# Plano de Testes — Sistema de Matrícula CINCoders

**Versão:** 1.0 — 21/11/2026  
**Status:** Plano aprovado para implementação técnica; execução automatizada ainda pendente  
**Responsável:** Thiago Silva  
**Prazo de entrega:** 23/11/2026  
**Rastreabilidade:** `docs/requisitos-e-backlog.md`, ADRs 0001–0003, Jira MAT

## 1. Objetivo

Verificar que o sistema cumpre as regras funcionais e de autorização do teste prático, principalmente o fluxo **login → consulta de ofertas → matrícula → cancelamento → progresso curricular**. Priorizar testes de regras de negócio e de integração HTTP para detectar regressões antes da entrega.

## 2. Escopo e estratégia

| Nível | O que valida | Ferramenta planejada |
| --- | --- | --- |
| Unidade | Cálculo de progresso, classificação curricular, validações e regras isoladas | Vitest |
| Integração | Rotas HTTP, autenticação, Prisma/SQLite, transações e efeitos persistidos | Vitest + Supertest + banco SQLite de teste |
| Ponta a ponta/manual | Fluxos completos no navegador e estados visuais | Navegador; registrar evidências no PR/README |
| Responsividade | Telas do aluno utilizáveis em largura de 360px | DevTools do navegador |

**Princípio:** testes de regras não devem depender de uma interface visual pronta; as regras críticas devem ser cobertas primeiro na API. Testes devem validar estado persistido, não apenas código HTTP.

## 3. Ambiente e dados de teste

- API: Node.js + Express + TypeScript, Prisma 7 e SQLite.
- Seed de desenvolvimento: três cursos (SI/CC/EC), quatro alunos (`aluno.si`, `aluno.cc`, `aluno.ec`, `aluno.si2`) e uma conta da secretaria.
- Dados iniciais: 6 disciplinas, 2 professores, 7 turmas, 11 vínculos curriculares, 8 históricos e 0 matrículas ativas.
- Senha do seed via variável de ambiente local `SEED_PASSWORD`; não registrar seu valor no repositório.
- **Isolamento:** testes automatizados devem apontar para um arquivo SQLite exclusivo de teste, distinto de `dev.db`; preparar dados previsíveis antes de cada teste ou suíte. Não executar migrações destrutivas no banco de desenvolvimento.
- **Repetibilidade:** mesmo conjunto de entrada deve produzir o mesmo resultado e não depender da ordem dos testes.

## 4. Critérios de entrada e saída

**Entrada:** schema válido, migrações aplicadas no banco de teste, Prisma Client gerado, API inicializada e fixtures disponíveis.

**Saída/Definition of Done de cada User Story:**

- [ ] Critérios de aceitação Gherkin exercitados.
- [ ] Casos felizes e principais falhas/limites cobertos.
- [ ] Nenhum teste crítico falha.
- [ ] Rotas não vazam `senhaHash`, dados de outro aluno ou segredos.
- [ ] Documentação e evidências atualizadas.
- [ ] Commit/push verificados e Jira atualizado.

## 5. Matriz de rastreabilidade

**Legenda:** P0 = bloqueia o MVP; P1 = importante; P2 = se houver tempo. Todos os casos abaixo estão **planejados**, exceto onde a seção 8 registrar evidência de execução.

| ID | Requisito/regra | Cenário a testar | Nível | Prioridade |
| --- | --- | --- | --- | --- |
| T-01 | US-01, autenticação | Usuário válido autentica; sessão criada; perfil correto | Integração | P0 |
| T-02 | US-01, autenticação | Senha errada ou usuário inexistente → `401` genérico, sem sessão | Integração | P0 |
| T-03 | US-01, autorização | Sem sessão → `401`; aluno na rota da secretaria → `403` | Integração | P0 |
| T-04 | US-01, logout | Logout invalida sessão; `/me` posterior → `401` | Integração | P0 |
| T-05 | US-01, privacidade | Usuário não acessa histórico/matrículas de outro aluno | Integração | P0 |
| T-06 | Ofertas | Listagem, filtros, paginação e indicação de vagas disponíveis | Integração/UI | P0 |
| T-07 | Estrutura curricular | Mesma disciplina recebe classificações distintas em cursos distintos | Unidade/integração | P0 |
| T-08 | Disciplina | Código duplicado é recusado; CH fora de 15–120 ou não múltipla de 15 é recusada | Integração | P1 |
| T-09 | Professor | E-mail duplicado é recusado | Integração | P1 |
| T-10 | Turma | Abrir turma sem disciplina/professor ou com menos de uma vaga é recusado | Integração | P1 |
| T-11 | Turma | Redução de vagas abaixo do número de matrículas ativas é recusada | Integração | P1 |
| T-12 | Matrícula | Aluno elegível ocupa uma vaga; nova matrícula fica `ATIVA` | Integração | P0 |
| T-13 | Matrícula | Matrícula em turma lotada é recusada sem exceder capacidade | Integração | P0 |
| T-14 | Matrícula | Disciplina já aprovada não admite nova matrícula | Integração | P0 |
| T-15 | Matrícula/ADR-0002 | Aluno já matriculado na disciplina não pode entrar em outra turma da mesma disciplina | Integração | P0 |
| T-16 | Matrícula | Reprovação anterior não impede nova tentativa | Integração | P0 |
| T-17 | Cancelamento | Apenas titular cancela matrícula ativa; vaga é liberada | Integração | P0 |
| T-18 | Rematrícula/ADR-0001 | Após cancelar, nova matrícula recebe outro ID; anterior permanece `CANCELADA` com data | Integração | P0 |
| T-19 | Concorrência | Duas solicitações disputam última vaga; no máximo uma é confirmada | Integração | P0 |
| T-20 | Concorrência/ADR-0002 | Duas solicitações simultâneas para turmas da mesma disciplina não geram duas matrículas ativas | Integração | P0 |
| T-21 | Progresso | Apenas histórico `APROVADA` integraliza CH; reprovadas não contam | Unidade/integração | P0 |
| T-22 | Progresso | CH de eletiva de perfil além do mínimo conta como livre, conforme regra | Unidade | P0 |
| T-23 | Progresso | Percentual é limitado a 100%; CH faltante nunca é negativa; CH ativa aparece separada | Unidade | P0 |
| T-24 | API/UX | Erros de rede, carregamento, vazio, sem resultados e ação de tentar novamente | Manual/UI | P1 |
| T-25 | Mobile | Fluxo do aluno utilizável a 360px sem perda dos comandos críticos | Manual/UI | P0 |
| T-26 | Extra | Requisito funcional adicional escolhido possui cenário completo de sucesso e falha | Integração/UI | P1 |

## 6. Exemplos Gherkin prioritários

```gherkin
Funcionalidade: Matrícula em turma

  Cenário: Uma matrícula ativa por disciplina
    Dado que o aluno possui matrícula ativa na turma A da disciplina X
    E existe outra turma B da mesma disciplina X com vagas
    Quando o aluno solicita matrícula na turma B
    Então a solicitação deve ser rejeitada
    E deve continuar existindo somente uma matrícula ativa em X

  Cenário: Rematrícula após cancelamento
    Dado que o aluno cancelou sua matrícula na disciplina X
    E não possui outra matrícula ativa em X
    E existe vaga disponível
    Quando solicita matrícula novamente
    Então deve ser criado um novo registro de matrícula ativa
    E o registro anterior deve permanecer cancelado

  Cenário: Vaga única disputada
    Dado que uma turma possui uma vaga restante
    Quando dois alunos elegíveis tentam se matricular simultaneamente
    Então no máximo uma solicitação deve ser confirmada
    E o total de matrículas ativas não deve exceder a capacidade
```

```gherkin
Funcionalidade: Progresso curricular

  Cenário: Reprovação e matrícula ativa não integralizam CH
    Dado que um aluno possui histórico aprovado, histórico reprovado e matrícula ativa
    Quando solicita o progresso curricular
    Então somente as disciplinas aprovadas devem compor a CH integralizada
    E a CH das matrículas ativas deve ser apresentada separadamente
```

## 7. Organização proposta dos testes

```text
apps/api/
  tests/
    auth.test.ts
    ofertas.test.ts
    matriculas.test.ts
    progresso.test.ts
    secretaria.test.ts
    helpers/
      banco-teste.ts
```

Os nomes são uma proposta; adequar à estrutura efetivamente implementada. Para Supertest, importar `app` de `src/app.ts` sem iniciar o processo com `server.ts`. Usar agentes de sessão do Supertest quando o teste exigir persistência de cookies.

### Comandos previstos

```powershell
cd C:\dev\sistema-matricula-cincoders\apps\api
pnpm exec prisma validate
pnpm exec prisma migrate status
pnpm test
```

**Atenção:** `pnpm test` só passa a representar evidência quando existirem testes e a execução terminar com sucesso. Não usar uma saída sem testes encontrados como prova de qualidade.

## 8. Registro de execução

| Data | Verificação | Evidência observada | Resultado |
| --- | --- | --- | --- |
| 21/11/2026 | `prisma validate` | Schema declarado válido | Passou |
| 21/11/2026 | `prisma migrate status` | Uma migração aplicada, banco em dia | Passou |
| 21/11/2026 | `prisma db seed` (duas execuções) | Ambas terminaram sem erros | Passou |
| 21/11/2026 | Contagem do banco com Prisma Client | Quantidades esperadas conferidas pelo responsável | Passou — conferência manual |
| 21/11/2026 | `GET /api/health` | Resposta JSON esperada informada pelo responsável | Passou — teste manual |
| — | Testes automatizados de autenticação e regras de negócio | Não executados ainda | Pendente |
| — | Testes da interface em 360px | Frontend ainda não validado | Pendente |

## 9. Riscos

Riscos que exigem atenção:

1. **Concorrência:** duas matrículas simultâneas podem violar capacidade/unicidade sem transação adequada.
2. **Privacidade:** usar o ID vindo do cliente em vez da sessão pode expor dados de outro aluno.
3. **Sessões:** armazenamento em memória não atende à proposta final de persistência; revisar ADR-0003.
4. **Banco de teste:** evitar modificar `dev.db` ao executar testes automatizados.
5. **Cobertura falsa:** não marcar testes como concluídos apenas porque TypeScript compila ou porque seed e health check funcionam.

## 10. Manutenção

Atualizar este documento quando novos critérios Gherkin forem acordados, quando uma regra mudar, **a cada conclusão de User Story** e antes do commit final. Registrar data, comando executado, resultado e pendências reais na seção 8. Atualizar a Sprint correspondente e o item no Jira MAT.