# Sistema de Matrícula CINCoders — requisitos e backlog inicial

**Versão:** 0.1 (21/11/2026)  
**Responsável:** Thiago Silva  
**Origem:** teste prático da Seleção nº 5/2026, CIn-UFPE  
**Situação:** linha de base para revisão antes da implementação  
**Prazo de entrega informado:** 23/11/2026

## 1. Visão do produto e escopo

Construir uma aplicação web de matrícula de graduação com dois perfis: a **Secretaria**, responsável por disciplinas, professores e turmas, e o **Aluno**, responsável por consultar ofertas, matricular-se, cancelar suas matrículas e acompanhar a carga horária curricular.

O valor principal é tornar as regras acadêmicas explícitas e verificáveis, tanto na API como na experiência do usuário. O teste avalia especialmente legibilidade, modelagem, validações, testes, histórico de commits e capacidade de explicar decisões.

### Premissas e limites impostos pelo teste

- Existe **um único semestre corrente**; não modelar períodos letivos ou turmas históricas.
- Alunos pertencem a cursos; a estrutura curricular vincula disciplinas ao curso como obrigatórias ou eletivas de perfil. As demais disciplinas contam como eletivas livres.
- Os dados de curso, currículo, alunos e histórico são fornecidos por carga inicial, sem telas de cadastro.
- A autenticação exige nome de usuário; senha é opcional no enunciado. A decisão sobre mecanismo e sessão será registrada em ADR.
- A área da secretaria pode ser desktop; as telas de aluno precisam funcionar desde 360 px.
- O repositório de entrega é pessoal, no GitLab do CIn, com front e back no **mesmo monorepo**, compartilhado com `selecaogersist` até o prazo.

### Stack aprovada

React + TypeScript + Vite; Express + TypeScript; Prisma + SQLite; pnpm workspaces; Vitest + Supertest.

### Fora do escopo mínimo

Gestão de calendários de diversos semestres, telas para cadastro de cursos e alunos, históricos de turmas antigas, notas e aprovação automática, pagamento, e qualquer funcionalidade adicional ainda não escolhida.

## 2. Requisitos funcionais

| ID | Requisito | Ator | Referência Jira |
|---|---|---|---|
| RF-01 | Entrar pelo nome de usuário e acessar apenas a própria área | Ambos | MAT-4 |
| RF-02 | Encerrar ou expirar sessão, retornando ao login | Ambos | MAT-4 |
| RF-03 | Listar disciplinas com busca e paginação; cadastrar e editar | Secretaria | MAT-5 |
| RF-04 | Listar e cadastrar professores | Secretaria | MAT-5 |
| RF-05 | Listar turmas com vagas ocupadas/totais; abrir turma e alterar capacidade | Secretaria | MAT-5 |
| RF-06 | Consultar ofertas com pesquisa, paginação, vagas livres e classificação curricular | Aluno | MAT-2 |
| RF-07 | Efetuar matrícula em turma elegível | Aluno | MAT-2 |
| RF-08 | Listar e cancelar as próprias matrículas ativas | Aluno | MAT-2 |
| RF-09 | Consultar CH exigida, integralizada, em curso e faltante em cada grupo | Aluno | MAT-3 |
| RF-10 | Popular cursos, currículos, alunos, secretaria e histórico na inicialização | Sistema | Transversal |
| RF-11 | Oferecer estados de carregamento, vazio, busca sem resultados, erro e retentativa | Ambos | Transversal |
| RF-12 | Refletir busca e página atual na URL das listagens | Ambos | Transversal |
| RF-13 | Implementar um requisito funcional adicional do back ao front | A definir | MAT-1 |

## 3. Regras de negócio — transcrição estruturada

| ID | Regra | Caso de teste essencial |
|---|---|---|
| RN-01 | Código de disciplina único | Recusar cadastro duplicado |
| RN-02 | CH da disciplina múltipla de 15, de 15 a 120 h | Recusar 10, 25 e 135; aceitar 15 e 120 |
| RN-03 | E-mail de professor único | Recusar segundo professor com mesmo e-mail |
| RN-04 | Turma requer disciplina, professor e pelo menos uma vaga | Recusar capacidade zero |
| RN-05 | Nova capacidade nunca menor que o número de matrículas ativas | Com 10 alunos, recusar reduzir para 9 |
| RN-06 | Aluno não pode matricular-se em turma lotada | Recusar matrícula sem vaga |
| RN-07 | Aprovação anterior impede nova matrícula; reprovação permite repetir | Verificar ambos os históricos |
| RN-08 | Aluno cancela as próprias matrículas ativas e a vaga volta à turma | Contagem decresce ao cancelar |
| RN-09 | Aluno só vê e altera as próprias matrículas | Rejeitar acesso à matrícula alheia |
| RN-10 | Classificação obrigatória/perfil/livre é relativa ao curso do aluno | Mesma disciplina em dois cursos com classificações diferentes |
| RN-11 | CH aprovada de perfil acima da exigida migra para eletiva livre | Perfil exige 60, aprovadas 90: 60 perfil + 30 livre |
| RN-12 | Apenas aprovações no histórico integralizam CH; reprovações não; matrículas ativas são CH em curso separada | Testar as três situações |
| RN-13 | Percentuais de conclusão limitados a 100%; CH faltante não negativa | Excesso de CH não gera 110% nem -30 h |

## 4. Requisitos não funcionais e critérios de qualidade

- **RNF-01 — Usabilidade:** feedback claro para recusas por regra de negócio, erro de rede, listas vazias e carregamento; ação de tentar novamente quando aplicável.
- **RNF-02 — Responsividade:** fluxo do aluno utilizável a partir de 360 px; secretaria funcional em desktop.
- **RNF-03 — Segurança básica:** autorização no back-end para cada perfil e para propriedade de matrículas; nunca confiar apenas em botões ocultos do front-end.
- **RNF-04 — API:** verbos e status HTTP coerentes, validação na entrada e formato consistente de erro; rotas documentadas.
- **RNF-05 — Integridade:** impedir exceder vagas, inclusive em requisições concorrentes; garantir consistência em matrículas e cancelamentos.
- **RNF-06 — Testabilidade:** testes automatizados das regras de negócio com dados de teste controlados.
- **RNF-07 — Reprodutibilidade:** README deve permitir iniciar do zero, criar o banco e carregar o seed sem etapas implícitas.
- **RNF-08 — Processo:** histórico incremental de commits e registro das principais decisões e limitações.

## 5. MVP e MoSCoW

**MVP priorizado pelo próprio edital:** login, fluxo completo do aluno (ofertas, matrícula, cancelamento e progresso) e testes das respectivas regras. Em seguida: secretaria; depois requisito adicional.

| MoSCoW | Escopo |
|---|---|
| Must | RF-01 a RF-13, RN-01 a RN-13, seed mínimo, responsividade exigida, testes, README e monorepo |
| Should | Testes de integração adicionais, refinamento visual e documentação suplementar |
| Could | Filtros convenientes não exigidos, refinamentos de acessibilidade além do mínimo, monitoramento |
| Won't nesta entrega | Vários semestres, matrícula em lote, módulo financeiro, cadastro de cursos e alunos por interface |

## 6. User Stories propostas

Cada história descreve valor observável e pode ser validada verticalmente (API, interface e teste). As condições de dependência técnica ficam nas tarefas, sem aumentar artificialmente o tamanho da história.

| ID | Épico | História de usuário | Critérios essenciais |
|---|---|---|---|
| US-01 | MAT-4 | Como usuário, quero entrar com meu nome de usuário para acessar a área do meu perfil | Credencial válida; redirecionamento; desconhecido recusado |
| US-02 | MAT-4 | Como usuário, quero que minha sessão e minhas permissões sejam respeitadas para proteger meus dados | Perfil errado bloqueado; sessão expirada redireciona; API restringe |
| US-03 | MAT-2 | Como aluno, quero consultar ofertas pesquisáveis para escolher uma turma | Busca/página na URL; vagas; classificação por curso; estados vazios/erro |
| US-04 | MAT-2 | Como aluno, quero me matricular numa turma elegível para cursar a disciplina | Vaga disponível; aprovação anterior bloqueada; reprovação permite; erro compreensível |
| US-05 | MAT-2 | Como aluno, quero ver minhas matrículas ativas para acompanhar meu semestre | Apenas minhas matrículas; turma e disciplina identificáveis |
| US-06 | MAT-2 | Como aluno, quero cancelar uma matrícula ativa para liberar a vaga | Cancelamento próprio; atualização das vagas; matrícula alheia bloqueada |
| US-07 | MAT-3 | Como aluno, quero visualizar meu progresso por categoria para saber quanto falta concluir | CH exigida/integralizada/em curso/faltante; excedente perfil; limites 100% e 0 h |
| US-08 | MAT-5 | Como secretaria, quero pesquisar e consultar disciplinas para administrar o catálogo | Busca/página na URL; vazio, erro e retentativa |
| US-09 | MAT-5 | Como secretaria, quero cadastrar e editar disciplinas válidas para manter o catálogo atualizado | Código único; CH válida; erros claros |
| US-10 | MAT-5 | Como secretaria, quero listar e cadastrar professores para associá-los a turmas | E-mail único; entradas validadas |
| US-11 | MAT-5 | Como secretaria, quero listar e abrir turmas para disponibilizar vagas no semestre | Disciplina e professor; capacidade mínima; ocupação exibida |
| US-12 | MAT-5 | Como secretaria, quero ajustar a capacidade de uma turma para refletir a oferta real | Redução nunca abaixo de matrículas ativas |
| US-13 | MAT-1 | Como [ator], quero [funcionalidade adicional] para [benefício concreto] | Definir após escolher a funcionalidade; deve atravessar API e UI |

### Rastreabilidade das histórias cadastradas no Jira

| História | Ticket | História | Ticket |
|---|---|---|---|
| US-01 | [MAT-6](https://cin-1402.atlassian.net/browse/MAT-6) | US-07 | [MAT-12](https://cin-1402.atlassian.net/browse/MAT-12) |
| US-02 | [MAT-7](https://cin-1402.atlassian.net/browse/MAT-7) | US-08 | [MAT-10](https://cin-1402.atlassian.net/browse/MAT-10) |
| US-03 | [MAT-16](https://cin-1402.atlassian.net/browse/MAT-16) | US-09 | [MAT-13](https://cin-1402.atlassian.net/browse/MAT-13) |
| US-04 | [MAT-11](https://cin-1402.atlassian.net/browse/MAT-11) | US-10 | [MAT-17](https://cin-1402.atlassian.net/browse/MAT-17) |
| US-05 | [MAT-8](https://cin-1402.atlassian.net/browse/MAT-8) | US-11 | [MAT-9](https://cin-1402.atlassian.net/browse/MAT-9) |
| US-06 | [MAT-15](https://cin-1402.atlassian.net/browse/MAT-15) | US-12 | [MAT-14](https://cin-1402.atlassian.net/browse/MAT-14) |

US-13 está propositalmente sem ticket: o requisito adicional ainda precisa de definição para passar na avaliação INVEST.

### Verificação INVEST

| Critério | Como verificaremos |
|---|---|
| **I — Independent** | A história entrega um comportamento identificável; dependências de infraestrutura não viram histórias gigantes |
| **N — Negotiable** | A implementação (rotas, componentes, arquitetura) pode mudar sem perder o resultado de negócio |
| **V — Valuable** | Há benefício explícito para aluno ou secretaria |
| **E — Estimable** | Entrada, saída, regra e testes são identificáveis |
| **S — Small** | Uma entrega vertical curta; se não couber no tempo disponível, dividir sem descartar critérios obrigatórios |
| **T — Testable** | Critérios podem virar testes automatizados e/ou verificações de interface |

**Revisão inicial:** US-07 concentra cálculo e interface e pode precisar virar duas tarefas técnicas sob a mesma história; US-09 e US-11 devem ser divididas se a implementação não couber numa entrega curta. US-13 **ainda não atende completamente** a Valuable, Estimable e Testable, pois depende da escolha do requisito adicional. Não marcar US-13 como pronta para desenvolvimento.

## 7. Critérios de aceitação em Gherkin

Estes cenários são uma primeira base para testes de domínio e API. Um teste completo também deve validar o status HTTP e o estado persistido no banco.

```gherkin
Funcionalidade: Acesso e autorização
  Cenário: Usuário aluno não acessa funções da secretaria
    Dado que estou autenticado como aluno
    Quando tento cadastrar uma disciplina
    Então a ação deve ser recusada por falta de permissão

  Cenário: Sessão expirada
    Dado que minha sessão expirou
    Quando tento abrir minhas matrículas
    Então devo voltar à tela de login

Funcionalidade: Cadastro acadêmico
  Cenário: Código de disciplina duplicado
    Dado que existe a disciplina IF668
    Quando a secretaria tenta cadastrar outra disciplina IF668
    Então o cadastro deve ser recusado

  Esquema do Cenário: Carga horária inválida
    Quando a secretaria cadastra uma disciplina com <ch> horas
    Então o cadastro deve ser recusado por carga horária inválida
    Exemplos:
      | ch  |
      | 10  |
      | 25  |
      | 135 |

  Cenário: E-mail de professor duplicado
    Dado que existe professor com e-mail prof@ufpe.br
    Quando a secretaria tenta cadastrar outro professor com esse e-mail
    Então o cadastro deve ser recusado

  Cenário: Turma sem vagas
    Quando a secretaria tenta abrir uma turma com zero vagas
    Então a abertura deve ser recusada

  Cenário: Redução abaixo da ocupação
    Dado que uma turma tem 10 matrículas ativas
    Quando a secretaria tenta reduzir sua capacidade para 9
    Então a alteração deve ser recusada

Funcionalidade: Matrícula do aluno
  Cenário: Matrícula numa turma lotada
    Dado que uma turma oferece 30 vagas e possui 30 matrículas ativas
    Quando o aluno tenta se matricular nela
    Então a matrícula deve ser recusada
    E a ocupação deve permanecer em 30

  Cenário: Disciplina já aprovada
    Dado que o aluno foi aprovado na disciplina IF668
    Quando tenta se matricular numa turma de IF668
    Então a matrícula deve ser recusada

  Cenário: Disciplina anteriormente reprovada
    Dado que o aluno foi reprovado na disciplina IF668
    E existe uma turma de IF668 com vagas disponíveis
    Quando solicita matrícula nessa turma
    Então a matrícula deve ser criada como ativa

  Cenário: Cancelamento de matrícula própria
    Dado que o aluno possui matrícula ativa numa turma
    Quando cancela a matrícula
    Então ela deixa de estar ativa
    E a turma passa a ter uma vaga disponível a mais

  Cenário: Cancelamento de matrícula alheia
    Dado que o aluno A está autenticado
    E a matrícula ativa pertence ao aluno B
    Quando o aluno A tenta cancelá-la
    Então a operação deve ser recusada
    E a matrícula do aluno B deve continuar ativa

Funcionalidade: Progresso curricular
  Cenário: Classificação conforme o curso
    Dado que IF668 é obrigatória para o curso A
    E IF668 é eletiva de perfil para o curso B
    Quando alunos desses cursos consultam a oferta de IF668
    Então o aluno do curso A deve ver a classificação obrigatória
    E o aluno do curso B deve ver a classificação eletiva de perfil

  Cenário: Excedente de eletiva de perfil
    Dado que o curso exige 60 horas de eletivas de perfil
    E o aluno aprovou 90 horas em disciplinas desse grupo
    Quando o progresso é calculado
    Então 60 horas devem contar como eletivas de perfil
    E 30 horas devem contar como eletivas livres

  Cenário: Reprovações e matrículas correntes
    Dado que o aluno reprovou numa disciplina de 60 horas
    E possui matrícula ativa em outra disciplina de 60 horas
    Quando consulta o progresso
    Então a disciplina reprovada não deve somar CH integralizada
    E a disciplina com matrícula ativa deve aparecer como CH em curso

  Cenário: Limites do indicador de progresso
    Dado que o aluno aprovou mais horas do que exige um grupo curricular
    Quando consulta o progresso desse grupo
    Então o percentual exibido não deve ultrapassar 100
    E a carga horária faltante não deve ser negativa
```

## 8. Decisões e perguntas de modelagem

Antes da primeira migração Prisma, decidir e registrar:

1. **Autenticação:** nome de usuário com senha (recomendado por segurança) ou login simplificado permitido pelo edital; como a sessão expira.
2. **Matrícula duplicada:** se é permitida uma segunda turma da mesma disciplina no semestre corrente; recomendação: não permitir duas matrículas ativas da mesma disciplina.
3. **Rematrícula após cancelamento:** criar novo registro ou reativar um registro cancelado; recomendação: novo registro, preservando o cancelamento.
4. **Concorrência de vagas:** operação atômica/transacional para evitar matrícula acima da capacidade.
5. **CH em curso:** como exibir o excedente potencial de perfil nas matrículas ainda ativas; recomendação inicial: separar “em curso” da CH integralizada, sem antecipar aprovação.
6. **Escolha da funcionalidade adicional:** só fechar após validar o núcleo; evitar dependência de entidades de semestre/horário, a menos que haja tempo.

Esses pontos são decisões propostas de implementação, não regras adicionais declaradas no edital.

## 9. Definition of Done de cada história

- Comportamento atende aos critérios Gherkin relevantes.
- Regra de negócio é validada no back-end, não apenas na interface.
- API retorna status e erros claros; estados persistidos são corretos.
- Interface mostra loading, vazio/sem resultado, erro e tentativa novamente quando aplicável.
- Telas de aluno verificadas em 360 px.
- Testes relevantes executados e passando.
- Commits pequenos e descritivos; README/ADR atualizados quando necessário.

## 10. Plano de execução para a janela restante

1. **Preparação:** estruturar monorepo, configurar scripts, Prisma, seed e README mínimo.
2. **Primeira entrega vertical:** login e listagem de ofertas por aluno.
3. **Núcleo de negócio:** matrícula, cancelamento, restrições e testes.
4. **Progresso:** cálculo do domínio e tela; testes para excedentes.
5. **Secretaria:** cadastros e capacidade das turmas.
6. **Extra e refinamento:** funcionalidade adicional, validação final, documentação do que ficou incompleto e ensaio de entrevista.