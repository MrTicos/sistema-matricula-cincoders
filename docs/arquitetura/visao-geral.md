# Visão geral da arquitetura — CINCoders

> **Checkpoint atualizado — 21/11/2026:** backend com 59 testes aprovados e frontend com 30 testes aprovados. **Total acumulado: 89 testes**, em execuções separadas. Seções antigas abaixo registram checkpoints históricos.

## Consulta, cancelamento e progresso — frontend do aluno

| História | Rota React | Endpoint Express |
| --- | --- | --- |
| US-05 — Matrículas ativas | `/aluno/matriculas` | `GET /api/aluno/matriculas` |
| US-06 — Cancelamento | Ação em `/aluno/matriculas` | `PATCH /api/aluno/matriculas/:matriculaId/cancelar` |
| US-07 — Progresso curricular | `/aluno/progresso` | `GET /api/aluno/progresso` |

### Responsabilidades e comportamento

- **Consulta de matrículas:** a interface apresenta apenas os registros ativos fornecidos pela API, com disciplina, professor, turma, carga horária e data. O aluno é identificado pela sessão; não se aceita `alunoId` do cliente para buscar dados privados.
- **Cancelamento:** o frontend exige confirmação e oferece desistência. Após resposta de sucesso, remove a matrícula cancelada da lista; o backend preserva o registro com situação `CANCELADA` e libera a vaga. Em eventual rematrícula elegível, cria-se novo registro (ADR-0001).
- **Progresso:** a API entrega indicadores `exigida`, `integralizada`, `emCurso`, `faltante` e `percentual` para obrigatória, perfil, livre e total, além de `cargaHorariaEmCurso`. O frontend exibe barras e indicadores sem recalcular as regras acadêmicas.
- **Segurança:** autenticação e autorização de propriedade são garantidas no backend. Rotas protegidas no React não substituem as verificações da API.

### Validação e pendências

Foram aprovados 5 testes de frontend da US-05, 4 da US-06 e 5 da US-07, além dos 16 testes anteriores. A consulta de matrícula real, o cancelamento com liberação de vaga e a tela de progresso foram verificados manualmente. Permanecem pendentes testes de ponta a ponta, conferência em 360px, revisão de CSRF/HTTPS e implementação das áreas administrativas.

## Consulta de ofertas e matrícula — frontend (US-03/MAT-16 e US-04/MAT-11)

O React consome `GET /api/aluno/ofertas`, com busca por nome/código e paginação por parâmetros de URL (`busca`, `pagina`, `limite`). A resposta inclui disciplina, professor, classificação por curso, vagas totais, vagas ocupadas e vagas disponíveis. A interface mostra estados de carregamento, erro, lista vazia e turma lotada.

O botão **Matricular-se** chama `POST /api/aluno/matriculas`, enviando somente `{ "turmaId": número }`. O backend identifica o aluno pela sessão e verifica vagas, aprovação anterior e unicidade de matrícula ativa por disciplina. Após sucesso, o frontend consulta novamente as ofertas para atualizar a ocupação sem recarregar o navegador.

**Evidência:** cinco testes de componente aprovados (`src/pages/aluno/OfertasPage.test.tsx`), com respostas da API simuladas; ESLint e TypeScript sem erros. Em teste manual com a API real, `aluno.si` foi impedido de cursar novamente CIN0002 por já estar aprovado, enquanto `aluno.si2` realizou matrícula elegível e observou atualização automática das vagas.

**Pendências:** ampliar cenários de busca/paginação, validar visualmente 360px e completar as páginas de consulta, cancelamento e progresso. O frontend não substitui a autorização do backend.
> **Atualização — 21/11/2026:**_ o frontend React já está iniciado e o fluxo de login, logout e proteção de rotas foi implementado e testado. Descrições antigas de frontend "planejado" abaixo representam checkpoints anteriores._

## Frontend React — US-02 (MAT-7)

| Pasta (`apps/web/src`) | Responsabilidade |

| --- | --- |

| `api/` | Cliente HTTP e URL do backend |

| `components/` | Componentes reutilizáveis, inclusive logout |

| `contexts/` | Estado de autenticação e provedor |

| `hooks/` | Hook `useAuth` |

| `pages/` | Login e páginas acadêmicas |

| `routes/` | Navegação e proteção por perfil |

| `types/` | Contratos TypeScript do frontend |

Ao iniciar, o `AuthProvider` consulta `GET /api/auth/me`. O formulário envia credenciais para `POST /api/auth/login`; um login bem-sucedido direciona ALUNO a `/aluno/ofertas` e SECRETARIA a `/secretaria`. O logout chama `POST /api/auth/logout` e retorna a `/login`.

As requisições usam `credentials: "include"` para transportar o cookie de sessão `HttpOnly`. O frontend não armazena senha ou token no `localStorage`. A proteção de rotas React melhora a navegação, mas **a autorização de dados pertence à API**.

**Validação em `apps/web`:** 11 testes aprovados (4 login, 3 logout, 4 rotas), `pnpm lint` e `pnpm exec tsc -b` sem erros. Backend: 59 testes em execução separada; total acumulado de 70.

**Pendente:** interfaces acadêmicas definitivas, responsividade em 360px, revisão de CSRF e configuração de cookies HTTPS para produção.

  **Estado do registro original:** documentação inicial de 21/11/2026. Para a situação atual do frontend, consultar a seção US-02 acima.

**  ## Objetivo e escopo**

  O CINCoders é uma aplicação de matrícula acadêmica com dois perfis: **aluno** e **secretaria**. O aluno consulta ofertas, realiza/cancela matrículas e acompanha o progresso curricular. A secretaria cadastra disciplinas e professores, abre turmas e ajusta vagas dentro das regras de negócio.

  O objetivo do MVP é entregar primeiro o fluxo do aluno, os controles de acesso e os testes exigidos no enunciado. Consulte `docs/requisitos-e-backlog.md` para requisitos, Gherkin e prioridades detalhadas.

**  ## Stack adotada**

  | Camada | Tecnologia | Situação |

  | --- | --- | --- |

  | Interface | React + TypeScript + Vite | Planejado |

  | API HTTP | Express 5 + TypeScript, Node.js | API inicializada |

  | Dados | Prisma ORM 7 + adaptador `better-sqlite3` | Implementada |

  | Persistência | SQLite local | Banco criado e seed conferido |

  | Senhas | Argon2id | Implementada e testada |

  | Sessão | `express-session`, cookie HttpOnly | Implementada |

  | Testes | Vitest + Supertest | 11   testes automatizados aprovados |

  | Organização | Repositório GitLab + Jira MAT | Em uso |

**  ## Componentes e fronteiras**

  ```mermaid

  flowchart TB

      A["Interface React (aluno/secretaria)"] -->|"HTTP + JSON"| B["API Express"]

      B --> C["Rotas e middlewares"]

      C --> D["Services de negócio"]

      D --> E["Prisma Client"]

      E --> F[("SQLite")]

  ```

  - A interface é responsável pela apresentação, formulários e estados de carregamento/erro; não executa regras de autorização.

  - As rotas e controllers fazem a tradução HTTP (validação de entrada, códigos de resposta e cookies).

  - Os services aplicam as regras de matrícula e progresso e coordenam transações.

  - O Prisma acessa o SQLite; componentes React não acessam o banco diretamente.

  - A autenticação identifica o usuário; **autorização** confere perfil e propriedade dos dados a cada operação.

  **## Estrutura de pastas proposta**

  ```text

  apps/

    web/                         # React/Vite — planejado

    api/

      prisma/

        migrations/

        schema.prisma

        seed.ts

        verificar-seed.ts

      src/

        app.ts

        server.ts

        config/

          database.ts

          session.ts

        middlewares/

          auth.middleware.ts

        modules/

          auth/

            auth.service.ts

            auth.controller.ts

            auth.routes.ts

        types/

          express-session.d.ts

        generated/prisma/        # Gerado automaticamente

      tests/

        auth.test.ts

        auth.middleware.test.ts

  docs/

    adr/

    arquitetura/

    sprints/

    testes/

  ```

  **## Modelo de dados**

  O schema físico contém nove entidades:

  | Entidade | Papel |

  | --- | --- |

  | `Usuario` | Login, hash e perfil |

  | `Aluno` | Identidade acadêmica com ID numérico e vínculo ao curso |

  | `Curso` | Mínimos de carga horária para progresso |

  | `Disciplina` | Código único e carga horária |

  | `EstruturaCurricular` | Classificação da disciplina dentro de cada curso |

  | `Professor` | Cadastro com e-mail único |

  | `Turma` | Oferta, disciplina, professor e capacidade |

  | `Matricula` | Matrícula ativa/cancelada e histórico de cancelamento |

  | `Historico` | Aprovação/reprovação de disciplinas |

  `EstruturaCurricular` contém `OBRIGATORIA` e `ELETIVA_PERFIL`; disciplina sem vínculo curricular naquele curso é tratada como **livre** pela regra de classificação, sem terceira categoria armazenada.

  **## Regras de domínio críticas**

  1. Disciplina tem código único e carga horária entre 15 e 120, múltipla de 15.

  2. Professor tem e-mail único.

  3. A turma tem ao menos uma vaga; redução de vagas não pode ficar abaixo das matrículas ativas.

  4. Não pode haver matrícula em turma lotada ou em disciplina já aprovada pelo aluno.

  5. Um aluno não pode possuir duas matrículas **ativas** em turmas de uma mesma disciplina, mesmo que sejam turmas distintas (ADR-0002).

  6. Cancelar a matrícula mantém seu registro como `CANCELADA`; uma rematrícula elegível cria outro registro (ADR-0001).

  7. Histórico com `APROVADA` integraliza carga horária; matrícula em andamento deve ser apresentada separadamente.

  8. A API deve impedir acesso a registros de outro aluno.

  Regras envolvendo quantidade de vagas e matrículas simultâneas precisam de verificação transacional. O schema validado **não comprova sozinho** essas invariantes.

  **## Dados de desenvolvimento**

  O seed possui três cursos (SI, CC, EC), quatro alunos e uma secretaria, com disciplinas compartilhadas classificadas de maneira diferente por curso. Há históricos aprovados e reprovados. Os usuários são fictícios e usam senha local definida por `SEED_PASSWORD`, armazenada com hash Argon2id.

  **## Configuração e operação**

  Execute os comandos abaixo em `apps/api`, com `.env` local configurado:

  ```powershell

  pnpm install

  pnpm exec prisma validate

  pnpm exec prisma migrate status

  pnpm exec prisma generate

  pnpm exec prisma db seed

  pnpm dev

  ```

  O endpoint `GET /api/health` permite verificar se a API

  está funcionando.

  Durante o desenvolvimento, ele está disponível em:

  http\\://localhost:3001/api/health

  **## Segurança e implantação**

  - Senhas armazenadas com hash Argon2id.

  - Validação de credenciais no backend.

  - Autenticação baseada em sessões.

  - Cookies configurados com HttpOnly e SameSite=Lax.

  - Middleware de autorização por perfil.

  - Login, sessão, logout e autorização por perfil

    validados por sete testes automatizados.

  - Arquivos .env, bancos SQLite locais e dependências

    não são versionados.

  **### Pendências de segurança**

  - Implementar armazenamento persistente das sessões.

  - Verificar atributos de segurança dos cookies em testes.

  - Revisar proteção contra CSRF.

  - Testar isolamento dos dados acadêmicos entre alunos.

  **## Qualidade e testes**

  A API utiliza Vitest e Supertest para testes automatizados.

  **### Resultados — 21/11/2026**

  | Módulo | Testes | Resultado |

  |---|---:|---|

  | Autenticação | 8 | Aprovados |

  | Autorização por perfil | 3 | Aprovados |

  | **Total** | **11** | **Aprovados** |

  A aplicação utiliza bancos SQLite separados para

  dados acadêmicos e armazenamento de sessões.

  As sessões de desenvolvimento e testes também

  são armazenadas em arquivos distintos.

  A descrição detalhada dos testes está disponível em

  `docs/testes/plano-de-testes.md`.

  **## Consulta de ofertas — US-03**

  **Endpoint:** `GET /api/aluno/ofertas`

  **Autorização:** Perfil `ALUNO`.

  **### Parâmetros**

  - `busca`: pesquisa por nome ou código da disciplina.

  - `pagina`: página solicitada; padrão 1.

  - `limite`: quantidade de ofertas; padrão 10, máximo 50.

  **### Informações retornadas**

  - Disciplina e professor.

  - Vagas totais, ocupadas e disponíveis.

  - Classificação curricular relativa ao curso do aluno.

  - Metadados de paginação.

  A API utiliza o usuário autenticado para identificar

  o curso do aluno. O cliente não informa o `alunoId`.

  **Status:** Backend implementado, com 9 testes aprovados.

  Frontend pendente.

  **### Realização de matrícula — US-04**

  **Jira:** MAT-11

  **Endpoint:** `POST /api/aluno/matriculas`

  **Autorização:** perfil `ALUNO`.

  **Entrada:** `{ "turmaId": 3 }`

  O identificador acadêmico do aluno é recuperado a partir

  da sessão autenticada. O cliente não informa `alunoId`.

  **#### Regras de negócio implementadas**

  1. A turma solicitada deve existir.

  2. A turma deve possuir vagas disponíveis.

  3. O aluno não pode ter sido aprovado anteriormente na disciplina.

  4. O aluno não pode possuir matrícula ativa em outra turma da mesma disciplina.

  5. A reprovação anterior não impede uma nova tentativa.

  6. A rematrícula após cancelamento cria um novo registro.

  7. As verificações e a criação da matrícula são executadas em transação.

  As regras de rematrícula e unicidade de matrícula ativa

  seguem, respectivamente, as ADRs 0001 e 0002.

  **#### Respostas HTTP**

  | Código | Significado |

  |---|---|

  | 201 | Matrícula realizada |

  | 400 | Identificador de turma inválido |

  | 401 | Usuário não autenticado |

  | 403 | Perfil não autorizado ou cadastro acadêmico ausente |

  | 404 | Turma inexistente |

  | 409 | Violação de regra de matrícula |

  **#### Testes automatizados**

  **Arquivo:** `apps/api/tests/matriculas.test.ts`

  **Resultado:** 12 testes aprovados em 21/11/2026.

  A suíte valida matrícula válida, autenticação, autorização,

  turma inexistente, entradas inválidas, aprovação anterior,

  matrícula duplicada, turma lotada, rematrícula, reprovação

  e atualização das vagas.

  Também foi realizado um teste com dois alunos disputando

  simultaneamente a última vaga. Nessa execução, apenas

  uma matrícula foi confirmada.

  **#### Limitações atuais**

  - A interface React ainda não foi implementada.

  - O cancelamento via API pertence à US-06.

  - A persistência da matrícula foi validada no banco de testes.

  - Testes adicionais de concorrência e carga permanecem recomendados.

  **Status:** backend implementado e validado; frontend pendente.

  **### Consulta de matrículas ativas — US-05**

  **Jira:** MAT-8

  **Endpoint:** `GET /api/aluno/matriculas`

  **Autorização:** perfil `ALUNO`.

  A API identifica o aluno pela sessão autenticada e

  retorna somente suas matrículas com situação `ATIVA`.

  Cada registro apresenta:

  - Identificador da matrícula e da turma.

  - Data da matrícula.

  - Código, nome e carga horária da disciplina.

  - Identificador e nome do professor.

  O cliente não escolhe o `alunoId`.

  **Validação:** 7 testes automatizados aprovados.

  **Status:** backend implementado e testado;

  interface React pendente.

  **### Cancelamento de matrícula — US-06**

  **Jira:** MAT-15

  **Endpoint:** `PATCH /api/aluno/matriculas/:matriculaId/cancelar`

  **Autorização:** perfil `ALUNO`.

  O aluno só pode cancelar suas próprias matrículas ativas.

  O cancelamento:

  - Altera a situação para `CANCELADA`.

  - Registra a data em `canceladaEm`.

  - Preserva o registro original.

  - Libera a vaga automaticamente.

  - Permite rematrícula elegível mediante novo registro.

  A atualização utiliza condições de titularidade e situação

  ativa na própria operação do banco.

  **Validação:** 10 testes automatizados aprovados.

  **Status:** backend implementado e testado;

  interface React pendente.

  **### Progresso curricular — US-07**

  **Jira:** MAT-12

  **Endpoint:** `GET /api/aluno/progresso`

  **Autorização:** perfil `ALUNO`.

  O progresso é calculado conforme o curso do aluno autenticado.

  O sistema apresenta:

  - CH exigida por categoria.

  - CH integralizada por aprovação.

  - CH em curso, separadamente.

  - CH faltante.

  - Percentual de conclusão.

  - Resumo total do progresso.

  **Regras:**

  - Apenas históricos aprovados integralizam CH.

  - Reprovações não integralizam CH.

  - Matrículas ativas representam CH em curso.

  - O excedente aprovado de perfil conta como livre.

  - Percentuais são limitados a 100%.

  - CH faltante nunca é negativa.

  - Aprovações duplicadas não são somadas duas vezes.

  **Validação:** 10 testes automatizados aprovados.

  **Status:** backend implementado e testado;

  frontend pendente.

  **## Referências internas**

  - `docs/requisitos-e-backlog.md`

  - `docs/modelagem-fisica.md`

  - `docs/adr/0001-rematricula-novo-registro.md`

  - `docs/adr/0002-unicidade-matricula-ativa-por-disciplina.md`

  - `docs/adr/0003-autenticacao-por-sessao.md`

  - `docs/sprints/sprint-0.md` e `docs/sprints/sprint-1.md`