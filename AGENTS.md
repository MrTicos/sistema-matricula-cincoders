# AGENTS.md — CINCoders

Este documento orienta agentes de IA que trabalham neste repositório. Use os arquivos de `docs/` como fonte de decisões e requisitos. Não trate funcionalidades planejadas como implementadas.

## Contexto do projeto

- Projeto: sistema acadêmico de matrícula, desenvolvido individualmente para o teste prático CINCoders.
- Prazo de submissão do repositório: **23/11/2026**. A entrega ao usuário avaliador no GitLab precisa ser confirmada pelo responsável.
- Gestão: Jira `MAT`; as User Stories e a prioridade estão em `docs/requisitos-e-backlog.md` e `docs/sprints/`.
- Prioridade do MVP: login e experiência do aluno (ofertas, matrícula, cancelamento, progresso), testes; depois fluxos da secretaria e requisito adicional.
- Trabalhar com pequenas alterações revisáveis; explicar os pontos essenciais para que o responsável consiga defender o código.

## Stack e estrutura

- Frontend planejado: React + TypeScript + Vite em `apps/web/`.
- Backend: Node.js + Express + TypeScript em `apps/api/`.
- Persistência: SQLite, Prisma ORM **7** com `@prisma/adapter-better-sqlite3`.
- Testes: Vitest e Supertest.
- Gerenciador de pacotes: pnpm; preservar o lockfile existente e evitar atualizações de major sem justificativa.
- Código de infraestrutura: `apps/api/prisma/schema.prisma`, migrações, `seed.ts`, `src/config/`.

Não presumir que o frontend ou todos os módulos da API já existam. Verificar os arquivos e o estado atual do Git antes de modificar.

## Invariantes de negócio

1. Uma disciplina possui código único; carga horária de 15 a 120, múltipla de 15.
2. E-mail do professor é único.
3. Turmas exigem disciplina, professor e pelo menos uma vaga; vagas não podem ficar abaixo da quantidade de matrículas ativas.
4. Aluno não pode se matricular em turma lotada nem em disciplina já aprovada.
5. Aluno **não pode possuir duas matrículas ativas em turmas da mesma disciplina** — mesmo que os IDs das turmas sejam diferentes.
6. Ao cancelar uma matrícula, manter a linha histórica com situação `CANCELADA`. Uma rematrícula elegível cria **novo registro**, sem reativar a linha cancelada.
7. Reprovação não impede nova tentativa; aprovação impede nova matrícula na disciplina.
8. A classificação curricular varia por curso: obrigatória, eletiva de perfil ou livre. Disciplina sem vínculo na estrutura do curso é livre.
9. Apenas histórico aprovado integraliza carga horária; disciplinas em curso devem ser contadas e apresentadas separadamente; percentual não pode exceder 100%.
10. Usuários só acessam operações autorizadas para seu perfil; aluno só acessa seus próprios dados.

As operações de matrícula e ajuste de vagas devem proteger invariantes contra concorrência por transação/estratégia adequada. Não assumir que índices simples por `alunoId` e `turmaId` resolvem a restrição por disciplina.

## Decisões registradas

- `docs/adr/0001-rematricula-novo-registro.md`: rematrícula após cancelamento gera nova linha.
- `docs/adr/0002-unicidade-matricula-ativa-por-disciplina.md`: no máximo uma matrícula ativa por aluno/disciplina.
- `docs/adr/0003-autenticacao-por-sessao.md`: proposta de autenticação por sessão e cookie `HttpOnly`; **não tratar como aceita até validar armazenamento e testes**.
- `docs/modelagem-fisica.md`: referência da estrutura persistida; `schema.prisma` é a fonte executável atual do banco.

Uma mudança que contradiga uma ADR aceita deve ser discutida com o responsável e documentada em uma nova ADR ou revisão explícita antes da implementação.

## Segurança e dados locais

- Senhas devem ser armazenadas como hash Argon2id; não expor `senhaHash` em respostas e não registrar segredos em logs.
- Não versionar `.env`, `dev.db`, `node_modules` ou `src/generated/prisma/`.
- Versionar migrações, schema, `seed.ts` e `.env.example` (sem valores secretos).
- Não executar comandos destrutivos (`prisma migrate reset`, exclusão de banco, limpeza abrangente ou sobrescrita de alterações locais) sem autorização explícita.
- Nas sessões: considerar expiração, regeneração do ID após login, logout revogável, cookie seguro, proteção contra CSRF e armazenamento persistente; `MemoryStore` não é solução final.

## Comandos úteis (executar em `apps/api/`)

```powershell
pnpm install
pnpm exec prisma validate
pnpm exec prisma migrate status
pnpm exec prisma generate
pnpm exec prisma db seed
pnpm dev
pnpm test
```

Não rodar o seed contra um banco real com dados de produção. O seed é destinado a desenvolvimento e testes.

## Fluxo de trabalho para cada User Story

1. Ler requisito, Gherkin, ADRs e arquivos relacionados antes de codificar.
2. Validar o escopo da história com foco no MVP e no prazo.
3. Implementar alteração pequena, legível e coerente com as camadas existentes.
4. Adicionar testes para sucesso, erros e regras de autorização; executar verificações disponíveis.
5. Atualizar a documentação pertinente e registrar decisões e limitações reais.
6. Inspecionar `git diff` e `git status`; nunca incluir arquivos sensíveis.
7. Propor commit descritivo; somente marcar concluído após resultados verificáveis.

## Política de atualização da documentação

**Revisar os documentos continuamente, com gatilhos claros:**

| Evento | Arquivos a revisar |
| --- | --- |
| Nova decisão ou mudança de regra de negócio | `docs/adr/`, `docs/requisitos-e-backlog.md`, `docs/modelagem-fisica.md` (se afetada) |
| Mudança em módulos, dependências ou fluxo HTTP | `docs/arquitetura/visao-geral.md` e documento do módulo, ex.: `autenticacao.md` |
| Finalização ou mudança de escopo de uma User Story | `docs/sprints/sprint-1.md`, critérios Gherkin e item no Jira |
| Migração ou modificação do banco | `schema.prisma`, migração, `docs/modelagem-fisica.md`, seed e testes relacionados |
| Antes de cada commit funcional | Conferir se código, testes e documentos descrevem o mesmo estado |
| Antes da entrega final | Revisão completa do `README.md`, backlog, ADRs, sprints, arquitetura, testes e execução do projeto do zero |

**Definition of Done:** critérios de aceitação atendidos, testes relevantes passando, documentação atualizada, revisão do diff, commit/push verificados e status do Jira atualizado. Não declarar sucesso de passos não executados.

## Comunicação com o responsável

- Preferir respostas objetivas em português do Brasil, com uma etapa executável por vez quando houver configuração manual no Windows.
- Explicar por que a alteração é necessária, principalmente em autenticação, transações e regras de matrícula.
- Se houver erro, pedir a saída exata do terminal antes de assumir a causa.
- Preservar as edições manuais existentes. Não reescrever documentos completos sem verificar a versão atual.