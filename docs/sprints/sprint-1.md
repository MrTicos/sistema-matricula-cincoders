# Sprint 1 — MVP do aluno: autenticação e fluxo principal

**Situação:** **Concluída funcionalmente e documentada** — US-01 a US-13 validadas conforme os testes e verificações compartilhados. A publicação final dos documentos no Git é etapa operacional posterior a esta revisão.
**Prazo de entrega do teste:** 23/11/2026
**Referências Jira:** MAT-6 (US-01), MAT-7 (US-02), MAT-16 (US-03), MAT-11 (US-04), MAT-8 (US-05), MAT-15 (US-06), MAT-12 (US-07), MAT-10 (US-08 — consulta de disciplinas), MAT-13 (US-09 — cadastro/edição de disciplinas) e MAT-17 (US-10 — consulta/cadastro de professores). **US-11** (consulta/abertura de turmas) e **US-12** (ajuste de capacidade) concluídas funcionalmente; conferir suas chaves específicas no Jira antes de atribuí-las no documento.
**Último checkpoint:** 23/11/2026; avaliador aceitou o convite do GitLab, conforme confirmação de Thiago.

## Complemento de segurança — T-32 (23/11/2026)

A API passou a verificar `Origin` ou `Referer` no login e nas operações autenticadas de escrita, com `FRONTEND_ORIGIN` compartilhada com CORS. Foram aprovados **10 testes novos de CSRF** e a regressão integral atingiu **143/143 testes em 12 arquivos**, além do TypeScript. O frontend mantém **95/95 testes**, totalizando **238 testes automatizados**. Ainda não há ensaio E2E da política de origem no navegador ou teste HTTPS real; commit e push permanecem etapas de publicação a confirmar.

## Checkpoint anterior de preparação para entrega — após US-13

**Escopo funcional:** US-01 a US-12 relatadas como implementadas, mais **US-13 — histórico de matrículas canceladas**, escolhida como requisito funcional adicional. O responsável confirmou **8 verificações manuais aprovadas na US-13**, elevando o histórico informado para **48 verificações manuais** (US-08 a US-13). A navegação foi padronizada com `AlunoNav` e `SecretariaNav` e o CSS administrativo recebeu ajustes para ampliar as listagens. O redesign inspirado em Classter e Aprova Total **não faz parte deste fechamento**.

**Qualidade:** suíte integral da API **133/133 em 11 arquivos** (após US-13, 28,94 s) e TypeScript aprovados, com `DATABASE_URL` restaurada para `dev.db` ao final. O frontend passou com **92/92 em 11 arquivos** (10,48 s) após os CT-06 de recuperação e depois teve **95 testes em 12 arquivos** aprovados conforme relato, incluindo três novos casos do cliente HTTP; lint e TypeScript aprovados. **Total informado: 228 testes automatizados**, executados em duas suítes separadas. A expiração de sessão foi corrigida e validada manualmente; o fechamento do GitLab ainda deve ser confirmado.

**Verificações de encerramento concluídas:**

- [x] README com instalação, migração/seed, usuários de demonstração, rotas, requisito adicional, justificativa, decisões e evoluções preparado e revisado.
- [x] Seed e migração executados num banco SQLite novo de validação.
- [x] Testes de erro/retentativa, sessão invalidada e responsividade de 360 px confirmados pelo responsável.
- [x] Suítes finais: **133/133 API** e **95/95 web**, com verificações de tipos/lint relatadas como aprovadas.
- [x] `schema.prisma` integral conferido com o documento de modelagem física.
- [x] Acesso ao GitLab aceito pelo avaliador `selecaogersist`.

**Publicação:** depois de copiar os documentos revisados para o Windows, conferir `git status`, `git diff --cached --check` e publicar commit/push. Atualizações dos tickets no Jira podem ser feitas como registro administrativo; não substituem o repositório exigido pelo edital.

### US-13 — Requisito adicional: histórico de cancelamentos

- **Necessidade:** o aluno pode consultar cancelamentos anteriores sem confundi-los com matrículas ativas; cada rematrícula continua criando um novo registro, sem apagar o cancelado.
- **Backend:** GET paginado e autorizado em `/api/aluno/matriculas/historico`, filtrado pelo aluno da sessão e pela situação `CANCELADA`. Seus 10 testes foram aprovados e incluídos no log integral **133/133**.
- **Frontend:** componente `HistoricoMatriculas.tsx` acessado na aba **Histórico de cancelamentos** em `/aluno/matriculas`; carrega apenas ao abrir a aba e trata lista vazia, carregamento, erro com nova tentativa e paginação. Os **9 testes dedicados** e os **89 testes da suíte web** passaram conforme log apresentado.
- **Manual:** 8 verificações da US-13 comunicadas como aprovadas, sem equivalerem a E2E automatizado.
- **Encerramento:** implementação, documentação e regressões validadas; cópia dos documentos para o repositório e push são as próximas operações de Git, sem trabalho funcional pendente.

### Identidade visual — registro de alterações já realizadas

- Definição inicial de cores azul-marinho/teal/cinza e melhoria de estilos compartilhados em `apps/web/src/index.css`.
- Criação de menus comuns: `SecretariaNav` com Disciplinas, Professores e Turmas; `AlunoNav` com Ofertas, Minhas matrículas e Progresso.
- Correção da navegação da secretaria que ocultava a aba de Turmas ao acessar Disciplinas; inclusão de navegação do aluno na página de Ofertas.
- Revisão da largura e da disposição dos cartões de listagem da secretaria. O responsável informou que os testes manuais passaram; um redesign aprofundado fica como melhoria futura.

---

## Checkpoint consolidado histórico — 22/11/2026 (após US-12)

**Resultado comprovado pelas execuções comunicadas após US-12:** `pnpm exec vitest run` em `apps/api` passou com **123/123 testes em 10 arquivos** (13,07 s); em `apps/web`, o log integral mais recente registra **80/80 testes em 10 arquivos** (11,63 s). **Total: 203 testes em 20 arquivos, 0 falhas.** São execuções separadas, não uma suíte ponta a ponta. O responsável informou **8 verificações manuais aprovadas para cada uma das US-08, US-09, US-10, US-11 e US-12**, totalizando **40 verificações manuais**. A US-10 foi publicada no GitLab pelo commit `8425521`; o responsável confirmou commit/push da US-11 (hash ainda a registrar). O versionamento da US-12 será o próximo passo.

| Grupo | Backend | Frontend | Situação observada |
| --- | ---: | ---: | --- |
| US-01 — Autenticação e middleware | 11 | — | API implementada e testada |
| US-02 — Login, logout e rotas | — | 11 | Interface implementada e testada |
| US-03 — Ofertas | 9 | Parte de 5 compartilhados com US-04 | API + `OfertasPage` implementadas |
| US-04 — Matrícula | 12 | Parte de 5 compartilhados com US-03 | API + ação de matrícula na página de ofertas |
| US-05 — Consulta de matrículas | 7 | 5 | API + `MatriculasPage` |
| US-06 — Cancelamento | 10 | 4 | API + fluxo de confirmação no frontend |
| US-07 — Progresso curricular | 10 | 5 | API + `ProgressoPage` |
| US-08 — Consulta de disciplinas (MAT-10) | 8 | 6 | Busca/paginação na API e interface; 8 verificações manuais aprovadas |
| US-09 — Cadastro e edição de disciplinas (MAT-13) | 17 (6 + 11) | 11 (4 + 7) | Cadastro e edição implementados; 8 verificações manuais da edição aprovadas |
| US-10 — Consulta e cadastro de professores (MAT-17) | 14 | 11 (6 consulta + 5 cadastro) | API e `ProfessoresPage` implementadas; 8 verificações manuais aprovadas |
| US-11 — Consulta e abertura de turmas | 15 (8 consulta + 7 abertura) | 14 (6 consulta + 8 abertura) | API e `TurmasPage` implementadas, com 8 verificações manuais relatadas |
| US-12 — Alteração da capacidade das turmas | 10 | 8 | `PATCH :id/vagas` e formulário de edição; 8 verificações manuais relatadas |
| **Total sem duplicar os 5 compartilhados** | **123** | **80** | **203 aprovados** |

**Limites:** o responsável informou `pnpm lint` e `pnpm exec tsc -b` aprovados no frontend e `pnpm exec tsc --noEmit` no backend. Persistência após reinício, CSRF, cookies em HTTPS, responsividade a 360px e testes de ponta a ponta automatizados permanecem exigindo evidência própria. Não considerar o conjunto de testes como encerramento automático da Sprint.

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
| Must | Consulta de disciplinas — US-08 (MAT-10) | Listagem, pesquisa, URL e paginação implementadas; 8 testes API + 6 frontend e 8 verificações manuais aprovadas |
| Must | Cadastro/edição de disciplinas — US-09 (MAT-13) | Cadastro e edição implementados; 17 testes API + 11 frontend; 8 verificações manuais da edição aprovadas |
| Must | Consulta/cadastro de professores — US-10 (MAT-17) | Listagem, pesquisa por nome/e-mail, URL, paginação e cadastro implementados; 14 testes API + 11 frontend + 8 manuais aprovados |
| Must | Consulta e abertura de turmas — US-11 | Listagem, pesquisa, vagas ocupadas/totais, abertura e seleção de disciplina/professor; 15 testes API + 14 frontend e 8 manuais aprovados |
| Must | Ajuste de capacidade de turmas — US-12 | Implementado e validado: 10 testes API + 8 frontend + 8 manuais; impede reduzir abaixo das matrículas ativas; hash/push final é assunto de publicação |
| Must | Isolamento acadêmico entre alunos | Testado nas consultas de matrículas e progresso; manter revisão dos demais endpoints privados |
| Must | Testes automatizados | 123 backend + 80 frontend = 203 aprovados em 20 arquivos, 0 falhas |
| Must | Persistência das sessões | SQLite integrado; falta evidência após reinício da API |
| Must | Segurança de cookies e requisições | `HttpOnly`, `SameSite=Lax`, regeneração de ID e limpeza no logout testados; CSRF e `Secure` em HTTPS real documentados como verificações adicionais para implantação de produção |
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

### Consulta de disciplinas — US-08 (Jira MAT-10)

- `GET /api/secretaria/disciplinas` exige sessão de `SECRETARIA`, aceita `busca`, `pagina` e `limite`, pesquisa por código/nome e retorna os registros acompanhados de metadados de paginação.
- `DisciplinasPage` mostra tabela, pesquisa refletida na URL, paginação, estado vazio, carregamento e erro com nova tentativa. A lista é atualizada depois de um cadastro.
- **8 testes API + 6 frontend aprovados.** O responsável também relatou **8 testes manuais aprovados** com a aplicação real.

### Cadastro e edição de disciplinas — US-09 (Jira MAT-13)

- `POST /api/secretaria/disciplinas` exige sessão válida e perfil `SECRETARIA`; alunos não podem cadastrar disciplinas.
- Entrada com `codigo`, `nome` e `cargaHoraria`; código normalizado em maiúsculas; carga horária inteira de 15 a 120 e múltipla de 15; código único.
- Respostas de referência: `201` criado; `400` inválido; `401` sem sessão; `403` perfil proibido; `409` duplicado.
- Formulário `DisciplinasPage` apresenta os três campos, valida entradas, bloqueia envio simultâneo e informa sucesso ou falha.
- **6 testes API + 4 testes frontend aprovados**, com logs separados.
- `PATCH /api/secretaria/disciplinas/:id` permite atualizar um ou mais campos com autorização de `SECRETARIA`. Valida identificador e campos, retorna `200` com disciplina atualizada, `400` para dados inválidos, `404` se não encontrada e `409` para código duplicado.
- `DisciplinasPage` oferece **Editar** por linha, formulário pré-preenchido, ações Salvar/Cancelar, bloqueio durante o envio, feedback de sucesso/erro e atualização da lista preservando busca e página.
- **11 testes de edição no backend + 7 no frontend aprovados**, além dos 10 de cadastro. O responsável confirmou **8 verificações manuais de edição aprovadas**.
- **Evolução posterior:** o cadastro de professores foi concluído na US-10, a consulta/abertura de turmas na US-11 e o ajuste de vagas na US-12. A listagem de disciplinas pertence à US-08 e já foi validada.

### Consulta e cadastro de professores — US-10 (Jira MAT-17)

- `GET /api/secretaria/professores`: somente `SECRETARIA`, busca por nome ou e-mail, parâmetros `busca`, `pagina` e `limite` (máximo 50), paginação e ordenação estável. Retorna `professores` e `paginacao`.
- `POST /api/secretaria/professores`: exige nome e e-mail válidos; normaliza e-mail para minúsculas, persiste no Prisma e trata e-mail duplicado (`409`) usando a restrição `@unique` do banco.
- API valida parâmetros e dados (`400`), bloqueia ausência de sessão (`401`) e perfil de aluno (`403`). `Professor` já existia no schema Prisma: **não foi necessária migração**.
- A `ProfessoresPage` exibe listagem, formulário, pesquisa sincronizada com a URL, paginação, carregamento, ausência de resultados, erro/nova tentativa, sucesso e atualização após cadastro.
- A rota React `/secretaria/professores` foi adicionada com perfil `SECRETARIA`, além da navegação entre disciplinas e professores.
- **14/14 testes de API**, **11/11 testes de frontend** e **8/8 verificações manuais** aprovados, conforme logs e confirmação do responsável.
- **Evolução:** a US-10 foi publicada no GitLab (`8425521`), a US-11 teve commit/push confirmados pelo responsável e a US-12 foi validada posteriormente.

### Consulta e abertura de turmas — US-11

- `GET /api/secretaria/turmas` exige perfil `SECRETARIA`; recebe `busca`, `pagina` e `limite` (máximo 50) e devolve `turmas` com disciplina, professor, capacidade, vagas ocupadas e disponíveis, além de `paginacao`.
- Busca pelo código/nome da disciplina ou nome do professor, com ordenação por ID e paginação no banco. **Vagas ocupadas consideram exclusivamente matrículas `ATIVA`**; matrículas `CANCELADA` não reduzem a disponibilidade.
- `POST /api/secretaria/turmas` recebe `{ "disciplinaId": number, "professorId": number, "vagasTotais": number }`. Valida inteiros positivos e referências existentes; retorna `201` no sucesso, `400` para entrada inválida, `404` para referência inexistente, `401` sem sessão e `403` para aluno.
- O Prisma já possuía `Turma`, `Disciplina` e `Professor` relacionados; não foi necessária migração nesta etapa.
- `TurmasPage` apresenta tabela, URL sincronizada, paginação, estados de carregamento/vazio/erro e nova tentativa; formulário pesquisa e seleciona disciplina/professor, exige vagas positivas, apresenta mensagens e atualiza a listagem após cadastrar.
- A página foi integrada à rota `/secretaria/turmas` e ao menu **Disciplinas · Professores · Turmas**. Um aviso de `<a>` aninhado detectado nos testes foi corrigido antes da última execução da suíte completa.
- **15 testes de API + 14 testes frontend aprovados**, além das **8 verificações manuais** informadas como corretas pelo responsável. Ainda não se trata de teste E2E automatizado.
- **Evolução posterior:** o responsável confirmou o commit/push da US-11, sem informar o hash, e concluiu a implementação da US-12. Conferir Jira e documentação final.

### Alteração da capacidade das turmas — US-12

- `PATCH /api/secretaria/turmas/:id/vagas`, protegido por perfil `SECRETARIA`, recebe `{ "vagasTotais": number }` e altera apenas a capacidade da turma.
- Identificador/capacidade inválidos retornam `400`; turma inexistente `404`; nova capacidade inferior às matrículas ativas `409` com `vagasOcupadas`; acesso sem sessão `401`; aluno autenticado `403`; atualização válida `200`.
- O service utiliza transação Prisma e `UPDATE` SQL parametrizado com verificação da contagem `ATIVA` no próprio comando de escrita; matrículas `CANCELADA` não ocupam vagas. O schema existente já continha `vagasTotais`, sem necessidade de migração.
- `TurmasPage` inclui botão **Editar vagas**, formulário pré-preenchido, validação local, cancelamento, bloqueio durante o salvamento, tratamento de erro/`409`, nova tentativa e atualização da lista preservando busca/paginação na URL.
- **10 novos testes API** (arquivo de turmas: 25/25; API completa: 123/123); **8 novos testes frontend** (página: 22/22; web completa: 80/80). Lint e TypeScript aprovados em ambas as camadas, conforme comandos comunicados.
- **8 verificações manuais** informadas como concluídas pelo responsável. O relato não substitui teste E2E automatizado.
- **Próximos passos:** atualizar documentos e criar commit/push da US-12; conferir Jira. Depois, implementar o requisito adicional e executar revisão final de segurança/responsividade.

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

### US-08 — Consulta de disciplinas pela secretaria

```gherkin
Funcionalidade: Consulta de disciplinas pela secretaria

  Cenário: Buscar disciplina por código ou nome
    Dado que a secretaria está autenticada
    Quando pesquisar uma disciplina pelo código ou parte do nome
    Então a lista apresenta os registros correspondentes
    E a pesquisa fica refletida na URL

  Cenário: Paginar resultados
    Dado que existem mais disciplinas do que o limite da página
    Quando a secretaria avançar para a próxima página
    Então a API devolve os registros daquela página sem duplicações
    E a URL registra a página atual

  Cenário: Lista vazia ou falha de rede
    Quando não houver resultados para a pesquisa
    Então a interface informa que a lista está vazia
    Quando a consulta falhar por erro de rede
    Então a interface oferece uma nova tentativa
```

### US-09 — Cadastro e edição de disciplinas pela secretaria

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

  Cenário: Editar disciplina existente
    Dado que a secretaria está autenticada
    E existe uma disciplina com código e carga horária válidos
    Quando alterar o nome e a carga horária dessa disciplina
    Então a API retorna 200 com a disciplina atualizada
    E a listagem apresenta as mudanças sem perder a busca e a página na URL

  Cenário: Editar apenas um campo
    Dado que a secretaria está autenticada
    Quando alterar somente o nome de uma disciplina
    Então o código e a carga horária permanecem inalterados

  Cenário: Impedir código duplicado na edição
    Dado que já existe outra disciplina com o código escolhido
    Quando a secretaria tentar atribuir esse código a uma disciplina
    Então a API retorna 409
    E o registro original não é alterado

  Cenário: Editar disciplina inexistente
    Dado que o identificador informado não corresponde a nenhuma disciplina
    Quando a secretaria solicitar a edição
    Então a API retorna 404

  Cenário: Cancelar edição pela interface
    Dado que a secretaria abriu um formulário de edição
    Quando cancelar a edição antes de salvar
    Então nenhuma requisição PATCH é enviada
    E os dados originais permanecem no sistema
```

### US-10 — Consulta e cadastro de professores pela secretaria

```gherkin
Funcionalidade: Consulta e cadastro de professores

  Cenário: Consultar professores pela secretaria
    Dado que a secretaria está autenticada
    Quando consultar os professores cadastrados
    Então recebe a lista ordenada e os dados de paginação

  Cenário: Buscar e paginar professores
    Dado que existem professores cadastrados
    Quando pesquisar pelo nome ou e-mail e mudar de página
    Então a lista apresenta os registros correspondentes sem duplicações
    E a URL reflete a busca e a página selecionada

  Cenário: Cadastrar professor válido
    Dado que a secretaria está autenticada
    Quando informar nome e e-mail válidos ainda não cadastrados
    Então o professor é persistido
    E a listagem é atualizada após o cadastro

  Cenário: Impedir e-mail duplicado
    Dado que existe um professor com o e-mail informado
    Quando a secretaria tentar cadastrá-lo novamente
    Então a API responde com conflito 409
    E nenhum professor duplicado é criado

  Cenário: Impedir acesso indevido
    Dado que uma pessoa não está autenticada ou possui perfil ALUNO
    Quando consultar ou cadastrar professores
    Então a API recusa a operação conforme a autenticação e o perfil
```

### US-11 — Consulta e abertura de turmas pela secretaria

```gherkin
Funcionalidade: Consulta e abertura de turmas

  Cenário: Listar turmas e contar somente matrículas ativas
    Dado que existem turmas com matrículas ativas e canceladas
    Quando a secretaria consultar as turmas
    Então recebe disciplina, professor, total e vagas disponíveis
    E somente matrículas ativas compõem o número de vagas ocupadas

  Cenário: Pesquisar e paginar turmas
    Dado que a secretaria está autenticada
    Quando pesquisar pelo código ou nome da disciplina ou pelo professor
    Então a lista é filtrada e a URL reflete a busca e a página
    E não há repetição de turmas entre páginas

  Cenário: Abrir turma válida
    Dado que existem uma disciplina e um professor cadastrados
    Quando a secretaria informar os identificadores e 30 vagas
    Então a API persiste a turma e responde com sucesso
    E a lista da secretaria é atualizada

  Cenário: Rejeitar entrada e referências inválidas
    Dado que a secretaria tenta abrir uma turma
    Quando informar vagas não positivas ou identificadores inválidos
    Então o cadastro é recusado sem criar nova turma
    Quando informar disciplina ou professor inexistentes
    Então a API responde que a referência não foi encontrada

  Cenário: Bloquear acesso de outro perfil
    Quando uma pessoa sem sessão ou um aluno consultar ou abrir turmas
    Então a API impede a operação conforme autenticação e autorização
```

### US-12 — Alteração da capacidade das turmas

```gherkin
Funcionalidade: Alterar capacidade de turma pela secretaria

  Cenário: Aumentar ou reduzir vagas respeitando as matrículas ativas
    Dado que uma turma possui 5 vagas e 2 matrículas ativas
    E também possui uma matrícula cancelada
    Quando a secretaria ajustar a capacidade para 3 vagas
    Então a alteração é persistida com sucesso
    E a turma passa a apresentar 2 vagas ocupadas e 1 disponível
    Quando a secretaria ajustar a capacidade para exatamente 2 vagas
    Então a alteração é permitida e restam 0 vagas disponíveis

  Cenário: Impedir capacidade inferior à ocupação
    Dado que uma turma possui 2 matrículas ativas
    Quando a secretaria tentar reduzir a capacidade para 1 vaga
    Então a API retorna conflito 409
    E a capacidade persistida permanece inalterada

  Cenário: Validar acesso, turma e quantidade de vagas
    Quando um aluno ou pessoa sem sessão tentar alterar a capacidade
    Então a API nega acesso de acordo com a autenticação e o perfil
    Quando a secretaria enviar um ID inválido ou quantidade inválida
    Então a API responde 400 e não modifica a turma
    Quando solicitar uma turma inexistente
    Então a API responde 404

  Cenário: Editar a capacidade na interface
    Dado que a secretaria está na listagem de turmas com busca e página na URL
    Quando clicar em Editar vagas e salvar uma capacidade válida
    Então a lista reflete os novos valores sem perder os parâmetros da URL
    E o formulário apresenta erros e permite nova tentativa quando necessário
```

## Definition of Done e acompanhamento

### US-01 — Autenticação (MAT-6)

- [x] Login, `/me`, logout, autorização por perfil e 11 testes automatizados.
- [x] Armazenamento SQLite de sessões integrado.
- [x] Cookie `HttpOnly`/`SameSite=Lax`, regeneração de ID e limpeza no logout testados.
- [x] Commit e push da implementação registrados no GitLab (commit `847ddc8`).
- **Evolução futura de segurança:** documentar continuidade da mesma sessão após reinício, `Secure` em HTTPS, proteção CSRF e expiração cronometrada; não foram apresentados como testes realizados.
- [x] Isolamento da listagem de matrículas entre alunos verificado na US-05.
- [x] Propriedade dos registros exercitada pelos testes de cancelamento, histórico de cancelamentos e progresso, além da US-05.
- **Acompanhamento externo:** conferir encerramento no Jira, sem tratá-lo como funcionalidade inacabada.

**Status atual da US-01:** implementação e critérios funcionais concluídos; as verificações adicionais de segurança para produção permanecem documentadas como evolução futura na ADR-0003.

### US-03 — Consulta de ofertas (MAT-16)

- [x] Backend e 9 testes automatizados.
- [x] Commit e push registrados no GitLab (commit `7d8c093`).
- [x] Interface React de ofertas implementada e coberta por testes de componente.
- [x] Filtros/paginação na URL e responsividade a 360px validados posteriormente pelo responsável.
- [x] Liberação da vaga após cancelamento validada na suíte de US-06 (teste de backend).

**Status em 22/11/2026:** API e componente React implementados/testados; testes manuais e critérios adicionais ainda abertos.

### US-04 — Realização de matrícula (MAT-11)

- [x] Endpoint, autorização, verificações de negócio e transação implementados.
- [x] 12 testes automatizados aprovados, incluindo rematrícula, reprovação e última vaga.
- [x] Atualização de vagas observada pelo endpoint de ofertas após matrícula.
- [x] Ação de matrícula no frontend de ofertas implementada e coberta por testes de componente.
- **Publicação histórica:** hash do commit da US-04 e situação no Jira MAT-11 não foram apresentados nesta revisão.
- **Evolução futura:** testes de carga/concorrência ampliados; o CT-10 já comprovou o cenário de disputa pela última vaga previsto na suíte.

**Status:** backend implementado e testado; confirmação do versionamento pendente neste registro.

### US-05 — Consulta de matrículas ativas (MAT-8)

- [x] Endpoint, consulta limitada à identidade da sessão e autorização por perfil `ALUNO` implementados.
- [x] Exibição apenas de matrículas ativas, com dados da turma, disciplina e professor.
- [x] Isolamento entre alunos e lista vazia verificados.
- [x] 7 testes automatizados aprovados.
- [x] Interface React de consulta de matrículas implementada e coberta por 5 testes.
- **Registro de Git/Jira:** hashes específicos da US-05 e estado MAT-8 não foram apresentados; isso não altera seus testes concluídos.

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
- **Registro de Git/Jira:** publicação específica da US-06 e atualização MAT-15 não foram verificadas nesta revisão documental.

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
- **Registro de Git/Jira:** publicação específica da US-07 e atualização MAT-12 não foram verificadas nesta revisão documental.

**Status em 22/11/2026:** backend e frontend implementados/testados; Jira e commit a verificar.

### US-02 — Interface de autenticação (MAT-7)

- [x] Login, logout e proteção de rotas no React.
- [x] 11 testes frontend aprovados (4 login, 3 logout, 4 rotas).
- [x] Layout do aluno a 360px e sessão invalidada durante navegação conferidos posteriormente pelo responsável; não equivale a E2E automatizado.
- **Registro externo:** hash específico e estado Jira da US-02 não foram apresentados nesta revisão.

**Status:** implementação e testes de componente registrados; aceite integral a confirmar.

### US-08 — Consulta de disciplinas (MAT-10)

- [x] API `GET /api/secretaria/disciplinas` protegida por perfil e com busca por código/nome.
- [x] Paginação com metadados e parâmetros de consulta validados.
- [x] Interface de listagem, pesquisa/URL, paginação, carregamento, vazio, erro e nova tentativa.
- [x] 8 testes backend e 6 frontend aprovados.
- [x] 8 verificações manuais aprovadas pelo responsável em 22/11/2026.
- [x] Commit e push da US-08 confirmados pelo responsável.
- **Jira:** estado de MAT-10 não foi confirmado nesta revisão; os critérios funcionais estão concluídos.

**Status:** funcionalidade implementada, validada e publicada no Git; rastreabilidade Jira a conferir.

### US-09 — Cadastro e edição de disciplinas (MAT-13)

- [x] Endpoint `POST /api/secretaria/disciplinas` com autenticação e autorização de secretaria.
- [x] Validação de código único, nome obrigatório e carga horária conforme o domínio.
- [x] Formulário React com código, nome, carga horária, mensagens de retorno e bloqueio durante envio.
- [x] 6 testes automatizados no backend e 4 no frontend aprovados em 22/11/2026.
- [x] Verificação manual de atualização da lista após cadastro relatada pelo responsável.
- [x] Commit `ff363db` da etapa original de cadastro realizado; a mensagem histórica usa US-08, mas a classificação correta no backlog é **US-09**. Não reescrever o histórico do Git.
- [x] Endpoint `PATCH /api/secretaria/disciplinas/:id`, com validação do ID, atualização parcial, `404` e `409`.
- [x] Interface de edição com formulário preenchido, salvar/cancelar, erros e atualização da listagem preservando URL.
- [x] 11 testes backend de edição, 7 testes frontend de edição e verificações de lint/TypeScript aprovados.
- [x] 8/8 verificações manuais da edição aprovadas em 22/11/2026, conforme relato do responsável.
- [x] Versionamento da edição da US-09 informado como concluído pelo responsável; conferir hash e publicação remota no fechamento geral.
- **Jira/Git:** estado de MAT-13 e hash da edição não foram apresentados nesta revisão; o versionamento foi informado como concluído.

**Status:** **US-09 funcionalmente concluída e validada** (cadastro + edição). Responsável informou ter realizado o commit; push remoto e Jira a conferir.

### US-10 — Consulta e cadastro de professores (MAT-17)

- [x] `GET /api/secretaria/professores` com pesquisa por nome/e-mail, ordenação e paginação.
- [x] `POST /api/secretaria/professores` com nome obrigatório, validação de e-mail, normalização e unicidade.
- [x] Bloqueio de acesso sem autenticação (`401`) e por aluno (`403`) para consulta e cadastro.
- [x] Rota `/secretaria/professores` e navegação entre as páginas da secretaria.
- [x] `ProfessoresPage` com consulta, cadastro, URL sincronizada, mensagens e estados de carregamento/erro/vazio.
- [x] 14 testes backend aprovados (arquivo `secretaria.professores.test.ts`).
- [x] 11 testes frontend aprovados (arquivo `ProfessoresPage.test.tsx`).
- [x] ESLint e TypeScript aprovados no frontend; TypeScript aprovado no backend.
- [x] 8 verificações manuais da US-10 aprovadas, conforme relato do responsável.
- [x] Commit e push da US-10 concluídos no GitLab (`8425521`), com `main` sincronizada a `origin/main` no checkpoint informado.
- **Jira:** situação de MAT-17 não foi apresentada nesta revisão; commit/push da US-10 já haviam sido confirmados.

**Status:** **US-10 implementada, validada e publicada**. Rastreabilidade no Jira ainda a conferir.

### US-11 — Consulta e abertura de turmas

- [x] `GET /api/secretaria/turmas` com busca, paginação e cálculo de vagas ocupadas/disponíveis.
- [x] Contagem de vagas filtrando somente matrículas `ATIVA` (canceladas não ocupam vagas).
- [x] `POST /api/secretaria/turmas` com validação de ID de disciplina, ID de professor e vagas positivas.
- [x] Autorização de `SECRETARIA` e respostas HTTP apropriadas (`400`, `401`, `403`, `404`, `201`).
- [x] Rota React `/secretaria/turmas`, menu administrativo e formulário de abertura com seletores pesquisáveis.
- [x] Estados visuais de carregamento, lista vazia, erro/nova tentativa, mensagens e recarga de consulta.
- [x] **15 testes backend** da US-11 e suíte API completa **113/113** aprovados.
- [x] **14 testes frontend** da US-11 e suíte web completa **72/72** aprovados, com lint/TypeScript sem erro.
- [x] Aviso React de `<a>` aninhado corrigido, sem reaparecer na execução final.
- [x] **8 verificações manuais** relatadas como aprovadas pelo responsável.
- [x] Commit e push da US-11 confirmados pelo responsável (hash ainda a registrar).
- **Jira:** conferir vinculação/estado da US-11 como acompanhamento administrativo, sem alterar a validação funcional.

**Status:** **US-11 concluída funcionalmente, validada e versionada**. Rastreabilidade no Jira ainda a conferir.

### US-12 — Alteração da capacidade das turmas

- [x] `PATCH /api/secretaria/turmas/:id/vagas` acessível somente a `SECRETARIA`.
- [x] Validação de ID/capacidade e respostas de sucesso/conflito/inexistência e autorização.
- [x] Atualização condicional dentro de transação, sem reduzir vagas abaixo das matrículas `ATIVA`.
- [x] Matrículas `CANCELADA` não contabilizadas na ocupação.
- [x] Interface de edição pré-preenchida com Salvar/Cancelar, bloqueio durante a requisição e feedback de sucesso/erro.
- [x] Atualização da listagem preservando busca e paginação.
- [x] **10 testes novos no backend; 123/123** aprovados na suíte completa em 10 arquivos.
- [x] **8 testes novos no frontend; 80/80** aprovados na suíte completa em 10 arquivos.
- [x] TypeScript nas duas aplicações e ESLint no frontend aprovados.
- [x] **8 verificações manuais** informadas como concluídas pelo responsável.
- **Git:** a preparação/publicação da US-12 faz parte do fluxo geral de commits; esta revisão não afirma possuir seu hash final.
- **Jira:** a vinculação/estado da US-12 não foi verificada independentemente.

**Status:** **US-12 funcionalmente concluída e validada**; faltam versionamento/documentação no repositório e rastreabilidade Jira. Não confundir os testes de lógica de capacidade com um ensaio de carga concorrente entre matrícula e edição.

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

**Validação no momento desse registro histórico:** 39 testes automatizados aprovados em 5 arquivos, sem falhas. O checkpoint atualizado de 22/11/2026, após US-12, registra 203 testes em 20 arquivos.

**Riscos naquele momento:** CSRF, teste após reinício, isolamento nos demais endpoints, concorrência sob maior carga, implementação de cancelamento/progresso e frontend responsivo. Cancelamento, progresso, isolamento e responsividade foram validados depois; CSRF, HTTPS, persistência após reinício e carga ampliada permanecem como evolução futura, sem evidência específica de teste.

## Próximas ações registradas em 21/11/2026 (histórico)

1. Versionar a US-05 e atualizar o Jira MAT-8; confirmar o registro do commit da US-04.
2. Implementar US-06 (cancelamento) e US-07 (progresso curricular).
3. Implementar o frontend React do aluno e conferir o fluxo completo a 360px.
4. Concluir os fluxos obrigatórios de secretaria e o requisito adicional do enunciado.
5. Revisar segurança, documentação, testes completos, README e entrega no GitLab até 23/11/2026.

## Próximas ações registradas em 22/11/2026 (histórico anterior à US-13)

1. Conferir `git status --short`, `git diff --check`, preparar o commit e publicar a **US-12 — ajuste da quantidade de vagas**; registrar o hash e conferir a rastreabilidade Jira. O commit/push da US-11 já foi informado como realizado, mas falta registrar o hash.
2. Implementar e testar o **requisito funcional adicional** exigido pelo enunciado, com critérios e evidências rastreáveis.
3. Validar as telas e os fluxos de aluno e secretaria no navegador a **360px**, com estados de carregamento, erro e vazio.
4. Revisar proteção CSRF, atributos de cookie em HTTPS, persistência de sessão após reinício e isolamento dos dados nos endpoints privados.
5. Confirmar `git diff --check`, `git status --short`, commits/push e atualização das histórias no Jira antes de declarar a entrega concluída.
