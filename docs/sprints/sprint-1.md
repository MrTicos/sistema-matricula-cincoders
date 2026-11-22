# Sprint 1 — MVP do aluno: autenticação e fluxo principal

> **Checkpoint atualizado — 21/11/2026:** backend do aluno: 59 testes aprovados; frontend: 30 testes aprovados. **Total acumulado: 89 testes** em suítes separadas, segundo as validações reportadas. A Sprint segue em andamento; números menores abaixo são históricos.

## Checkpoint — US-05, US-06 e US-07 no frontend

**Jira:** MAT-8 (US-05), MAT-15 (US-06) e MAT-12 (US-07).
**Estado:** fluxo principal do aluno implementado no frontend; consolidação de entrega e refinamento final pendentes.

### Entregas realizadas

- **US-05:** página de matrículas ativas com disciplina, professor, turma, data, estados de carregamento, lista vazia e erro. Dados do próprio aluno vêm de `GET /api/aluno/matriculas`, usando a sessão.
- **US-06:** confirmação antes do cancelamento, opção de desistir, `PATCH /api/aluno/matriculas/:matriculaId/cancelar`, mensagens de sucesso/erro e remoção da matrícula cancelada da lista.
- **US-07:** página com curso, percentuais e cargas horárias obrigatória, perfil, livre e total; horas em andamento apresentadas separadamente de horas aprovadas.
- Navegação provisória entre ofertas, matrículas e progresso; acabamento visual não priorizado neste checkpoint.

### Validação

| Escopo | Arquivos de testes | Testes aprovados |
| --- | ---: | ---: |
| Backend (US-01/03/04/05/06/07) | 7 | 59 |
| Frontend — US-02/03/04 | 4 | 16 |
| Frontend — US-05 | 1 | 5 |
| Frontend — US-06 | 1 | 4 |
| Frontend — US-07 | 1 | 5 |
| **Total acumulado** | **14** | **89** |

**Evidência manual:** consulta de matrícula real, cancelamento com liberação de vaga e apresentação de progresso curricular confirmados. **Verificações:** Vitest, ESLint e TypeScript passaram, conforme relato do desenvolvedor.

### Pendências e próximos passos

- [ ] Conferir `git status`, revisar alterações, registrar commit e push deste marco.
- [ ] Atualizar as tarefas MAT-8, MAT-15 e MAT-12 no Jira.
- [ ] Validar layout de 360px, navegação e comportamento em outros tamanhos de tela.
- [ ] Revisar CSRF, HTTPS/cookies e persistência de sessão após reinício.
- [ ] Implementar funcionalidades obrigatórias da secretaria e requisito adicional.
- [ ] Revisar README, documentação e instruções de execução para a entrega de 23/11/2026.

## Checkpoint — US-03 e US-04 no frontend

**Jira:** MAT-16 (US-03) e MAT-11 (US-04).
**Estado:** interface integrada ao backend e validada manualmente; testes de componentes aprovados.

### Entregas

- Listagem de ofertas por aluno, pesquisa por nome/código, paginação na URL e classificação curricular por curso.
- Exibição de professor, carga horária, vagas totais, ocupadas e disponíveis; indicador de turma lotada.
- Botão de matrícula que chama `POST /api/aluno/matriculas` com `turmaId` e mantém sessão por cookie.
- Estados de processamento, mensagens de sucesso/erro e atualização automática de vagas após confirmação.

### Evidências

| Suíte | Testes aprovados | Falhas |
| --- | ---: | ---: |
| Backend — US-01/03/04/05/06/07 | 59 | 0 |
| Frontend — US-02 | 11 | 0 |
| Frontend — Ofertas/matrícula US-03/04 | 5 | 0 |
| **Total acumulado** | **75** | **0** |

No frontend, `pnpm exec vitest run`, `pnpm lint` e `pnpm exec tsc -b` foram executados sem erros. Em teste manual, a regra de disciplina já aprovada bloqueou `aluno.si` em CIN0002; `aluno.si2` conseguiu matricular-se, com redução imediata das vagas exibidas. Essa atualização é resultado de nova consulta à API, não de alteração direta no contador pelo navegador.

### Pendências antes de encerrar a entrega

- [ ] Ampliar testes do frontend para paginação e atualização do contador após matrícula.
- [ ] Validar layout e navegação em 360px.
- [ ] Implementar telas de matrículas ativas, cancelamento e progresso curricular.
- [ ] Concluir revisão de CSRF e sessão em HTTPS.
- [ ] Confirmar commit/push deste checkpoint e atualizar MAT-16/MAT-11 no Jira.
> **Checkpoint atualizado — 21/11/2026:**_ backend do aluno com 59 testes aprovados; frontend de autenticação (US-02/MAT-7) implementado e aprovado em 11 testes. Total acumulado: _**70 testes**_, em execuções separadas. A Sprint segue em andamento. Seções abaixo com números menores registram checkpoints históricos._

## US-02 — Interface de autenticação (MAT-7)

**Estado:** interface implementada e validada; pendências de conclusão listadas abaixo.

### Entregas

- Frontend React + TypeScript + Vite inicializado.

- Cliente HTTP com `credentials: "include"` e sessão no backend.

- `AuthProvider` com recuperação da identidade em `/api/auth/me` e hook `useAuth`.

- Formulário de login, estados de carregamento e mensagem de erro.

- Redirecionamentos e rotas protegidas por perfil ALUNO/SECRETARIA.

- Botão de logout; login e logout reais verificados manualmente.

### Validação

| Categoria | Arquivo | Testes aprovados |

| --- | --- | ---: |

| Formulário | `LoginPage.test.tsx` | 4 |

| Logout | `LogoutButton.test.tsx` | 3 |

| Proteção de rotas | `AppRoutes.test.tsx` | 4 |

| **Total frontend US-02** | **3 arquivos** | **11** |

`pnpm exec vitest run`, `pnpm lint` e `pnpm exec tsc -b` foram executados em `apps/web` sem erros. A suíte do backend acumulou 59 testes aprovados em execução separada.

### Definition of Done — US-02

- [x] Login integrado à API e sessão por cookie.

- [x] Logout pela interface e tratamento de erro.

- [x] Rotas protegidas por perfil e redirecionamentos.

- [x] 11 testes automatizados de frontend aprovados.

- [x] ESLint e TypeScript sem erros.

- [ ] Verificar visualmente viewport de 360px.

- [ ] Revisar CSRF e cookies em HTTPS para entrega.

- [ ] Confirmar commit/push e atualizar Jira MAT-7.

**Próximo foco:** integração das telas de ofertas, matrículas, cancelamento e progresso com o backend já implementado.

**Situação:** Em andamento

**Prazo de entrega do teste:** 23/11/2026

**Referências Jira:** MAT-6 (US-01), MAT-16 (US-03), MAT-11 (US-04), MAT-8 (US-05)

**Último checkpoint:** 21/11/2026

## Registro anterior da Sprint (histórico)

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

| Must | Consulta das matrículas ativas — US-05 | Backend implementado; 7 testes aprovados; frontend pendente |

| Must | Cancelamento — US-06 | Backend implementado; 10 testes aprovados; frontend pendente |

| Must | Progresso curricular — US-07 | Backend implementado; 10 testes aprovados; frontend pendente |

| Must | Isolamento acadêmico entre alunos | Parcial: US-05 testa a separação de matrículas por titular; outros endpoints privados ainda exigem verificação |

| Must | Testes automatizados do backend | 59 testes aprovados em 7 arquivos; 0 falhas |

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

### Consulta de matrículas ativas — US-05 (Jira MAT-8)

- `GET /api/aluno/matriculas` exige perfil `ALUNO` e deriva a identidade acadêmica da sessão.

- A API retorna somente matrículas com situação `ATIVA`, com turma, data, disciplina e professor.

- Matrículas canceladas não aparecem; um aluno não recebe registros de outro, mesmo informando outro `alunoId` na consulta.

- Retorno de lista vazia para aluno sem matrículas ativas.

- **7 testes automatizados aprovados**; frontend pendente.

### Cancelamento de matrícula — US-06 (Jira MAT-15)

- Endpoint `PATCH /api/aluno/matriculas/:matriculaId/cancelar`.

- Cancelamento permitido somente ao titular.

- Matrículas canceladas permanecem armazenadas.

- Data do cancelamento registrada.

- Liberação automática da vaga.

- Cancelamento repetido rejeitado.

- Rematrícula validada após cancelamento via API.

- **10 testes automatizados aprovados**.

### Progresso curricular — US-07 (Jira MAT-12)

- Endpoint `GET /api/aluno/progresso` implementado.

- Cálculo de CH obrigatória, perfil e livre.

- Separação entre CH aprovada e CH em curso.

- Transferência do excedente de perfil para livre.

- Percentuais limitados a 100%.

- Isolamento do progresso entre alunos.

- **10 testes automatizados aprovados**.

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

### US-05 — Consulta de matrículas ativas

```gherkin

Funcionalidade: Consultar matrículas ativas

  Cenário: Aluno consulta suas matrículas

    Dado que um aluno está autenticado e possui matrículas ativas

    Quando solicitar a listagem de matrículas

    Então a API retorna somente as matrículas ativas desse aluno

    E informa turma, disciplina, professor e data da matrícula

  Cenário: Matrícula cancelada

    Dado que o aluno possui uma matrícula cancelada

    Quando consultar suas matrículas ativas

    Então a matrícula cancelada não aparece

  Cenário: Isolamento de registros

    Dado que um aluno está autenticado

    Quando consultar suas matrículas tentando informar outro alunoId

    Então a API não retorna matrículas de outro aluno

  Cenário: Lista vazia

    Dado que o aluno não possui matrículas ativas

    Quando consultar suas matrículas

    Então a API retorna uma lista vazia

```

## Definition of Done e acompanhamento

### US-01 — Autenticação (MAT-6)

- [x] Login, `/me`, logout, autorização por perfil e 11 testes automatizados.

- [x] Armazenamento SQLite de sessões integrado.

- [x] Cookie `HttpOnly`/`SameSite=Lax`, regeneração de ID e limpeza no logout testados.

- [x] Commit e push da implementação registrados no GitLab (commit `847ddc8`).

- [ ] Evidência de persistência da mesma sessão após reinício da API.

- [ ] Verificação de `Secure` em HTTPS, proteção CSRF e expiração da sessão.

- [x] Isolamento da listagem de matrículas entre alunos verificado na US-05.

- [ ] Verificar propriedade dos registros nos demais endpoints acadêmicos privados.

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

- [ ] Confirmar hash do commit/push da US-04 e atualização no Jira MAT-11.

- [ ] Ampliar testes de concorrência; o CT-10 não comprova ausência de falhas sob carga elevada.

**Status:** backend implementado e testado; confirmação do versionamento pendente neste registro.

### US-05 — Consulta de matrículas ativas (MAT-8)

- [x] Endpoint, consulta limitada à identidade da sessão e autorização por perfil `ALUNO` implementados.

- [x] Exibição apenas de matrículas ativas, com dados da turma, disciplina e professor.

- [x] Isolamento entre alunos e lista vazia verificados.

- [x] 7 testes automatizados aprovados.

- [ ] Interface React de consulta de matrículas.

- [ ] Commit/push da US-05 e atualização do Jira MAT-8.

**Status:** backend implementado e testado; frontend e versionamento pendentes.

### US-06 — Cancelamento de matrícula (MAT-15)

- [x] Endpoint de cancelamento implementado.

- [x] Autorização por perfil e titularidade validada.

- [x] Preservação do registro cancelado.

- [x] Liberação de vagas validada.

- [x] Rematrícula após cancelamento validada.

- [x] Concorrência no cancelamento testada.

- [x] 10 testes automatizados aprovados.

- [ ] Interface React implementada.

- [ ] Commit e push verificados.

- [ ] Jira MAT-15 atualizado.

**Status:** backend implementado e testado;

frontend pendente.

### US-07 — Progresso curricular (MAT-12)

- [x] Endpoint de progresso implementado.

- [x] Cálculos por categoria implementados.

- [x] Histórico aprovado contabilizado corretamente.

- [x] Reprovações desconsideradas.

- [x] Matrículas ativas apresentadas separadamente.

- [x] Excedente de perfil transferido para livre.

- [x] Percentuais e CH faltante limitados corretamente.

- [x] Isolamento entre alunos testado.

- [x] 10 testes automatizados aprovados.

- [ ] Interface React implementada.

- [ ] Commit e push verificados.

- [ ] Jira MAT-12 atualizado.

**Status:** backend implementado e testado;

frontend pendente.

## Histórico de validações — 21/11/2026

| Marco | Suítes/arquivos | Testes aprovados | Falhas |

| --- | ---: | ---: | ---: |

| Autenticação e autorização — US-01 | 2 | 11 | 0 |

| Inclusão das ofertas — US-03 | 3 | 20 | 0 |

| Realização de matrícula — US-04 | 4 | 32 | 0 |

| Consulta de matrículas ativas — US-05 | 5 | 39 | 0 |

| Cancelamento de matrícula — US-06 | 6 | 49 | 0 |

| Progresso curricular — US-07 | 7 | **59** | **0** |

**Comando:** `pnpm exec vitest run`

**Resultado:** 59 testes aprovados em 7 arquivos, 0 falhas.

## Revisão da Sprint — 21/11/2026

**Entregas:** API e persistência acadêmica, autenticação/sessões, ofertas paginadas, realização de matrícula e consulta das matrículas ativas no backend.

**Dificuldades:** configuração das variáveis de ambiente, tipagem do seed, credenciais de teste, inicialização do servidor e separação dos bancos de desenvolvimento e de testes. A nova suíte de matrícula exigiu configurar explicitamente `DATABASE_URL=file:./test.db`.

**Validação atual:** 39 testes automatizados aprovados em 5 arquivos, sem falhas.

**Riscos e pendências:** CSRF, teste após reinício, isolamento nos demais endpoints privados, concorrência sob maior carga, implementação de cancelamento/progresso e frontend responsivo. A Sprint continua em andamento.

## Próximas ações — prioridade de entrega

3. Implementar o frontend React do aluno e conferir o fluxo completo a 360px.

4. Concluir os fluxos obrigatórios de secretaria e o requisito adicional do enunciado.

5. Revisar segurança, documentação, testes completos, README e entrega no GitLab até 23/11/2026.