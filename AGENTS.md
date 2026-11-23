# AGENTS.md — Projeto CINCoders

Este arquivo orienta agentes de IA que colaboram com o responsável pelo Sistema de Matrícula CINCoders. Ler os requisitos e decisões de `docs/` antes de alterar o projeto. **Não declarar como testado, concluído, publicado ou entregue algo que não possua evidência.**

## 1. Contexto e estágio atual

- **Projeto:** sistema acadêmico de matrícula de graduação, desenvolvido individualmente por Thiago Silva para o teste prático da Seleção nº 5/2026 do CIn-UFPE.
- **Prazo do teste:** 23/11/2026.
- **Gestão:** Jira MAT; documentação de requisitos, decisões e sprints no próprio repositório.
- **Entrega:** monorepo com backend e frontend no GitLab do CIn, compartilhado com `selecaogersist`. **O avaliador aceitou o convite**, conforme confirmação de Thiago em 23/11/2026; o push dos arquivos finais ainda precisa ser confirmado para declarar a entrega efetivada.
- **Histórias:** US-01 a US-12 e **US-13 — Histórico de matrículas canceladas** foram relatadas como implementadas e validadas. A US-13 é o requisito funcional adicional escolhido.
- **Interface:** navegação compartilhada por perfil, estados de erro e recuperação, ajustes de identidade visual e responsividade para o aluno.
- **Evidência automatizada recente:** 133 testes de API em 11 arquivos aprovados; 95 testes frontend em 12 arquivos aprovados conforme confirmação do responsável. São **228 testes em duas suítes separadas**, não testes E2E.
- **Evidência manual:** 48 verificações relatadas para US-08 a US-13 (oito por história). Não confundir com testes automatizados.

O estado detalhado e as ressalvas estão em `docs/sprints/sprint-1.md`, `docs/testes/plano-de-testes.md` e `docs/entrega-checklist.md`.

## 2. Stack e organização

| Camada | Tecnologias e localização |
| --- | --- |
| Frontend | React, TypeScript, Vite e React Router em `apps/web/` |
| Backend | Node.js, Express, TypeScript em `apps/api/` |
| Persistência | SQLite e Prisma ORM 7, com `@prisma/adapter-better-sqlite3` |
| Sessões | `express-session`, cookie `cincoders.sid` e armazenamento SQLite |
| Segurança de senha | Argon2id |
| Testes backend | Vitest e Supertest, com banco SQLite de testes dedicado |
| Testes frontend | Vitest, Testing Library e jsdom |
| Gerenciamento | pnpm; respeitar os lockfiles existentes |

Principais diretórios:

```text
apps/
  api/
    prisma/                  schema, migrations e seed
    src/config/              Prisma e sessão
    src/modules/             auth, matrícula, ofertas, secretaria e progresso
    tests/                   testes HTTP e integração
  web/
    src/api/                 cliente HTTP e funções de acesso
    src/components/          navegação compartilhada e logout
    src/pages/aluno/         ofertas, matrículas, histórico e progresso
    src/pages/secretaria/    disciplinas, professores e turmas
    src/routes/              rotas e proteção por perfil
docs/
  adr/                       decisões arquiteturais
  arquitetura/               visão dos módulos e contratos
  sprints/                   linha do tempo e entregas
  testes/                    plano e evidências
```

**Antes de agir**, inspecionar arquivos reais e `git status --short`. A lista é uma orientação; caminhos específicos devem ser confirmados no repositório.

## 3. Regras de negócio invariantes

1. Código de disciplina único; carga horária de 15 a 120 horas, múltipla de 15.
2. E-mail do professor único.
3. Turma exige disciplina, professor e capacidade positiva.
4. A capacidade não pode ser reduzida abaixo do total de matrículas **ativas** da turma.
5. Matrícula em turma lotada é recusada.
6. Disciplina aprovada impede nova matrícula; reprovação permite nova tentativa.
7. Um aluno não pode manter **duas matrículas ativas na mesma disciplina**, ainda que em turmas diferentes.
8. Cancelamento modifica a situação para `CANCELADA`, preserva o registro e libera vaga; uma rematrícula válida cria **um novo registro**.
9. Aluno só consulta e modifica os próprios dados; operações da secretaria exigem perfil `SECRETARIA` e operações acadêmicas do aluno exigem `ALUNO`.
10. A classificação curricular depende do curso: obrigatória, eletiva de perfil ou livre quando a disciplina não integra a estrutura do curso.
11. Excedente de CH aprovada em eletivas de perfil é transferido à categoria livre.
12. Somente disciplinas **aprovadas** no histórico acadêmico contam como CH integralizada. Matrículas ativas aparecem separadamente como CH em curso; reprovações não integralizam.
13. Percentuais de progresso não ultrapassam 100%, e a carga horária faltante não fica negativa.
14. Histórico de cancelamentos da **US-13** é exclusivo do próprio aluno, lista matrículas `CANCELADA` e preserva dados, data e ordenação/paginação sem afetar a lista de matrículas ativas.

As operações de matrícula e alteração de capacidade precisam preservar invariantes mesmo com concorrência. Não confiar em validação apenas no frontend e não assumir que um índice simples por `alunoId` e `turmaId` garanta unicidade por disciplina.

## 4. Decisões arquiteturais

- `docs/adr/0001-rematricula-novo-registro.md` — nova linha após cancelamento.
- `docs/adr/0002-unicidade-matricula-ativa-por-disciplina.md` — no máximo uma matrícula ativa por disciplina/aluno.
- `docs/adr/0003-autenticacao-por-sessao.md` — estratégia **adotada e implementada** com cookie HttpOnly e sessões SQLite; limitações para produção explicitadas, sem afirmar testes de CSRF/HTTPS não executados.
- `docs/modelagem-fisica.md` — documentação **conferida contra o schema integral** enviado em 23/11/2026; `apps/api/prisma/schema.prisma` continua sendo a fonte executável.

Mudanças que contrariem ADRs aceitas exigem conversa prévia com o responsável e registro explícito da nova decisão.

## 5. Autenticação, segurança e privacidade

- Armazenar senhas como hash Argon2id; nunca devolver `senhaHash`, senhas ou segredos.
- A sessão do usuário é mantida no servidor, não no conteúdo legível do cookie.
- A configuração conhecida usa `HttpOnly`, `SameSite=Lax`, `Secure` quando `NODE_ENV=production`, prazo de oito horas e regeneração de ID após login.
- O cliente HTTP reage a `401` em chamadas protegidas levando ao login; preservar as exceções necessárias para login e verificação inicial de sessão.
- Verificar autorização por **perfil** e por **titularidade acadêmica** nos serviços e endpoints.
- **Pendências a não ocultar:** verificação específica de continuidade de sessão após reinício, política/mitigação contra CSRF e comportamento real de `Secure` sob HTTPS. Não afirmar que foram validados sem evidência.
- Não usar `MemoryStore` para sessões persistentes. Evitar logs sensíveis e respostas que permitam enumerar usuários.
- Não versionar `apps/api/.env`, bancos SQLite, arquivos auxiliares `-wal`/`-shm`/`-journal`, `node_modules`, nem `apps/api/src/generated/prisma/`.
- Versionar fontes, migrações, `schema.prisma`, `seed.ts` e `.env.example` **sem credenciais reais**.
- **Testes de integração:** exigem `DATABASE_URL` de teste, pois modificam registros. Jamais apontar a suíte para `dev.db` ou banco com dados importantes.

## 6. Comandos úteis no Windows

### Backend — no diretório `apps/api/`

```powershell
pnpm install
pnpm exec prisma validate
pnpm exec prisma migrate status
pnpm exec prisma generate
pnpm exec prisma db seed
pnpm exec tsc --noEmit
pnpm dev
```

Para testar a API, **confirmar antes** a existência e a preparação do banco dedicado:

```powershell
$env:DATABASE_URL = "file:./test.db"
pnpm exec node -r dotenv/config -e "console.log('Banco de testes:', /test/i.test(process.env.DATABASE_URL ?? ''))"
pnpm exec vitest run --no-file-parallelism
Remove-Item Env:DATABASE_URL
```

Após remover a variável temporária, conferir a configuração padrão (deve ser a de desenvolvimento, não a de testes):

```powershell
pnpm exec node -r dotenv/config -e "console.log('Banco configurado:', process.env.DATABASE_URL)"
```

### Frontend — no diretório `apps/web/`

```powershell
pnpm install
pnpm lint
pnpm exec tsc -b
pnpm exec vitest run
pnpm dev
```

O servidor da API usa a porta 3001 por padrão; o frontend usa a URL definida em `VITE_API_URL`. Consultar o README para a instalação reproduzível. Não executar `prisma migrate reset`, excluir bancos, limpar alterações de Git ou rodar seed sobre dados reais sem autorização explícita.

## 7. Fluxo para cada alteração

1. Ler enunciado, requisito/US, Gherkin, ADRs e código efetivo.
2. Examinar `git status`, `git diff` e arquivos relacionados para preservar trabalho manual.
3. Explicar escopo e trade-offs de mudanças relevantes; manter soluções simples e defensáveis na entrevista.
4. Implementar por camadas sem alterar regras de negócio fora do solicitado.
5. Adicionar ou ajustar testes de sucesso, validação, erro e autorização. Executar lint, TypeScript e testes relevantes.
6. Testar estados visuais e responsividade (aluno desde 360 px) quando a mudança atingir a interface.
7. Atualizar a documentação afetada e registrar restrições que permaneçam.
8. Verificar `git diff --check` e `git diff --cached --check`, revisar a lista exata de arquivos a commitar e propor mensagem descritiva.
9. Confirmar commit, push, acesso do avaliador e atualização do Jira **somente mediante evidência**, sem presumir.

## 8. Quando atualizar a documentação

| Evento | Documentos |
| --- | --- |
| Regra ou decisão nova | `docs/adr/`, `docs/requisitos-e-backlog.md` e, se aplicável, `docs/modelagem-fisica.md` |
| Alteração de endpoint, módulo ou sessão | `docs/arquitetura/visao-geral.md` e `docs/arquitetura/autenticacao.md` |
| História implementada/testada | `docs/sprints/sprint-1.md`, `docs/testes/plano-de-testes.md`, critérios Gherkin e Jira |
| Alteração de banco | `schema.prisma`, migração, seed e `docs/modelagem-fisica.md` |
| Mudança de setup | `README.md` e `apps/api/.env.example` ou `apps/web/.env.example` |
| Antes do commit e da entrega | `docs/entrega-checklist.md`, README, ADRs, testes, requisitos e Git |

**Definition of Done:** código claro, regras e critérios atendidos, testes relevantes passando, documentação compatível com os fatos e revisão de diff. **Commit/push/Jira são etapas de publicação separadas** e devem ser confirmadas.

## 9. Comunicação com Thiago

- Responder em português do Brasil, com passos PowerShell executáveis e contextualizados.
- Para uma configuração manual, preferir uma etapa por vez e aguardar o resultado.
- Explicar decisões técnicas para que Thiago possa apresentá-las e alterá-las durante a entrevista.
- Em caso de erro, solicitar log exato e distinguir observação de hipótese.
- Preservar arquivos e alterações manuais existentes; não substituir documentos longos sem conferir seu conteúdo.
