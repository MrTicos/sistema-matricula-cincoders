# Plano de Testes — Sistema de Matrícula CINCoders

**Versão:** 1.2 — 21/11/2026

**Status:** Em execução — 32 testes automatizados aprovados em 4 arquivos: US-01 (11), US-03 (9) e US-04 (12). Cancelamento, progresso, frontend e fluxos administrativos pendentes.

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

## 7. Organização dos testes
```text
apps/api/

  tests/

    auth.test.ts                  # Implementado: 8 testes

    auth.middleware.test.ts       # Implementado: 3 testes

    ofertas.test.ts               # Implementado: 9 testes

    matriculas.test.ts            # Implementado: 12 testes

    progresso.test.ts             # Planejado

    secretaria.test.ts            # Planejado

    helpers/

      banco-teste.ts              # Estrutura sugerida, se necessária
```

Os quatro arquivos de autenticação/autorização, ofertas e matrículas já existem; os demais nomes são sugestões para módulos futuros. Para Supertest, importar `app` de `src/app.ts` sem iniciar `server.ts`. Usar `request.agent(app)` nos cenários que precisam reutilizar cookies. A autorização da secretaria foi exercitada por rota exclusiva do ambiente de teste, não por um endpoint administrativo já entregue na API.

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

## 9. Priorização e riscos

O prazo é curto. Priorizar **P0** no fluxo do aluno: credenciais, autorização, consulta de ofertas, matrícula, cancelamento, rematrícula, lotação, concorrência, progresso e isolamento de dados. Os testes **P1** da secretaria e do requisito extra acompanham sua implementação.

Riscos que exigem atenção:

1. **Concorrência:** duas matrículas simultâneas podem violar capacidade/unicidade sem transação adequada.

2. **Privacidade:** usar o ID vindo do cliente em vez da sessão pode expor dados de outro aluno.

3. **Sessões e CSRF:** a persistência foi integrada ao SQLite, mas requer evidência após reinício; revisar CSRF e os cookies de produção antes da entrega.

4. **Banco de teste:** assegurar que Vitest, Prisma e o armazenamento de sessão não modifiquem `dev.db` nem o banco de sessões de desenvolvimento.

5. **Cobertura falsa:** os 32 testes aprovados cobrem autenticação/autorização, ofertas e realização de matrícula no backend; não implicam aprovação de cancelamento, progresso, frontend, secretaria, CSRF ou MVP completo.

## 10. Manutenção

Atualizar este documento quando novos critérios Gherkin forem acordados, quando uma regra mudar, **a cada conclusão de User Story** e antes do commit final. Registrar data, comando executado, resultado e pendências reais na seção 8. Atualizar a Sprint correspondente e o item no Jira MAT.