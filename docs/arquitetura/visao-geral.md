  # Visão geral da arquitetura — CINCoders

  **Estado:** Documentação inicial, atualizada em 21/11/2026. As partes ainda não implementadas são explicitamente sinalizadas.

  ## Objetivo e escopo

  O CINCoders é uma aplicação de matrícula acadêmica com dois perfis: **aluno** e **secretaria**. O aluno consulta ofertas, realiza/cancela matrículas e acompanha o progresso curricular. A secretaria cadastra disciplinas e professores, abre turmas e ajusta vagas dentro das regras de negócio.

  O objetivo do MVP é entregar primeiro o fluxo do aluno, os controles de acesso e os testes exigidos no enunciado. Consulte `docs/requisitos-e-backlog.md` para requisitos, Gherkin e prioridades detalhadas.

  ## Stack adotada

  | Camada | Tecnologia | Situação |
  | --- | --- | --- |
  | Interface | React + TypeScript + Vite | Planejado |
  | API HTTP | Express 5 + TypeScript, Node.js | API inicializada |
  | Dados | Prisma ORM 7 + adaptador `better-sqlite3` | Implementada |
  | Persistência | SQLite local | Banco criado e seed conferido |
  | Senhas | Argon2id | Implementada e testada |
  | Sessão | `express-session`, cookie HttpOnly | Implementada |
  | Testes | Vitest + Supertest | 11   testes automatizados aprovados |
  | Organização | Repositório GitLab + Jira MAT | Em uso |

  ## Componentes e fronteiras

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

  ## Estrutura de pastas proposta

  ```text
  apps/
    web/                         # React/Vite — planejado
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

        generated/prisma/        # Gerado automaticamente

      tests/
        auth.test.ts
        auth.middleware.test.ts

  docs/
    adr/
    arquitetura/
    sprints/
    testes/
  ```

  ## Modelo de dados

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

  ## Regras de domínio críticas

  1. Disciplina tem código único e carga horária entre 15 e 120, múltipla de 15.
  2. Professor tem e-mail único.
  3. A turma tem ao menos uma vaga; redução de vagas não pode ficar abaixo das matrículas ativas.
  4. Não pode haver matrícula em turma lotada ou em disciplina já aprovada pelo aluno.
  5. Um aluno não pode possuir duas matrículas **ativas** em turmas de uma mesma disciplina, mesmo que sejam turmas distintas (ADR-0002).
  6. Cancelar a matrícula mantém seu registro como `CANCELADA`; uma rematrícula elegível cria outro registro (ADR-0001).
  7. Histórico com `APROVADA` integraliza carga horária; matrícula em andamento deve ser apresentada separadamente.
  8. A API deve impedir acesso a registros de outro aluno.

  Regras envolvendo quantidade de vagas e matrículas simultâneas precisam de verificação transacional. O schema validado **não comprova sozinho** essas invariantes.

  ## Dados de desenvolvimento

  O seed possui três cursos (SI, CC, EC), quatro alunos e uma secretaria, com disciplinas compartilhadas classificadas de maneira diferente por curso. Há históricos aprovados e reprovados. Os usuários são fictícios e usam senha local definida por `SEED_PASSWORD`, armazenada com hash Argon2id.

  ## Configuração e operação

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
  http://localhost:3001/api/health

  ## Segurança e implantação

  - Senhas armazenadas com hash Argon2id.
  - Validação de credenciais no backend.
  - Autenticação baseada em sessões.
  - Cookies configurados com HttpOnly e SameSite=Lax.
  - Middleware de autorização por perfil.
  - Login, sessão, logout e autorização por perfil
    validados por sete testes automatizados.
  - Arquivos .env, bancos SQLite locais e dependências
    não são versionados.

  ### Pendências de segurança

  - Implementar armazenamento persistente das sessões.
  - Verificar atributos de segurança dos cookies em testes.
  - Revisar proteção contra CSRF.
  - Testar isolamento dos dados acadêmicos entre alunos.

  ## Qualidade e testes

  A API utiliza Vitest e Supertest para testes automatizados.

  ### Resultados — 21/11/2026

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

  ## Referências internas

  - `docs/requisitos-e-backlog.md`
  - `docs/modelagem-fisica.md`
  - `docs/adr/0001-rematricula-novo-registro.md`
  - `docs/adr/0002-unicidade-matricula-ativa-por-disciplina.md`
  - `docs/adr/0003-autenticacao-por-sessao.md`
  - `docs/sprints/sprint-0.md` e `docs/sprints/sprint-1.md`