# CINCoders — Sistema de Matrícula Acadêmica

Aplicação web para gerenciamento de matrículas de graduação, com dois perfis: **Aluno** e **Secretaria**. Desenvolvida em React, Express e TypeScript, com persistência em SQLite por meio do Prisma.

Este README reúne as instruções de execução desde um banco vazio, as regras principais, as rotas e os testes. A documentação foi consolidada com base no `schema.prisma` integral e nos testes compartilhados em 23/11/2026. **O avaliador já aceitou o convite do GitLab, conforme confirmação de Thiago; resta executar/conferir o commit e push final.** Consulte o [checklist de entrega](docs/entrega-checklist.md) para os comandos de publicação. **Nunca publique arquivos `.env`, bancos locais ou valores reais de segredos.**

## Índice

- [Visão geral](#visão-geral)
- [Comece aqui](#comece-aqui)
- [Requisitos para executar](#requisitos-para-executar)
- [Instalação e execução](#instalação-e-execução)
  - [1. Configurar a API](#1-configurar-a-api)
  - [2. Preparar o banco de dados](#2-preparar-o-banco-de-dados)
  - [3. Iniciar a API](#3-iniciar-a-api)
  - [4. Iniciar o frontend](#4-iniciar-o-frontend)
- [Contas de demonstração](#contas-de-demonstração)
- [Funcionalidades](#funcionalidades)
  - [Aluno](#aluno)
  - [Secretaria](#secretaria)
  - [Requisito adicional — US-13](#requisito-adicional--us-13)
- [Rotas da API](#rotas-da-api)
- [Testes e qualidade](#testes-e-qualidade)
- [Arquitetura do projeto](#arquitetura-do-projeto)
- [Decisões de implementação](#decisões-de-implementação)
- [Documentação complementar](#documentação-complementar)
- [Problemas comuns](#problemas-comuns)
- [Limitações e melhorias futuras](#limitações-e-melhorias-futuras)

## Visão geral

O CINCoders simula o sistema acadêmico de uma graduação com um único semestre corrente. Os alunos consultam as ofertas, realizam ou cancelam matrículas e acompanham seu progresso curricular. A secretaria gerencia disciplinas, professores e turmas, respeitando regras de carga horária, unicidade e capacidade.

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, React Router 7, TypeScript, Vite 8 |
| Backend | Node.js, Express 5, TypeScript |
| Banco | SQLite, Prisma ORM 7, adaptador `better-sqlite3` |
| Autenticação | Argon2, `express-session`, cookies de sessão |
| Testes | Vitest, Supertest, React Testing Library, jsdom |
| Gerenciador de pacotes | pnpm (API configurada para versão 12.21.0) |

## Comece aqui

Para testar a aplicação localmente:

1. Instale Node.js e pnpm.
2. Configure a API em `apps/api` e as variáveis descritas em `.env.example`.
3. Prepare o banco SQLite e execute o seed (ver seção seguinte).
4. Inicie a API e o frontend em **dois terminais diferentes**.
5. Acesse [http://localhost:5173](http://localhost:5173).

O frontend foi configurado para se comunicar com uma API em `http://localhost:3001` durante o desenvolvimento. Se usar outra URL, revise `VITE_API_URL` conforme `apps/web/.env.example`.

> **Primeira instalação:** aplique as migrações e execute o seed. Ele fornece cursos, estrutura curricular, contas de demonstração e históricos necessários para testar o progresso.

## Requisitos para executar

- Node.js compatível com as versões de Vite e Prisma utilizadas no projeto (ambiente de desenvolvimento: Node.js 24).
- pnpm 12.21.0, conforme configuração da API.
- Git para clonar o repositório.
- Dois terminais para executar API e frontend simultaneamente.

O projeto usa SQLite local: não é necessário configurar PostgreSQL nem Docker para os fluxos descritos.

## Instalação e execução

Os `package.json` estão em **`apps/api` e `apps/web`**. Não há `package.json` na raiz do repositório; por isso, cada aplicação deve ter suas dependências instaladas em sua própria pasta.

### 1. Configurar a API

No PowerShell, a partir da raiz do repositório:

```powershell
cd apps/api
pnpm install
Copy-Item .env.example .env
```

Abra `apps/api/.env` e preencha as variáveis exigidas pelo `.env.example`. As variáveis de banco de dados, sessão e senha dos dados iniciais devem ser configuradas localmente. **Não publique o `.env`, arquivos `.db` ou segredos no Git.**

O `.env.example` apresentado atualmente contém:

```dotenv
DATABASE_URL="file:./dev.db"
```

As integrações e os testes também utilizam `SESSION_SECRET` (segredo da sessão) e `SEED_PASSWORD` (senha definida para as contas demonstrativas), conforme `src/config/session.ts` e `prisma/seed.ts`. Portanto, o arquivo `.env.example` precisa listar **as três variáveis**, para que uma instalação nova não dependa de configurações omitidas.

| Variável | Finalidade | Observação |
| --- | --- | --- |
| `DATABASE_URL` | Localização do banco SQLite | O exemplo aponta para `file:./dev.db`; testes devem usar outro arquivo |
| `SESSION_SECRET` | Segredo usado pelas sessões autenticadas | **Obrigatória, mínimo de 32 caracteres**; não publicar o valor real |
| `SEED_PASSWORD` | Senha atribuída aos usuários fictícios pelo seed | **Obrigatória, mínimo de 12 caracteres**; não incluir a senha real no repositório |
| `PORT` | Porta HTTP da API | Opcional: o servidor usa `3001` quando não está definida |

Modelo recomendado para `apps/api/.env.example` (preencher os campos vazios somente no `.env` local):

```dotenv
DATABASE_URL="file:./dev.db"
SESSION_SECRET=""
SEED_PASSWORD=""
PORT=3001
```

A API recusa `SESSION_SECRET` com menos de 32 caracteres, e o seed recusa `SEED_PASSWORD` com menos de 12. A aplicação usa cookie `cincoders.sid` com `HttpOnly`, `SameSite=Lax` e validade de oito horas; em `NODE_ENV=production`, o cookie é marcado como `Secure` e depende de HTTPS. As sessões são guardadas em `sessions.db` no desenvolvimento e `sessions.test.db` quando `NODE_ENV=test`, relativos ao diretório de execução da API.

### 2. Preparar o banco de dados

Em `apps/api`, o Prisma é utilizado para manter o schema e carregar os dados iniciais:

```powershell
pnpm exec prisma validate
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm exec prisma db seed
```

A execução do Prisma 7.10.1 informou ter carregado `apps/api/prisma7.config.ts` (nome previsto nessa versão). A configuração apresentada pelo responsável aponta para o schema `prisma/schema.prisma`, procura migrações em `prisma/migrations`, lê `DATABASE_URL` do ambiente e executa o seed com `tsx prisma/seed.ts`. O comando `migrate deploy` aplica as migrações já existentes ao banco escolhido, mas **não gera o Prisma Client nem executa o seed**; por isso, os três comandos aparecem separadamente. Se houver também um arquivo `prisma.config.ts`, confirmar qual está em uso e manter o README alinhado ao arquivo efetivo.

**Cuidado:** confirme o valor de `DATABASE_URL` antes de aplicar migrações ou carregar dados. A sequência foi validada em um banco SQLite **novo e separado** (`readme-validacao.db`), conforme execução relatada pelo responsável: `migrate deploy` criou o banco e aplicou `20261121010456_init`; `prisma generate` gerou o Client 7.10.1; `prisma db seed` concluiu com as contagens documentadas. Isso valida a **preparação do banco**, mas ainda não substitui o teste completo de clonar, instalar dependências e iniciar API/web num ambiente limpo.

### 3. Iniciar a API

Ainda em `apps/api`:

```powershell
pnpm dev
```

Para execução sem modo de observação, o script disponível é `pnpm start`. A rota de saúde pode ser consultada em [http://localhost:3001/api/health](http://localhost:3001/api/health).

O arquivo `src/server.ts` carrega `dotenv/config` antes de importar a aplicação Express e inicia o servidor em `PORT`, usando **3001 como valor padrão**. Se mudar a porta, configure também `VITE_API_URL` no frontend e revise a origem autorizada pelo CORS, quando necessário.

### 4. Iniciar o frontend

Abra outro terminal na raiz do repositório:

```powershell
cd apps/web
pnpm install
Copy-Item .env.example .env
pnpm dev
```

O `.env.example` do frontend contém `VITE_API_URL=http://localhost:3001`. Se a API utilizar outra origem, altere apenas a URL no `.env` local. Variáveis iniciadas com `VITE_` ficam disponíveis no código do navegador: **não use esse prefixo para senhas, tokens ou segredos**.

Abra [http://localhost:5173](http://localhost:5173).

### Outros comandos úteis

| Aplicação | Comando | Finalidade |
| --- | --- | --- |
| API (`apps/api`) | `pnpm dev` | Iniciar servidor em modo de desenvolvimento |
| API (`apps/api`) | `pnpm start` | Executar servidor com o script configurado (`tsx`) |
| API (`apps/api`) | `pnpm test` | Executar a suíte Vitest |
| API (`apps/api`) | `pnpm exec tsc --noEmit` | Verificar tipos sem gerar arquivos |
| Web (`apps/web`) | `pnpm dev` | Iniciar Vite |
| Web (`apps/web`) | `pnpm build` | Verificar tipos e gerar build |
| Web (`apps/web`) | `pnpm lint` | Executar ESLint |
| Web (`apps/web`) | `pnpm exec vitest run` | Executar testes React |
| Web (`apps/web`) | `pnpm preview` | Pré-visualizar build já gerado |

## Contas de demonstração

O script `apps/api/prisma/seed.ts` prepara **três cursos, quatro alunos, uma conta de secretaria, seis disciplinas, dois professores e sete turmas**. Também insere **onze vínculos curriculares e oito registros de histórico** (aprovações e reprovações).

| Usuário | Nome | Perfil | Curso |
| --- | --- | --- | --- |
| `secretaria` | Secretaria de Testes | Secretaria | — |
| `aluno.si` | Ana Silva | Aluno | Sistemas de Informação |
| `aluno.cc` | Bruno Costa | Aluno | Ciência da Computação |
| `aluno.ec` | Carla Lima | Aluno | Engenharia da Computação |
| `aluno.si2` | Diego Souza | Aluno | Sistemas de Informação |

**Senha:** todas as contas recebem inicialmente a senha local definida em `SEED_PASSWORD`. O seed **recusa valores com menos de 12 caracteres** e armazena o hash com Argon2id. Não inclua a senha escolhida no repositório ou neste README.

### Dados acadêmicos para demonstração

| Aluno | Disciplina aprovada | Disciplina reprovada |
| --- | --- | --- |
| Ana (`aluno.si`) | `CIN0002` — Banco de Dados | `CIN0004` — Estruturas de Dados |
| Bruno (`aluno.cc`) | `CIN0003` — Circuitos Digitais | `CIN0002` — Banco de Dados |
| Carla (`aluno.ec`) | `CIN0006` — Redes de Computadores | `CIN0004` — Estruturas de Dados |
| Diego (`aluno.si2`) | `CIN0005` — Engenharia de Software | `CIN0003` — Circuitos Digitais |

O seed atende ao requisito de uma mesma disciplina ser classificada diferentemente conforme o curso. Por exemplo:

- `CIN0002` (Banco de Dados) é **obrigatória** em Sistemas de Informação e **eletiva de perfil** em Ciência da Computação.
- `CIN0003` (Circuitos Digitais) é **eletiva de perfil** em Ciência da Computação e **obrigatória** em Engenharia da Computação.

**Observações importantes:** o seed não cria matrículas ativas nem canceladas. Para demonstrar a US-13, entre como aluno, realize uma matrícula e cancele-a; o registro então aparecerá na aba de histórico. O script evita recriar cadastros existentes, mas **não troca a senha de contas já cadastradas** quando `SEED_PASSWORD` é alterada posteriormente (`upsert` com `update: {}`). Para um banco recém-criado, defina a senha antes de executar o seed.

## Funcionalidades

### Aluno

- **Ofertas (US-03):** consulta de turmas disponíveis com busca, paginação, vagas e classificação curricular por curso.
- **Matrícula (US-04):** inscrição em turma elegível; bloqueia turmas lotadas, disciplinas já aprovadas e matrícula ativa duplicada na mesma disciplina.
- **Minhas matrículas (US-05):** visualização exclusiva das matrículas ativas do aluno autenticado.
- **Cancelamento (US-06):** confirmação antes do cancelamento; a vaga fica novamente disponível.
- **Progresso (US-07):** horas exigidas, integralizadas, faltantes e em curso nas categorias obrigatória, perfil e livre.
- **Histórico de cancelamentos (US-13):** consulta paginada de matrículas canceladas anteriormente.

### Secretaria

- **Disciplinas (US-08 e US-09):** consulta, pesquisa, paginação, cadastro e edição; código único e carga horária entre 15 e 120 horas, em múltiplos de 15.
- **Professores (US-10):** listagem, pesquisa e cadastro com e-mail único.
- **Turmas (US-11):** listagem, pesquisa, vagas ocupadas/disponíveis e abertura com disciplina, professor e capacidade.
- **Ajuste de vagas (US-12):** alteração da capacidade, impedindo valores inferiores ao número de matrículas ativas.

Os perfis possuem menus próprios. A interface organiza as rotas por perfil, e a API também aplica autorização em cada endpoint protegido.

### Requisito adicional — US-13

**Histórico de matrículas canceladas:** requisito funcional adicional escolhido para permitir ao aluno acompanhar suas decisões de matrícula, mesmo após cancelar uma turma e se matricular novamente.

**Por que foi escolhido?** Porque a consulta de matrículas ativas não mostra cancelamentos anteriores. A nova funcionalidade melhora a rastreabilidade da vida acadêmica sem alterar as regras principais do edital.

**Regras definidas:**

1. Somente o perfil **ALUNO** autenticado pode consultar o histórico.
2. O aluno vê **apenas os próprios registros**; a identidade é obtida da sessão, não de um ID enviado pelo cliente.
3. O histórico contém somente matrículas com situação `CANCELADA` e é consultado com paginação.
4. O cancelamento não apaga o registro original; caso uma nova matrícula seja permitida, ela cria outro registro.
5. As matrículas ativas e o histórico de cancelamentos são exibidos separadamente, em abas.

**Implementação:** endpoint `GET /api/aluno/matriculas/historico` e componente `HistoricoMatriculas.tsx` na página **Minhas matrículas**.

## Rotas da API

Base local: `http://localhost:3001`.

| Método | Endpoint | Permissão | Descrição |
| --- | --- | --- | --- |
| GET | `/api/health` | Pública | Estado da API |
| POST | `/api/auth/login` | Pública | Login |
| GET | `/api/auth/me` | Autenticado | Dados da sessão |
| POST | `/api/auth/logout` | Autenticado | Logout |
| GET | `/api/aluno/ofertas` | Aluno | Ofertas com busca/paginação |
| POST | `/api/aluno/matriculas` | Aluno | Realizar matrícula |
| GET | `/api/aluno/matriculas` | Aluno | Matrículas ativas |
| PATCH | `/api/aluno/matriculas/:matriculaId/cancelar` | Aluno | Cancelar matrícula |
| GET | `/api/aluno/matriculas/historico` | Aluno | Histórico de cancelamentos (US-13) |
| GET | `/api/aluno/progresso` | Aluno | Progresso curricular |
| GET | `/api/secretaria/disciplinas` | Secretaria | Consultar disciplinas |
| POST | `/api/secretaria/disciplinas` | Secretaria | Cadastrar disciplina |
| PATCH | `/api/secretaria/disciplinas/:id` | Secretaria | Editar disciplina |
| GET | `/api/secretaria/professores` | Secretaria | Consultar professores |
| POST | `/api/secretaria/professores` | Secretaria | Cadastrar professor |
| GET | `/api/secretaria/turmas` | Secretaria | Consultar turmas |
| POST | `/api/secretaria/turmas` | Secretaria | Abrir turma |
| PATCH | `/api/secretaria/turmas/:id/vagas` | Secretaria | Alterar capacidade |

As chamadas autenticadas utilizam sessão por cookie. As rotas de consulta com paginação aceitam parâmetros como `busca`, `pagina` e `limite`, conforme cada endpoint. Consulte a [visão geral da arquitetura](docs/arquitetura/visao-geral.md) para detalhes dos contratos e regras de negócio.

## Testes e qualidade

### Backend

**Antes de executar:** prepare um **banco de testes isolado**, pois os testes de integração criam e alteram registros. Alguns deles abortam intencionalmente quando `DATABASE_URL` não indica o ambiente de teste. No PowerShell, a partir de `apps/api`, use um arquivo separado:

```powershell
$env:DATABASE_URL = "file:./test.db"
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm exec prisma db seed
```

Com o banco de teste selecionado, execute:

```powershell
pnpm exec tsc --noEmit
pnpm exec vitest run --no-file-parallelism
```

Ao terminar, **restaure o ambiente do terminal** antes de iniciar a API de desenvolvimento:

```powershell
Remove-Item Env:DATABASE_URL
```

Isso faz a API voltar a ler `DATABASE_URL` de `apps/api/.env` nas próximas execuções. Os exemplos pressupõem que `SESSION_SECRET` e `SEED_PASSWORD` já foram definidos no `.env` local. Não use `dev.db` na execução dos testes.

### Frontend

```powershell
cd apps/web
pnpm lint
pnpm exec tsc -b
pnpm exec vitest run
```

**Evidências compartilhadas no projeto:** a suíte completa da API, **após US-13**, passou com **133/133 testes em 11 arquivos**, executada com `pnpm exec vitest run --no-file-parallelism` em `test.db` (28,94 s), além de `pnpm exec tsc --noEmit`. Em seguida, o responsável restaurou a configuração para `file:./dev.db`. O frontend passou com **92/92 testes em 11 arquivos** (10,48 s), após acrescentar os CT-06 de recuperação de conexão em Ofertas, Matrículas e Progresso; mais tarde, a correção do redirecionamento por sessão expirada foi validada manualmente e **três novos testes do cliente HTTP passaram**, elevando o total informado pelo responsável para **95 testes em 12 arquivos**. Lint e TypeScript também passaram após as correções, conforme relato. **Total atual informado: 228 testes automatizados em 23 arquivos, em duas suítes separadas.** Foram relatadas **48 verificações manuais** aprovadas, oito para cada US-08 a US-13. Testes de unidade/integração e verificações manuais não equivalem a uma suíte ponta a ponta automatizada.

**Validação operacional adicional:** o responsável comprovou via terminal a migração e o seed de um banco SQLite novo; após restaurar `DATABASE_URL` para `file:./dev.db`, confirmou acesso com sucesso a `http://localhost:3001/api/health` e à tela de login em `http://localhost:5173`. Também relatou que os testes manuais de responsividade em **360px** passaram nas telas do aluno. Essas conferências não equivalem a testes E2E automatizados ou a uma auditoria independente de todas as interações.

O detalhamento e os cenários estão em [Plano de testes](docs/testes/plano-de-testes.md).

## Arquitetura do projeto

```text
sistema-matricula-cincoders/
├── apps/
│   ├── api/
│   │   ├── prisma/              # Schema, migrações e seed
│   │   ├── src/
│   │   │   ├── config/          # Banco e sessões
│   │   │   ├── middlewares/     # Autenticação e autorização
│   │   │   └── modules/         # Regras por funcionalidade
│   │   ├── tests/               # Integração HTTP e regras de negócio
│   │   └── package.json
│   └── web/
│       ├── public/
│       ├── src/
│       │   ├── api/             # Requisições ao backend
│       │   ├── components/      # Menus e componentes reutilizáveis
│       │   ├── pages/           # Login, aluno e secretaria
│       │   ├── routes/          # Rotas protegidas
│       │   └── types/           # Contratos TypeScript
│       └── package.json
├── docs/                         # Requisitos, arquitetura, ADRs e testes
└── README.md
```

Fluxo geral: **React → API Express → controllers → services → Prisma → SQLite**. O frontend apresenta formulários, estados de carregamento/erro e navegação; controllers validam requisições e traduzem resultados para HTTP; services aplicam regras acadêmicas e operações transacionais.

## Decisões de implementação

| Decisão | Justificativa |
| --- | --- |
| Monorepo com `apps/api` e `apps/web` | Reunir frontend, backend e documentação no mesmo repositório da entrega |
| Express + services separados | Separar validação HTTP, regras de negócio e acesso ao banco |
| Prisma + SQLite | Modelo relacional com configuração local simples para o teste prático |
| Sessões com cookie e hash Argon2 | Autenticar usuários sem armazenar senha no frontend |
| Identidade do aluno obtida da sessão | Impedir acesso ou alteração de dados acadêmicos de outros alunos |
| Rematrícula cria novo registro | Preservar o histórico mesmo após cancelamentos |
| Matrícula ativa única por aluno/disciplina | Impedir matrícula simultânea em turmas diferentes da mesma disciplina |
| Regras de capacidade verificadas na operação de escrita | Reduzir condições de corrida entre matrícula, cancelamento e alteração de vagas |
| Classificação curricular por curso | A mesma disciplina pode contar de forma diferente em cursos distintos |

Consulte os registros de decisão na pasta [`docs/adr`](docs/adr) para justificativas mais detalhadas.

## Documentação complementar

| Documento | Conteúdo |
| --- | --- |
| [Requisitos e backlog](docs/requisitos-e-backlog.md) | Escopo e histórias de usuário |
| [Visão geral da arquitetura](docs/arquitetura/visao-geral.md) | Módulos e contratos |
| [Autenticação](docs/arquitetura/autenticacao.md) | Sessões e segurança |
| [Modelagem física](docs/modelagem-fisica.md) | Estrutura relacional do banco |
| [Sprint 0](docs/sprints/sprint-0.md) | Preparação e decisões iniciais |
| [Sprint 1](docs/sprints/sprint-1.md) | Implementações e andamento |
| [Plano de testes](docs/testes/plano-de-testes.md) | Estratégia e evidências de validação |

## Problemas comuns

| Sintoma | O que verificar |
| --- | --- |
| `SESSION_SECRET deve conter pelo menos 32 caracteres` | Preencher `SESSION_SECRET` com um valor local de 32 caracteres ou mais em `apps/api/.env` |
| `Defina SEED_PASSWORD com pelo menos 12 caracteres` | Preencher `SEED_PASSWORD` antes de executar o seed |
| Falha ao conectar ao SQLite ou tabela inexistente | Conferir `DATABASE_URL`, aplicar as migrações, gerar o Prisma Client e executar o seed |
| Login falha após alterar `SEED_PASSWORD` | O seed não atualiza o hash dos usuários existentes; a senha válida continua sendo a usada ao criá-los |
| Frontend não consegue acessar a API | Confirmar que os dois servidores estão iniciados e que `VITE_API_URL` aponta para a porta HTTP da API |
| Testes recusam o banco | Os testes de integração exigem um SQLite **de testes**, separado de `dev.db`; não desabilitar essa proteção |
| Histórico de cancelamentos vazio no banco recém-criado | O seed não cria matrículas canceladas; realize e cancele uma matrícula usando a interface |

## Limitações e melhorias futuras

Os seguintes pontos compõem a revisão final ou possíveis evoluções; não devem ser confundidos com funcionalidades já verificadas:

- Aprimorar continuamente a experiência responsiva; a largura mínima de **360px** foi verificada manualmente pelo responsável neste checkpoint.
- Recuperação das consultas de **Ofertas, Matrículas e Progresso** após falha de rede: correções aplicadas, com os três CT-06 e regressão web aprovados. Uma falha de redirecionamento após sessão expirada foi encontrada e corrigida no cliente HTTP; o responsável confirmou o reteste manual, os testes automatizados e os três cenários dedicados de `client.test.ts`. Automatizar o fluxo completo em navegador com testes E2E permanece uma possibilidade futura.
- Aprofundar a identidade visual inspirada em **Classter** (secretaria) e **Aprova Total** (aluno), mantendo os fluxos acessíveis.
- Adicionar testes E2E de navegação e cenários de concorrência mais amplos.
- Revisar proteções adicionais para produção (HTTPS, cookies seguros e CSRF).
- Evoluir o domínio acadêmico com semestres, horários e pré-requisitos, se o escopo do sistema for ampliado.

---

**CINCoders** — projeto de sistema de matrícula acadêmica desenvolvido para o teste prático de seleção do CIn/UFPE.
