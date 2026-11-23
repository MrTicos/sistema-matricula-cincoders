# Plano de Testes — Sistema de Matrícula CINCoders

**Estado em 23/11/2026:** testes e validações funcionais informados como concluídos; **133/133 testes API**, **95/95 testes web** e **48 verificações manuais** aprovadas. Este documento mantém os checkpoints anteriores como registro histórico, não como tarefas ainda abertas.

## Checkpoint de entrega — após US-13 e ajustes de navegação

**Fonte:** logs de terminal e verificações manuais compartilhados pelo responsável. A US-13 acrescentou o histórico de matrículas canceladas e foi validada com **9 testes frontend dedicados** (`HistoricoMatriculas.test.tsx`, log 9/9), **10 testes backend** incluídos na suíte integral **133/133 em 11 arquivos** e **8 verificações manuais** informadas como aprovadas. No frontend, houve log integral de **92/92 em 11 arquivos** (após CT-06 de Ofertas, Matrículas e Progresso) e, posteriormente, **três novos testes dedicados ao cliente HTTP**, com aprovação geral informada como **95 testes em 12 arquivos**. O histórico manual informado totaliza **48 verificações** (8 para cada US-08 a US-13).

**Validação de instalação do banco:** o responsável criou o arquivo isolado `readme-validacao.db` via `DATABASE_URL=file:./readme-validacao.db` em `apps/api`, executou `pnpm exec prisma migrate deploy` (criação do SQLite e aplicação de `20261121010456_init`), `pnpm exec prisma generate` (Client 7.10.1 gerado) e `pnpm exec prisma db seed` (3 cursos, 4 alunos, 1 secretaria, 6 disciplinas, 2 professores e 7 turmas), todos com conclusão positiva nos logs compartilhados. **Esse ensaio valida o banco novo e não representa um clone/instalação integral nem garante o início dos servidores.** O banco `dev.db` não foi selecionado nesses comandos.

**Validação de inicialização local:** após remover a substituição de `DATABASE_URL`, o usuário confirmou que a configuração voltou a `file:./dev.db` e que tanto `http://localhost:3001/api/health` quanto `http://localhost:5173` funcionaram. Resultado: health check e apresentação da tela de login aprovados conforme relato. Em seguida, o responsável confirmou os testes manuais das telas do aluno em **360px**, a recuperação após falhas de rede e o redirecionamento após sessão invalidada. O teste de responsividade não foi automatizado.

**Correção de falhas temporárias de rede:** o teste offline de Ofertas mostrou `Failed to fetch` sem ação de **Tentar novamente**. Após implementar mensagem amigável, retry e CT-06, o responsável confirmou aprovação dos testes focados, lint, TypeScript **e reteste manual offline/online**. O mesmo tratamento foi incluído em Matrículas e Progresso. Os três CT-06 passaram primeiro na suíte web **92/92** (10,48 s) e, com os testes do cliente HTTP adicionados, na confirmação posterior de **95/95**. A imagem inicial com possível recorte do botão de pesquisa não demonstrou um bug reproduzível após a validação manual em 360px.

**Regressão manual de expiração da sessão (23/11/2026): falha reproduzida e corrigida.** O responsável abriu a aplicação autenticado em duas abas, encerrou a sessão em uma delas e navegou na aba antiga sem recarregá-la. Inicialmente, as áreas de Ofertas, Matrículas e Progresso exibiram `Usuário não autenticado.` e **Tentar novamente**, sem redirecionamento. O cliente HTTP passou a distinguir `401` de falhas de rede, redirecionando endpoints protegidos para `/login` e preservando os erros de autenticação do formulário. **O responsável confirmou aprovação dos testes manuais e automatizados após a correção**, inclusive dos **três novos cenários de `client.test.ts`**. Uma captura do log integral atualizado pode ser arquivada como evidência adicional.

| Evidência | Situação | Cuidados |
| --- | --- | --- |
| Backend completo após US-13 | **133/133 em 11 arquivos aprovados** (28,94 s) | `pnpm exec vitest run --no-file-parallelism` em `test.db`, 23/11/2026; TypeScript aprovado e configuração `dev.db` restaurada |
| Backend US-13 isolada | **10 cenários em `matriculas.historico.test.ts`** | Incluídos nos 133, não somar novamente |
| Frontend completo após sessão expirada | **95 testes em 12 arquivos aprovados, conforme relato** | Inclui três novos testes do cliente HTTP; último log integral apresentado em texto na conversa: 92/92 em 11 arquivos (10,48 s) |
| Frontend US-13 isolada | **9/9 aprovados** | Incluídos nos 92, não somar novamente |
| Manuais US-08 a US-13 | **48 verificações aprovadas conforme relato** | Oito por história, não somar aos testes Vitest |

### US-13 — Histórico de matrículas canceladas (requisito adicional)

**Objetivo:** comprovar que o aluno vê somente suas próprias matrículas `CANCELADA`, preservadas mesmo quando se matricula novamente, e que a interface mostra as informações com paginação sem confundir com matrículas `ATIVA`.

| Camada | Evidência e cobertura | Estado |
| --- | --- | --- |
| API — `tests/matriculas.historico.test.ts` | Dez novos cenários: autenticação, autorização de perfil, titularidade, filtro por `CANCELADA`, paginação/ordem, situações vazias e parâmetros inválidos; conferir os nomes exatos no arquivo ao revisar o repositório | **10/10 aprovados**, incluídos na suíte API completa **133/133** |
| Web — `src/pages/aluno/HistoricoMatriculas.test.tsx` | CT-01 consultar/exibir; CT-02 carregamento; CT-03 vazio; CT-04 erro; CT-05 tentar novamente; CT-06 avançar/voltar; CT-07 esconder paginação com uma página; CT-08 data ausente; CT-09 carregar somente ao selecionar a aba | **9/9 aprovados**, 2,53 s (focado); incluídos nos 89/89 |
| Manual — navegador | Oito cenários de acesso à aba, dados do histórico, navegação, erro, estados vazios, isolamento e consistência informados como verificados | **8/8 aprovadas conforme relato** |

### Regressão de navegação e visual — resultados comunicados

- [x] **Disciplinas, Professores e Turmas** permanecem visíveis nas páginas administrativas, com item ativo destacado; âncoras `<a>` aninhadas foram corrigidas.
- [x] **Ofertas, Minhas matrículas e Progresso** estão presentes na navegação do aluno; verificação em 360px informada como aprovada.
- [x] Tabelas e cartões administrativos tiveram sua largura revista para permitir a consulta adequada, conforme validação manual.
- [x] Falhas de comunicação em **Ofertas, Minhas matrículas e Progresso** exibem mensagem e permitem tentar novamente; testes automatizados e manuais aprovados.
- [x] Sessão invalidada em outra aba leva à tela de login numa requisição protegida; testes do cliente HTTP e reteste manual aprovados.

**Melhoria futura independente:** ampliar testes automatizados de navegação por teclado e acessibilidade, que não foram declarados como realizados.

### Comandos de reprodução das suítes aprovadas

```powershell
cd C:\dev\sistema-matricula-cincoders\apps\api
$env:DATABASE_URL = "file:./test.db"
pnpm exec tsc --noEmit
pnpm exec vitest run --no-file-parallelism
Remove-Item Env:DATABASE_URL

cd C:\dev\sistema-matricula-cincoders\apps\web
pnpm lint
pnpm exec tsc -b
pnpm exec vitest run
```

**Banco seguro:** conferir que `DATABASE_URL` aponta explicitamente para o SQLite de **testes** antes de rodar as suítes que criam e excluem registros. O teste abortar quando a URL não contém `test` é proteção intencional; não desativá-la. Registrar os totais reais e o commit exato da versão validada.

---

## Checkpoint histórico — 22/11/2026 (após US-12)

**Fonte da evidência:** logs de `pnpm exec vitest run` apresentados pelo responsável do projeto em `apps/api` e `apps/web`, resultados de lint/TypeScript e **40 verificações manuais** relatadas como aprovadas: 8 da consulta de disciplinas (US-08), 8 da edição de disciplinas (US-09), 8 de professores (US-10), 8 da consulta/abertura de turmas (US-11) e 8 do ajuste de capacidade (US-12). Os testes de integração HTTP, de componentes e as verificações manuais são contabilizados separadamente. A US-10 possui commit/push confirmado (`8425521`); o responsável também confirmou commit/push da US-11, sem fornecer hash.

| Camada | Arquivos aprovados | Testes aprovados | Reprovados | Tempo informado |
| --- | ---: | ---: | ---: | --- |
| Backend — Vitest + Supertest | 10 | 123 | 0 | 13,07 s |
| Frontend — Vitest / testes de componentes | 10 | 80 | 0 | 11,63 s |
| **Total (execuções separadas)** | **20** | **203** | **0** | Não somar durações como se fosse uma execução única |

### Inventário de suítes — backend

| Arquivo em `apps/api/tests` | História | Testes aprovados |
| --- | --- | ---: |
| `auth.test.ts` | US-01 | 8 |
| `auth.middleware.test.ts` | US-01 | 3 |
| `ofertas.test.ts` | US-03 | 9 |
| `matriculas.test.ts` | US-04 | 12 |
| `matriculas.consulta.test.ts` | US-05 | 7 |
| `matriculas.cancelamento.test.ts` | US-06 | 10 |
| `progresso.test.ts` | US-07 | 10 |
| `secretaria.disciplinas.test.ts` | US-08 (8 consulta) + US-09 (6 cadastro + 11 edição) | 25 |
| `secretaria.professores.test.ts` | US-10 (8 consulta + 6 cadastro/autorização/validação) | 14 |
| `secretaria.turmas.test.ts` | US-11 (15 consulta/abertura) + US-12 (10 alteração de capacidade) | 25 |
| **Total** | | **123** |

### Inventário de suítes — frontend

| Arquivo de teste em `apps/web/src` | História | Testes aprovados |
| --- | --- | ---: |
| `pages/LoginPage.test.tsx` | US-02 | 4 |
| `components/LogoutButton.test.tsx` | US-02 | 3 |
| `routes/AppRoutes.test.tsx` | US-02 | 4 |
| `pages/aluno/OfertasPage.test.tsx` | US-03 e US-04 (compartilhados) | 5 |
| `pages/aluno/MatriculasPage.test.tsx` | US-05 | 5 |
| `pages/aluno/MatriculasCancelamento.test.tsx` | US-06 | 4 |
| `pages/aluno/ProgressoPage.test.tsx` | US-07 | 5 |
| `pages/secretaria/DisciplinasPage.test.tsx` | US-08 (6 consulta) + US-09 (4 cadastro + 7 edição) | 17 |
| `pages/secretaria/ProfessoresPage.test.tsx` | US-10 (6 consulta + 5 cadastro) | 11 |
| `pages/secretaria/TurmasPage.test.tsx` | US-11 (6 consulta + 8 abertura) + US-12 (8 edição) | 22 |
| **Total** | | **80** |

Os cinco testes de ofertas/matrícula são uma única suíte: **não** somar cinco testes para US-03 e mais cinco para US-04. Os testes focados `DisciplinasPage.test.tsx` (17/17), `ProfessoresPage.test.tsx` (11/11) e `TurmasPage.test.tsx` (22/22), assim como os 25 testes focados da API de turmas, também integram as suítes completas; **não contabilizá-los duas vezes**.

### US-08 — Consulta de disciplinas (MAT-10): evidência atual

**Contrato em teste:** `GET /api/secretaria/disciplinas?busca=&pagina=&limite=`. A API restringe o acesso a `SECRETARIA`, pesquisa por código/nome, pagina resultados e informa `{ disciplinas, paginacao: { pagina, limite, total, totalPaginas } }`. A interface sincroniza a busca e a página com a URL e trata os estados de carregamento, vazio e erro.

| Fonte | Cobertura relatada | Resultado |
| --- | --- | --- |
| Backend — `secretaria.disciplinas.test.ts` | 8 cenários de consulta, acesso, pesquisa e paginação | **8/8 aprovados** |
| Frontend — `DisciplinasPage.test.tsx` | 6 cenários: renderização, busca/URL, paginação/URL, vazio, erro/nova tentativa e carregamento | **6/6 aprovados** |
| Manual — navegador, API e banco reais | 8 verificações concluídas, incluindo pesquisa, URL, lista vazia, atualização pós-cadastro e navegação | **8/8 aprovadas, conforme relato do responsável** |

**Total US-08:** 14 testes automatizados aprovados e 8 verificações manuais bem-sucedidas. Os 14 casos já integram o consolidado de 203; os testes manuais **não** aumentam a contagem de Vitest.

### US-09 — Cadastro e edição de disciplinas (MAT-13): evidência atual

**Contrato em teste:** `POST /api/secretaria/disciplinas`, acessível apenas ao perfil `SECRETARIA`; entrada `{ "codigo": string, "nome": string, "cargaHoraria": number }`. Código obrigatório e único, normalizado em maiúsculas; nome obrigatório; carga horária inteira de 15 a 120 e múltipla de 15. O frontend apresenta os mesmos campos e feedback de validação/erro.

| Fonte | Cenário explicitamente visível no log | Resultado |
| --- | --- | --- |
| Backend — `secretaria.disciplinas.test.ts` | CT-02: aluno não pode cadastrar | Aprovado |
| Backend — mesmo arquivo | CT-03: cadastro válido | Aprovado |
| Backend — mesmo arquivo | CT-04: código duplicado | Aprovado |
| Backend — suíte completa | 6 casos no arquivo; os demais nomes não aparecem no trecho resumido do log | **6/6 aprovados** |
| Frontend — `DisciplinasPage.test.tsx` | CT-01: campos obrigatórios | Aprovado |
| Frontend — mesmo arquivo | CT-02: cadastrar disciplina válida | Aprovado |
| Frontend — mesmo arquivo | CT-03: mostrar erro de código duplicado | Aprovado |
| Frontend — mesmo arquivo | CT-04: impedir cadastro com carga horária inválida | Aprovado |

**Total do cadastro da US-09:** 6 testes de backend + 4 testes de frontend = **10 testes aprovados**, já incluídos nos 203 totais. O código de teste fornecido inclui os casos CT-01 a CT-06 do cadastro.

**Contrato de edição:** `PATCH /api/secretaria/disciplinas/:id`, apenas para `SECRETARIA`; o corpo pode conter um ou mais entre `codigo`, `nome` e `cargaHoraria`. O controller valida ID, campos enviados e CH; o service normaliza texto e trata unicidade (`409`) e inexistência (`404`). O formulário React permite salvar/cancelar, mantém as condições de busca/paginação e recarrega a listagem.

| Fonte | Cobertura nova de edição | Resultado |
| --- | --- | --- |
| Backend — `secretaria.disciplinas.test.ts` | 11 testes: atualização integral e parcial, 401/403, ID inválido, 404, duplicidade, CH inválida, corpo vazio, código/nome inválidos e manutenção do próprio código | **11/11 aprovados**, conforme confirmação do responsável |
| Frontend — `DisciplinasPage.test.tsx` | 7 testes: pré-preenchimento, cancelar sem PATCH, salvar/recarregar/preservar URL, duplicidade, CH inválida, bloqueio de novo envio e nova tentativa após erro | **7/7 aprovados**, no log apresentado |
| Manual — navegador/API/banco reais | 8 verificações de edição, incluindo cancelamento, persistência, conflito de código, CH inválida e preservação de busca/URL | **8/8 aprovadas**, conforme relato do responsável |

**Total US-09:** 17 testes de backend (6 cadastro + 11 edição) e 11 de frontend (4 cadastro + 7 edição) = **28 testes automatizados aprovados**, além de **8 verificações manuais específicas da edição**. Os 28 casos já estão incluídos no total de 203. **US-09 funcionalmente concluída**; o responsável informou ter feito o commit, mas ainda é necessário conferir push e Jira MAT-13.

### US-10 — Consulta e cadastro de professores (MAT-17): evidência atual

**Contrato em teste:** `GET` e `POST /api/secretaria/professores`, ambos exclusivos do perfil `SECRETARIA` e protegidos por sessão. O `GET` aceita `busca` (nome/e-mail), `pagina` e `limite` e devolve `professores` e os metadados `paginacao`. O `POST` recebe `{ "nome": string, "email": string }`, exige campos válidos e persiste o e-mail normalizado; a unicidade é garantida pelo banco (`@unique`, erro `P2002` convertido em `409`).

| Fonte | Casos cobertos | Resultado |
| --- | --- | --- |
| Backend — `secretaria.professores.test.ts` | 14 cenários: autorização, listagem, busca por nome/e-mail, paginação, parâmetros inválidos, vazio, criação válida, unicidade e validação dos campos | **14/14 aprovados** (1,97 s na execução focada) |
| Frontend — `ProfessoresPage.test.tsx` | 5 cenários de cadastro + 6 de consulta; formulário, duplicidade, e-mail inválido, envio bloqueado, pesquisa/URL, paginação, estados de vazio, erro/nova tentativa e carregamento | **11/11 aprovados** (5,47 s na execução focada) |
| Manual — secretaria no navegador | Navegação, listagem, busca por nome/e-mail, cadastro válido, duplicidade, validação do formulário e paginação/URL | **8/8 aprovadas**, conforme relato do responsável |

**Total US-10:** **25 testes automatizados aprovados** (14 backend + 11 frontend), já incluídos nos **203 testes consolidados**, e **8 verificações manuais aprovadas**, que não integram a contagem do Vitest. Após integrar `/secretaria/professores` e a navegação entre disciplinas e professores, o responsável repetiu lint, TypeScript e suíte frontend completa, com resultado positivo.

**Situação:** US-10 funcionalmente validada e **publicada no GitLab** (`8425521`); atualização do Jira MAT-17 a conferir. As US-11 e US-12 foram validadas posteriormente.

### US-11 — Consulta e abertura de turmas: evidência atual

**Contrato em teste:** `GET` e `POST /api/secretaria/turmas`, exclusivos de `SECRETARIA` (sem sessão `401`, aluno `403`). O GET recebe `busca` (código/nome da disciplina ou nome do professor), `pagina` e `limite`, retornando `turmas` e `paginacao`. Cada turma inclui disciplina, professor, vagas totais, vagas ocupadas e disponíveis. A contagem de ocupação **filtra matrículas `ATIVA`**; canceladas não ocupam vagas. O POST recebe `{ "disciplinaId": number, "professorId": number, "vagasTotais": number }`, valida referências e inteiros positivos, e cria a turma (`201`). IDs/vagas inválidos retornam `400`, referências inexistentes retornam `404`.

| Fonte | Cobertura | Resultado |
| --- | --- | --- |
| Backend — `secretaria.turmas.test.ts` | 8 cenários GET: autenticação, autorização, listagem com ocupação ativa, busca por disciplina/professor, paginação, parâmetros inválidos e lista vazia; 7 cenários POST: abertura persistida, dados inválidos, referências inexistentes e autorização | **15/15 aprovados** (2,98 s focados; conjunto API 113/113 em 8,28 s) |
| Frontend — `TurmasPage.test.tsx` | 6 cenários de consulta: tabela/capacidade, busca/URL, paginação, vazio, erro/nova tentativa e carregamento; 8 cenários de abertura: campos, envio/recarga/URL, validação de vagas e seletores, erro, bloqueio de reenvio, busca e recuperação de opções | **14/14 aprovados** (3,90 s focados após correção; conjunto web 72/72 em 9,10 s) |
| Manual — navegador, API e banco real | 8 verificações propostas: acesso e listagem, busca, paginação quando aplicável, abertura, validações, ausência de resultados e persistência após recarregar | **8/8 relatadas como aprovadas pelo responsável** |

**Total US-11:** **29 testes automatizados** (15 backend + 14 frontend) incluídos nos **203 do projeto**; **8 verificações manuais**, somadas às 24 anteriores para **32 verificações relatadas naquele checkpoint**. O teste inicial do React emitiu aviso de `<a>` aninhado; o responsável corrigiu a navegação e repetiu as execuções focadas e a suíte frontend completa sem esse aviso. Testes manuais e de componentes não substituem E2E automatizado; a paginação manual entre páginas requer registros suficientes.

**Situação:** **US-11 funcionalmente concluída e validada**, com commit/push confirmado posteriormente pelo responsável, hash e Jira ainda a conferir. A US-12 foi implementada depois, conforme seção seguinte.

### US-12 — Alteração da capacidade de turmas: evidência atual

**Contrato em teste:** `PATCH /api/secretaria/turmas/:id/vagas`, exclusivo de `SECRETARIA` (sem sessão `401`, perfil `ALUNO` `403`). Corpo `{ "vagasTotais": number }`, inteiro positivo dentro do limite `Int`; `id` também deve ser inteiro positivo. Retorna `200` com `turma` e vagas atualizadas; `400` para entrada inválida, `404` para turma inexistente e `409` com `vagasOcupadas` quando a capacidade desejada é inferior às matrículas `ATIVA`. Matrículas `CANCELADA` não impedem redução; a recusa deve preservar o valor anterior. O service realiza `UPDATE` condicional numa transação, com ocupação verificada no mesmo comando de escrita.

| Fonte | Casos cobertos | Resultado |
| --- | --- | --- |
| Backend — `secretaria.turmas.test.ts` | 10 testes: negação de acesso sem sessão/aluno, aumentar capacidade, reduzir acima/até a ocupação, bloquear redução inferior com banco inalterado, recusar vagas e IDs inválidos, turma inexistente e GET após atualização | **10/10 aprovados**; arquivo de turmas **25/25** (4,86 s); API completa **123/123** em 10 arquivos (13,07 s) |
| Frontend — `TurmasPage.test.tsx` | 8 testes: abrir formulário com dados atuais, cancelar sem PATCH, salvar e recarregar sem perder URL, impedir valor inferior à ocupação, mostrar `409` preservando edição, bloquear reenvio/cancelamento enquanto salva, recuperar de erro e selecionar turma correta | **8/8 aprovados**; página de turmas **22/22** (7,55 s); web completa **80/80** em 10 arquivos (11,63 s) |
| Manual — secretaria no navegador | 8 verificações propostas: acessar a edição, pré-preenchimento, cancelar, aumentar, reduzir com folga, reduzir até a ocupação, bloquear capacidade inferior e preservar URL/recarga | **8 verificações informadas como concluídas pelo responsável** |

**Total US-12:** **18 testes automatizados novos** (10 backend + 8 frontend), incluídos nos **203 do projeto**, e **8 verificações manuais informadas como concluídas**, somadas às 32 anteriores para **40**. Os resultados de lint e TypeScript foram aprovados nas duas aplicações. A aprovação manual é relatada pelo responsável, não equivale a gravação de navegador nem a automação E2E.

**Situação naquele checkpoint (22/11):** US-12 funcionalmente concluída e validada; o requisito adicional **ainda não estava entregue naquela data**. A US-13 foi concluída depois e aparece no consolidado final do início deste documento.

**O que esses resultados não provam isoladamente:** proteção CSRF, cookie `Secure` em HTTPS, persistência da sessão após reinício, acessibilidade, responsividade a 360px, testes de carga ou uma disputa concorrente ampliada entre matrícula e ajuste de capacidade. Ainda não há uma suíte E2E automatizada reproduzível para os fluxos da secretaria.

### Comandos para reproduzir o checkpoint

```powershell
cd C:\dev\sistema-matricula-cincoders\apps\api
pnpm exec tsc --noEmit
pnpm exec vitest run tests/secretaria.professores.test.ts
pnpm exec vitest run tests/secretaria.turmas.test.ts
pnpm exec vitest run

cd C:\dev\sistema-matricula-cincoders\apps\web
pnpm exec vitest run src/pages/secretaria/DisciplinasPage.test.tsx
pnpm exec vitest run src/pages/secretaria/ProfessoresPage.test.tsx
pnpm exec vitest run src/pages/secretaria/TurmasPage.test.tsx
pnpm exec vitest run
pnpm lint
pnpm exec tsc -b
```

**Importante:** o responsável também confirmou `pnpm lint`, `pnpm exec tsc -b` no frontend e `pnpm exec tsc --noEmit` no backend como aprovados. Os arquivos de banco e variáveis de ambiente devem permanecer segregados entre desenvolvimento e testes.

---

## Registro histórico: checkpoints de 21/11/2026

O material abaixo mantém critérios, Gherkin e evidências de marcos anteriores. Contagens de 11, 20, 32, 39, 49, 59 ou 70 testes são **marcos históricos**, não o total atual. Frases sobre módulos "planejados" ou "frontend pendente" descrevem aquele momento; o estado de 22/11 está consolidado acima.

> **Checkpoint histórico — 21/11/2026:** 59 testes de backend (7 arquivos) e 11 de frontend (3 arquivos), 70 testes aprovados, sem falhas, em execuções separadas. As seções históricas abaixo preservam os resultados anteriores.

## US-02 — Interface de autenticação (MAT-7)

**Estado:** implementada e testada no frontend React + TypeScript.

| Caso | Cenário | Resultado |
| --- | --- | --- |
| CT-01 | Exibir campos de usuário e senha | Aprovado |
| CT-02 | Enviar credenciais do formulário | Aprovado |
| CT-03 | Exibir erro de login | Aprovado |
| CT-04 | Impedir novo envio enquanto autentica | Aprovado |
| CT-05 | Exibir botão de logout | Aprovado |
| CT-06 | Efetuar logout e redirecionar | Aprovado |
| CT-07 | Exibir erro quando logout falhar | Aprovado |
| CT-08 | Redirecionar visitante à tela de login | Aprovado |
| CT-09 | Impedir acesso do aluno à secretaria | Aprovado |
| CT-10 | Impedir acesso da secretaria à área do aluno | Aprovado |
| CT-11 | Permitir acesso autorizado do aluno | Aprovado |

**Comandos (em `apps/web`):** `pnpm exec vitest run`, `pnpm lint` e `pnpm exec tsc -b`. Resultado: 3 arquivos, **11 testes aprovados**, ESLint e TypeScript sem erros. Login e logout também foram verificados manualmente com a API real.

**Limites:** os testes de componente usam um hook de autenticação simulado; não constituem um teste ponta a ponta da API. Permanecem pendentes a verificação visual em 360px e a revisão de CSRF e HTTPS/cookies.

## Histórico e plano original (checkpoints anteriores)

**Versão histórica:** 1.2 — 21/11/2026

**Status naquele checkpoint:** 32 testes automatizados aprovados em 4 arquivos: US-01 (11), US-03 (9) e US-04 (12). O estado atual consolidado está no início deste documento.

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

**Saída/Definition of Done funcional — consolidado em 23/11/2026:**

- [x] Critérios de aceitação Gherkin relevantes exercitados nas suítes e validações manuais informadas.

- [x] Casos felizes e principais falhas/limites cobertos.

- [x] Nenhum teste crítico falha nas execuções compartilhadas (133 API e 95 web).

- [x] Rotas testadas não expõem `senhaHash` ou dados acadêmicos de outro aluno.

- [x] Documentação e evidências consolidadas com a modelagem física conferida.

**Publicação e gestão:** commit/push da versão final e atualização Jira são verificações operacionais independentes, a conferir após copiar os documentos. Não são testes funcionais em aberto.

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
| T-33 | US-09, acesso | Requisição não autenticada não cadastra disciplina; aluno autenticado é bloqueado | Integração | P0 |
| T-34 | US-09, cadastro | Secretaria cria disciplina com código, nome e CH válidos | Integração | P1 |
| T-35 | US-09, unicidade | Código já existente, inclusive após normalização, não produz novo cadastro | Integração | P1 |
| T-36 | US-09, validação | Código/nome obrigatórios, CH inteira de 15–120 e múltipla de 15 | Integração/UI | P1 |
| T-37 | US-09, formulário | Campos, envio válido, erro de duplicidade e bloqueio de CH inválida | Componente | P1 |
| T-38 | US-09, integração | Cadastro pela interface real atualiza o banco via API com sessão da secretaria | Ponta a ponta/manual | P1 |
| T-39 | US-08, consulta | Secretaria consulta disciplinas com autorização, busca por código e nome e paginação | Integração | P1 |
| T-40 | US-08, interface | A listagem apresenta resultados, vazio, carregamento, erro e nova tentativa | Componente/manual | P1 |
| T-41 | US-08, navegação | Busca e página são sincronizadas com a URL, e o cadastro atualiza a lista | Componente/manual | P1 |
| T-42 | US-09, edição | Alterar dados válidos de disciplina, validar unicidade, carga horária e autorização | Integração/UI | P1 — aprovado |
| T-43 | US-09, interface de edição | Pré-preenchimento, salvar/cancelar, recarga da lista e preservação de busca/página na URL | Componente/manual | P1 — aprovado |
| T-44 | US-09, fluxo real | Edição persistida após recarregar, erro de código duplicado e de CH inválida, sem modificar registros indevidos | Manual | P1 — 8/8 verificações aprovadas |
| T-45 | US-10, acesso a professores | Consulta/cadastro sem sessão → `401`; por aluno → `403` | Integração | P1 — aprovado |
| T-46 | US-10, consulta de professores | Listar, buscar por nome/e-mail e paginar sem repetir resultados; validar parâmetros | Integração | P1 — aprovado |
| T-47 | US-10, cadastro de professores | Criar e persistir professor válido, normalizar e-mail e rejeitar duplicado (`409`) | Integração | P1 — aprovado |
| T-48 | US-10, validação | Recusar nome ausente/inválido e e-mail inválido | Integração/UI | P1 — aprovado |
| T-49 | US-10, página React | Busca e paginação na URL, estados de carregamento/vazio/erro e tentativa novamente | Componente/manual | P1 — aprovado |
| T-50 | US-10, fluxo manual | Navegar, pesquisar, cadastrar, observar duplicidade e consultar paginação/URL | Manual | P1 — 8/8 verificações aprovadas |
| T-51 | US-11, autorização | Sem autenticação → `401`; aluno autenticado → `403` para consulta e abertura de turmas | Integração | P1 — aprovado |
| T-52 | US-11, consulta | Listar turmas com disciplina, professor e vagas totais, ocupadas e disponíveis; contar somente matrículas `ATIVA` | Integração/UI | P1 — aprovado |
| T-53 | US-11, busca e paginação | Buscar por código de disciplina ou nome de professor; paginação estável, sem repetições, com validação de parâmetros | Integração/componente | P1 — aprovado |
| T-54 | US-11, abertura | Secretaria cria turma válida, vinculada a disciplina/professor existentes, e persiste as vagas | Integração/UI | P1 — aprovado |
| T-55 | US-11, validações | Recusar vagas inválidas, IDs inválidos e disciplina ou professor inexistente sem criar turma | Integração/UI | P1 — aprovado |
| T-56 | US-11, página React | Carregamento, lista vazia, erro e nova tentativa; busca/página refletidas na URL; abertura atualiza a listagem | Componente | P1 — aprovado |
| T-57 | US-11, fluxo manual | Consultar, filtrar, paginar, abrir turma, validar erros e conferir vagas/atualização com API real | Manual | P1 — 8 verificações relatadas como aprovadas |
| T-58 | US-12, acesso | Sem sessão → `401`; aluno → `403` ao alterar capacidade | Integração | P1 — aprovado |
| T-59 | US-12, alteração válida | Aumentar vagas, reduzir acima da ocupação ou igual à ocupação; persistir e recalcular disponíveis | Integração/UI | P1 — aprovado |
| T-60 | US-12, ocupação e conflito | Contar somente `ATIVA`; tentativa abaixo da ocupação → `409` sem atualizar o banco | Integração | P0 — aprovado |
| T-61 | US-12, validação | Rejeitar ID/vagas inválidos (`400`) e turma inexistente (`404`) | Integração | P1 — aprovado |
| T-62 | US-12, consistência de leitura | Nova capacidade aparece no GET subsequente com contagem correta de vagas | Integração | P1 — aprovado |
| T-63 | US-12, página React | Formulário correto, cancelar sem PATCH, bloquear envio inválido/repetido, tratar `409`, permitir recuperação e preservar URL | Componente | P1 — aprovado |
| T-64 | US-12, fluxo manual | Acessar edição, pré-preenchimento, cancelar, aumentar, reduzir, bloquear redução indevida e conservar busca/página | Manual | P1 — 8 verificações informadas como concluídas |

**Rastreabilidade atual:** US-08 (consulta, MAT-10) tem 8 testes API, 6 frontend e 8 manuais; US-09 (cadastro/edição, MAT-13) tem 17 API, 11 frontend e 8 manuais da edição; US-10 (professores, MAT-17) tem 14 API, 11 frontend e 8 manuais; US-11 (turmas) tem 15 API, 14 frontend e 8 manuais; US-12 (edição de vagas) tem 10 API, 8 frontend e 8 manuais informados. **Total do projeto: 203 testes automatizados + 40 verificações manuais**, sem duplicar execuções focadas. O T-38 teve verificação manual de atualização da lista após cadastro; não existe ainda uma suíte E2E automatizada para ele. A matriz expressa *o que testar*, sem declarar aprovados cenários não exercitados.

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

```gherkin
Funcionalidade: Consulta e cadastro de professores pela secretaria

  Cenário: Pesquisar professores com paginação
    Dado que a secretaria está autenticada e existem professores cadastrados
    Quando pesquisar por nome ou e-mail e navegar entre páginas
    Então a listagem apresenta os resultados esperados sem repetições
    E a busca e a página são refletidas na URL

  Cenário: Cadastrar professor sem duplicar e-mail
    Dado que a secretaria está autenticada
    Quando cadastrar um professor com nome e e-mail válidos e inéditos
    Então a API persiste o professor e retorna sucesso
    E a listagem é atualizada
    Quando repetir o cadastro com o mesmo e-mail
    Então a API rejeita a duplicidade
    E a interface informa o erro sem criar outro professor

  Cenário: Proteger endpoints de professores
    Dado que o acesso ocorre sem sessão ou por um aluno autenticado
    Quando consultar ou cadastrar professores
    Então o sistema bloqueia a operação conforme o perfil
```

```gherkin
Funcionalidade: Consulta e abertura de turmas pela secretaria

  Cenário: Consultar turmas e calcular vagas disponíveis
    Dado que a secretaria está autenticada e existem turmas cadastradas
    Quando consultar as turmas com filtro de disciplina ou professor e paginação
    Então o sistema retorna a turma, sua disciplina e seu professor
    E calcula as vagas ocupadas considerando somente matrículas ativas
    E mantém a busca e a página na URL da interface

  Cenário: Abrir turma com vínculos válidos
    Dado que existem uma disciplina e um professor cadastrados
    E que a secretaria está autenticada
    Quando informar os identificadores válidos e uma capacidade inteira positiva
    Então o sistema persiste a turma
    E a página atualiza a listagem sem perder a busca e a página

  Cenário: Impedir abertura de turma inválida
    Dado que a secretaria está autenticada
    Quando enviar uma capacidade inválida ou um identificador inexistente
    Então a API rejeita a operação
    E nenhuma turma indevida é cadastrada

  Cenário: Proteger consulta e abertura de turmas
    Dado que o acesso não possui sessão ou pertence a um aluno
    Quando consultar ou cadastrar turmas
    Então o sistema bloqueia o acesso de acordo com o perfil
```

```gherkin
Funcionalidade: Ajuste de capacidade de turmas pela secretaria

  Cenário: Atualizar capacidade sem ultrapassar a ocupação
    Dado que a turma tem 5 vagas, 2 matrículas ativas e 1 cancelada
    Quando a secretaria alterar a capacidade para 3 vagas
    Então a API persiste 3 vagas totais e 1 disponível
    Quando alterar a capacidade para 2 vagas
    Então a API permite o limite exato e retorna 0 vagas disponíveis

  Cenário: Impedir redução que exclua vagas ocupadas
    Dado que a turma possui 2 matrículas ativas
    Quando a secretaria solicitar apenas 1 vaga
    Então a API retorna 409 com a ocupação atual
    E a capacidade persistida não se altera

  Cenário: Impedir acesso e entradas inválidas
    Quando alguém sem sessão ou com perfil ALUNO tentar ajustar a capacidade
    Então a API nega a operação
    Quando a secretaria informar ID ou quantidade inválida
    Então a API retorna 400
    E retorna 404 para uma turma inexistente

  Cenário: Editar pela página de turmas
    Quando a secretaria abrir o formulário de uma turma
    Então a capacidade atual e a ocupação aparecem preenchidas
    Quando salvar uma capacidade válida
    Então a listagem é atualizada preservando a URL
    E uma falha mantém o formulário para nova tentativa
```

## 7. Organização dos testes

### Estrutura efetiva do checkpoint de 22/11/2026

```text
apps/api/tests/
  auth.test.ts                         # 8 testes
  auth.middleware.test.ts              # 3 testes
  ofertas.test.ts                      # 9 testes
  matriculas.test.ts                   # 12 testes
  matriculas.consulta.test.ts          # 7 testes
  matriculas.cancelamento.test.ts      # 10 testes
  progresso.test.ts                    # 10 testes
  secretaria.disciplinas.test.ts       # 25 testes (US-08 e US-09)
  secretaria.professores.test.ts       # 14 testes (US-10)
  secretaria.turmas.test.ts            # 25 testes (15 US-11 + 10 US-12)

apps/web/src/
  pages/LoginPage.test.tsx             # 4 testes
  components/LogoutButton.test.tsx     # 3 testes
  routes/AppRoutes.test.tsx            # 4 testes
  pages/aluno/OfertasPage.test.tsx     # 5 testes
  pages/aluno/MatriculasPage.test.tsx  # 5 testes
  pages/aluno/MatriculasCancelamento.test.tsx # 4 testes
  pages/aluno/ProgressoPage.test.tsx   # 5 testes
  pages/secretaria/DisciplinasPage.test.tsx # 17 testes (US-08 e US-09)
  pages/secretaria/ProfessoresPage.test.tsx # 11 testes (US-10)
  pages/secretaria/TurmasPage.test.tsx      # 22 testes (14 US-11 + 8 US-12)
```

### Proposta inicial preservada (21/11/2026)

```text

apps/api/

  tests/

    auth.test.ts                  # Implementado: 8 testes

    auth.middleware.test.ts       # Implementado: 3 testes

    ofertas.test.ts               # Implementado: 9 testes

    matriculas.test.ts            # Implementado: 12 testes

    progresso.test.ts             # Planejado

    secretaria.test.ts            # Planejado

    helpers/

      banco-teste.ts              # Estrutura sugerida, se necessária

```

**Contexto histórico:** naquele momento só os quatro arquivos de autenticação/autorização, ofertas e matrículas estavam concluídos; os demais nomes eram sugestões. Em 22/11/2026, `progresso.test.ts` e `secretaria.disciplinas.test.ts` já aparecem nas suítes reais, juntamente com os testes de consulta e cancelamento. Para Supertest, importar `app` de `src/app.ts` sem iniciar `server.ts`. Usar `request.agent(app)` nos cenários que precisam reutilizar cookies. A autorização da secretaria foi inicialmente exercitada por rota exclusiva de teste; posteriormente o cadastro (US-09) e a consulta (US-08) implementaram rotas administrativas reais.

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

### Registro atual — 22/11/2026 (US-12 alteração de capacidade de turmas)

| Data | Verificação | Evidência observada | Resultado |
| --- | --- | --- | --- |
| 22/11/2026 | `apps/api`: `pnpm exec tsc --noEmit` | Comando executado sem erros, conforme log enviado pelo responsável | **Passou** |
| 22/11/2026 | `apps/api`: `pnpm exec vitest run tests/secretaria.turmas.test.ts` | 1 arquivo, 25 testes (15 US-11 + 10 US-12), 0 falhas, 4,86 s | **25/25 passaram** |
| 22/11/2026 | `apps/api`: `pnpm exec vitest run` | 10 arquivos, 123 testes, 0 falhas, 13,07 s | **123/123 passaram** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run src/pages/secretaria/TurmasPage.test.tsx` | 1 arquivo, 22 testes (14 US-11 + 8 US-12), 0 falhas, 7,55 s | **22/22 passaram** |
| 22/11/2026 | `apps/web`: `pnpm lint` e `pnpm exec tsc -b` | ESLint e TypeScript executados sem erro, conforme log enviado | **Passou** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run` | 10 arquivos, 80 testes, 0 falhas, 11,63 s | **80/80 passaram** |
| 22/11/2026 | US-12: validação manual | O responsável informou ter concluído as verificações do roteiro de edição de capacidade | **8 verificações relatadas como concluídas** |

**Consolidado atual:** 123 + 80 = **203 testes automatizados aprovados em 20 arquivos**, 0 falhas; **40 verificações manuais relatadas** (8 cada em US-08, US-09, US-10, US-11 e US-12). Os testes focados integram as suítes completas e não aumentam a contagem total. O banco de testes foi configurado explicitamente após um bloqueio de segurança por `DATABASE_URL` não apontar inicialmente para `test.db`; o responsável corrigiu o ambiente e reexecutou as suítes com sucesso. Não se removeu a proteção de banco de testes. A US-12 aguarda commit/push e registro da chave Jira.

### Registro anterior — 22/11/2026 (US-11 consulta e abertura de turmas, preservado)

| Data | Verificação | Evidência observada | Resultado |
| --- | --- | --- | --- |
| 22/11/2026 | `apps/api`: `pnpm exec vitest run tests/secretaria.turmas.test.ts` | 1 arquivo, 15 testes, 0 falhas, 2,98 s | **15/15 passaram** |
| 22/11/2026 | `apps/api`: `pnpm exec vitest run` | 10 arquivos, 113 testes, 0 falhas, 8,28 s | **113/113 passaram** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run src/pages/secretaria/TurmasPage.test.tsx` | 1 arquivo, 14 testes, 0 falhas, 3,90 s após correção de navegação | **14/14 passaram** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run src/pages/secretaria/ProfessoresPage.test.tsx` | 1 arquivo, 11 testes, 0 falhas, 4,94 s após correção de navegação | **11/11 passaram** |
| 22/11/2026 | `apps/web`: `pnpm lint` e `pnpm exec tsc -b` | Execução completa sem erros, conforme log do responsável | **Passou** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run` | 10 arquivos, 72 testes, 0 falhas, 9,10 s; sem os avisos de `<a>` aninhado das execuções anteriores | **72/72 passaram** |
| 22/11/2026 | US-11: verificações manuais | O responsável confirmou que os fluxos manuais de consulta e abertura funcionaram | **8 verificações relatadas como aprovadas** |

**Consolidado naquele checkpoint:** 113 + 72 = **185 testes automatizados em 20 arquivos, sem falhas**; **32 verificações manuais relatadas como aprovadas** (8 cada em US-08, US-09, US-10 e US-11). Os testes focados integram as suítes completas e não são somados novamente. A aprovação manual é evidência relatada pelo responsável, não uma suíte E2E automatizada. O backend também foi verificado com `pnpm exec tsc --noEmit` durante a implementação da US-11. O commit/push da US-11 ainda estava pendente neste checkpoint; foi confirmado posteriormente pelo responsável.

**Observação sobre o aviso de navegação:** uma execução inicial de frontend mostrou `<a>` dentro de `<a>` em TurmasPage e ProfessoresPage, embora todos os testes passassem. Depois da correção, ambas as suítes focadas e a suíte completa passaram sem o aviso; os resultados finais acima correspondem à versão corrigida.

### Registro anterior — 22/11/2026 (US-10 professores, preservado)

| Data | Verificação | Evidência observada | Resultado |
| --- | --- | --- | --- |
| 22/11/2026 | `apps/api`: `pnpm exec tsc --noEmit` | Compilação de tipos sem erros, conforme log do responsável | **Passou** |
| 22/11/2026 | `apps/api`: `pnpm exec vitest run tests/secretaria.professores.test.ts` | 1 arquivo, 14 testes, 0 falhas, 1,97 s | **14/14 passaram** |
| 22/11/2026 | `apps/api`: `pnpm exec vitest run` | 9 arquivos, 98 testes, 0 falhas, 6,67 s | **98/98 passaram** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run src/pages/secretaria/ProfessoresPage.test.tsx` | 1 arquivo, 11 testes, 0 falhas, 5,47 s | **11/11 passaram** |
| 22/11/2026 | `apps/web`: `pnpm lint` e `pnpm exec tsc -b` | Ambos aprovados após integração de rota e menu da secretaria | **Passou** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run` | 9 arquivos, 58 testes, 0 falhas, 10,32 s na última execução | **58/58 passaram** |
| 22/11/2026 | US-10: 8 verificações manuais | Lista, busca, cadastro, validações e navegação com API real, todas relatadas como corretas | **8/8 passaram — manual** |

**Consolidado naquele checkpoint:** 98 + 58 = **156 testes automatizados aprovados**, 18 arquivos, 0 falhas; **24 verificações manuais aprovadas** (8 da US-08, 8 da US-09, 8 da US-10). Testes focados estão contidos nas suítes completas, e as verificações manuais não são contadas como testes Vitest. **Esse total é histórico; o atual está na tabela acima.**

### Registro anterior — 22/11/2026 (US-09 edição, preservado)

| Data | Verificação | Evidência observada | Resultado |
| --- | --- | --- | --- |
| 22/11/2026 | `apps/api`: `pnpm exec vitest run` | 8 arquivos, 84 testes, 0 falhas; tempo não informado | **Passou — confirmado pelo responsável** |
| 22/11/2026 | `apps/api`: `pnpm exec tsc --noEmit` | Verificação de tipos confirmada pelo responsável | **Passou** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run src/pages/secretaria/DisciplinasPage.test.tsx` | 1 arquivo, 17 testes (6 consulta + 4 cadastro + 7 edição), 0 falhas, duração 6,19 s | **Passou** |
| 22/11/2026 | `apps/web`: `pnpm exec vitest run` | 8 arquivos, 47 testes, 0 falhas, duração 7,00 s | **Passou** |
| 22/11/2026 | `apps/web`: `pnpm lint` e `pnpm exec tsc -b` | Comandos executados sem erro, conforme relato do responsável | **Passou** |
| 22/11/2026 | US-08: 8 verificações manuais | Navegador/API/banco reais; todas funcionaram, conforme relato do responsável | **8/8 passaram — manual** |
| 22/11/2026 | US-09: 8 verificações manuais | Edição no navegador real: pré-preenchimento, cancelar, salvar/persistir, duplicidade, CH inválida e preservação da URL, conforme relato do responsável | **8/8 passaram — manual** |

**Consolidado naquele checkpoint:** 84 + 47 = **131 testes automatizados aprovados**, 16 arquivos, 0 falhas. A execução focada de 17 testes é uma repetição parcial da suíte frontend e **não** aumenta o total de 131. As **16 verificações manuais** (8 US-08 + 8 US-09) são registradas à parte. **Esse número é histórico; o atual está na tabela imediatamente acima.**

**Checkpoint imediatamente anterior — consulta US-08, também em 22/11/2026:** 73 testes backend (8 arquivos) + 40 frontend (8 arquivos) = 113 automatizados sem falhas; 10 testes focados na página (4 cadastro + 6 consulta); 8 verificações manuais de consulta aprovadas. O novo total **substitui**, não se soma ao total antigo.

### Registro inicial — 21/11/2026 (histórico)

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
| Evolução futura | Sessão mantida após reiniciar a API | Registro não apresentado | Não testado especificamente |
| Evolução futura | CSRF e atributo `Secure` em HTTPS | Verificação destinada à implantação em produção | Não testado especificamente |
| Concluído após 21/11 | Isolamento acadêmico entre alunos | Coberto posteriormente nas suítes de matrículas, cancelamento, progresso e US-13 | **Aprovado posteriormente** |
| Concluído após 21/11 | Cancelamento via API, progresso e demais regras de negócio | US-06/US-07/US-13 implementadas e testadas | **Aprovado posteriormente** |
| Concluído após 21/11 | Interface em largura de 360px | Validação manual confirmada pelo responsável | **Aprovado posteriormente** |

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

- **Nota histórica (21/11):** naquele momento não havia cobertura de titularidade acadêmica. Os testes das US-05, US-06, US-07 e US-13 acrescentaram essa verificação posteriormente.

### 8.3. Situação da Definition of Done da US-01

- [x] Login, `/me` e logout implementados e testados.

- [x] Autorização por perfil implementada e testada.

- [x] Hash Argon2id utilizado na verificação de credenciais.

- [x] Resposta de login não expõe `senhaHash`.

- [x] Armazenamento SQLite de sessões integrado, com arquivos distintos para desenvolvimento e testes.

- [x] Atributos `HttpOnly` e `SameSite=Lax`, regeneração do ID e limpeza do cookie testados.

- [x] Isolamento de dados acadêmicos validado posteriormente nas suítes de matrículas, cancelamento, progresso e histórico de cancelamentos.

- [x] Commit/push da autenticação verificados no GitLab (`847ddc8`).

- **Segurança além do escopo validado:** continuidade da sessão após reinício, CSRF e `Secure` sob HTTPS são verificações futuras descritas na ADR-0003; não foram apresentadas como testes aprovados.
- **Jira MAT-6:** estado do ticket não foi verificado nesta revisão documental.

**Status da US-01:** funcionalmente implementada e testada; este bloco contém os resultados da etapa original, complementados pelas suítes posteriores. A publicação inicial de autenticação foi registrada no GitLab (`847ddc8`).

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

- [x] Liberação de vaga após cancelamento validada na suíte de API da US-06 (CT-08).

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

- No checkpoint da US-04, o CT-09 simulava cancelamento diretamente no SQLite e **não** testava o endpoint HTTP. A US-06 implementou e validou posteriormente esse endpoint, incluindo a liberação da vaga (CT-08).

- O CT-10 passou em uma disputa simultânea de duas requisições. Não representa testes prolongados de concorrência/carga ou múltiplas instâncias da API.

- O CT-12 verifica a ocupação após matrícula; liberação de vagas após cancelamento permanece pendente.

- A identificação do aluno ocorre via sessão, mas ainda faltam testes de propriedade em endpoints que exponham matrículas/histórico privados.

- O frontend de matrícula ainda não foi implementado. A US-04 está validada **no backend**, não concluída de ponta a ponta.

**Evidência da suíte completa de 21/11/2026:** 4 arquivos aprovados; 32 testes aprovados; 0 falhas; duração de 2,55 s.

### 8.5. US-05 — Consulta de matrículas — 21/11/2026

**Jira:** MAT-8

**Endpoint:** GET /api/aluno/matriculas

**Arquivo:** apps/api/tests/matriculas.consulta.test.ts

**Resultado:** 7 testes aprovados.

#### Cenários validados

- [x] CT-01 — Negar acesso sem autenticação (401).

- [x] CT-02 — Bloquear acesso da secretaria (403).

- [x] CT-03 — Listar matrículas ativas do aluno.

- [x] CT-04 — Não retornar matrículas canceladas.

- [x] CT-05 — Não expor matrículas de outro aluno.

- [x] CT-06 — Ignorar tentativa de informar outro alunoId.

- [x] CT-07 — Retornar lista vazia para aluno sem matrículas.

**Suíte completa:** 39 testes aprovados, 0 falhas.

**Pendências:**

- Implementar a interface React.

- Validar a atualização da listagem após cancelamento.

### 8.6. US-06 — Cancelamento de matrícula — 21/11/2026

**Jira:** MAT-15

**Endpoint:** PATCH /api/aluno/matriculas/:matriculaId/cancelar

**Arquivo:** apps/api/tests/matriculas.cancelamento.test.ts

**Resultado:** 10 testes aprovados.

#### Cenários validados

- [x] CT-01 — Negar cancelamento sem autenticação (401).

- [x] CT-02 — Bloquear acesso da secretaria (403).

- [x] CT-03 — Rejeitar identificador inválido (400).

- [x] CT-04 — Rejeitar matrícula inexistente (404).

- [x] CT-05 — Cancelar matrícula própria.

- [x] CT-06 — Impedir cancelamento de outro aluno.

- [x] CT-07 — Impedir cancelamento repetido.

- [x] CT-08 — Liberar vaga após cancelamento.

- [x] CT-09 — Permitir rematrícula após cancelamento.

- [x] CT-10 — Processar somente um cancelamento simultâneo.

**Suíte completa:** 49 testes aprovados em 6 arquivos,

0 falhas.

**Limitações:**

- A interface React ainda não foi implementada.

- O teste concorrente não substitui testes de carga.

### 8.7. US-07 — Progresso curricular — 21/11/2026

**Jira:** MAT-12

**Endpoint:** GET /api/aluno/progresso

**Arquivo:** apps/api/tests/progresso.test.ts

**Resultado:** 10 testes aprovados.

#### Cenários validados

- [x] CT-01 — Negar acesso sem autenticação.

- [x] CT-02 — Bloquear acesso da secretaria.

- [x] CT-03 — Calcular CH aprovada por categoria.

- [x] CT-04 — Retornar progresso vazio.

- [x] CT-05 — Não integralizar disciplinas reprovadas.

- [x] CT-06 — Transferir excedente de perfil para livre.

- [x] CT-07 — Não contabilizar aprovação duplicada.

- [x] CT-08 — Apresentar CH de matrícula ativa separadamente.

- [x] CT-09 — Desconsiderar matrícula cancelada da CH em curso.

- [x] CT-10 — Impedir consulta de progresso de outro aluno.

**Suíte completa:** 59 testes aprovados,

7 arquivos e 0 falhas.

**Pendência:** integração com o frontend React.

### 8.8. US-09 — Cadastro de disciplinas (checkpoint anterior à edição) — 22/11/2026

**Endpoint:** `POST /api/secretaria/disciplinas`.

**Arquivo backend:** `apps/api/tests/secretaria.disciplinas.test.ts` — **6 testes aprovados**.

**Arquivo frontend:** `apps/web/src/pages/secretaria/DisciplinasPage.test.tsx` — **4 testes aprovados**.

**Aspectos verificados nos logs:**

- [x] Aluno não possui autorização para cadastrar disciplina (caso CT-02 do backend).
- [x] Secretaria cadastra disciplina válida (CT-03 do backend).
- [x] Código duplicado é recusado (CT-04 do backend).
- [x] A página apresenta código, nome e carga horária (CT-01 do frontend).
- [x] O formulário envia um cadastro válido (CT-02 do frontend).
- [x] O formulário apresenta erro de código duplicado (CT-03 do frontend).
- [x] O formulário impede carga horária inválida (CT-04 do frontend).
- [x] As suítes completas daquele checkpoint terminaram sem falhas: 73 backend e 40 frontend.

O código de teste da fase de cadastro foi fornecido com os seis casos CT-01 a CT-06; todos passaram. As verificações de consulta incluídas posteriormente foram registradas na seção 8.9.

**Contexto histórico:** naquele momento, edição de disciplinas ainda não estava concluída; foi implementada e validada posteriormente no mesmo dia (seção 8.10). Permanecem responsividade, acessibilidade, CSRF e outros cadastros da secretaria. A atualização manual da lista após cadastro foi confirmada; testes de componente não substituem integralmente testes E2E.

### 8.9. US-08 — Consulta de disciplinas — 22/11/2026

**Endpoint:** `GET /api/secretaria/disciplinas`, com pesquisa e paginação.

**Backend:** 8 testes de consulta em `apps/api/tests/secretaria.disciplinas.test.ts`; naquele checkpoint, o arquivo tinha 14 casos com os 6 de cadastro da US-09. Na versão atual, tem 25 após incluir a edição.

**Frontend:** 6 testes de consulta em `apps/web/src/pages/secretaria/DisciplinasPage.test.tsx`; naquele checkpoint, o arquivo tinha 10 com os 4 de cadastro. Na versão atual, tem 17 após incluir a edição.

- [x] Exibir as disciplinas retornadas pela API.
- [x] Pesquisar e refletir o termo na URL.
- [x] Avançar a página e atualizar a URL.
- [x] Apresentar mensagem de lista vazia.
- [x] Permitir tentar novamente após erro de rede.
- [x] Informar carregamento durante a consulta.
- [x] Validar acesso e paginação no backend (8 casos de consulta aprovados).
- [x] Executar 8 verificações manuais com a aplicação real; o responsável relatou que **todas funcionaram**.

**Status:** US-08 implementada e validada, com 14 testes automatizados específicos de consulta e oito verificações manuais. Permanecem a revisão de responsividade/acessibilidade e os cuidados de segurança transversais do sistema.

### 8.10. US-09 — Edição de disciplinas — 22/11/2026

**Endpoint:** `PATCH /api/secretaria/disciplinas/:id`, protegido por `exigirPerfil("SECRETARIA")`. Aceita atualização de um ou mais campos de disciplina, preserva o próprio código e aplica unicidade e regra de CH.

**Backend:** 11 testes novos em `apps/api/tests/secretaria.disciplinas.test.ts`, além dos 14 anteriores. O responsável confirmou a aprovação dos testes de integração e da suíte backend completa (**84/84 em 8 arquivos**).

- [x] CT-01 — Atualizar disciplina e conferir persistência no banco.
- [x] CT-02 — Atualização parcial sem modificar campos omitidos.
- [x] CT-03 — Negar edição sem sessão (`401`).
- [x] CT-04 — Negar edição pelo aluno (`403`) e preservar dados.
- [x] CT-05 — Rejeitar ID inválido (`400`).
- [x] CT-06 — Rejeitar disciplina inexistente (`404`).
- [x] CT-07 — Rejeitar código de outra disciplina (`409`) sem alteração indevida.
- [x] CT-08 — Rejeitar CH inválida (`400`) sem persistir mudanças.
- [x] CT-09 — Rejeitar corpo sem campos editáveis (`400`).
- [x] CT-10 — Rejeitar código/nome inválidos (`400`).
- [x] CT-11 — Permitir alterar nome mantendo o próprio código.

**Frontend:** 7 novos testes em `apps/web/src/pages/secretaria/DisciplinasPage.test.tsx`, somados aos 10 anteriores. Log do teste focado: **17/17 aprovados em 6,19 s**. Log da suíte completa: **47/47 aprovados em 8 arquivos, 7,00 s**; `pnpm lint` e `pnpm exec tsc -b` também passaram.

- [x] CT-01 — Abrir formulário preenchido a partir da linha da tabela.
- [x] CT-02 — Cancelar sem chamar a API de edição.
- [x] CT-03 — Enviar `PATCH`, recarregar listagem e preservar busca/página na URL.
- [x] CT-04 — Exibir erro de código duplicado sem fechar o formulário.
- [x] CT-05 — Impedir envio de CH inválida.
- [x] CT-06 — Desabilitar salvamento/cancelamento durante a requisição.
- [x] CT-07 — Permitir tentar novamente após falha temporária.

**Verificação manual:** o responsável confirmou **8/8 cenários aprovados**, cobrindo botão Editar, dados pré-preenchidos, cancelamento, alteração válida, persistência após recarga, código duplicado, CH inválida e preservação da URL. O relato comprova a execução manual informada, mas não é uma gravação ou automação de E2E.

**Status:** US-09 (cadastro + edição) funcionalmente implementada e validada; registro do commit da edição e atualização Jira MAT-13 ainda a conferir.

### 8.11. US-10 — Consulta e cadastro de professores — 22/11/2026

**Backend:** `apps/api/tests/secretaria.professores.test.ts`, com **14/14 testes aprovados** na suíte focada e na suíte geral (**98/98 em 9 arquivos**).

- [x] CT-01 — Negar consulta sem autenticação (`401`).
- [x] CT-02 — Impedir consulta pelo aluno (`403`).
- [x] CT-03 — Listar professores para a secretaria.
- [x] CT-04 — Pesquisar professor pelo nome.
- [x] CT-05 — Pesquisar professor pelo e-mail.
- [x] CT-06 — Paginar sem repetir professores.
- [x] CT-07 — Rejeitar parâmetros de consulta inválidos (`400`).
- [x] CT-08 — Retornar lista vazia sem resultados.
- [x] CT-09 — Cadastrar professor válido e persistir no banco.
- [x] CT-10 — Rejeitar e-mail duplicado (`409`).
- [x] CT-11 — Rejeitar nome inválido (`400`).
- [x] CT-12 — Rejeitar e-mail inválido (`400`).
- [x] CT-13 — Impedir cadastro pelo aluno (`403`).
- [x] CT-14 — Impedir cadastro sem autenticação (`401`).

**Frontend:** `apps/web/src/pages/secretaria/ProfessoresPage.test.tsx`, com **11/11 testes aprovados** na suíte focada e na geral (**58/58 em 9 arquivos** após integrar a rota).

Cadastro:

- [x] CT-01 — Apresentar campos obrigatórios.
- [x] CT-02 — Cadastrar professor válido e atualizar a lista.
- [x] CT-03 — Mostrar erro de e-mail duplicado.
- [x] CT-04 — Impedir cadastro com e-mail inválido.
- [x] CT-05 — Impedir novo envio durante o cadastro.

Consulta:

- [x] CT-01 — Exibir os professores retornados.
- [x] CT-02 — Pesquisar e refletir a busca na URL.
- [x] CT-03 — Avançar página e atualizar a URL.
- [x] CT-04 — Mostrar mensagem de lista vazia.
- [x] CT-05 — Permitir tentar novamente após erro de rede.
- [x] CT-06 — Informar estado de carregamento durante a consulta.

**Verificações manuais (8/8):** o responsável informou ter concluído com sucesso a navegação para a página, consulta de professores, pesquisa por nome e por e-mail, cadastro válido, rejeição de e-mail duplicado, validação de dados e funcionamento de URL/paginação. Relato de aprovação manual não deve ser confundido com captura automática de evidências E2E.

**Status naquele checkpoint:** **US-10 funcionalmente concluída, validada e publicada no GitLab**, commit `8425521`; atualização Jira MAT-17 a conferir. A US-11, a US-12 e o requisito adicional US-13 foram concluídos posteriormente, conforme consolidado do início do documento.

### 8.12. US-11 — Consulta e abertura de turmas — 22/11/2026

**Backend:** `apps/api/tests/secretaria.turmas.test.ts`, com **15/15 testes aprovados** na execução focada (2,98 s), incluídos na suíte geral **113/113 em 10 arquivos** (8,28 s). Os cenários exercitam autenticação, autorização por perfil, vínculos com disciplina/professor, ocupação por matrículas ativas, pesquisa, paginação e validação de dados.

Consulta (GET `/api/secretaria/turmas`):

- [x] CT-01 — Negar consulta sem autenticação (`401`).
- [x] CT-02 — Negar consulta por aluno (`403`).
- [x] CT-03 — Listar disciplina, professor e vagas ocupadas/totais/disponíveis, considerando as matrículas ativas.
- [x] CT-04 — Pesquisar pelo código da disciplina.
- [x] CT-05 — Pesquisar pelo nome do professor.
- [x] CT-06 — Paginar em ordem estável, sem repetir turmas.
- [x] CT-07 — Rejeitar parâmetros inválidos (`400`).
- [x] CT-08 — Retornar lista vazia sem resultados.

Abertura (POST `/api/secretaria/turmas`):

- [x] CT-09 — Abrir turma válida e persistir no banco.
- [x] CT-10 — Rejeitar vagas inválidas sem criar turma.
- [x] CT-11 — Rejeitar IDs inválidos.
- [x] CT-12 — Rejeitar disciplina inexistente.
- [x] CT-13 — Rejeitar professor inexistente.
- [x] CT-14 — Negar abertura sem autenticação (`401`).
- [x] CT-15 — Negar abertura pelo aluno (`403`).

**Frontend:** `apps/web/src/pages/secretaria/TurmasPage.test.tsx`, com **14/14 testes aprovados** na execução focada após correção do menu (3,90 s) e incluídos na suíte completa **72/72 em 10 arquivos** (9,10 s). `pnpm lint` e `pnpm exec tsc -b` também passaram.

Consulta:

- [x] CT-01 — Exibir turmas e vagas ocupadas, totais e disponíveis.
- [x] CT-02 — Pesquisar e refletir a busca na URL.
- [x] CT-03 — Avançar a página preservando a busca.
- [x] CT-04 — Apresentar mensagem de lista vazia.
- [x] CT-05 — Permitir tentar novamente após falha de rede.
- [x] CT-06 — Informar carregamento durante a consulta.

Abertura:

- [x] CT-01 — Apresentar seleção obrigatória de disciplina e professor e campo de vagas.
- [x] CT-02 — Abrir turma válida e atualizar a lista preservando a URL.
- [x] CT-03 — Impedir vagas inválidas sem chamar o POST.
- [x] CT-04 — Exigir disciplina e professor selecionados.
- [x] CT-05 — Apresentar erro da API sem perder o formulário.
- [x] CT-06 — Impedir reenvio durante a abertura.
- [x] CT-07 — Buscar opções de disciplinas pelo código.
- [x] CT-08 — Permitir tentar carregar disciplinas novamente após falha.

**Verificações manuais:** o responsável confirmou que todos os fluxos manuais testados funcionaram, conforme roteiro da US-11 (8 verificações). A verificação de paginação entre múltiplas páginas depende da existência de registros suficientes; não confundir a confirmação manual com uma gravação de navegador ou teste E2E automatizado.

**Ajuste de semântica HTML:** nas primeiras execuções, o React alertou que existiam links `<a>` aninhados nas páginas de turmas e professores. A navegação foi corrigida e as suítes focadas e geral foram reexecutadas sem o aviso.

**Status:** **US-11 funcionalmente concluída e validada**; o responsável confirmou posteriormente commit/push, mas ainda falta registrar o hash e conferir a história no Jira. A US-12 foi implementada e validada após esse checkpoint; o requisito extra, segurança de produção e QA responsivo ainda exigem atenção.

### 8.13. US-12 — Alteração da capacidade das turmas — 22/11/2026

**Backend:** 10 novos testes em `apps/api/tests/secretaria.turmas.test.ts`. Log focado **25/25 testes aprovados** (15 da US-11 e 10 da US-12) em 4,86 s; log da API completa **123/123 em 10 arquivos** (13,07 s). TypeScript aprovado.

- [x] CT-01 — Negar alteração de vagas sem autenticação (`401`).
- [x] CT-02 — Impedir alteração pelo perfil `ALUNO` (`403`).
- [x] CT-03 — Aumentar capacidade e confirmar persistência e vagas disponíveis.
- [x] CT-04 — Reduzir capacidade sem ultrapassar a ocupação ativa.
- [x] CT-05 — Permitir capacidade igual ao número de matrículas ativas (disponíveis = 0; canceladas não ocupam vagas).
- [x] CT-06 — Rejeitar capacidade inferior à ocupação (`409`), informando `vagasOcupadas` e preservando o valor persistido.
- [x] CT-07 — Rejeitar valores inválidos de capacidade: zero, negativo, decimal, string, `null` e fora do limite `Int` (`400`).
- [x] CT-08 — Rejeitar identificadores de turma inválidos (`400`).
- [x] CT-09 — Responder `404` para turma inexistente.
- [x] CT-10 — Refletir capacidade e vagas atualizadas na consulta GET posterior.

**Frontend:** 8 novos testes em `apps/web/src/pages/secretaria/TurmasPage.test.tsx`. Log focado **22/22 aprovados** (14 US-11 + 8 US-12) em 7,55 s; log web completo **80/80 em 10 arquivos** (11,63 s), com lint e TypeScript aprovados.

- [x] CT-01 — Abrir formulário com a capacidade atual e a ocupação da turma selecionada.
- [x] CT-02 — Cancelar edição sem chamar PATCH.
- [x] CT-03 — Salvar alteração, atualizar listagem e preservar busca/página na URL.
- [x] CT-04 — Impedir envio com capacidade inferior à ocupação exibida.
- [x] CT-05 — Exibir erro de conflito `409` sem perder os dados do formulário.
- [x] CT-06 — Bloquear reenvio e cancelamento enquanto salva.
- [x] CT-07 — Permitir nova tentativa após erro temporário.
- [x] CT-08 — Editar a turma correta quando há mais de uma linha na tabela.

**Verificações manuais:** roteiro de 8 casos (acesso à edição, formulário preenchido, cancelamento, aumento, redução permitida, igualdade com ocupação, impedimento de redução indevida e preservação de URL/recarga) informado pelo responsável como concluído. Sem captura independente, não tratar o relato como E2E automatizado.

**Validação adicional recomendada antes da entrega:** ensaio concorrente envolvendo aumento de matrículas e redução de vagas, revisão de responsividade a 360px e proteção CSRF. O `UPDATE` condicional na transação fornece defesa de integridade na operação de alteração, mas os dez testes atuais não são um teste de estresse ou simulação de todos os interleavings possíveis.

**Status naquele checkpoint:** US-12 funcionalmente implementada, testada e validada manualmente. Posteriormente, a US-13, os testes finais e a revisão documental foram concluídos conforme o consolidado de 23/11/2026. O estado do último commit/push é verificado na publicação, fora deste plano de testes.

## 9. Priorização e riscos

O prazo é curto. Priorizar **P0** no fluxo do aluno: credenciais, autorização, consulta de ofertas, matrícula, cancelamento, rematrícula, lotação, concorrência, progresso e isolamento de dados. Os testes **P1** da secretaria e do requisito extra acompanham sua implementação.

Riscos que exigem atenção:

1. **Concorrência:** duas matrículas simultâneas podem violar capacidade/unicidade sem transação adequada.

2. **Privacidade:** usar o ID vindo do cliente em vez da sessão pode expor dados de outro aluno.

3. **Sessões e CSRF:** a persistência foi integrada ao SQLite, mas requer evidência após reinício; revisar CSRF e os cookies de produção antes da entrega.

4. **Banco de teste:** assegurar que Vitest, Prisma e o armazenamento de sessão não modifiquem `dev.db` nem o banco de sessões de desenvolvimento.

5. **Cobertura falsa (exemplo histórico):** os 32 testes de um checkpoint de 21/11 cobriam autenticação/autorização, ofertas e realização de matrícula no backend, sem provar cancelamento, progresso, frontend ou secretaria naquela época. No checkpoint atual de 22/11 há **203 testes**, mas ainda não há prova automática de CSRF, responsividade, carga ou MVP completo.

## 10. Manutenção

Atualizar este documento quando novos critérios Gherkin forem acordados, quando uma regra mudar, **a cada conclusão de User Story** e antes do commit final. Registrar data, comando executado, resultado e pendências reais na seção 8. Atualizar a Sprint correspondente e o item no Jira MAT. Manter checkpoints históricos identificados e não somar execuções focadas aos resultados consolidados da mesma suíte.
