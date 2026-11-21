# ADR 0001 — Novo registro em rematrícula após cancelamento

**Status:** Aceita  
**Data:** 20/11/2026  
**Projeto:** CINCoders — Sistema de Matrícula  
**Responsável pela decisão:** Thiago Silva

## Contexto

O sistema permite que o aluno cancele as próprias matrículas ativas e que a vaga cancelada volte a ficar disponível. O enunciado não determina como representar uma eventual nova matrícula do mesmo aluno na mesma turma após um cancelamento.

Há duas estratégias principais: reativar o registro cancelado ou criar outro registro. A primeira produz menos linhas, mas apaga o estado anterior se não houver um mecanismo separado de auditoria. A segunda preserva cada tentativa de matrícula como uma ocorrência distinta.

## Decisão

**Cada matrícula aceita cria um novo registro.** Uma matrícula cancelada nunca volta ao estado ativo.

1. Ao realizar matrícula elegível, o sistema insere uma linha com situação `ATIVA` e data de criação.
2. Ao cancelar, a linha existente passa a `CANCELADA`, recebe `canceladaEm` e permanece no banco.
3. Se o aluno solicitar matrícula novamente, o sistema executa **todas** as validações atuais, incluindo disponibilidade de vagas, aprovação anterior na disciplina e ausência de matrícula ativa duplicada.
4. Se a rematrícula for aceita, é inserida **outra** linha, com identificador novo. A linha cancelada não é modificada.
5. Vagas ocupadas são calculadas somente com matrículas **ativas**.

## Modelo conceitual afetado

| Atributo da entidade `Matricula` | Significado |
|---|---|
| `id` | Chave primária; identifica uma ocorrência de matrícula |
| `alunoId` | Chave estrangeira para o aluno |
| `turmaId` | Chave estrangeira para a turma |
| `situacao` | `ATIVA` ou `CANCELADA` |
| `criadaEm` | Data e hora de criação da ocorrência |
| `canceladaEm` | Data e hora do cancelamento, nula enquanto ativa |

**Cardinalidades:** um aluno pode ter muitas ocorrências de matrícula; uma turma pode ter muitas ocorrências de matrícula; cada ocorrência se relaciona a exatamente um aluno e uma turma.

**Restrição de integridade:** não deve haver duas ocorrências `ATIVA` para o mesmo par `(alunoId, turmaId)`. A aplicação deve validar essa regra no fluxo transacional e, quando viável, reforçá-la com um índice único condicionado à situação ativa. Uma restrição única incondicional sobre `(alunoId, turmaId)` é **incompatível** com esta decisão, pois impediria a nova ocorrência após o cancelamento.

**Concorrência:** verificar vagas e criar a matrícula deve constituir uma operação consistente, impedindo que duas solicitações consumam a última vaga. Não é suficiente verificar a capacidade numa requisição e persistir posteriormente sem controle transacional.

## Consequências

### Benefícios

- Preserva o registro dos cancelamentos e das novas matrículas sem exigir outra tabela de eventos.
- Facilita a explicação e o rastreamento de mudanças de situação.
- Evita a operação conceitualmente ambígua de “desfazer” um cancelamento anterior.

### Custos e cuidados

- Produz mais linhas na tabela, custo de armazenamento considerado aceitável para o domínio.
- Exige consultas que filtrem `situacao = ATIVA` para listagem atual e ocupação de vagas.
- Exige proteção contra duplicidade ativa e contra competição pela última vaga.

## Exemplos de aceitação

```gherkin
Funcionalidade: Rematrícula após cancelamento
  Cenário: Criar uma nova ocorrência quando há vaga
    Dado que o aluno cancelou uma matrícula anterior na turma T
    E a turma T tem uma vaga disponível
    E o aluno continua elegível para a disciplina
    Quando o aluno solicita matrícula novamente na turma T
    Então deve ser criada uma nova matrícula ativa com outro identificador
    E a matrícula anterior deve continuar cancelada
    E somente a nova matrícula deve contar na ocupação da turma

  Cenário: Não reutilizar matrícula cancelada quando a turma está lotada
    Dado que o aluno cancelou uma matrícula anterior na turma T
    E a turma T está lotada
    Quando o aluno solicita matrícula novamente na turma T
    Então a operação deve ser recusada
    E a matrícula anterior deve continuar cancelada

  Cenário: Impedir duplicação ativa
    Dado que o aluno já possui uma matrícula ativa na turma T
    Quando solicita outra matrícula na turma T
    Então a operação deve ser recusada
    E deve existir apenas uma matrícula ativa para esse par aluno-turma
```

## Questões ainda abertas

- Se um aluno pode manter duas matrículas ativas em **turmas diferentes da mesma disciplina** no semestre atual. Essa restrição não foi decidida nesta ADR.
- O mecanismo exato de bloqueio, índice e transação será definido na modelagem física, de acordo com a versão instalada do Prisma e do SQLite.

## Referências de implementação

- [MAT-11 — Efetuar matrícula](https://cin-1402.atlassian.net/browse/MAT-11)
- [MAT-15 — Cancelar matrícula](https://cin-1402.atlassian.net/browse/MAT-15)