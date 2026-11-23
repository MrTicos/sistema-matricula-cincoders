# CINCoders — Sistema de Matrícula Acadêmica

Sistema de matrícula de graduação desenvolvido para o teste prático da Seleção nº 5/2026 do CIn-UFPE. Monorepo com **frontend React**, **API Express/TypeScript** e **SQLite com Prisma 7**.

Há dois perfis: **Secretaria**, que administra disciplinas, professores e turmas; e **Aluno**, que consulta ofertas, realiza/cancela matrículas e acompanha seu progresso curricular. A área do aluno foi desenvolvida para telas a partir de 360 px.

## Como executar do zero

**Pré-requisitos:** Node.js, pnpm e Git. **Versões recomendadas**, utilizadas no desenvolvimento: Node.js 24 e pnpm 12.21.0 (declarada em `apps/api/package.json`). Se tiver Corepack instalado, pode habilitá-lo com `corepack enable` para utilizar a versão indicada pela API. Não é necessário Docker nem PostgreSQL. Os comandos principais abaixo usam **PowerShell**.

```powershell
git clone https://gitlab.cin.ufpe.br/tsf3/sistema-matricula-cincoders.git
cd sistema-matricula-cincoders
```

### 1. Configurar API e dados iniciais

No terminal aberto na raiz do repositório:

```powershell
cd apps/api
pnpm install
Copy-Item .env.example .env
```

No Linux/macOS (Bash ou Zsh), substitua `Copy-Item .env.example .env` por `cp .env.example .env`, tanto na API quanto no frontend.

Edite `apps/api/.env` e preencha as variáveis:

```dotenv
DATABASE_URL="file:./dev.db"
SESSION_SECRET=""
SEED_PASSWORD=""
PORT=3001
FRONTEND_ORIGIN="http://localhost:5173"
```

- `SESSION_SECRET`: segredo local com **pelo menos 32 caracteres**, usado nas sessões.
- `SEED_PASSWORD`: senha local com **pelo menos 12 caracteres** para as contas de demonstração.
- `DATABASE_URL`: localização do banco SQLite de desenvolvimento.
- `PORT`: porta da API, `3001` por padrão.
- `FRONTEND_ORIGIN`: origem autorizada do frontend para CORS e proteção CSRF (padrão: `http://localhost:5173`).

Não versione o `.env`, senhas, segredos nem arquivos SQLite. Em `apps/api`, prepare o banco e inicie a API:

```powershell
pnpm exec prisma validate
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm exec prisma db seed
pnpm dev
```

A API ficará em `http://localhost:3001`. Confira [o endpoint de saúde](http://localhost:3001/api/health). O projeto usa `apps/api/prisma7.config.ts` porque, a partir do **Prisma 7.10**, esse nome evita conflito com o formato de configuração do Prisma 8. O CLI do Prisma 7 o detecta automaticamente, sem `--config` ([documentação oficial](https://www.prisma.io/docs/v7/prisma-orm/quickstart/sqlite)).

### 2. Iniciar o frontend

Abra **outro terminal** na raiz do repositório:

```powershell
cd apps/web
pnpm install
Copy-Item .env.example .env
pnpm dev
```

Acesse **http://localhost:5173**. O exemplo do frontend configura `VITE_API_URL=http://localhost:3001`; ajuste essa variável caso use outra porta da API.

### Contas de demonstração

Todas usam a senha definida em `SEED_PASSWORD` **antes da primeira execução do seed**.

| Usuário | Perfil | Curso |
| --- | --- | --- |
| `secretaria` | Secretaria | — |
| `aluno.si` (Ana) | Aluno | Sistemas de Informação |
| `aluno.cc` (Bruno) | Aluno | Ciência da Computação |
| `aluno.ec` (Carla) | Aluno | Engenharia da Computação |
| `aluno.si2` (Diego) | Aluno | Sistemas de Informação |

O seed cria três cursos, seis disciplinas, dois professores, sete turmas, estruturas curriculares e históricos de aprovação e reprovação. Por exemplo, Banco de Dados é obrigatória em Sistemas de Informação e eletiva de perfil em Ciência da Computação.

**Demonstração do requisito extra:** o seed não cria cancelamentos. Entre como aluno, faça uma matrícula, cancele-a e abra a aba **Histórico** em **Minhas matrículas**. O seed não redefine senhas de usuários que já existiam no banco.

## Funcionalidades e regras

**Secretaria**

- Listar, buscar, paginar, cadastrar e editar disciplinas: código único e carga horária de 15h a 120h, múltipla de 15.
- Listar e cadastrar professores, com e-mail único.
- Listar, abrir e ajustar turmas: exigem disciplina, professor e ao menos uma vaga; a capacidade não pode ficar abaixo das matrículas ativas.

**Aluno**

- Consultar ofertas com busca/paginação, vagas e classificação por curso (obrigatória, eletiva de perfil ou livre).
- Matricular-se havendo vaga, desde que não tenha sido aprovado na disciplina nem possua matrícula ativa nela. Reprovação permite nova tentativa.
- Consultar e cancelar **apenas as próprias matrículas**. Cancelar libera a vaga e mantém o registro; uma rematrícula válida cria outro registro.
- Consultar progresso por grupo: carga horária exigida, integralizada, em curso e faltante. Apenas aprovações integralizam; excedente de perfil conta como livre. Percentuais ficam em até 100% e a carga faltante nunca é negativa.

As regras e permissões são verificadas no backend. As operações de escrita autenticadas e o login exigem `Origin` confiável (ou `Referer` válido quando `Origin` não estiver presente). As listagens relevantes mantêm busca e página na URL. A interface trata carregamento, listas vazias, busca sem resultados, erros e nova tentativa.

**Escopo:** todos os requisitos funcionais mínimos do edital foram contemplados na implementação. As limitações e melhorias de segurança e testes adicionais aparecem ao final deste README.

## Requisito adicional — Histórico de cancelamentos (US-13)

**Escolha:** permitir que cada aluno consulte as próprias matrículas canceladas, separadas das ativas.

**Por quê:** manter rastreabilidade das decisões acadêmicas. Cancelamentos não apagam registros, inclusive quando o aluno se matricula novamente, sem exigir modelagem de semestres anteriores.

**Regras definidas:**

1. Somente o perfil `ALUNO` autenticado acessa o histórico.
2. O aluno é identificado pela sessão e só recebe seus próprios registros.
3. A consulta retorna apenas matrículas `CANCELADA`, com disciplina, turma, professor e data quando registrada.
4. A listagem tem ordenação estável e paginação validada.
5. A interface separa ativas e canceladas em abas e trata carregamento, vazio e falhas.

**Implementação:** `GET /api/aluno/matriculas/historico` e aba **Histórico** em **Minhas matrículas**.

## Rotas da API

Base local: `http://localhost:3001`. Rotas protegidas usam cookie de sessão.

| Método | Rota | Acesso |
| --- | --- | --- |
| `GET` | `/api/health` | Público |
| `POST` | `/api/auth/login` | Público |
| `GET` | `/api/auth/me` | Autenticado |
| `POST` | `/api/auth/logout` | Autenticado |
| `GET` | `/api/aluno/ofertas` | Aluno |
| `GET`, `POST` | `/api/aluno/matriculas` | Aluno |
| `PATCH` | `/api/aluno/matriculas/:matriculaId/cancelar` | Aluno |
| `GET` | `/api/aluno/matriculas/historico` | Aluno |
| `GET` | `/api/aluno/progresso` | Aluno |
| `GET`, `POST` | `/api/secretaria/disciplinas` | Secretaria |
| `PATCH` | `/api/secretaria/disciplinas/:id` | Secretaria |
| `GET`, `POST` | `/api/secretaria/professores` | Secretaria |
| `GET`, `POST` | `/api/secretaria/turmas` | Secretaria |
| `PATCH` | `/api/secretaria/turmas/:id/vagas` | Secretaria |

Contratos e detalhes estão na [visão geral da arquitetura](docs/arquitetura/visao-geral.md).

Nas listagens, `busca` filtra os resultados, `pagina` seleciona a página (padrão: 1) e `limite` define a quantidade por página (padrão: 10, máximo: 50). Erros são retornados com status HTTP e JSON como `{"message":"Turma sem vagas disponíveis."}`: `400` para entrada inválida, `401` para sessão ausente, `403` para falta de permissão, `404` para recurso inexistente e `409` para conflito de regra.

Ao testar `POST`/`PATCH` manualmente fora do navegador (por exemplo, em Postman ou curl), informe `Origin: http://localhost:5173` ou um `Referer` dessa origem. Uma origem inválida ou ausente nas operações protegidas recebe `403`.

## Testes

**Atenção:** os testes de integração criam e alteram registros. Utilize um banco **exclusivo para testes**, nunca `dev.db` nem um banco com dados importantes.

Em `apps/api`, após configurar o `.env`:

```powershell
$env:DATABASE_URL = "file:./test.db"
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm exec prisma db seed
pnpm exec tsc --noEmit
pnpm exec vitest run --no-file-parallelism
Remove-Item Env:DATABASE_URL
```

No Linux/macOS (Bash ou Zsh), prepare o banco de testes e execute os mesmos comandos usando `export` e `unset` no lugar de `$env:` e `Remove-Item`:

```bash
export DATABASE_URL="file:./test.db"
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm exec prisma db seed
pnpm exec tsc --noEmit
pnpm exec vitest run --no-file-parallelism
unset DATABASE_URL
```

Em `apps/web`:

```powershell
pnpm lint
pnpm exec tsc -b
pnpm exec vitest run
```

**Verificação em clone isolado (23/11/2026): 143 testes da API e 95 do frontend aprovados**, totalizando 238 testes automatizados. TypeScript e lint também passaram. Os testes abrangem regras acadêmicas, autorização, proteção CSRF por origem, concorrência de vagas e o requisito adicional, mas não substituem testes E2E no navegador. Cenários e evidências estão no [plano de testes](docs/testes/plano-de-testes.md).

## Decisões técnicas

| Decisão | Justificativa |
| --- | --- |
| Monorepo `apps/api` e `apps/web` | Frontend e backend no mesmo repositório |
| Express com controllers/services | Separação de HTTP, validações e regras de negócio |
| SQLite e Prisma 7 | Modelagem relacional e instalação local simples |
| Hash Argon2id e sessões armazenadas no servidor | Proteger credenciais e permitir logout |
| Cookie `HttpOnly` e `SameSite=Lax` | Reduzir exposição do identificador de sessão |
| Verificação de `Origin`/`Referer` | Rejeitar requisições autenticadas que modificam dados quando a origem não é confiável |
| Matrícula em transação SQLite | Antes de contar vagas, executa uma escrita na turma para obter o bloqueio de escrita; depois verifica ocupação e cria a matrícula na mesma transação, evitando duas inscrições na última vaga |
| Redução de capacidade condicional | Um `UPDATE` SQL só altera vagas se a contagem atual de matrículas ativas não exceder o novo limite |
| Rematrícula com novo registro | Preservar histórico de cancelamentos |

Os módulos da API ficam em `apps/api/src/modules/`; schema, migrações e seed em `apps/api/prisma/`; interface em `apps/web/src/`. Consulte as [decisões arquiteturais](docs/adr/) para mais detalhes.

## O que faria com mais tempo

- Criaria testes E2E em navegador e ampliaria verificações de concorrência e acessibilidade.
- Complementaria a proteção CSRF por origem com tokens quando necessário e validaria cookies `Secure` em HTTPS e persistência de sessão após reinício antes de implantar em produção.
- Acrescentaria pré-requisitos, choque de horários e períodos letivos ao domínio acadêmico.

## Problemas comuns

- **`Schema engine error` na primeira migração SQLite:** reproduzido em um clone Linux isolado. A migração funcionou ao repetir com `RUST_LOG=info pnpm exec prisma migrate deploy` (Bash/Zsh). No PowerShell, use `$env:RUST_LOG = "info"` antes do comando e `Remove-Item Env:RUST_LOG` depois. Há um [relato semelhante no repositório do Prisma](https://github.com/prisma/orm/issues/29355).

Esta é uma aplicação acadêmica, não uma implantação de produção. Documentação complementar: [Requisitos](docs/requisitos-e-backlog.md), [Autenticação](docs/adr/0003-autenticacao-por-sessao.md), [Modelagem](docs/modelagem-fisica.md) e [Testes](docs/testes/plano-de-testes.md).