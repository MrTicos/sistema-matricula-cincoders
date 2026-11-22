# Sprint 1 — MVP do aluno: autenticação e fluxo principal

**Situação:** Em andamento — funcionalidades principais implementadas; encerramento condicionado às verificações pendentes de segurança, responsividade, integração e entrega.
**Prazo de entrega do teste:** 23/11/2026
**Referências Jira:** MAT-6 (US-01), MAT-7 (US-02), MAT-16 (US-03), MAT-11 (US-04), MAT-8 (US-05), MAT-15 (US-06), MAT-12 (US-07); confirmar o vínculo da US-08 no Jira (requisito de disciplinas associado a MAT-5 no backlog).
**Último checkpoint:** 22/11/2026

## Checkpoint consolidado — 22/11/2026

**Resultado comprovado pelos logs enviados:** `pnpm exec vitest run` em `apps/api` passou com **65/65 testes em 8 arquivos**; o mesmo comando em `apps/web` passou com **34/34 testes em 8 arquivos**. **Total: 99 testes em 16 arquivos, 0 falhas.** São execuções separadas, e não um teste ponta a ponta do sistema.

| Grupo | Backend | Frontend | Situação observada |
| --- | ---: | ---: | --- |
| US-01 — Autenticação e middleware | 11 | — | API implementada e testada |
| US-02 — Login, logout e rotas | — | 11 | Interface implementada e testada |
| US-03 — Ofertas | 9 | Parte de 5 compartilhados com US-04 | API + `OfertasPage` implementadas |
| US-04 — Matrícula | 12 | Parte de 5 compartilhados com US-03 | API + ação de matrícula na página de ofertas |
| US-05 — Consulta de matrículas | 7 | 5 | API + `MatriculasPage` |
| US-06 — Cancelamento | 10 | 4 | API + fluxo de confirmação no frontend |
| US-07 — Progresso curricular | 10 | 5 | API + `ProgressoPage` |
| US-08 — Cadastro de disciplinas | 6 | 4 | API protegida + `DisciplinasPage` |
| **Total sem duplicar os 5 compartilhados** | **65** | **34** | **99 aprovados** |

**Limites:** o último trecho compartilhado para `pnpm lint` e `pnpm exec tsc -b` no frontend termina em `$ eslint .`, sem comprovação do término dessa execução; uma execução anterior havia sido registrada como aprovada. Persistência após reinício, CSRF, cookies em HTTPS, responsividade a 360px e testes de ponta a ponta permanecem exigindo evidência própria. Não considerar o conjunto de testes como encerramento automático da Sprint.

## Objetivo

Entregar o fluxo prioritário do aluno: autenticação, consulta de ofertas, realização e cancelamento de matrículas e progresso curricular, com controles de autorização e testes automatizados. O frontend React e os fluxos administrativos ainda integram o escopo do MVP.

## Backlog da Sprint — MoSCoW

| Prioridade | Entrega | Estado atual |
| --- | --- | --- |
| Must | API Express e `GET /api/health` | Concluído; health check validado manualmente |
| Must | Autenticação com Argon2id, login, `/me` e logout | Implementados e testados |
| Must | Autorização por perfil `ALUNO`/`SECRETARIA` | Implementada e testada; ainda faltam regras de propriedade para dados privados |
| Must | Interface de autenticação — US-02 | Login, logout e proteção de rotas implementados; 11 testes frontend aprovados |
| Must | Consulta de ofertas — US-03 | Backend implementado; 9 testes; `OfertasPage` implementada/testada |
| Must | Realização de matrícula — US-04 | Backend implementado; 12 testes; ação no frontend de ofertas implementada/testada |
| Must | Consulta das matrículas ativas — US-05 | Backend implementado; 7 testes; `MatriculasPage` com 5 testes frontend |
| Must | Cancelamento — US-06 | Backend implementado; 10 testes; confirmação no React com 4 testes |
| Must | Progresso curricular — US-07 | Backend implementado; 10 testes; página React com 5 testes |
| Must | Cadastro de disciplinas — US-08 | Endpoint e formulário da secretaria implementados; 6 testes API + 4 frontend |
| Must | Isolamento acadêmico entre alunos | Testado nas consultas de matrículas e progresso; manter revisão dos demais endpoints privados |
| Must | Testes automatizados | 65 backend + 34 frontend = 99 aprovados em 16 arquivos, 0 falhas |
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
- **9 testes automatizados aprovados** no backend; `OfertasPage` implementada, com testes frontend compartilhados com US-04.

### Matrículas — US-04 (Jira MAT-11)

- `POST /api/aluno/matriculas` recebe somente `{ "turmaId": número }` e identifica o aluno pela sessão.
- Respostas previstas: `201` (criada), `400` (entrada inválida), `401` (não autenticado), `403` (perfil/cadastro acadêmico), `404` (turma inexistente) e `409` (conflito de regra).
- Validação de vagas, aprovação anterior e inexistência de outra matrícula ativa na mesma disciplina.
- Rematrícula elegível cria **novo registro**; a matrícula cancelada é preservada (ADR-0001).
- Transação com verificação de capacidade e tentativa de serialização da escrita para SQLite; **CT-10 aprovado em uma execução concorrente**, sem substituir testes de carga.
- **12 testes automatizados aprovados**. No CT-09 da US-04, o cancelamento é simulado diretamente no banco (característica daquele teste); o endpoint separado de cancelamento foi implementado posteriormente na US-06.

### Consulta de matrículas ativas — US-05 (Jira MAT-8)

- `GET /api/aluno/matriculas` exige perfil `ALUNO` e deriva a identidade acadêmica da sessão.
- A API retorna somente matrículas com situação `ATIVA`, com turma, data, disciplina e professor.
- Matrículas canceladas não aparecem; um aluno não recebe registros de outro, mesmo informando outro `alunoId` na consulta.
- Retorno de lista vazia para aluno sem matrículas ativas.
- **7 testes automatizados aprovados** no backend; `MatriculasPage` implementada e testada no frontend (5 testes).

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

### Interface de autenticação — US-02 (Jira MAT-7)

- Login, logout, estado de autenticação e redirecionamento por perfil em React/Vite.
- Proteção de rotas para impedir navegação de aluno na secretaria e vice-versa; a API continua a aplicar as permissões reais.
- **11 testes frontend aprovados**: 4 de login, 3 de logout e 4 de rotas.

### Cadastro de disciplinas — US-08 (vínculo Jira a conferir)

- `POST /api/secretaria/disciplinas` exige sessão válida e perfil `SECRETARIA`; alunos não podem cadastrar disciplinas.
- Entrada com `codigo`, `nome` e `cargaHoraria`; código normalizado em maiúsculas; carga horária inteira de 15 a 120 e múltipla de 15; código único.
- Respostas de referência: `201` criado; `400` inválido; `401` sem sessão; `403` perfil proibido; `409` duplicado.
- Formulário `DisciplinasPage` apresenta os três campos, valida entradas, bloqueia envio simultâneo e informa sucesso ou falha.
- **6 testes API + 4 testes frontend aprovados**, com logs separados.
- **Ainda não comprovados:** edição/listagem administrativa de disciplinas, CRUD de professores, abertura de turmas e ajuste de vagas.

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

### US-08 — Cadastro de disciplinas pela secretaria

```gherkin
Funcionalidade: Cadastro de disciplinas pela secretaria

  Cenário: Cadastro válido
    Dado que uma pessoa com perfil SECRETARIA está autenticada
    E informa código e nome válidos e carga horária 60
    Quando cadastrar uma disciplina ainda inexistente
    Então a API retorna 201
    E a disciplina é persistida com o código normalizado

  Cenário: Código duplicado
    Dado que já existe uma disciplina com o código informado
    Quando a secretaria tentar cadastrar outra disciplina com o mesmo código
    Então a API retorna 409
    E nenhuma disciplina duplicada é criada

  Cenário: Carga horária inválida
    Dado que a secretaria informa carga horária fora de 15 a 120 ou não múltipla de 15
    Quando tentar cadastrar a disciplina
    Então a entrada é rejeitada
    E a interface apresenta o erro ao usuário

  Cenário: Aluno tenta cadastrar disciplina
    Dado que um aluno está autenticado
    Quando solicitar o cadastro de disciplina
    Então a API retorna 403
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
- [x] Interface React de ofertas implementada e coberta por testes de componente.
- [ ] Conferir filtros/paginação com URL e responsividade a 360px em execução manual.
- [x] Liberação da vaga após cancelamento validada na suíte de US-06 (teste de backend).

**Status em 22/11/2026:** API e componente React implementados/testados; testes manuais e critérios adicionais ainda abertos.

### US-04 — Realização de matrícula (MAT-11)

- [x] Endpoint, autorização, verificações de negócio e transação implementados.
- [x] 12 testes automatizados aprovados, incluindo rematrícula, reprovação e última vaga.
- [x] Atualização de vagas observada pelo endpoint de ofertas após matrícula.
- [x] Ação de matrícula no frontend de ofertas implementada e coberta por testes de componente.
- [ ] Confirmar hash do commit/push da US-04 e atualização no Jira MAT-11.
- [ ] Ampliar testes de concorrência; o CT-10 não comprova ausência de falhas sob carga elevada.

**Status:** backend implementado e testado; confirmação do versionamento pendente neste registro.

### US-05 — Consulta de matrículas ativas (MAT-8)

- [x] Endpoint, consulta limitada à identidade da sessão e autorização por perfil `ALUNO` implementados.
- [x] Exibição apenas de matrículas ativas, com dados da turma, disciplina e professor.
- [x] Isolamento entre alunos e lista vazia verificados.
- [x] 7 testes automatizados aprovados.
- [x] Interface React de consulta de matrículas implementada e coberta por 5 testes.
- [ ] Commit/push da US-05 e atualização do Jira MAT-8.

**Status em 22/11/2026:** backend e frontend implementados/testados; versionamento/Jira e verificação ponta a ponta a confirmar.

### US-06 — Cancelamento de matrícula (MAT-15)

- [x] Endpoint de cancelamento implementado.
- [x] Autorização por perfil e titularidade validada.
- [x] Preservação do registro cancelado.
- [x] Liberação de vagas validada.
- [x] Rematrícula após cancelamento validada.
- [x] Concorrência no cancelamento testada.
- [x] 10 testes automatizados aprovados.
- [x] Interface React com confirmação de cancelamento implementada e coberta por 4 testes.
- [ ] Commit e push verificados.
- [ ] Jira MAT-15 atualizado.

**Status em 22/11/2026:** backend e frontend implementados/testados; Jira e commit a verificar.

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
- [x] Interface React de progresso implementada e coberta por 5 testes.
- [ ] Commit e push verificados.
- [ ] Jira MAT-12 atualizado.

**Status em 22/11/2026:** backend e frontend implementados/testados; Jira e commit a verificar.

### US-02 — Interface de autenticação (MAT-7)

- [x] Login, logout e proteção de rotas no React.
- [x] 11 testes frontend aprovados (4 login, 3 logout, 4 rotas).
- [ ] Verificar layout a 360px, estados reais de sessão e navegação ponta a ponta.
- [ ] Confirmar registro do commit e situação da história no Jira.

**Status:** implementação e testes de componente registrados; aceite integral a confirmar.

### US-08 — Cadastro de disciplinas (Jira a conferir)

- [x] Endpoint `POST /api/secretaria/disciplinas` com autenticação e autorização de secretaria.
- [x] Validação de código único, nome obrigatório e carga horária conforme o domínio.
- [x] Formulário React com código, nome, carga horária, mensagens de retorno e bloqueio durante envio.
- [x] 6 testes automatizados no backend e 4 no frontend aprovados em 22/11/2026.
- [ ] Confirmar fluxo completo pelo navegador contra a API e o banco reais.
- [ ] Confirmar commit/push da US-08 e referência correta no Jira.
- [ ] Não confundir esta entrega com listagem/edição de disciplinas ou os demais cadastros administrativos.

**Status:** cadastro implementado e testado nas camadas API e React; verificações de entrega e critérios mais amplos de gerenciamento pendentes.

## Histórico de validações — 21/11/2026

| Marco | Suítes/arquivos | Testes aprovados | Falhas |
| --- | ---: | ---: | ---: |
| Autenticação e autorização — US-01 | 2 | 11 | 0 |
| Inclusão das ofertas — US-03 | 3 | 20 | 0 |
| Realização de matrícula — US-04 | 4 | 32 | 0 |
| Consulta de matrículas ativas — US-05 | 5 | 39 | 0 |
| Cancelamento de matrícula — US-06 | 6 | **49** | 0 |
| Progresso curricular — US-07 | 7 | **59** | **0** |

**Comando:** `pnpm exec vitest run`

**Resultado:** 59 testes aprovados em 7 arquivos, 0 falhas.
## Revisão da Sprint — 21/11/2026

**Entregas:** API e persistência acadêmica, autenticação/sessões, ofertas paginadas, realização de matrícula e consulta das matrículas ativas no backend.

**Dificuldades:** configuração das variáveis de ambiente, tipagem do seed, credenciais de teste, inicialização do servidor e separação dos bancos de desenvolvimento e de testes. A nova suíte de matrícula exigiu configurar explicitamente `DATABASE_URL=file:./test.db`.

**Validação no momento desse registro histórico:** 39 testes automatizados aprovados em 5 arquivos, sem falhas. O checkpoint atualizado de 22/11/2026 registra 99 testes em 16 arquivos.

**Riscos e pendências naquele momento:** CSRF, teste após reinício, isolamento nos demais endpoints privados, concorrência sob maior carga, implementação de cancelamento/progresso e frontend responsivo. Cancelamento e progresso foram implementados depois; os riscos de segurança, responsividade e carga ainda precisam de verificação.

## Próximas ações registradas em 21/11/2026 (histórico)

1. Versionar a US-05 e atualizar o Jira MAT-8; confirmar o registro do commit da US-04.
2. Implementar US-06 (cancelamento) e US-07 (progresso curricular).
3. Implementar o frontend React do aluno e conferir o fluxo completo a 360px.
4. Concluir os fluxos obrigatórios de secretaria e o requisito adicional do enunciado.
5. Revisar segurança, documentação, testes completos, README e entrega no GitLab até 23/11/2026.

## Próximas ações vigentes — 22/11/2026

1. Confirmar `pnpm lint` e `pnpm exec tsc -b` até o término em `apps/web`; conferir `pnpm exec tsc --noEmit`/verificação de tipos no backend, conforme a configuração atual do projeto.
2. Testar manualmente o fluxo de secretaria: autenticação, cadastro válido, duplicidade e carga horária inválida, verificando o banco de desenvolvimento apropriado sem afetar o banco de testes.
3. Validar as telas e os fluxos de aluno e secretaria no navegador a **360px**, com estados de carregamento, erro e vazio.
4. Revisar proteção CSRF, atributos de cookie em HTTPS, persistência de sessão após reinício e isolamento dos dados nos endpoints privados.
5. Confirmar `git diff --check`, `git status --short`, commits/push e atualização das histórias no Jira antes de declarar a entrega concluída.