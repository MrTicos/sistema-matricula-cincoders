# Sistema de Matrícula CINCoders — Requisitos e backlog

**Versão documental:** 1.0 — revisão para entrega
**Atualizado em:** 23/11/2026
**Responsável:** Thiago Silva
**Origem:** teste prático da Seleção nº 5/2026, CIn-UFPE
**Prazo de entrega:** 23/11/2026
**Estado:** requisitos mínimos e requisito adicional **US-13** implementados e validados conforme evidências relatadas; acesso do avaliador ao GitLab confirmado pelo responsável. Documentação pronta para commit/push final.

> **Histórico:** a versão 0.1, de 21/11/2026, era um backlog *antes* da implementação. Este documento atualiza a rastreabilidade sem apagar as regras e os critérios de aceitação originais. As evidências estão em [Sprint 1](sprints/sprint-1.md) e [plano de testes](testes/plano-de-testes.md).

## 1. Visão do produto e escopo

Construir uma aplicação web de matrícula para graduação, com dois perfis:

- **Secretaria de Graduação:** consulta, cadastra e edita disciplinas; consulta/cadastra professores; consulta, abre e ajusta a capacidade das turmas.
- **Aluno:** consulta ofertas de disciplinas e vagas, realiza e cancela matrículas, acompanha suas matrículas ativas, visualiza o progresso curricular e, como requisito adicional, consulta seu histórico de cancelamentos.

A aplicação busca tornar verificáveis as regras acadêmicas tanto na API quanto no frontend. A avaliação também considera clareza do código, decisões técnicas, testes, controle de acesso e facilidade de reproduzir a instalação.

### Premissas do enunciado

1. Existe **apenas um semestre corrente**; não é necessário modelar períodos letivos nem turmas de semestres anteriores.
2. Cada aluno pertence a um curso; cada curso classifica disciplinas obrigatórias e eletivas de perfil. As demais disciplinas são livres para aquele aluno.
3. Cursos, alunos, currículos e histórico de aprovações/reprovações são criados por carga inicial, sem telas administrativas de cadastro.
4. O enunciado permite autenticação só por nome de usuário; este projeto adotou `username` **e senha** com sessão, por segurança.
5. A área da secretaria precisa funcionar em desktop; a área do aluno precisa ser utilizável desde **360 px**.
6. Backend e frontend pertencem ao **mesmo monorepo** no GitLab do CIn, com acesso concedido ao usuário `selecaogersist` dentro do prazo.
7. Um requisito funcional adicional é obrigatório, do backend ao frontend; neste projeto, é a **US-13 — Histórico de matrículas canceladas**.

### Tecnologias adotadas

| Camada | Stack |
| --- | --- |
| Frontend | React, React Router, TypeScript e Vite |
| Backend | Node.js, Express e TypeScript |
| Banco | SQLite e Prisma ORM 7, com adaptador Better SQLite3 |
| Sessões e senhas | Express Session, sessões em SQLite e Argon2id |
| Testes | Vitest, Supertest, Testing Library e jsdom |
| Pacotes | pnpm |

### Fora do escopo mínimo

- Múltiplos semestres, calendário e matrícula em lote.
- Cadastro de alunos e cursos via interface.
- Lançamento de notas e aprovação automática.
- Gestão financeira, boletos e pagamentos.
- Pré-requisitos ou choque de horários, não escolhidos como requisito adicional.
- Redesign amplo inspirado em produtos externos, se ainda não implementado e testado.

## 2. Requisitos funcionais

| ID | Requisito | Perfil | Histórias |
| --- | --- | --- | --- |
| RF-01 | Login por usuário/senha e acesso à área correta | Ambos | US-01, US-02 |
| RF-02 | Encerrar sessão e retornar ao login quando não autenticado | Ambos | US-01, US-02 |
| RF-03 | Consultar, pesquisar, paginar, cadastrar e editar disciplinas | Secretaria | US-08, US-09 |
| RF-04 | Consultar e cadastrar professores | Secretaria | US-10 |
| RF-05 | Consultar turmas, abrir oferta e alterar capacidade respeitando a ocupação | Secretaria | US-11, US-12 |
| RF-06 | Consultar ofertas com pesquisa, paginação, vagas e classificação para o curso | Aluno | US-03 |
| RF-07 | Realizar matrícula elegível | Aluno | US-04 |
| RF-08 | Consultar e cancelar as próprias matrículas ativas | Aluno | US-05, US-06 |
| RF-09 | Consultar progresso por grupo curricular, incluindo CH em curso e faltante | Aluno | US-07 |
| RF-10 | Popular cursos, currículos, usuários e histórico com seed reproduzível | Sistema | Transversal |
| RF-11 | Exibir carregamento, lista vazia, ausência de resultados, erro e recuperação | Ambos | Transversal |
| RF-12 | Refletir pesquisa e página na URL das listagens previstas | Ambos | Transversal |
| RF-13 | Requisito adicional: consultar histórico paginado de matrículas canceladas | Aluno | **US-13** |

## 3. Regras de negócio

As RN-01 a RN-13 correspondem ao conjunto mínimo do enunciado; as RN-A são decisões complementares explicitadas pelo projeto.

| ID | Regra | Verificação esperada |
| --- | --- | --- |
| RN-01 | Código de disciplina é único | Recusar duplicidade |
| RN-02 | CH de disciplina entre 15 e 120h, múltipla de 15 | Aceitar 15/120; rejeitar 10/25/135 |
| RN-03 | E-mail do professor é único | Recusar segundo cadastro com e-mail existente |
| RN-04 | Turma exige disciplina, professor e ao menos 1 vaga | Recusar capacidade zero ou IDs inválidos |
| RN-05 | Capacidade atualizada não pode ser inferior às matrículas ativas | Recusar redução abaixo da ocupação; aceitar igualdade |
| RN-06 | Aluno não se matricula em turma lotada | Recusar sem alterar ocupação |
| RN-07 | Disciplina já aprovada impede matrícula; reprovação permite repetir | Testar ambos os históricos |
| RN-08 | Aluno pode cancelar matrícula própria ativa e liberar vaga | Registrar cancelamento e diminuir ocupação |
| RN-09 | Aluno só consulta/altera as próprias matrículas | Não expor registros de terceiros |
| RN-10 | Classificação curricular depende do curso | Mesma disciplina pode ter classificações diferentes |
| RN-11 | Excedente de CH aprovada em perfil conta como livre | Ex.: 90h aprovadas/60h exigidas: 60h perfil + 30h livre |
| RN-12 | Apenas aprovações integralizam CH; matrículas ativas são CH em curso separada | Reprovação não integraliza |
| RN-13 | Percentual máximo de 100%; CH faltante nunca negativa | Excesso não gera 110% nem -30h |
| RN-A01 | Não permitir duas matrículas ativas do mesmo aluno em turmas de uma única disciplina | Recusar matrícula duplicada mesmo com turma diferente |
| RN-A02 | Após cancelar, uma nova matrícula elegível deve criar outro registro | Preservar o cancelamento anterior |
| RN-A03 | Matrículas concorrentes não podem exceder a capacidade | Proteger verificação e escrita em transação |
| RN-A04 | Histórico adicional só retorna matrículas `CANCELADA` pertencentes ao aluno autenticado | Nunca incluir ativas nem registros de terceiros |
| RN-A05 | Histórico adicional usa ordenação estável e paginação validada | Evitar itens repetidos em páginas sucessivas |

As RN-A01/RN-A02 têm ADRs próprias. As RN-A04/RN-A05 correspondem à US-13; não são obrigações textuais da lista original de 13 regras do edital.

## 4. Requisitos não funcionais

| ID | Requisito | Critério |
| --- | --- | --- |
| RNF-01 | Usabilidade | Mensagens claras, feedback por regra e recuperação de falhas |
| RNF-02 | Responsividade | Fluxos do aluno utilizáveis desde 360 px |
| RNF-03 | Segurança | Validação de perfil e titularidade no backend; proteção de sessão e senhas |
| RNF-04 | HTTP | Métodos/status coerentes, validação de entrada e erros tratados |
| RNF-05 | Integridade | Capacidade e matrículas consistentes sob concorrência |
| RNF-06 | Testabilidade | Testes automatizados das regras com banco isolado |
| RNF-07 | Reprodutibilidade | README descreve instalação, configuração, migração e seed |
| RNF-08 | Processo | Código legível, documentos revisados e histórico de commits |
| RNF-09 | Acessibilidade básica | Navegação identificável, rótulos e mensagens sem depender só de cor |

**Ressalva:** a verificação de origem CSRF foi implementada e aprovada em 10 testes HTTP no dia 23/11. Ainda não comprova HTTPS real, expiração cronometrada de cookie ou proteção E2E em navegador.

## 5. Priorização MoSCoW e MVP

| Prioridade | Escopo |
| --- | --- |
| **Must** | Autenticação, ofertas, matrícula/cancelamento, progresso, secretaria, regras RN-01 a RN-13, requisito adicional funcional, seed, README, testes e responsividade |
| **Should** | Testes de integração complementares, documentação de decisões, recuperação de erro e polimento visual |
| **Could** | Melhorias de acessibilidade e filtros adicionais, painéis-resumo e evolução do design |
| **Won't nesta entrega** | Múltiplos semestres, finanças, notas, cadastro de cursos/alunos por interface |

**Ordem histórica de implementação:** base técnica → login → fluxos do aluno → secretaria → US-13 → navegação, robustez e documentação para entrega.

## 6. User Stories e situação atual

| US | Ticket conhecido | História / valor | Situação informada |
| --- | --- | --- | --- |
| **US-01** | [MAT-6](https://cin-1402.atlassian.net/browse/MAT-6) | Login e sessão autenticada | Implementada; 8 testes específicos de autenticação API e 3 de middleware de autorização |
| **US-02** | [MAT-7](https://cin-1402.atlassian.net/browse/MAT-7) | Interface de login, perfis e sessão expirada | Implementada; telas/rotas testadas e tratamento de `401` corrigido |
| **US-03** | [MAT-16](https://cin-1402.atlassian.net/browse/MAT-16) | Consultar ofertas pesquisáveis, vagas e classificação | Implementada e testada |
| **US-04** | [MAT-11](https://cin-1402.atlassian.net/browse/MAT-11) | Realizar matrícula elegível | Implementada e testada, incluindo concorrência de vagas |
| **US-05** | [MAT-8](https://cin-1402.atlassian.net/browse/MAT-8) | Consultar matrículas ativas próprias | Implementada e testada |
| **US-06** | [MAT-15](https://cin-1402.atlassian.net/browse/MAT-15) | Cancelar matrícula e liberar vaga | Implementada e testada |
| **US-07** | [MAT-12](https://cin-1402.atlassian.net/browse/MAT-12) | Acompanhar progresso curricular | Implementada e testada |
| **US-08** | [MAT-10](https://cin-1402.atlassian.net/browse/MAT-10) | Consultar/pesquisar disciplinas | Implementada; 8 testes API, 6 frontend, 8 manuais informados |
| **US-09** | [MAT-13](https://cin-1402.atlassian.net/browse/MAT-13) | Cadastrar e editar disciplinas | Implementada; 17 testes API, 11 frontend, 8 manuais informados |
| **US-10** | [MAT-17](https://cin-1402.atlassian.net/browse/MAT-17) | Consultar e cadastrar professores | Implementada; 14 testes API, 11 frontend, 8 manuais informados |
| **US-11** | MAT-9 *(conferir associação no Jira)* | Consultar e abrir turmas | Implementada; 15 testes API, 14 frontend, 8 manuais informados |
| **US-12** | MAT-14 *(conferir associação no Jira)* | Ajustar capacidade sem prejudicar matrículas ativas | Implementada; 10 testes API, 8 frontend, 8 manuais informados |
| **US-13** | Requisito adicional; **ticket específico não confirmado** | Consultar histórico de matrículas canceladas | Implementada; 10 testes API, 9 frontend, 8 manuais informados |

**Atenção à rastreabilidade:** as chaves MAT-9 e MAT-14 foram usadas no planejamento, mas a associação definitiva deve ser conferida no Jira. Não inventar ticket da US-13; o projeto tinha o épico MAT-1 para o requisito adicional.

### Critérios INVEST

| Critério | Verificação |
| --- | --- |
| **I — Independent** | História entrega comportamento observável sem depender de uma tela genérica |
| **N — Negotiable** | Detalhes de UI/API podem mudar desde que a regra e o benefício sejam preservados |
| **V — Valuable** | Cada US beneficia aluno, secretaria ou a segurança |
| **E — Estimable** | Entrada, saída, validação e testes são identificáveis |
| **S — Small** | Fluxo vertical implementável e revisável |
| **T — Testable** | Regras expressas em Gherkin e cenários automatizados/manuais |

A US-13 era indefinida na versão 0.1; passou a ter ator, valor, endpoint e critérios concretos. Não manter seu status como “aguardando escolha”.

## 7. Requisito adicional escolhido — US-13

**História:** Como aluno, quero consultar minhas matrículas **canceladas** para lembrar em quais disciplinas/turmas estive inscrito, sem misturá-las às matrículas ativas.

**Justificativa:** o cancelamento já preserva a linha de matrícula e sua data; expor esses registros com segurança oferece rastreabilidade acadêmica real, sem ampliar o modelo para vários semestres.

### Escopo e regras

1. Disponibilizar consulta HTTP paginada do histórico de **cancelamentos** do aluno autenticado.
2. Filtrar por `situacao = CANCELADA` e pelo aluno obtido da sessão.
3. Retornar dados acadêmicos úteis (disciplina, turma, professor e data de cancelamento, quando registrada), sem informações de outros usuários.
4. Estabelecer ordenação estável e rejeitar parâmetros de paginação inválidos.
5. Apresentar o histórico sob a área “Minhas matrículas”, em aba própria, mantendo a lista de ativas separada.
6. Tratar carregamento, ausência de cancelamentos, erro de rede e retentativa; oferecer navegação entre páginas quando necessário.
7. Consultar o histórico quando o aluno escolher sua aba, evitando carregar dados desnecessários antes disso.

**Implementação relatada:** `GET /api/aluno/matriculas/historico`, serviço e controlador de matrículas, componente `HistoricoMatriculas.tsx` e sua integração com `MatriculasPage.tsx`.

**Evidências:** 10 testes API em `matriculas.historico.test.ts` (incluídos nos 133), 9 frontend em `HistoricoMatriculas.test.tsx` (incluídos nos 95) e oito cenários manuais informados como aprovados.

## 8. Cenários essenciais em Gherkin

Os exemplos abaixo formam uma matriz concisa de aceitação. A suíte real pode ter cenários adicionais, conforme o [plano de testes](testes/plano-de-testes.md).

```gherkin
Funcionalidade: Autenticação e sessão
  Cenário: Perfil incorreto
    Dado que estou autenticado como aluno
    Quando tento cadastrar uma disciplina
    Então a API deve recusar por falta de permissão

  Cenário: Sessão invalidada
    Dado que minha sessão não está mais válida
    Quando consulto uma página acadêmica protegida
    Então a aplicação deve me encaminhar ao login

Funcionalidade: Catálogo e turmas da secretaria
  Cenário: Código de disciplina duplicado
    Dado que uma disciplina com código IF668 já existe
    Quando a secretaria cadastra outra disciplina IF668
    Então o cadastro deve ser recusado

  Esquema do Cenário: Carga horária inválida
    Quando a secretaria informa <ch> horas
    Então o cadastro deve ser recusado
    Exemplos:
      | ch  |
      | 10  |
      | 25  |
      | 135 |

  Cenário: E-mail de professor duplicado
    Dado que um professor já usa determinado e-mail
    Quando a secretaria tenta cadastrar outro com o mesmo e-mail
    Então o cadastro deve ser recusado

  Cenário: Turma sem vagas
    Quando a secretaria tenta abrir turma com zero vagas
    Então a criação deve ser recusada

  Cenário: Redução abaixo da ocupação
    Dado que a turma possui 10 matrículas ativas
    Quando a secretaria reduz a capacidade para 9
    Então a alteração deve ser recusada

Funcionalidade: Matrícula do aluno
  Cenário: Turma lotada
    Dado que a turma oferece 30 vagas e possui 30 alunos ativos
    Quando o aluno tenta matricular-se
    Então a matrícula é recusada
    E a ocupação permanece em 30

  Cenário: Disciplina já aprovada
    Dado que o aluno foi aprovado em IF668
    Quando tenta matricular-se novamente em IF668
    Então a matrícula deve ser recusada

  Cenário: Disciplina reprovada
    Dado que o aluno foi reprovado em IF668
    E uma turma de IF668 possui vagas
    Quando solicita matrícula
    Então uma matrícula ATIVA é criada

  Cenário: Duas turmas da mesma disciplina
    Dado que o aluno já tem matrícula ativa em IF668
    Quando tenta matricular-se em outra turma de IF668
    Então a segunda matrícula é recusada

  Cenário: Cancelamento próprio
    Dado que o aluno possui matrícula ativa
    Quando cancela a matrícula
    Então sua situação passa a CANCELADA
    E uma vaga é liberada

  Cenário: Matrícula de outro aluno
    Dado que o aluno A está autenticado
    E o registro pertence ao aluno B
    Quando o aluno A tenta consultá-lo ou cancelá-lo
    Então a operação não revela nem altera o registro de B

Funcionalidade: Progresso curricular
  Cenário: Classificação relativa ao curso
    Dado que IF668 é obrigatória no curso A
    E IF668 é eletiva de perfil no curso B
    Quando os dois alunos consultam suas ofertas
    Então cada aluno vê a classificação do próprio curso

  Cenário: Excedente de eletiva de perfil
    Dado que o curso exige 60 horas de perfil
    E o aluno aprovou 90 horas desse grupo
    Quando o progresso é calculado
    Então 60 horas contam como perfil
    E 30 horas contam como livres

  Cenário: Reprovação e disciplina em curso
    Dado que o aluno possui uma disciplina reprovada
    E uma matrícula ativa em outra disciplina
    Quando consulta o progresso
    Então a reprovação não soma CH integralizada
    E a ativa aparece como CH em curso

  Cenário: Limites de progresso
    Dado que a CH aprovada excede a CH mínima
    Quando o progresso é calculado
    Então o percentual não ultrapassa 100
    E a carga horária faltante não é negativa

Funcionalidade: Histórico de matrículas canceladas (US-13)
  Cenário: Consultar cancelamentos próprios
    Dado que o aluno possui matrículas ATIVAS e CANCELADAS
    Quando consulta seu histórico de cancelamentos
    Então visualiza somente as CANCELADAS
    E os registros de outros alunos não aparecem

  Cenário: Histórico vazio
    Dado que não possuo matrículas canceladas
    Quando abro a aba de histórico
    Então vejo uma mensagem de ausência de cancelamentos

  Cenário: Falha de comunicação
    Dado que abri a aba de histórico
    Quando a requisição falha
    Então vejo mensagem de erro
    E posso tentar novamente

  Cenário: Histórico paginado
    Dado que possuo cancelamentos em várias páginas
    Quando avanço ou retorno na paginação
    Então vejo itens ordenados sem duplicação indevida
```

## 9. Decisões técnicas registradas

| Tema | Decisão | Documento |
| --- | --- | --- |
| Matrícula duplicada por disciplina | Não permitir duas ativas; validar por disciplina, não só turma | [ADR-0002](adr/0002-unicidade-matricula-ativa-por-disciplina.md) |
| Rematrícula após cancelamento | Criar nova linha, preservar cancelamento | [ADR-0001](adr/0001-rematricula-novo-registro.md) |
| Autenticação | `username` e senha, Argon2id, sessão em SQLite e cookie HttpOnly | [ADR-0003](adr/0003-autenticacao-por-sessao.md) |
| Concorrência | Proteger gravações e verificações de disponibilidade em transações adequadas ao SQLite | [Arquitetura](arquitetura/visao-geral.md) |
| CH em curso | Não antecipar aprovação; apresentar carga ativa separadamente | [Arquitetura](arquitetura/visao-geral.md) |
| Requisito adicional | Histórico de matrículas canceladas, sem novo semestre | Seção 7 deste documento |

**Estado da ADR-0003:** estratégia de sessão adotada e implementada. A verificação de origem CSRF está testada; HTTPS real e continuidade após reinício permanecem sem evidência específica. A revisão está registrada na própria ADR.

## 10. Evidências e rastreabilidade de testes

| Verificação | Resultado informado | Limite |
| --- | --- | --- |
| API completa | **143/143 testes aprovados em 12 arquivos** | Executada no banco dedicado de testes após T-32 |
| Frontend completo | **95/95 testes aprovados em 12 arquivos** | Confirmação do responsável após incluir três casos do cliente HTTP |
| Verificações manuais US-08 a US-13 | **48 aprovadas** | Oito por US, não são testes automatizados |
| Linters e tipagem | `pnpm lint` e `pnpm exec tsc -b` no web; `pnpm exec tsc --noEmit` na API, sem erros relatados | Conferir novamente após qualquer edição de código |
| Reprodução da base | Migração, geração do Client e seed aprovados em banco separado | Validada localmente; documentar preparação no README |

**Total automatizado atualizado:** **238 testes**, distribuídos nas duas aplicações, sem E2E automatizado adicional declarado.

## 11. Definition of Done e fechamento documental

Para marcar uma história como funcionalmente concluída:

- [x] Regra implementada no backend e fluxo correspondente no frontend, quando aplicável.
- [x] Testes relevantes executados e aprovados conforme os resultados compartilhados.
- [x] Cenários manuais de US-08 a US-13 relatados como aprovados.
- [x] Navegação por perfil e tratamento de erros/requisições revisados.
- [x] README, arquitetura, autenticação, modelagem física, ADR-0003, sprints e plano de testes revisados com os registros compartilhados.
- [x] `schema.prisma` integral conferido com o documento de modelagem física.
- [x] Arquivos locais sensíveis e habilidades de IA instaladas pelo Prisma identificados para exclusão do estágio do Git.
- [x] Convite do usuário avaliador `selecaogersist` aceito, conforme confirmação de Thiago.

**Publicação:** a seleção final dos arquivos, o commit/push e a eventual atualização de tickets Jira são atos operacionais externos a esta revisão documental; não são apresentados falsamente como já executados. Os comandos exatos estão em [Checklist de entrega](entrega-checklist.md).

**Preparação para entrevista:** saber explicar o isolamento de dados por sessão, o uso de transação para vagas, a unicidade de matrícula ativa por disciplina, a rematrícula como novo registro, os cálculos de CH e a motivação da US-13.

**Próximo passo após esta revisão:** concluir documentação e Git; um redesign visual maior deve ser tratado como evolução posterior, com nova rodada de validação, para não comprometer a entrega já testada.
