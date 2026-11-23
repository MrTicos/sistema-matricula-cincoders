# Sprint 0 — Ambiente, requisitos e persistência inicial

**Projeto:** Sistema de Matrícula CINCoders
**Responsável:** Thiago Silva
**Período de referência:** preparação inicial, em 21/11/2026
**Situação da Sprint 0:** concluída quanto à configuração, modelagem e preparação dos dados
**Prazo geral do teste:** 23/11/2026

> **Como ler este documento:** esta é a retrospectiva da **Sprint 0**, não um retrato do estágio atual da aplicação. Na conclusão desta sprint, login e fluxos de matrícula ainda estavam no backlog. Posteriormente, foram implementadas as US-01 a US-12 e a US-13 (histórico de matrículas canceladas). Para o estado funcional atual, consultar [Sprint 1](sprint-1.md), [plano de testes](../testes/plano-de-testes.md) e [checklist de entrega](../entrega-checklist.md).

## 1. Objetivo

Preparar o repositório, registrar requisitos e decisões arquiteturais e disponibilizar um banco SQLite local reproduzível antes da implementação dos fluxos da aplicação.

## 2. Entregas e evidências

| Entrega | Local ou evidência | Situação na Sprint 0 |
| --- | --- | --- |
| Repositório GitLab CIn | `sistema-matricula-cincoders` | Configurado na Sprint 0; o avaliador aceitou o convite de acesso posteriormente, conforme confirmação de 23/11/2026 |
| Requisitos e backlog | `docs/requisitos-e-backlog.md`; Jira MAT | Linha de base criada; posteriormente revisada com as funcionalidades implementadas |
| Rematrícula após cancelamento | `docs/adr/0001-rematricula-novo-registro.md` | Decisão: criar nova matrícula e preservar o registro cancelado |
| Unicidade de matrícula ativa por disciplina | `docs/adr/0002-unicidade-matricula-ativa-por-disciplina.md` | Decisão: impedir duas matrículas ativas na mesma disciplina, mesmo em turmas distintas |
| Estratégia de autenticação | `docs/adr/0003-autenticacao-por-sessao.md` | Decisão documentada; implementação e testes vieram posteriormente |
| Modelagem física | `apps/api/prisma/schema.prisma` | Esquema inicial validado com Prisma |
| Migração inicial | `apps/api/prisma/migrations/20261121010456_init/migration.sql` | Migração inicial aplicada |
| Prisma Client | `apps/api/src/generated/prisma/` | Gerado com Prisma 7.10.1; diretório não versionado |
| Dados de desenvolvimento | `apps/api/prisma/seed.ts` | Carga inicial criada e reexecução conferida |
| Verificação dos dados | Conferência por Prisma Client; o registro inicial cita `apps/api/prisma/verificar-seed.ts` | Quantidades relatadas como conferidas; confirmar a presença do script antes de referenciá-lo como comando de entrega |

### Reprodução validada posteriormente

Em 23/11/2026, foi relatada uma validação em banco SQLite **separado** (`readme-validacao.db`):

1. `pnpm exec prisma migrate deploy`: migração aplicada com sucesso.
2. `pnpm exec prisma generate`: Prisma Client gerado.
3. `pnpm exec prisma db seed`: dados iniciais criados sem erros.
4. A variável temporária `DATABASE_URL` foi removida da sessão PowerShell; a configuração de desenvolvimento voltou a `file:./dev.db`.

Esses passos corroboram a reprodutibilidade da infraestrutura. O banco de validação e o banco de testes não devem ser incluídos no commit.

## 3. Dados iniciais

O seed prepara:

| Entidade | Quantidade / observação |
| --- | --- |
| Cursos | 3: Sistemas de Informação, Ciência da Computação e Engenharia da Computação |
| Alunos | 4: `aluno.si`, `aluno.cc`, `aluno.ec` e `aluno.si2` |
| Conta de secretaria | 1: `secretaria` |
| Disciplinas | 6 |
| Professores | 2 |
| Turmas | 7 |
| Vínculos de estrutura curricular | 11 |
| Registros de histórico acadêmico | 8, com aprovações e reprovações |
| Matrículas ativas iniciais | 0; os cenários de matrícula ficam livres para validação |

As senhas de desenvolvimento vêm de `SEED_PASSWORD`, definida localmente, e são armazenadas como hash Argon2id. Nenhuma senha deve constar no repositório.

## 4. Decisões técnicas e riscos identificados

1. **SQLite e Prisma 7:** escolhidos para limitar a complexidade de instalação dentro do prazo.
2. **Idempotência do seed:** o script procura ou atualiza registros existentes. A reexecução foi conferida; isso não equivale a garantia contra execuções concorrentes.
3. **Unicidade de domínio:** `Curso` e `Turma` não possuem, no esquema inicial, uma chave natural única para todos os cenários de negócio. As verificações pertinentes pertencem aos serviços e aos testes.
4. **Prisma Studio:** houve dificuldade relatada com `file:./dev.db`. A conferência por Prisma Client foi uma alternativa sem impacto na execução da aplicação.
5. **Arquivos locais:** `.env`, bancos `.db` e auxiliares, `node_modules` e Client gerado não devem ser versionados. Fontes, schema, migrações, seed e `.env.example` podem integrar o Git.
6. **Banco dos testes:** os testes de integração alteram dados. Usar sempre um banco dedicado, como `file:./test.db`, e nunca executar a suíte com o banco de desenvolvimento ou dados reais.

## 5. Revisão e retrospectiva

**O que funcionou**

- Validação do esquema Prisma e migração inicial.
- Geração do Prisma Client.
- Criação de cursos, usuários, vínculos curriculares e ofertas pela carga inicial.
- Reexecução do seed sem falhas relatadas.
- Registro antecipado de decisões e regras de matrícula.

**Dificuldades**

- Dependências com scripts de instalação sujeitos à configuração do pnpm.
- Configuração de `DATABASE_URL`.
- Limitações no uso do Prisma Studio no ambiente inicial.

**Melhorias adotadas**

- Registrar evidências, decisões e testes durante o desenvolvimento.
- Não considerar uma história concluída apenas por existir código: é preciso verificar regras, estados de erro e critérios de aceitação.
- Separar banco de desenvolvimento, banco de validação do README e banco de testes.

## 6. Encerramento e continuidade

A Sprint 0 **não era um MVP funcional no momento de seu encerramento**. Login, matrícula, cancelamento, progresso e módulos da secretaria passaram para a execução posterior.

**Situação posterior, até 23/11/2026:** o responsável informou US-01 a US-13 implementadas, 133 testes de API aprovados e 95 testes de frontend aprovados; as evidências estão detalhadas na Sprint 1 e no plano de testes. Isso **não transforma retroativamente** as entregas funcionais em entregas da Sprint 0.