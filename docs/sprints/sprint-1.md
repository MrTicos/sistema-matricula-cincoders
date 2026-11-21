# Sprint 1 — MVP do aluno: autenticação e fluxo principal

**Situação:** Em andamento
**Prazo de entrega do teste:** 23/11/2026
**Referência principal:** Jira MAT-6 (US-01 — Autenticação)

**Último checkpoint:** 21/11/2026

## Objetivo

Permitir que alunos utilizem as funcionalidades prioritárias do MVP, iniciando por login, sessão, autorização e testes. A priorização seguirá o enunciado do teste: autenticação, ofertas, matrícula/cancelamento e progresso antes dos fluxos administrativos.

## Backlog da Sprint — MoSCoW

| Prioridade | Entrega | Estado |
| --- | --- | --- |
| Must | Inicializar API Express e `GET /api/health` | Concluído; health check verificado manualmente |
| Must | Autenticação de usuários com Argon2id | Implementada e testada |
| Must | Login, sessão, `/me` e logout | Implementados e testados |
| Must | Autorização por perfil `ALUNO`/`SECRETARIA` | Implementada e testada em rota exclusiva dos testes |
| Must | Isolamento dos dados acadêmicos por aluno | Pendente; depende dos endpoints acadêmicos |
| Must | Testes automatizados de autenticação/autorização | 11 testes aprovados, 0 falhas |
| Must | Ofertas, matrícula, cancelamento e progresso do aluno | Pendente |
| Must | Persistência das sessões | Armazenamento SQLite integrado; evidência após reinício a registrar |
| Must | Segurança das sessões e cookies | `HttpOnly`, `SameSite=Lax`, regeneração de ID e limpeza no logout testados; CSRF e HTTPS pendentes |
| Could | Melhorias visuais secundárias | Não iniciadas; após o MVP |

## Evidências da implementação

### Infraestrutura

- API Express inicializada com `src/app.ts` e `src/server.ts`.
- `GET /api/health` validado manualmente.
- Prisma 7 + adaptador SQLite configurados, schema validado, migração aplicada e seed executado.
- Banco de dados acadêmicos de teste separado do banco de desenvolvimento.
- Bancos de sessões SQLite separados: `sessions.db` e `sessions.test.db`; criação dos arquivos confirmada com `Test-Path`.

### Autenticação e autorização

- Verificação de credenciais com Argon2id, sem retornar `senhaHash`.
- Endpoints `POST /api/auth/login`, `GET /api/auth/me` e `POST /api/auth/logout` implementados.
- `express-session` configurado com armazenamento persistente `@bleed-believer/connect-sqlite3`.
- Middleware de autenticação e autorização por perfil implementado.
- Cookies com `HttpOnly` e `SameSite=Lax`; identificador de sessão regenerado em novo login e limpo no logout.

### Testes automatizados — 21/11/2026

| Arquivo | Testes | Resultado |
| --- | ---: | --- |
| `tests/auth.test.ts` | 8 | Aprovados |
| `tests/auth.middleware.test.ts` | 3 | Aprovados |
| **Total** | **11** | **11 aprovados, 0 falhas** |


**Ferramentas:** Vitest 5.1.1 e Supertest.
**Comando executado:** `pnpm exec vitest run`.
**Limite da evidência:** os testes de autorização utilizam uma rota exclusiva dos testes; os endpoints administrativos e o isolamento entre alunos ainda não foram validados.

## Critérios de aceitação (US-01)

```gherkin
Funcionalidade: Login de usuário

  Cenário: Credenciais válidas
    Dado um usuário cadastrado com senha válida
    Quando enviar usuário e senha ao endpoint de login
    Então a API deve criar uma sessão autenticada
    E deve retornar seu perfil sem expor senhaHash

  Cenário: Credenciais inválidas
    Quando enviar uma combinação inválida de usuário e senha
    Então a API deve responder 401 com mensagem genérica

  Cenário: Acesso não autenticado
    Dado um cliente sem sessão válida
    Quando solicitar uma rota protegida
    Então a API deve negar o acesso

  Cenário: Encerramento de sessão
    Dado um usuário autenticado
    Quando encerrar a sessão
    Então as requisições posteriores não devem continuar autenticadas

  Cenário: Usuário inexistente
    Quando enviar um username inexistente e qualquer senha
    Então a API deve responder 401 com mensagem genérica

  Cenário: Cookie protegido
    Dado um usuário com credenciais válidas
    Quando realizar o login
    Então o cookie de sessão deve conter HttpOnly e SameSite=Lax

  Cenário: Persistência após reinício
    Dado um usuário autenticado com cookie válido
    Quando a API reiniciar com o mesmo segredo e banco de sessões
    Então /api/auth/me deverá continuar autenticado sem novo login
```

Os cenários de login, erros, controle de acesso, logout e atributos de cookie possuem evidências automatizadas. O cenário de persistência após reinício ainda exige registro explícito do resultado manual.

## Definition of Done — US-01

- [x] Endpoints de autenticação implementados.
- [x] Middleware de autenticação e autorização por perfil implementado.
- [x] Testes automatizados de autenticação e autorização passando (11/11).
- [x] Armazenamento de sessões em SQLite integrado, substituindo `MemoryStore`.
- [x] Cookie `HttpOnly` e `SameSite=Lax` testados.
- [x] Regeneração do identificador de sessão e limpeza do cookie no logout testadas.
- [x] Documentação técnica de autenticação e plano de testes revisados.
- [ ] Evidência registrada de persistência da mesma sessão após reiniciar a API.
- [ ] Atributo `Secure` verificado em ambiente HTTPS.
- [ ] Proteção contra CSRF revisada, implementada e validada para operações mutáveis.
- [ ] Testar login com os demais alunos do seed e expiração da sessão.
- [ ] Verificar isolamento de dados de cada aluno quando as rotas acadêmicas existirem.
- [ ] Commit e push da funcionalidade verificados no GitLab.
- [ ] Jira MAT-6 atualizado conforme a Definition of Done.

**Status da US-01:** em andamento; não considerar concluída somente porque os 11 testes atuais passaram.

## Próximas ações

1. Registrar a evidência do teste manual de sessão após reinício, sem realizar novo login.
2. Revisar a proteção contra CSRF nas rotas que alteram dados e implementar os testes necessários.
3. Verificar a política de cookies em HTTPS, inclusive o atributo `Secure`.
4. Executar novamente `pnpm exec vitest run` e verificar o resultado completo.
5. Atualizar `docs/testes/plano-de-testes.md`, `docs/arquitetura/autenticacao.md`, `docs/arquitetura/visao-geral.md` e a ADR-0003 conforme as decisões finais.
6. Conferir `git status` e `git diff`, preparar commit e push; atualizar o Jira MAT-6.
7. Priorizar imediatamente a consulta de ofertas, matrícula, cancelamento e progresso curricular do aluno.

## Checkpoint da Sprint — 21/11/2026

### Entregas concluídas

- Inicialização da API Express e conexão Prisma/SQLite.
- Migração e seed do banco acadêmico.
- Autenticação com Argon2id, login, consulta de sessão e logout.
- Middleware de autorização por perfil.
- Integração de armazenamento de sessões em SQLite.
- Ampliação da suíte de autenticação de 4 para 8 testes, com mais 3 de autorização.

### Resultado do checkpoint

| Categoria | Testes | Resultado |
| --- | ---: | --- |
| Autenticação, sessão e cookies | 8 | Aprovados |
| Autorização por perfil | 3 | Aprovados |
| **Total** | **11** | **Aprovados (0 falhas)** |

### Dificuldades encontradas

- Configuração inicial das variáveis de ambiente.
- Ajustes de tipagem TypeScript no seed.
- Falha inicial de login por divergência de credenciais.
- Necessidade de manter banco SQLite de teste separado do desenvolvimento.
- Diagnóstico de falha de conexão quando a API não estava em execução.

### Pendências principais

- Documentar o resultado explícito do teste de persistência após reinício.
- Revisar e testar CSRF e verificar `Secure` em HTTPS.
- Implementar e testar o isolamento de dados acadêmicos.
- Concluir os fluxos de ofertas, matrícula/cancelamento e progresso curricular.
- Registrar commit/push e atualizar o Jira.

**Situação do checkpoint:** a autenticação e a autorização por perfil possuem 11 testes automatizados aprovados. A Sprint 1 segue em andamento; as funcionalidades principais do aluno ainda não foram entregues.