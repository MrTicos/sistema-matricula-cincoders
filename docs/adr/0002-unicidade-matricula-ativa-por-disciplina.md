# ADR 0002 — Uma matrícula ativa por disciplina

**Status:** Aceita  
**Data:** 20/11/2026  
**Projeto:** CINCoders — Sistema de Matrícula  
**Responsável pela decisão:** Thiago Silva

## Contexto

Uma disciplina pode ter várias turmas no semestre corrente. O enunciado impede matrícula em disciplina já aprovada, mas não especifica se um aluno pode ocupar simultaneamente vagas em duas turmas diferentes da mesma disciplina.

Permitir as duas matrículas geraria duplicação de uma mesma disciplina na grade do aluno e ocuparia vagas que poderiam atender outros estudantes.

## Decisão

**Um aluno não pode ter duas matrículas ativas na mesma disciplina no semestre corrente**, ainda que as matrículas sejam em turmas diferentes.

1. Ao solicitar matrícula em uma turma, identificar a disciplina vinculada a ela.
2. Consultar se o aluno já possui matrícula **ativa** em qualquer turma dessa disciplina.
3. Se existir, recusar a solicitação com mensagem clara, sem ocupar outra vaga.
4. Matrículas **canceladas** não bloqueiam nova matrícula, desde que haja vaga e as demais regras sejam satisfeitas.
5. Cada nova matrícula aprovada gera um registro novo, conforme a [ADR 0001](0001-rematricula-novo-registro.md); o registro cancelado permanece inalterado.

Essa regra é uma decisão adicional do projeto, não uma transcrição literal do enunciado.

## Implicações para o modelo de dados

O relacionamento é `Matricula → Turma → Disciplina`. Por isso, verificar apenas a duplicidade de `(alunoId, turmaId)` é insuficiente: duas turmas diferentes podem apontar para a mesma disciplina.

**Invariantes:**

- Para cada par aluno-disciplina, no máximo uma matrícula ativa em todas as turmas do semestre atual.
- Registros cancelados não contam para essa verificação nem para as vagas ocupadas.
- A verificação de duplicidade e a efetivação da matrícula devem fazer parte de uma operação consistente, inclusive diante de requisições concorrentes.

Uma restrição única simples em `(alunoId, turmaId)` não resolve o caso de turmas distintas. A estratégia física — consulta transacional, índice/estrutura auxiliar ou outro mecanismo equivalente — será definida no `schema.prisma` e na implementação da API, sem duplicar dados desnecessariamente apenas para facilitar uma restrição.

## Critérios de aceitação

```gherkin
Funcionalidade: Unicidade de matrícula ativa por disciplina

  Cenário: Tentar matrícula em outra turma da mesma disciplina
    Dado que o aluno possui matrícula ativa na turma A da disciplina IF668
    E existe vaga disponível na turma B da disciplina IF668
    Quando o aluno tenta se matricular na turma B
    Então a matrícula deve ser recusada
    E nenhuma vaga da turma B deve ser ocupada

  Cenário: Matricular-se em outra turma após cancelar
    Dado que o aluno cancelou sua matrícula na turma A da disciplina IF668
    E existe vaga na turma B da mesma disciplina
    E o aluno não foi aprovado anteriormente em IF668
    Quando solicita matrícula na turma B
    Então deve ser criado um novo registro de matrícula ativa na turma B
    E o registro da turma A deve permanecer cancelado

  Cenário: Matrícula em outra disciplina
    Dado que o aluno possui matrícula ativa na disciplina IF668
    E existe vaga em uma turma da disciplina IF669
    E o aluno é elegível para IF669
    Quando solicita matrícula em IF669git
    Então a matrícula pode ser aceita
```

## Consequências

**Positivas:** evita ocupação duplicada de vagas e mantém o semestre coerente; facilita explicar ao aluno por que uma nova solicitação foi recusada.

**Custos:** requer verificar a disciplina das turmas já matriculadas e preservar a consistência sob concorrência. A interface pode indicar que a disciplina já está em curso, mas a regra precisa ser validada na API.

## Referência

- [MAT-11 — Matricular-se apenas em turma elegível](https://cin-1402.atlassian.net/browse/MAT-11)