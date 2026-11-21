# Sprint 1 — MVP do aluno: autenticação e fluxo principal

**Situação:** Em andamento
**Prazo de entrega do teste:** 23/11/2026
**Referências Jira:** MAT-6 (US-01), MAT-16 (US-03), MAT-11 (US-04)
**Último checkpoint:** 21/11/2026

## Objetivo

Entregar o fluxo prioritário do aluno: autenticação, consulta de ofertas, realização e cancelamento de matrículas e progresso curricular, com controles de autorização e testes automatizados. O frontend React e os fluxos administrativos ainda integram o escopo do MVP.

## Backlog da Sprint — MoSCoW

| Prioridade | Entrega | Estado atual |
| --- | --- | --- |
| Must | API Express e `GET /api/health` | Concluído; health check validado manualmente |
| Must | Autenticação com Argon2id, login, `/me` e logout | Implementados e testados |
| Must | Autorização por perfil `ALUNO`/`SECRETARIA` | Implementada e testada; ainda faltam regras de propriedade para dados privados |
| Must | Consulta de ofertas — US-03 | Backend implementado; 9 testes aprovados; frontend pendente |
| Must | Realização de matrícula — US-04 | Backend implementado; 12 testes aprovados; frontend pendente |
| Must | Consulta das matrículas ativas — US-05 | Pendente |
| Must | Cancelamento — US-06 | Pendente; o CT-09 simula cancelamento diretamente no banco |
| Must | Progresso curricular — US-07 | Pendente |
| Must | Isolamento acadêmico entre alunos | Parcial: ofertas e matrícula derivam identidade da sessão; testes de propriedade dos registros privados pendentes |
| Must | Testes automatizados do backend | **32 aprovados em 4 arquivos; 0 falhas** |
| Must | Persistência das sessões | SQLite integrado; falta evidência após reinício da API |
| Must | Segurança de cookies e requisições | `HttpOnly`, `SameSite=Lax`, regeneração de ID e limpeza no logout testados; CSRF e `Secure` em HTTPS pendentes |
| Could | Melhorias visuais secundárias | Não iniciadas; após as funcionalidades essenciais |

## Evidências da implementação

### Infraestrutura e autenticação

- Express 5, Prisma 7, adaptador SQLite, migrações e seed configurados.
- Banco acadêmico de testes separado de `dev.db`; arquivos de sessões `sessions.db` e `sessions.test.db` utilizados conforme o ambiente.
- Senhas verificadas com Argon2id; `senhaHash` não é exposto nas respostas.
- Endpoints `POST /api/auth/login`, `GET /api/auth/me` e `POST /api/auth/logout` implementados.
- Sessões armazenadas em SQLite com `express-session` e `@bleed-believer/connect-sqlite3`.
- Middleware de autenticação e de perfil implementado.
- **US-01:** 8 testes de autenticação/sessões e 3 de autorização aprovados. A autorização de secretaria foi testada em rota exclusiva dos testes.

### Ofertas — US-03 (Jira MAT-16)

- `GET /api/aluno/ofertas` exige perfil `ALUNO`.
- Busca por nome/código da disciplina, paginação e cálculo de vagas.
- Classificação curricular conforme o curso extraído da sessão (`OBRIGATORIA`, `ELETIVA_PERFIL`, `LIVRE`).
- **9 testes automatizados aprovados**; frontend pendente.

### Matrículas — US-04 (Jira MAT-11)

- `POST /api/aluno/matriculas` recebe somente `{ "turmaId": número }` e identifica o aluno pela sessão.
- Respostas previstas: `201` (criada), `400` (entrada inválida), `401` (não autenticado), `403` (perfil/cadastro acadêmico), `404` (turma inexistente) e `409` (conflito de regra).
- Validação de vagas, aprovação anterior e inexistência de outra matrícula ativa na mesma disciplina.
- Rematrícula elegível cria **novo registro**; a matrícula cancelada é preservada (ADR-0001).
- Transação com verificação de capacidade e tentativa de serialização da escrita para SQLite; **CT-10 aprovado em uma execução concorrente**, sem substituir testes de carga.
- **12 testes automatizados aprovados**. No CT-09, o cancelamento é simulado diretamente no banco; o endpoint de cancelamento continua pendente.

## Critérios de aceitação — Gherkin

### US-01 — Autenticação

```gherkin
Funcionalidade: Autenticação de usuário

  Cenário: Login válido
    Dado que existe um usuário cadastrado com senha válida
    Quando enviar as credenciais corretas
    Então a API cria uma sessão autenticada
    E retorna o perfil sem expor senhaHash

  Cenário: Login inválido
    Quando enviar credenciais incorretas
    Então a API responde 401 com mensagem genérica

  Cenário: Logout
    Dado que o usuário está autenticado
    Quando encerrar a sessão
    Então uma chamada posterior a /api/auth/me retorna 401
```

### US-04 — Matrícula

```gherkin
Funcionalidade: Realização de matrícula

  Cenário: Aluno elegível ocupa vaga
    Dado que o aluno está autenticado e a turma possui vagas
    E o aluno não foi aprovado anteriormente na disciplina
    E não possui matrícula ativa nessa disciplina
    Quando solicitar matrícula na turma
    Então a API cria um novo registro ATIVA e responde 201

  Cenário: Matrícula duplicada em outra turma
    Dado que o aluno possui matrícula ativa na disciplina
    Quando solicitar outra turma da mesma disciplina
    Então a API responde 409

  Cenário: Rematrícula após cancelamento
    Dado que a matrícula anterior foi cancelada
    E o aluno continua elegível e existe vaga
    Quando solicitar nova matrícula
    Então é criado outro registro ATIVA
    E o registro cancelado permanece preservado

  Cenário: Disputa pela última vaga
    Dado que existe apenas uma vaga disponível
    Quando dois alunos elegíveis solicitam a matrícula simultaneamente
    Então apenas uma solicitação é confirmada
    E a turma não ultrapassa sua capacidade
```

## Definition of Done e acompanhamento

### US-01 — Autenticação (MAT-6)

- [x] Login, `/me`, logout, autorização por perfil e 11 testes automatizados.
- [x] Armazenamento SQLite de sessões integrado.
- [x] Cookie `HttpOnly`/`SameSite=Lax`, regeneração de ID e limpeza no logout testados.
- [x] Commit e push da implementação registrados no GitLab (commit `847ddc8`).
- [ ] Evidência de persistência da mesma sessão após reinício da API.
- [ ] Verificação de `Secure` em HTTPS, proteção CSRF e expiração da sessão.
- [ ] Testes de propriedade dos dados acadêmicos entre alunos.
- [ ] Atualização e encerramento no Jira conforme os critérios restantes.

**Status:** em andamento; testes aprovados não encerram automaticamente a US-01.

### US-03 — Consulta de ofertas (MAT-16)

- [x] Backend e 9 testes automatizados.
- [x] Commit e push registrados no GitLab (commit `7d8c093`).
- [ ] Interface React, navegação por filtros/paginação e responsividade a 360px.
- [ ] Validação da ocupação após cancelamento via API.

**Status:** backend entregue; User Story integral pendente do frontend.

### US-04 — Realização de matrícula (MAT-11)

- [x] Endpoint, autorização, verificações de negócio e transação implementados.
- [x] 12 testes automatizados aprovados, incluindo rematrícula, reprovação e última vaga.
- [x] Atualização de vagas observada pelo endpoint de ofertas após matrícula.
- [ ] Frontend do fluxo de matrícula.
- [ ] Commit/push da US-04 e atualização no Jira.
- [ ] Ampliar testes de concorrência; o CT-10 não comprova ausência de falhas sob carga elevada.

**Status:** backend implementado e testado; ainda não versionado no checkpoint de 21/11/2026.

## Histórico de validações — 21/11/2026

| Marco | Suítes/arquivos | Testes aprovados | Falhas |
| --- | ---: | ---: | ---: |
| Autenticação e autorização — US-01 | 2 | 11 | 0 |
| Inclusão das ofertas — US-03 | 3 | 20 | 0 |
| Inclusão das matrículas — US-04 | 4 | **32** | **0** |

**Comando final executado:** `pnpm exec vitest run` (Vitest 5.1.1 + Supertest). Banco acadêmico: SQLite de teste.

## Revisão da Sprint — 21/11/2026

**Entregas:** API e persistência acadêmica, autenticação/sessões, ofertas paginadas e realização de matrícula no backend.

**Dificuldades:** configuração das variáveis de ambiente, tipagem do seed, credenciais de teste, inicialização do servidor e separação dos bancos de desenvolvimento e de testes. A nova suíte de matrícula exigiu configurar explicitamente `DATABASE_URL=file:./test.db`.

**Riscos e pendências:** CSRF, teste após reinício, isolamento de dados privados, concorrência sob maior carga, implementação de cancelamento/progresso e frontend responsivo. A Sprint continua em andamento.

## Próximas ações — prioridade de entrega

1. Revisar e versionar os arquivos da US-04 com a documentação; registrar avanço no Jira MAT-11.
2. Implementar US-05 (consultar matrículas ativas), US-06 (cancelar matrícula) e US-07 (progresso).
3. Implementar o frontend React do aluno e conferir o fluxo completo a 360px.
4. Concluir os fluxos obrigatórios de secretaria e o requisito adicional do enunciado.
5. Revisar segurança, documentação, testes completos, README e entrega no GitLab até 23/11/2026.