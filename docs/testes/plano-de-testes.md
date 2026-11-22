# Plano de Testes — Sistema de Matrícula CINCoders

## Checkpoint atual — 22/11/2026

**Fonte da evidência:** logs de `pnpm exec vitest run` apresentados pelo responsável do projeto em `apps/api` e `apps/web`, resultados de lint/TypeScript e **24 verificações manuais** relatadas como aprovadas: 8 da consulta de disciplinas (US-08), 8 da edição de disciplinas (US-09) e 8 da consulta/cadastro de professores (US-10). Os testes de integração HTTP, testes de componentes e verificações manuais são contabilizados separadamente.

| Camada | Arquivos aprovados | Testes aprovados | Reprovados | Tempo informado |
| --- | ---: | ---: | ---: | --- |
| Backend — Vitest + Supertest | 9 | 98 | 0 | 6,67 s |
| Frontend — Vitest / testes de componentes | 9 | 58 | 0 | 10,32 s (última execução, após navegação US-10) |
| **Total (execuções separadas)** | **18** | **156** | **0** | Não somar durações como se fosse uma execução única |

### Inventário de suítes — backend

| Arquivo em `apps/api/tests` | História | Testes aprovados |
| --- | --- | ---: |
| `auth.test.ts` | US-01 | 8 |
| `auth.middleware.test.ts` | US-01 | 3 |
| `ofertas.test.ts` | US-03 | 9 |
| `matriculas.test.ts` | US-04 | 12 |
| `matriculas.consulta.test.ts` | US-05 | 7 |
| `matriculas.cancelamento.test.ts` | US-06 | 10 |
| `progresso.test.ts` | US-07 | 10 |
| `secretaria.disciplinas.test.ts` | US-08 (8 consulta) + US-09 (6 cadastro + 11 edição) | 25 |
| `secretaria.professores.test.ts` | US-10 (8 consulta + 6 cadastro/autorização/validação) | 14 |
| **Total** | | **98** |

### Inventário de suítes — frontend

| Arquivo de teste em `apps/web/src` | História | Testes aprovados |
| --- | --- | ---: |
| `pages/LoginPage.test.tsx` | US-02 | 4 |
| `components/LogoutButton.test.tsx` | US-02 | 3 |
| `routes/AppRoutes.test.tsx` | US-02 | 4 |
| `pages/aluno/OfertasPage.test.tsx` | US-03 e US-04 (compartilhados) | 5 |
| `pages/aluno/MatriculasPage.test.tsx` | US-05 | 5 |
| `pages/aluno/MatriculasCancelamento.test.tsx` | US-06 | 4 |
| `pages/aluno/ProgressoPage.test.tsx` | US-07 | 5 |
| `pages/secretaria/DisciplinasPage.test.tsx` | US-08 (6 consulta) + US-09 (4 cadastro + 7 edição) | 17 |
| `pages/secretaria/ProfessoresPage.test.tsx` | US-10 (6 consulta + 5 cadastro) | 11 |
| **Total** | | **58** |

Os cinco testes de ofertas/matrícula são uma única suíte: **não** somar cinco testes para US-03 e mais cinco para US-04. Os testes focados `DisciplinasPage.test.tsx` (17/17) e `ProfessoresPage.test.tsx` (11/11) foram executados separadamente e também integram a suíte completa; **não contabilizá-los duas vezes**.

### US-08 — Consulta de disciplinas (MAT-10): evidência atual

**Contrato em teste:** `GET /api/secretaria/disciplinas?busca=&pagina=&limite=`. A API restringe o acesso a `SECRETARIA`, pesquisa por código/nome, pagina resultados e informa `{ disciplinas, paginacao: { pagina, limite, total, totalPaginas } }`. A interface sincroniza a busca e a página com a URL e trata os estados de carregamento, vazio e erro.

| Fonte | Cobertura relatada | Resultado |
| --- | --- | --- |
| Backend — `secretaria.disciplinas.test.ts` | 8 cenários de consulta, acesso, pesquisa e paginação | **8/8 aprovados** |
| Frontend — `DisciplinasPage.test.tsx` | 6 cenários: renderização, busca/URL, paginação/URL, vazio, erro/nova tentativa e carregamento | **6/6 aprovados** |
| Manual — navegador, API e banco reais | 8 verificações concluídas, incluindo pesquisa, URL, lista vazia, atualização pós-cadastro e navegação | **8/8 aprovadas, conforme relato do responsável** |

**Total US-08:** 14 testes automatizados aprovados e 8 verificações manuais bem-sucedidas. Os 14 casos já integram o consolidado de 156; os testes manuais **não** aumentam a contagem de Vitest.

### US-09 — Cadastro e edição de disciplinas (MAT-13): evidência atual

**Contrato em teste:** `POST /api/secretaria/disciplinas`, acessível apenas ao perfil `SECRETARIA`; entrada `{ "codigo": string, "nome": string, "cargaHoraria": number }`. Código obrigatório e único, normalizado em maiúsculas; nome obrigatório; carga horária inteira de 15 a 120 e múltipla de 15. O frontend apresenta os mesmos campos e feedback de validação/erro.

| Fonte | Cenário explicitamente visível no log | Resultado |
| --- | --- | --- |
| Backend — `secretaria.disciplinas.test.ts` | CT-02: aluno não pode cadastrar | Aprovado |
| Backend — mesmo arquivo | CT-03: cadastro válido | Aprovado |
| Backend — mesmo arquivo | CT-04: código duplicado | Aprovado |
| Backend — suíte completa | 6 casos no arquivo; os demais nomes não aparecem no trecho resumido do log | **6/6 aprovados** |
| Frontend — `DisciplinasPage.test.tsx` | CT-01: campos obrigatórios | Aprovado |
| Frontend — mesmo arquivo | CT-02: cadastrar disciplina válida | Aprovado |
| Frontend — mesmo arquivo | CT-03: mostrar erro de código duplicado | Aprovado |
| Frontend — mesmo arquivo | CT-04: impedir cadastro com carga horária inválida | Aprovado |

**Total do cadastro da US-09:** 6 testes de backend + 4 testes de frontend = **10 testes aprovados**, já incluídos nos 156 totais. O código de teste fornecido inclui os casos CT-01 a CT-06 do cadastro.

**Contrato de edição:** `PATCH /api/secretaria/disciplinas/:id`, apenas para `SECRETARIA`; o corpo pode conter um ou mais entre `codigo`, `nome` e `cargaHoraria`. O controller valida ID, campos enviados e CH; o service normaliza texto e trata unicidade (`409`) e inexistência (`404`). O formulário React permite salvar/cancelar, mantém as condições de busca/paginação e recarrega a listagem.

| Fonte | Cobertura nova de edição | Resultado |
| --- | --- | --- |
| Backend — `secretaria.disciplinas.test.ts` | 11 testes: atualização integral e parcial, 401/403, ID inválido, 404, duplicidade, CH inválida, corpo vazio, código/nome inválidos e manutenção do próprio código | **11/11 aprovados**, conforme confirmação do responsável |
| Frontend — `DisciplinasPage.test.tsx` | 7 testes: pré-preenchimento, cancelar sem PATCH, salvar/recarregar/preservar URL, duplicidade, CH inválida, bloqueio de novo envio e nova tentativa após erro | **7/7 aprovados**, no log apresentado |
| Manual — navegador/API/banco reais | 8 verificações de edição, incluindo cancelamento, persistência, conflito de código, CH inválida e preservação de busca/URL | **8/8 aprovadas**, conforme relato do responsável |

**Total US-09:** 17 testes de backend (6 cadastro + 11 edição) e 11 de frontend (4 cadastro + 7 edição) = **28 testes automatizados aprovados**, além de **8 verificações manuais específicas da edição**. Os 28 casos já estão incluídos no total de 156. **US-09 funcionalmente concluída**; o responsável informou ter feito o commit, mas ainda é necessário conferir push e Jira MAT-13.

### US-10 — Consulta e cadastro de professores (MAT-17): evidência atual

**Contrato em teste:** `GET` e `POST /api/secretaria/professores`, ambos exclusivos do perfil `SECRETARIA` e protegidos por sessão. O `GET` aceita `busca` (nome/e-mail), `pagina` e `limite` e devolve `professores` e os metadados `paginacao`. O `POST` recebe `{ "nome": string, "email": string }`, exige campos válidos e persiste o e-mail normalizado; a unicidade é garantida pelo banco (`@unique`, erro `P2002` convertido em `409`).

| Fonte | Casos cobertos | Resultado |
| --- | --- | --- |
| Backend — `secretaria.professores.test.ts` | 14 cenários: autorização, listagem, busca por nome/e-mail, paginação, parâmetros inválidos, vazio, criação válida, unicidade e validação dos campos | **14/14 aprovados** (1,97 s na execução focada) |
| Frontend — `ProfessoresPage.test.tsx` | 5 cenários de cadastro + 6 de consulta; formulário, duplicidade, e-mail inválido, envio bloqueado, pesquisa/URL, paginação, estados de vazio, erro/nova tentativa e carregamento | **11/11 aprovados** (5,47 s na execução focada) |
| Manual — secretaria no navegador | Navegação, listagem, busca por nome/e-mail, cadastro válido, duplicidade, validação do formulário e paginação/URL | **8/8 aprovadas**, conforme relato do responsável |

**Total US-10:** **25 testes automatizados aprovados** (14 backend + 11 frontend), já incluídos nos **156 testes consolidados**, e **8 verificações manuais aprovadas**, que não integram a contagem do Vitest. Após integrar `/secretaria/professores` e a navegação entre disciplinas e professores, o responsável repetiu lint, TypeScript e suíte frontend completa, com resultado positivo.

**Situação:** US-10 funcionalmente validada; registro de commit/push e atualização do Jira MAT-17 pendentes de confirmação. A seguir, US-11 (consulta/abertura de turmas) e US-12 (capacidade/vagas).

**O que esses resultados não provam isoladamente:** proteção CSRF, cookie `Secure` em HTTPS, persistência da sessão após reinício, acessibilidade, responsividade em 360px, testes de carga ou fluxos de abertura de turmas e ajuste de vagas. Disciplinas e professores tiveram verificações manuais bem-sucedidas, mas ainda não uma suíte E2E automatizada reproduzível.

### Comandos para reproduzir o checkpoint

```powershell
cd C:\dev\sistema-matricula-cincoders\apps\api
pnpm exec tsc --noEmit
pnpm exec vitest run tests/secretaria.professores.test.ts
pnpm exec vitest run

cd C:\dev\sistema-matricula-cincoders\apps\web
pnpm exec vitest run src/pages/secretaria/DisciplinasPage.test.tsx
pnpm exec vitest run src/pages/secretaria/ProfessoresPage.test.tsx
pnpm exec vitest run
pnpm lint
pnpm exec tsc -b
```

**Importante:** o responsável também confirmou `pnpm lint`, `pnpm exec tsc -b` no frontend e `pnpm exec tsc --noEmit` no backend como aprovados. Os arquivos de banco e variáveis de ambiente devem permanecer segregados entre desenvolvimento e testes.

---

## Registro histórico: checkpoints de 21/11/2026

O material abaixo mantém critérios, Gherkin e evidências de marcos anteriores. Contagens de 11, 20, 32, 39, 49, 59 ou 70 testes são **marcos históricos**, não o total atual. Frases sobre módulos "planejados" ou "frontend pendente" descrevem aquele momento; o estado de 22/11 está consolidado acima.

> **Checkpoint histórico — 21/11/2026:** 59 testes de backend (7 arquivos) e 11 de frontend (3 arquivos), 70 testes aprovados, sem falhas, em execuções separadas. As seções históricas abaixo preservam os resultados anteriores.

## US-02 — Interface de autenticação (MAT-7)

**Estado:** implementada e testada no frontend React + TypeScript.

| Caso | Cenário | Resultado |
| --- | --- | --- |
| CT-01 | Exibir campos de usuário e senha | Aprovado |
| CT-02 | Enviar credenciais do formulário | Aprovado |
| CT-03 | Exibir erro de login | Aprovado |
| CT-04 | Impedir novo envio enquanto autentica | Aprovado |
| CT-05 | Exibir botão de logout | Aprovado |
| CT-06 | Efetuar logout e redirecionar | Aprovado |
| CT-07 | Exibir erro quando logout falhar | Aprovado |
| CT-08 | Redirecionar visitante à tela de login | Aprovado |
| CT-09 | Impedir acesso do aluno à secretaria | Aprovado |
| CT-10 | Impedir acesso da secretaria à área do aluno | Aprovado |
| CT-11 | Permitir acesso autorizado do aluno | Aprovado |

**Comandos (em `apps/web`):** `pnpm exec vitest run`, `pnpm lint` e `pnpm exec tsc -b`. Resultado: 3 arquivos, **11 testes aprovados**, ESLint e TypeScript sem erros. Login e logout também foram verificados manualmente com a API real.

**Limites:** os testes de componente usam um hook de autenticação simulado; não constituem um teste ponta a ponta da API. Permanecem pendentes a verificação visual em 360px e a revisão de CSRF e HTTPS/cookies.

## Histórico e plano original (checkpoints anteriores)

**Versão histórica:** 1.2 — 21/11/2026

**Status naquele checkpoint:** 32 testes automatizados aprovados em 4 arquivos: US-01 (11), US-03 (9) e US-04 (12). O estado atual consolidado está no início deste documento.

**Responsável:** Thiago Silva

**Prazo de entrega:** 23/11/2026

**Rastreabilidade:** `docs/requisitos-e-backlog.md`, ADRs 0001–0003, Jira MAT

## 1. Objetivo

Verificar que o sistema cumpre as regras funcionais e de autorização do teste prático, principalmente o fluxo **login → consulta de ofertas → matrícula → cancelamento → progresso curricular**. Priorizar testes de regras de negócio e de integração HTTP para detectar regressões antes da entrega.

## 2. Escopo e estratégia

| Nível | O que valida | Ferramenta / situação |
| --- | --- | --- |
| Unidade | Cálculo de progresso, classificação curricular, validações e regras isoladas | Vitest |
| Integração | Rotas HTTP, autenticação, Prisma/SQLite, transações e efeitos persistidos | Vitest + Supertest + SQLite; executado para US-01, US-03 e US-04 |
| Ponta a ponta/manual | Fluxos completos no navegador e estados visuais | Navegador; registrar evidências no PR/README |
| Responsividade | Telas do aluno utilizáveis em largura de 360px | DevTools do navegador |

**Princípio:** testes de regras não devem depender de uma interface visual pronta; as regras críticas devem ser cobertas primeiro na API. Testes devem validar estado persistido, não apenas código HTTP.

## 3. Ambiente e dados de teste

- API: Node.js + Express + TypeScript, Prisma 7 e SQLite.

- Seed de desenvolvimento: três cursos (SI/CC/EC), quatro alunos (`aluno.si`, `aluno.cc`, `aluno.ec`, `aluno.si2`) e uma conta da secretaria.

- Dados iniciais: 6 disciplinas, 2 professores, 7 turmas, 11 vínculos curriculares, 8 históricos e 0 matrículas ativas.

- Senha do seed via variável de ambiente local `SEED_PASSWORD`; não registrar seu valor no repositório.

- **Isolamento:** testes automatizados devem apontar para um arquivo SQLite exclusivo de teste, distinto de `dev.db`; preparar dados previsíveis antes de cada teste ou suíte. Não executar migrações destrutivas no banco de desenvolvimento.

- **Sessões:** a API utiliza `express-session` e `@bleed-believer/connect-sqlite3` para persistir sessões. Os arquivos `sessions.db` (desenvolvimento) e `sessions.test.db` (testes) foram criados em ambientes distintos, conforme verificação local.

- **Arquivos locais:** `dev.db`, `test.db`, `sessions.db`, `sessions.test.db` e arquivos auxiliares de SQLite não devem ser versionados. O segredo da sessão e as senhas são definidos por variáveis de ambiente.

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

**Legenda:** P0 = bloqueia o MVP; P1 = importante; P2 = se houver tempo. A execução dos casos é indicada na seção 8; a presença de um cenário nesta matriz não implica sua aprovação.

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
| T-27 | US-01, cookie | Login define cookie com `HttpOnly` e `SameSite=Lax` | Integração | P0 |
| T-28 | US-01, sessão | Novo login regenera o identificador da sessão | Integração | P0 |
| T-29 | US-01, logout | Logout envia instrução para limpar o cookie da sessão | Integração | P0 |
| T-30 | US-01, persistência | Sessão continua válida após reinício da API sem novo login, dentro do prazo de expiração | Manual/integração | P1 |
| T-31 | US-01, HTTPS | Cookie contém `Secure` em ambiente HTTPS de produção | Integração/manual | P1 |
| T-32 | US-01, CSRF | Requisições que alteram dados são protegidas contra CSRF | Integração | P0 |
| T-33 | US-09, acesso | Requisição não autenticada não cadastra disciplina; aluno autenticado é bloqueado | Integração | P0 |
| T-34 | US-09, cadastro | Secretaria cria disciplina com código, nome e CH válidos | Integração | P1 |
| T-35 | US-09, unicidade | Código já existente, inclusive após normalização, não produz novo cadastro | Integração | P1 |
| T-36 | US-09, validação | Código/nome obrigatórios, CH inteira de 15–120 e múltipla de 15 | Integração/UI | P1 |
| T-37 | US-09, formulário | Campos, envio válido, erro de duplicidade e bloqueio de CH inválida | Componente | P1 |
| T-38 | US-09, integração | Cadastro pela interface real atualiza o banco via API com sessão da secretaria | Ponta a ponta/manual | P1 |
| T-39 | US-08, consulta | Secretaria consulta disciplinas com autorização, busca por código e nome e paginação | Integração | P1 |
| T-40 | US-08, interface | A listagem apresenta resultados, vazio, carregamento, erro e nova tentativa | Componente/manual | P1 |
| T-41 | US-08, navegação | Busca e página são sincronizadas com a URL, e o cadastro atualiza a lista | Componente/manual | P1 |
| T-42 | US-09, edição | Alterar dados válidos de disciplina, validar unicidade, carga horária e autorização | Integração/UI | P1 — aprovado |
| T-43 | US-09, interface de edição | Pré-preenchimento, salvar/cancelar, recarga da lista e preservação de busca/página na URL | Componente/manual | P1 — aprovado |
| T-44 | US-09, fluxo real | Edição persistida após recarregar, erro de código duplicado e de CH inválida, sem modificar registros indevidos | Manual | P1 — 8/8 verificações aprovadas |
| T-45 | US-10, acesso a professores | Consulta/cadastro sem sessão → `401`; por aluno → `403` | Integração | P1 — aprovado |
| T-46 | US-10, consulta de professores | Listar, buscar por nome/e-mail e paginar sem repetir resultados; validar parâmetros | Integração | P1 — aprovado |
| T-47 | US-10, cadastro de professores | Criar e persistir professor válido, normalizar e-mail e rejeitar duplicado (`409`) | Integração | P1 — aprovado |
| T-48 | US-10, validação | Recusar nome ausente/inválido e e-mail inválido | Integração/UI | P1 — aprovado |
| T-49 | US-10, página React | Busca e paginação na URL, estados de carregamento/vazio/erro e tentativa novamente | Componente/manual | P1 — aprovado |
| T-50 | US-10, fluxo manual | Navegar, pesquisar, cadastrar, observar duplicidade e consultar paginação/URL | Manual | P1 — 8/8 verificações aprovadas |

**Rastreabilidade atual:** US-08 (consulta, MAT-10) tem 8 testes API, 6 frontend e 8 manuais; US-09 (cadastro/edição, MAT-13) tem 17 API, 11 frontend e 8 manuais da edição; US-10 (professores, MAT-17) tem 14 API, 11 frontend e 8 manuais. **Total do projeto: 156 automatizados + 24 verificações manuais**, sem duplicar execuções focadas. O T-38 teve verificação manual de atualização da lista após cadastro; não existe ainda uma suíte E2E automatizada para ele. A matriz expressa *o que testar*, sem declarar aprovados cenários não exercitados.

## 6. Exemplos Gherkin prioritários

```gherkin

Funcionalidade: Autenticação e sessão

  Cenário: Login válido cria sessão protegida

    Dado que existe um aluno com credenciais válidas

    Quando ele realiza login

    Então a API retorna seu perfil sem senhaHash

    E cria uma sessão acessível por cookie HttpOnly e SameSite=Lax

  Cenário: Usuário inexistente

    Quando alguém tenta login com um username inexistente

    Então a API responde 401 com mensagem genérica

  Cenário: Logout invalida sessão

    Dado que um aluno está autenticado

    Quando ele solicita logout

    Então a API invalida sua sessão e limpa o cookie

    E uma consulta posterior a /api/auth/me retorna 401

  Cenário: Sessão persiste após reinício

    Dado que o aluno realizou login e possui cookie válido

    Quando a API é reiniciada mantendo o mesmo segredo e banco de sessões

    Então a consulta a /api/auth/me permanece autenticada sem novo login

```

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

```gherkin
Funcionalidade: Consulta e cadastro de professores pela secretaria

  Cenário: Pesquisar professores com paginação
    Dado que a secretaria está autenticada e existem professores cadastrados
    Quando pesquisar por nome ou e-mail e navegar entre páginas
    Então a listagem apresenta os resultados esperados sem repetições
    E a busca e a página são refletidas na URL

  Cenário: Cadastrar professor sem duplicar e-mail
    Dado que a secretaria está autenticada
    Quando cadastrar um professor com nome e e-mail válidos e inéditos
    Então a API persiste o professor e retorna sucesso
    E a listagem é atualizada
    Quando repetir o cadastro com o mesmo e-mail
    Então a API rejeita a duplicidade
    E a interface informa o erro sem criar outro professor

  Cenário: Proteger endpoints de professores
    Dado que o acesso ocorre sem sessão ou por um aluno autenticado
    Quando consultar ou cadastrar professores
    Então o sistema bloqueia a operação conforme o perfil
```

## 7. Organização dos testes

### Estrutura efetiva do checkpoint de 22/11/2026

```text
apps/api/tests/
  auth.test.ts                         # 8 testes
  auth.middleware.test.ts              # 3 testes
  ofertas.test.ts                      # 9 testes
  matriculas.test.ts                   # 12 testes
  matriculas.consulta.test.ts          # 7 testes
  matriculas.cancelamento.test.ts      # 10 testes
  progresso.test.ts                    # 10 testes
  secretaria.disciplinas.test.ts       # 25 testes (US-08 e US-09)
  secretaria.professores.test.ts       # 14 testes (US-10)

apps/web/src/
  pages/LoginPage.test.tsx             # 4 testes
  components/LogoutButton.test.tsx     # 3 testes
  routes/AppRoutes.test.tsx            # 4 testes
  pages/aluno/OfertasPage.test.tsx     # 5 testes
  pages/aluno/MatriculasPage.test.tsx  # 5 testes
  pages/aluno/MatriculasCancelamento.test.tsx # 4 testes
  pages/aluno/ProgressoPage.test.tsx   # 5 testes
  pages/secretaria/DisciplinasPage.test.tsx # 17 testes (US-08 e US-09)
  pages/secretaria/ProfessoresPage.test.tsx # 11 testes (US-10)
```

### Proposta inicial preservada (21/11/2026)

```text

apps/api/

  tests/

    auth.test.ts                  # Implementado: 8 testes

    auth.middleware.test.ts       # Implementado: 3 testes

    ofertas.test.ts               # Implementado: 9 testes

    matriculas.test.ts            # Implementado: 12 testes

    progresso.test.ts             # Planejado

    secretaria.test.ts            # Planejado

    helpers/

      banco-teste.ts              # Estrutura sugerida, se necessária

```

**Contexto histórico:** naquele momento só os quatro arquivos de autenticação/autorização, ofertas e matrículas estavam concluídos; os demais nomes eram sugestões. Em 22/11/2026, `progresso.test.ts` e `secretaria.disciplinas.test.ts` já aparecem nas suítes reais, juntamente com os testes de consulta e cancelamento. Para Supertest, importar `app` de `src/app.ts` sem iniciar `server.ts`. Usar `request.agent(app)` nos cenários que precisam reutilizar cookies. A autorização da secretaria foi inicialmente exercitada por rota exclusiva de teste; posteriormente o cadastro (US-09) e a consulta (US-08) implementaram rotas administrativas reais.

### Comandos de verificação

```powershell

cd C:\dev\sistema-matricula-cincoders\apps\api

pnpm exec prisma validate

pnpm exec prisma migrate status

pnpm exec vitest run tests/auth.test.ts

pnpm exec vitest run tests/matriculas.test.ts

pnpm exec vitest run

```

**Pré-condição:** `DATABASE_URL` deve apontar para o banco SQLite de teste preparado com migrações e seed, nunca para `dev.db`. Os testes dependem das variáveis locais `SESSION_SECRET` e `SEED_PASSWORD`. Não registrar seus valores em logs ou documentos. Antes de executar uma suíte que altera dados, conferir as variáveis e o banco de destino.

**Atenção:** um teste que passa não comprova requisitos ainda não exercitados. A suíte de matrícula inclui uma disputa concorrente por vaga, mas não substitui testes de carga nem a verificação da propriedade de dados acadêmicos ou de proteção CSRF.

## 8. Registro de execução

### Registro atual — 22/11/2026 (US-10 professores)

| Data | Verificação | Evidência observada | Resultado |
| --- | --- | --- | --- |
| 22/11/2026 | `apps/api`: `pnpm exec tsc --noEmit` | Compilação de tipos sem erros, conforme log do responsável | **Passou** |
| 22/11/2026 | `apps/api`: `pnpm exec vitest run tests/secretaria.professores.test.ts` | 1 arquivo, 14 testes, 0 falhas, 1,97 s | **14/14 passaram** |
| 22/11/2026 | `apps/api`: `pnpm exec vitest run` | 9 arquivos, 98 testes, 0 falhas, 6,67 s | **98/98 passaram** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run src/pages/secretaria/ProfessoresPage.test.tsx` | 1 arquivo, 11 testes, 0 falhas, 5,47 s | **11/11 passaram** |
| 22/11/2026 | `apps/web`: `pnpm lint` e `pnpm exec tsc -b` | Ambos aprovados após integração de rota e menu da secretaria | **Passou** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run` | 9 arquivos, 58 testes, 0 falhas, 10,32 s na última execução | **58/58 passaram** |
| 22/11/2026 | US-10: 8 verificações manuais | Lista, busca, cadastro, validações e navegação com API real, todas relatadas como corretas | **8/8 passaram — manual** |

**Consolidado atual:** 98 + 58 = **156 testes automatizados aprovados**, 18 arquivos, 0 falhas; **24 verificações manuais aprovadas** (8 da US-08, 8 da US-09, 8 da US-10). Testes focados estão contidos nas suítes completas, e as verificações manuais não são contadas como testes Vitest.

### Registro anterior — 22/11/2026 (US-09 edição, preservado)

| Data | Verificação | Evidência observada | Resultado |
| --- | --- | --- | --- |
| 22/11/2026 | `apps/api`: `pnpm exec vitest run` | 8 arquivos, 84 testes, 0 falhas; tempo não informado | **Passou — confirmado pelo responsável** |
| 22/11/2026 | `apps/api`: `pnpm exec tsc --noEmit` | Verificação de tipos confirmada pelo responsável | **Passou** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run src/pages/secretaria/DisciplinasPage.test.tsx` | 1 arquivo, 17 testes (6 consulta + 4 cadastro + 7 edição), 0 falhas, duração 6,19 s | **Passou** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run` | 8 arquivos, 47 testes, 0 falhas, duração 7,00 s | **Passou** |
| 22/11/2026 | `apps/web`: `pnpm lint` e `pnpm exec tsc -b` | Comandos executados sem erro, conforme relato do responsável | **Passou** |
| 22/11/2026 | US-08: 8 verificações manuais | Navegador/API/banco reais; todas funcionaram, conforme relato do responsável | **8/8 passaram — manual** |
| 22/11/2026 | US-09: 8 verificações manuais | Edição no navegador real: pré-preenchimento, cancelar, salvar/persistir, duplicidade, CH inválida e preservação da URL, conforme relato do responsável | **8/8 passaram — manual** |

**Consolidado naquele checkpoint:** 84 + 47 = **131 testes automatizados aprovados**, 16 arquivos, 0 falhas. A execução focada de 17 testes é uma repetição parcial da suíte frontend e **não** aumenta o total de 131. As **16 verificações manuais** (8 US-08 + 8 US-09) são registradas à parte. **Esse número é histórico; o atual está na tabela imediatamente acima.**

**Checkpoint imediatamente anterior — consulta US-08, também em 22/11/2026:** 73 testes backend (8 arquivos) + 40 frontend (8 arquivos) = 113 automatizados sem falhas; 10 testes focados na página (4 cadastro + 6 consulta); 8 verificações manuais de consulta aprovadas. O novo total **substitui**, não se soma ao total antigo.

### Registro inicial — 21/11/2026 (histórico)

| Data | Verificação | Evidência observada | Resultado |
| --- | --- | --- | --- |
| 21/11/2026 | `prisma validate` | Schema declarado válido | Passou |
| 21/11/2026 | `prisma migrate status` | Uma migração aplicada, banco em dia | Passou |
| 21/11/2026 | `prisma db seed` (duas execuções) | Ambas terminaram sem erros | Passou |
| 21/11/2026 | Contagem do banco com Prisma Client | Quantidades esperadas conferidas pelo responsável | Passou — conferência manual |
| 21/11/2026 | `GET /api/health` | Resposta JSON esperada informada pelo responsável | Passou — teste manual |
| 21/11/2026 | Login manual `aluno.si` | HTTP 200 e perfil `ALUNO`; `/api/auth/me` respondeu autenticado | Passou — manual |
| 21/11/2026 | Logout manual | `/api/auth/me` passou a responder `401` após logout | Passou — manual |
| 21/11/2026 | Criação do armazenamento SQLite de sessões | `Test-Path .\sessions.db` → `True` | Passou — verificação de arquivo |
| 21/11/2026 | Separação do arquivo de sessões de teste | `Test-Path .\sessions.test.db` → `True` | Passou — verificação de arquivo |
| 21/11/2026 | `pnpm exec vitest run tests/auth.test.ts` | 1 arquivo, 8 testes, 0 falhas; duração 2,83 s | Passou |
| 21/11/2026 | `pnpm exec vitest run` | 2 arquivos, 11 testes (8 autenticação + 3 autorização), 0 falhas; duração 2,18 s | Passou |
| 21/11/2026 | US-03 — `pnpm exec vitest run` | 3 arquivos, 20 testes (11 anteriores + 9 ofertas), 0 falhas | Passou |
| 21/11/2026 | `prisma migrate status` com `DATABASE_URL=file:./test.db` | Banco `test.db` identificado; schema atualizado | Passou |
| 21/11/2026 | `pnpm exec vitest run tests/matriculas.test.ts` | 12 casos aprovados, incluindo concorrência por última vaga | Passou |
| 21/11/2026 | `pnpm exec vitest run` | **4 arquivos, 32 testes (11 autenticação/autorização + 9 ofertas + 12 matrículas), 0 falhas; duração 2,55 s** | **Passou** |
| A confirmar | Sessão mantida após reiniciar a API | Registrar resposta de `/api/auth/me` sem novo login | Pendente de evidência explícita |
| — | CSRF e atributo `Secure` em HTTPS | Ainda não testados | Pendente |
| — | Isolamento acadêmico entre alunos | Ofertas e matrícula derivam identidade da sessão; testes de titularidade de registros privados ainda pendentes | Parcial |
| — | Cancelamento via API, progresso e demais regras de negócio | Matrícula testada; demais módulos ainda pendentes | Pendente |
| — | Interface em largura de 360px | Frontend ainda não validado | Pendente |

### 8.1. Evidências detalhadas da US-01 — 21/11/2026

**Resultado da suíte completa:** 11 testes aprovados, 0 reprovados, em 2 arquivos de teste (Vitest 5.1.1 + Supertest).

| ID de teste | Cenário automatizado | Evidência |
| --- | --- | --- |
| T-03 | `GET /api/auth/me` sem autenticação | HTTP 401 |
| T-02 | Senha incorreta | HTTP 401 com mensagem genérica |
| T-01 | Login válido e manutenção da sessão de `aluno.si` | HTTP 200; perfil `ALUNO`; resposta sem `senhaHash`; `/me` autenticado |
| T-04 | Logout invalida sessão | `/me` após logout → HTTP 401 |
| T-02 | Username inexistente | HTTP 401 com mensagem genérica |
| T-27 | Cookie de sessão | `HttpOnly` e `SameSite=Lax` presentes |
| T-28 | Novo login na mesma sessão de cliente | Identificador de sessão alterado |
| T-29 | Logout limpa cookie | Resposta de logout envia cookie vazio; `/me` → HTTP 401 |
| T-03 | Cliente sem sessão em rota restrita à secretaria | HTTP 401 |
| T-03 | Aluno em rota restrita à secretaria | HTTP 403 |
| T-03 | Secretaria em rota autorizada | HTTP 200 |

Os três testes de autorização por perfil utilizam uma **rota exclusiva do ambiente de testes**. Eles validam o middleware, mas não representam a implementação dos futuros endpoints administrativos.

### 8.2. Limites da evidência

- O teste de regeneração compara identificadores emitidos em **dois logins sucessivos**; não substitui uma auditoria completa contra fixação de sessão.

- O teste de `HttpOnly`/`SameSite=Lax` inspeciona o cabeçalho `Set-Cookie` no ambiente de testes. `Secure` deve ser verificado separadamente em HTTPS.

- O armazenamento em arquivo SQLite foi criado, mas isso **não comprova sozinho** que a sessão sobrevive a reinício da API. É necessária a evidência específica do cenário T-30.

- `SameSite=Lax` não é prova suficiente de proteção contra CSRF; o cenário T-32 permanece aberto.

- Não há cobertura de autorização por propriedade dos dados acadêmicos (T-05) enquanto os endpoints correspondentes não existirem.

### 8.3. Situação da Definition of Done da US-01

- [x] Login, `/me` e logout implementados e testados.

- [x] Autorização por perfil implementada e testada.

- [x] Hash Argon2id utilizado na verificação de credenciais.

- [x] Resposta de login não expõe `senhaHash`.

- [x] Armazenamento SQLite de sessões integrado, com arquivos distintos para desenvolvimento e testes.

- [x] Atributos `HttpOnly` e `SameSite=Lax`, regeneração do ID e limpeza do cookie testados.

- [ ] Evidência formal da sessão após reinício da API.

- [ ] Proteção contra CSRF revisada e validada.

- [ ] Atributo `Secure` validado em HTTPS.

- [ ] Isolamento de dados acadêmicos validado quando as rotas estiverem disponíveis.

- [x] Commit/push da autenticação verificados no GitLab (`847ddc8`).

- [ ] Jira MAT-6 atualizado e demais critérios pendentes encerrados.

**Status da US-01:** em andamento; não marcar como concluída apenas pelo resultado de 11/11 testes.

### US-03 — Consulta de ofertas — 21/11/2026

**Implementação:** GET /api/aluno/ofertas

**Ferramentas:** Vitest e Supertest.

**Resultado:** 9 testes automatizados aprovados.

Cenários validados:

- [x] Rejeitar acesso sem autenticação (401).

- [x] Bloquear acesso da secretaria (403).

- [x] Listar ofertas e calcular vagas disponíveis.

- [x] Pesquisar disciplinas pelo código.

- [x] Paginar resultados sem repetir turmas.

- [x] Classificar disciplinas conforme o curso do aluno.

- [x] Identificar disciplinas livres.

- [x] Retornar lista vazia quando não houver resultados.

- [x] Rejeitar parâmetros inválidos de paginação (400).

**Suíte completa:** 20 testes aprovados, 0 falhas.

**Pendências:**

- Implementar a interface React.

- Validar busca e paginação refletidas na URL do navegador.

- Testar o comportamento responsivo em 360px.

- [x] Validar a atualização da ocupação após matrícula (CT-12 da US-04).

- [ ] Validar a liberação da vaga após cancelamento via API (US-06).

### 8.4. US-04 — Realização de matrícula — 21/11/2026

**Jira:** MAT-11

**Endpoint:** `POST /api/aluno/matriculas`

**Arquivo:** `apps/api/tests/matriculas.test.ts`

**Ferramentas:** Vitest 5.1.1, Supertest, Prisma 7 e SQLite de teste.

**Resultado:** 12 testes aprovados, 0 falhas.

| Caso | Cenário | Evidência |
| --- | --- | --- |
| CT-01 | Matrícula de aluno elegível | HTTP `201`, registro `ATIVA` |
| CT-02 | Cliente sem autenticação | HTTP `401` |
| CT-03 | Secretaria acessa operação de aluno | HTTP `403` |
| CT-04 | Turma inexistente | HTTP `404` |
| CT-05 | `turmaId` inválido | HTTP `400` |
| CT-06 | Disciplina previamente aprovada | HTTP `409` |
| CT-07 | Duas turmas da mesma disciplina | Segunda matrícula rejeitada com `409` |
| CT-08 | Turma lotada | HTTP `409` |
| CT-09 | Rematrícula após cancelamento | Dois registros distintos; anterior `CANCELADA`, novo `ATIVA` |
| CT-10 | Dois alunos concorrem pela última vaga | Um `201`, um `409`, ocupação final igual a 1 |
| CT-11 | Disciplina anteriormente reprovada | HTTP `201` |
| CT-12 | Consulta de ofertas após matrícula | Vagas ocupadas e disponíveis atualizadas |

**Limites da evidência:**

- O CT-09 simula o cancelamento por atualização direta do registro no SQLite; **não** valida um endpoint HTTP de cancelamento, ainda pendente na US-06.

- O CT-10 passou em uma disputa simultânea de duas requisições. Não representa testes prolongados de concorrência/carga ou múltiplas instâncias da API.

- O CT-12 verifica a ocupação após matrícula; liberação de vagas após cancelamento permanece pendente.

- A identificação do aluno ocorre via sessão, mas ainda faltam testes de propriedade em endpoints que exponham matrículas/histórico privados.

- O frontend de matrícula ainda não foi implementado. A US-04 está validada **no backend**, não concluída de ponta a ponta.

**Evidência da suíte completa de 21/11/2026:** 4 arquivos aprovados; 32 testes aprovados; 0 falhas; duração de 2,55 s.

### 8.5. US-05 — Consulta de matrículas — 21/11/2026

**Jira:** MAT-8

**Endpoint:** GET /api/aluno/matriculas

**Arquivo:** apps/api/tests/matriculas.consulta.test.ts

**Resultado:** 7 testes aprovados.

#### Cenários validados

- [x] CT-01 — Negar acesso sem autenticação (401).

- [x] CT-02 — Bloquear acesso da secretaria (403).

- [x] CT-03 — Listar matrículas ativas do aluno.

- [x] CT-04 — Não retornar matrículas canceladas.

- [x] CT-05 — Não expor matrículas de outro aluno.

- [x] CT-06 — Ignorar tentativa de informar outro alunoId.

- [x] CT-07 — Retornar lista vazia para aluno sem matrículas.

**Suíte completa:** 39 testes aprovados, 0 falhas.

**Pendências:**

- Implementar a interface React.

- Validar a atualização da listagem após cancelamento.

### 8.6. US-06 — Cancelamento de matrícula — 21/11/2026

**Jira:** MAT-15

**Endpoint:** PATCH /api/aluno/matriculas/:matriculaId/cancelar

**Arquivo:** apps/api/tests/matriculas.cancelamento.test.ts

**Resultado:** 10 testes aprovados.

#### Cenários validados

- [x] CT-01 — Negar cancelamento sem autenticação (401).

- [x] CT-02 — Bloquear acesso da secretaria (403).

- [x] CT-03 — Rejeitar identificador inválido (400).

- [x] CT-04 — Rejeitar matrícula inexistente (404).

- [x] CT-05 — Cancelar matrícula própria.

- [x] CT-06 — Impedir cancelamento de outro aluno.

- [x] CT-07 — Impedir cancelamento repetido.

- [x] CT-08 — Liberar vaga após cancelamento.

- [x] CT-09 — Permitir rematrícula após cancelamento.

- [x] CT-10 — Processar somente um cancelamento simultâneo.

**Suíte completa:** 49 testes aprovados em 6 arquivos,

0 falhas.

**Limitações:**

- A interface React ainda não foi implementada.

- O teste concorrente não substitui testes de carga.

### 8.7. US-07 — Progresso curricular — 21/11/2026

**Jira:** MAT-12

**Endpoint:** GET /api/aluno/progresso

**Arquivo:** apps/api/tests/progresso.test.ts

**Resultado:** 10 testes aprovados.

#### Cenários validados

- [x] CT-01 — Negar acesso sem autenticação.

- [x] CT-02 — Bloquear acesso da secretaria.

- [x] CT-03 — Calcular CH aprovada por categoria.

- [x] CT-04 — Retornar progresso vazio.

- [x] CT-05 — Não integralizar disciplinas reprovadas.

- [x] CT-06 — Transferir excedente de perfil para livre.

- [x] CT-07 — Não contabilizar aprovação duplicada.

- [x] CT-08 — Apresentar CH de matrícula ativa separadamente.

- [x] CT-09 — Desconsiderar matrícula cancelada da CH em curso.

- [x] CT-10 — Impedir consulta de progresso de outro aluno.

**Suíte completa:** 59 testes aprovados,

7 arquivos e 0 falhas.

**Pendência:** integração com o frontend React.

### 8.8. US-09 — Cadastro de disciplinas (checkpoint anterior à edição) — 22/11/2026

**Endpoint:** `POST /api/secretaria/disciplinas`.

**Arquivo backend:** `apps/api/tests/secretaria.disciplinas.test.ts` — **6 testes aprovados**.

**Arquivo frontend:** `apps/web/src/pages/secretaria/DisciplinasPage.test.tsx` — **4 testes aprovados**.

**Aspectos verificados nos logs:**

- [x] Aluno não possui autorização para cadastrar disciplina (caso CT-02 do backend).
- [x] Secretaria cadastra disciplina válida (CT-03 do backend).
- [x] Código duplicado é recusado (CT-04 do backend).
- [x] A página apresenta código, nome e carga horária (CT-01 do frontend).
- [x] O formulário envia um cadastro válido (CT-02 do frontend).
- [x] O formulário apresenta erro de código duplicado (CT-03 do frontend).
- [x] O formulário impede carga horária inválida (CT-04 do frontend).
- [x] As suítes completas daquele checkpoint terminaram sem falhas: 73 backend e 40 frontend.

O código de teste da fase de cadastro foi fornecido com os seis casos CT-01 a CT-06; todos passaram. As verificações de consulta incluídas posteriormente foram registradas na seção 8.9.

**Contexto histórico:** naquele momento, edição de disciplinas ainda não estava concluída; foi implementada e validada posteriormente no mesmo dia (seção 8.10). Permanecem responsividade, acessibilidade, CSRF e outros cadastros da secretaria. A atualização manual da lista após cadastro foi confirmada; testes de componente não substituem integralmente testes E2E.

### 8.9. US-08 — Consulta de disciplinas — 22/11/2026

**Endpoint:** `GET /api/secretaria/disciplinas`, com pesquisa e paginação.

**Backend:** 8 testes de consulta em `apps/api/tests/secretaria.disciplinas.test.ts`; naquele checkpoint, o arquivo tinha 14 casos com os 6 de cadastro da US-09. Na versão atual, tem 25 após incluir a edição.

**Frontend:** 6 testes de consulta em `apps/web/src/pages/secretaria/DisciplinasPage.test.tsx`; naquele checkpoint, o arquivo tinha 10 com os 4 de cadastro. Na versão atual, tem 17 após incluir a edição.

- [x] Exibir as disciplinas retornadas pela API.
- [x] Pesquisar e refletir o termo na URL.
- [x] Avançar a página e atualizar a URL.
- [x] Apresentar mensagem de lista vazia.
- [x] Permitir tentar novamente após erro de rede.
- [x] Informar carregamento durante a consulta.
- [x] Validar acesso e paginação no backend (8 casos de consulta aprovados).
- [x] Executar 8 verificações manuais com a aplicação real; o responsável relatou que **todas funcionaram**.

**Status:** US-08 implementada e validada, com 14 testes automatizados específicos de consulta e oito verificações manuais. Permanecem a revisão de responsividade/acessibilidade e os cuidados de segurança transversais do sistema.

### 8.10. US-09 — Edição de disciplinas — 22/11/2026

**Endpoint:** `PATCH /api/secretaria/disciplinas/:id`, protegido por `exigirPerfil("SECRETARIA")`. Aceita atualização de um ou mais campos de disciplina, preserva o próprio código e aplica unicidade e regra de CH.

**Backend:** 11 testes novos em `apps/api/tests/secretaria.disciplinas.test.ts`, além dos 14 anteriores. O responsável confirmou a aprovação dos testes de integração e da suíte backend completa (**84/84 em 8 arquivos**).

- [x] CT-01 — Atualizar disciplina e conferir persistência no banco.
- [x] CT-02 — Atualização parcial sem modificar campos omitidos.
- [x] CT-03 — Negar edição sem sessão (`401`).
- [x] CT-04 — Negar edição pelo aluno (`403`) e preservar dados.
- [x] CT-05 — Rejeitar ID inválido (`400`).
- [x] CT-06 — Rejeitar disciplina inexistente (`404`).
- [x] CT-07 — Rejeitar código de outra disciplina (`409`) sem alteração indevida.
- [x] CT-08 — Rejeitar CH inválida (`400`) sem persistir mudanças.
- [x] CT-09 — Rejeitar corpo sem campos editáveis (`400`).
- [x] CT-10 — Rejeitar código/nome inválidos (`400`).
- [x] CT-11 — Permitir alterar nome mantendo o próprio código.

**Frontend:** 7 novos testes em `apps/web/src/pages/secretaria/DisciplinasPage.test.tsx`, somados aos 10 anteriores. Log do teste focado: **17/17 aprovados em 6,19 s**. Log da suíte completa: **47/47 aprovados em 8 arquivos, 7,00 s**; `pnpm lint` e `pnpm exec tsc -b` também passaram.

- [x] CT-01 — Abrir formulário preenchido a partir da linha da tabela.
- [x] CT-02 — Cancelar sem chamar a API de edição.
- [x] CT-03 — Enviar `PATCH`, recarregar listagem e preservar busca/página na URL.
- [x] CT-04 — Exibir erro de código duplicado sem fechar o formulário.
- [x] CT-05 — Impedir envio de CH inválida.
- [x] CT-06 — Desabilitar salvamento/cancelamento durante a requisição.
- [x] CT-07 — Permitir tentar novamente após falha temporária.

**Verificação manual:** o responsável confirmou **8/8 cenários aprovados**, cobrindo botão Editar, dados pré-preenchidos, cancelamento, alteração válida, persistência após recarga, código duplicado, CH inválida e preservação da URL. O relato comprova a execução manual informada, mas não é uma gravação ou automação de E2E.

**Status:** US-09 (cadastro + edição) funcionalmente implementada e validada; registro do commit da edição e atualização Jira MAT-13 ainda a conferir.

### 8.11. US-10 — Consulta e cadastro de professores — 22/11/2026

**Backend:** `apps/api/tests/secretaria.professores.test.ts`, com **14/14 testes aprovados** na suíte focada e na suíte geral (**98/98 em 9 arquivos**).

- [x] CT-01 — Negar consulta sem autenticação (`401`).
- [x] CT-02 — Impedir consulta pelo aluno (`403`).
- [x] CT-03 — Listar professores para a secretaria.
- [x] CT-04 — Pesquisar professor pelo nome.
- [x] CT-05 — Pesquisar professor pelo e-mail.
- [x] CT-06 — Paginar sem repetir professores.
- [x] CT-07 — Rejeitar parâmetros de consulta inválidos (`400`).
- [x] CT-08 — Retornar lista vazia sem resultados.
- [x] CT-09 — Cadastrar professor válido e persistir no banco.
- [x] CT-10 — Rejeitar e-mail duplicado (`409`).
- [x] CT-11 — Rejeitar nome inválido (`400`).
- [x] CT-12 — Rejeitar e-mail inválido (`400`).
- [x] CT-13 — Impedir cadastro pelo aluno (`403`).
- [x] CT-14 — Impedir cadastro sem autenticação (`401`).

**Frontend:** `apps/web/src/pages/secretaria/ProfessoresPage.test.tsx`, com **11/11 testes aprovados** na suíte focada e na geral (**58/58 em 9 arquivos** após integrar a rota).

Cadastro:

- [x] CT-01 — Apresentar campos obrigatórios.
- [x] CT-02 — Cadastrar professor válido e atualizar a lista.
- [x] CT-03 — Mostrar erro de e-mail duplicado.
- [x] CT-04 — Impedir cadastro com e-mail inválido.
- [x] CT-05 — Impedir novo envio durante o cadastro.

Consulta:

- [x] CT-01 — Exibir os professores retornados.
- [x] CT-02 — Pesquisar e refletir a busca na URL.
- [x] CT-03 — Avançar página e atualizar a URL.
- [x] CT-04 — Mostrar mensagem de lista vazia.
- [x] CT-05 — Permitir tentar novamente após erro de rede.
- [x] CT-06 — Informar estado de carregamento durante a consulta.

**Verificações manuais (8/8):** o responsável informou ter concluído com sucesso a navegação para a página, consulta de professores, pesquisa por nome e por e-mail, cadastro válido, rejeição de e-mail duplicado, validação de dados e funcionamento de URL/paginação. Relato de aprovação manual não deve ser confundido com captura automática de evidências E2E.

**Status:** **US-10 funcionalmente concluída e validada**; conferir publicação de código/documentação no Git e atualização Jira MAT-17. As histórias US-11/US-12 e o requisito adicional ainda não foram validados.

## 9. Priorização e riscos

O prazo é curto. Priorizar **P0** no fluxo do aluno: credenciais, autorização, consulta de ofertas, matrícula, cancelamento, rematrícula, lotação, concorrência, progresso e isolamento de dados. Os testes **P1** da secretaria e do requisito extra acompanham sua implementação.

Riscos que exigem atenção:

1. **Concorrência:** duas matrículas simultâneas podem violar capacidade/unicidade sem transação adequada.

2. **Privacidade:** usar o ID vindo do cliente em vez da sessão pode expor dados de outro aluno.

3. **Sessões e CSRF:** a persistência foi integrada ao SQLite, mas requer evidência após reinício; revisar CSRF e os cookies de produção antes da entrega.

4. **Banco de teste:** assegurar que Vitest, Prisma e o armazenamento de sessão não modifiquem `dev.db` nem o banco de sessões de desenvolvimento.

5. **Cobertura falsa (exemplo histórico):** os 32 testes de um checkpoint de 21/11 cobriam autenticação/autorização, ofertas e realização de matrícula no backend, sem provar cancelamento, progresso, frontend ou secretaria naquela época. No checkpoint atual de 22/11 há **156 testes**, mas ainda não há prova automática de CSRF, responsividade, carga ou MVP completo.

## 10. Manutenção

Atualizar este documento quando novos critérios Gherkin forem acordados, quando uma regra mudar, **a cada conclusão de User Story** e antes do commit final. Registrar data, comando executado, resultado e pendências reais na seção 8. Atualizar a Sprint correspondente e o item no Jira MAT. Manter checkpoints históricos identificados e não somar execuções focadas aos resultados consolidados da mesma suíte.