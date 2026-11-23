# CINCoders — Auditoria de requisitos mínimos e preparação da entrega

**Referência:** edital “Seleção nº 5/2026 — Teste Prático: Sistema de Matrícula”.
**Data da revisão final:** 23/11/2026 (horário de Fortaleza).
**Objetivo:** consolidar as funcionalidades e a documentação validadas e registrar a sequência final de publicação. **O avaliador aceitou o convite de acesso ao GitLab**, segundo confirmação do responsável. O commit/push final ainda precisa ser executado ou confirmado pelo Git.

## 1. Requisitos do enunciado

Legenda: **Aprovado** = código/testes/logs/verificações manuais relatados pelo responsável. Os resultados foram comunicados e não representam uma auditoria independente da máquina Windows.

| Requisito | Evidência conhecida | Estado de entrega |
| --- | --- | --- |
| Monorepo React + API JavaScript/TypeScript e banco | `apps/web`, `apps/api`, Prisma/SQLite, testes e commits por US | **Implementado; publicação final em preparação** |
| Login, sessões, logout e perfis `ALUNO`/`SECRETARIA` | US-01/US-02; testes de sessão, middlewares, rotas e tratamento de `401` | **Aprovado funcionalmente** |
| Proteção CSRF nas escritas autenticadas e no login | Middleware de `Origin`/`Referer`, integrado ao CORS e com origem configurável; T-32 com 10 testes e regressão da API aprovada | **Implementado e testado por HTTP** |
| Disciplina: código único, CH de 15–120 e múltiplo de 15 | US-08/US-09; API e formulário; duplicidade `409` | **Aprovado** |
| Professores: cadastro com e-mail único e consulta | US-10; API/React; testes de duplicidade e busca | **Aprovado** |
| Turmas: disciplina, professor, ao menos uma vaga, consulta de ocupação | US-11; API/React; 15 testes API + 14 web | **Aprovado** |
| Ajuste de vagas nunca abaixo da ocupação ativa | US-12; 10 testes API + 8 web e 8 manuais relatados | **Aprovado** |
| Ofertas do aluno com busca, paginação, vagas e classificação por curso | US-03; 9 testes API e teste de recuperação CT-06 aprovado conforme relato | **Implementado e recuperação validada conforme relato** |
| Matrícula sem exceder vagas, aprovada bloqueia, reprovada permite | US-04; transação e testes de concorrência; suíte final com banco isolado aprovada | **Aprovado** |
| Cancelar matrícula própria libera vaga e permite rematrícula | US-05/US-06; 7 + 10 testes API, páginas e testes web; CT-06 de recuperação de consulta de Matrículas aprovado conforme relato | **Implementado e recuperação validada conforme relato** |
| Progresso: obrigatória/perfil/livre, excedente, aprovação, em curso e limites de porcentagem | US-07; 10 testes API + 6 web, incluindo CT-06 de recuperação aprovado | **Implementado e testado** |
| Busca e página atuais na URL | Observado e testado em Ofertas, Disciplinas, Professores e Turmas | **Aprovado** |
| Carregamento, vazio, sem resultado, falha de comunicação **com nova tentativa** | CT-06 de recuperação em Ofertas, Matrículas e Progresso aprovados; após correção de sessão, suíte web com **95 testes em 12 arquivos** informados como aprovados | **Implementado e testado**, com sessão expirada validada separadamente |
| Área do aluno funcional a partir de **360px** | Responsável confirmou os testes manuais das telas do aluno em modo responsivo de 360px, incluindo navegação e acesso às ações | **Aprovado conforme relato manual**; sem teste visual automatizado |
| Dados iniciais: 2 cursos com disciplina compartilhada classificada diferente, secretaria, alunos de ambos os cursos com aprovações e reprovações | Seed analisado: três cursos, quatro alunos com aprovações e reprovações; migração inicial e seed executados em `readme-validacao.db` novo, conforme logs apresentados | **Atendido quanto aos dados e preparo do banco**; API e tela de login também abriram no ambiente de desenvolvimento |
| Requisito extra backend → frontend e explicado no README | US-13: histórico paginado de cancelamentos próprios; 10 testes API incluídos na suíte integral **133/133**, 9 testes web e 8 manuais relatados | **Implementado, testado e documentado** |
| README: rodar do zero incluindo dados iniciais, principais decisões, extra, melhorias futuras | Documento completo preparado; migração, geração do Client e seed validados em banco novo | **Conteúdo revisado e pronto para versionamento** |
| Rotas da API documentadas | Tabela em `docs/arquitetura/visao-geral.md` incluindo US-13, vinculada no README | **Registrado e referenciado** |
| GitLab CIn pessoal com frontend/backend, histórico de commits, compartilhado com `selecaogersist` | O avaliador **aceitou o convite**, segundo Thiago; histórico prévio registrado | **Acesso confirmado; resta publicar/conferir os últimos commits** |

## 2. Alterações funcionais implementadas e testadas

### US-13 — Histórico de matrículas canceladas

1. Consulta HTTP paginada `GET /api/aluno/matriculas/historico` restrita a `ALUNO`, sem parâmetro capaz de selecionar outro aluno: identidade vem da sessão.
2. Registros filtrados por `CANCELADA`, preservando sua data e os vínculos com turma/disciplina/professor; registros `ATIVA` continuam na consulta própria.
3. Componente `HistoricoMatriculas.tsx` e aba em `MatriculasPage.tsx` com carregamento sob demanda, lista vazia, falha/novo carregamento e paginação.
4. Testes API específicos da US-13 aprovados na suíte integral **133/133 em 11 arquivos**; teste `HistoricoMatriculas.test.tsx` **9/9**; última suíte web integral após US-13 **89/89** (anterior aos testes novos de recuperação); **8 verificações manuais** relatadas.

### Navegação e apresentação

1. Adicionados menus compartilhados `SecretariaNav.tsx` e `AlunoNav.tsx`, com destaque da página selecionada.
2. Secretaria: Disciplinas, Professores e Turmas visíveis de qualquer seção; correção do menu que fazia Turmas desaparecer ao selecionar Disciplinas.
3. Aluno: Ofertas, Minhas matrículas e Progresso disponíveis também na tela de ofertas.
4. Ajustes visuais em `apps/web/src/index.css`: paleta azul-marinho/teal/cinza e largura dos cartões de listagem administrativa.
5. Referências visuais escolhidas para evolução posterior: **Classter** (administração) e **Aprova Total** (área do estudante); não confundir inspiração planejada com trabalho já entregue.

## 3. Checklist das verificações concluídas

- [x] **README.md:** documentados os comandos de instalação, `.env.example`, migração/geração Prisma, seed, contas de desenvolvimento sem expor segredos, inicialização da API/web e testes. Migração e seed foram reproduzidos num banco vazio; não há evidência de clone/install em outro computador.
- [x] **Requisito extra:** o README explica a escolha do histórico de cancelamentos, quem acessa, exclusividade por aluno, ordenação/paginação, datas e diferença entre matrícula cancelada e rematrícula.
- [x] **Seed e banco novo:** dados iniciais cumprem o edital; `migrate deploy`, `prisma generate` e `prisma db seed` passaram em `readme-validacao.db` separado, conforme logs informados. Isso não equivale a um clone/install completo.
- [x] **Servidores locais:** após restaurar `DATABASE_URL=file:./dev.db`, responsável confirmou o health check em `localhost:3001/api/health` e a tela de login em `localhost:5173`. Não equivale a teste de todos os fluxos.
- [x] **Erros de rede:** recuperação de Ofertas, Matrículas e Progresso com CT-06 aprovados; frontend integral com **95 testes em 12 arquivos** aprovado conforme confirmação posterior do responsável. O redirecionamento por sessão expirada foi verificado em item próprio.
- [x] **Sessão expirada — falha corrigida em 23/11:** o teste com duas abas revelou inicialmente que a primeira permanecia na área do aluno exibindo `Usuário não autenticado.` e **Tentar novamente**. O cliente HTTP passou a redirecionar respostas `401` de endpoints protegidos para `/login`, preservando os erros de `/api/auth/login` e a verificação inicial de `/api/auth/me`. **Responsável confirmou aprovação do reteste manual e dos testes automatizados após a correção**, incluindo três cenários dedicados em `apps/web/src/api/client.test.ts`.
- [x] **360px:** responsável confirmou que os testes manuais de login, ofertas, matrículas (incluindo histórico), progresso e navegação passaram em 360px. A captura anterior com possível recorte era inconclusiva e não demonstrou um defeito reproduzível. Não equivale a teste visual automatizado.
- [x] **Confirmação do backend após US-13:** `pnpm exec tsc --noEmit` e `pnpm exec vitest run --no-file-parallelism` concluídos; **133/133 testes em 11 arquivos** (28,94 s), em `test.db`; `DATABASE_URL` restaurada para `file:./dev.db`, conforme logs compartilhados.
- [x] **Validação posterior de CSRF — T-32:** middleware de origem adicionado para login e escritas com sessão, rejeitando origem externa, `null` ou ausente; 10 testes focados passaram e a API completa alcançou **143/143 testes em 12 arquivos** em banco de testes isolado.
- [x] **Regressão frontend após correções de rede e sessão:** lint, TypeScript e **95 testes em 12 arquivos** aprovados conforme relato; o log completo anteriormente compartilhado registra 92/92 em 11 arquivos (10,48 s), antes dos três casos do cliente HTTP. Reexecutar se houver alterações de código posteriores.
- [x] **Modelagem:** `schema.prisma` integral recebido e documentado com nove modelos, quatro enums, índices, chaves, valores padrão e relações.
- [x] **Acesso ao GitLab:** o avaliador `selecaogersist` aceitou o convite de acesso, conforme confirmação de Thiago.
- [x] **Git anterior:** `git diff --check` foi executado sem erros antes da atualização final dos documentos; nova revisão do estágio será feita no procedimento da seção 4.

**Limites conhecidos, não pendências funcionais:** CSRF está validado em testes HTTP por verificação de origem, mas não houve demonstração E2E automatizada dessa proteção, HTTPS real nem persistência de sessão após reinício. São limites documentados para evolução/implantação.

## 4. Procedimento de commit e publicação no PowerShell

**O conteúdo funcional e documental está preparado.** Estes são comandos a executar no repositório Windows, não tarefas de código inacabadas.

### Revisar o estado antes de adicionar arquivos

```powershell
cd C:\dev\sistema-matricula-cincoders
git status --short
git diff --check
git diff --cached --check
```

### Adicionar somente os arquivos conferidos

Após copiar os arquivos finais para suas pastas, **incluindo o middleware e os testes T-32**:

```powershell
git add README.md
git add AGENTS.md
git add apps/api/.env.example
git add apps/api/src/app.ts
git add apps/api/src/config/frontend-origin.ts
git add apps/api/src/middlewares/csrf.middleware.ts
git add apps/api/tests/auth.test.ts
git add apps/api/tests/csrf.test.ts
git add apps/api/tests/ofertas.test.ts
git add apps/api/tests/matriculas.test.ts
git add apps/api/tests/matriculas.consulta.test.ts
git add apps/api/tests/matriculas.cancelamento.test.ts
git add apps/api/tests/matriculas.historico.test.ts
git add apps/api/tests/progresso.test.ts
git add apps/api/tests/secretaria.disciplinas.test.ts
git add apps/api/tests/secretaria.professores.test.ts
git add apps/api/tests/secretaria.turmas.test.ts
git add docs/requisitos-e-backlog.md
git add docs/modelagem-fisica.md
git add docs/adr/0003-autenticacao-por-sessao.md
git add docs/arquitetura/autenticacao.md
git add docs/arquitetura/visao-geral.md
git add docs/sprints/sprint-0.md
git add docs/sprints/sprint-1.md
git add docs/testes/plano-de-testes.md
git add docs/entrega-checklist.md
git diff --cached --check
git diff --cached --stat
git status --short
git diff --cached --name-only
```

**Não adicionar:** `apps/api/.agents/`, `apps/api/.claude/`, `apps/api/.windsurf/`, `apps/api/skills-lock.json`, bancos SQLite, arquivos `.env`, dependências ou Prisma Client gerado.

Se o estágio contiver **somente os arquivos revisados acima**, publicar com:

```powershell
git commit -m "feat(security): protege escritas com verificacao de origem"
git push origin main
git status --short
git log -1 --oneline
git branch -vv
```

Caso existam **outros arquivos de código também no estágio**, revisar o diff e escolher mensagem que os represente. O avaliador já aceitou o convite, segundo Thiago. Depois do push, conferir que a branch remota contém os commits mais recentes.

## 5. Encerramento

**Funcionalidades:** US-01 a US-13 validadas conforme os testes relatados.
**Qualidade:** 143 testes API e 95 web aprovados (238 automatizados); 48 verificações manuais informadas como aprovadas.
**Documentos:** revisados, com modelagem agora conferida contra o schema integral.
**Acesso do avaliador:** convite aceito.
**Próximo ato operacional:** publicar os arquivos no GitLab. Documento pronto para commit não equivale a commit/push já realizados.
