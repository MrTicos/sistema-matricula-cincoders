# Sprint 0 — Ambiente, requisitos e persistência inicial

**Projeto:** Sistema de Matrícula CINCoders  
**Situação:** Concluída quanto à configuração, modelagem e preparação de dados  
**Prazo geral do teste:** 23/11/2026  
**Responsável:** Thiago Silva

## Objetivo

Preparar o repositório, registrar requisitos e decisões e disponibilizar um banco local reproduzível antes da implementação das funcionalidades.

## Entregas e evidências

| Entrega | Evidência | Resultado |
| --- | --- | --- |
| Repositório GitLab CIn | Repositório `sistema-matricula-cincoders` e acesso concedido ao avaliador | Configurado, segundo confirmação do responsável |
| Requisitos e backlog | `docs/requisitos-e-backlog.md`; User Stories no Jira MAT | Base de planejamento registrada |
| Rematrícula após cancelamento | `docs/adr/0001-rematricula-novo-registro.md` | Decisão aceita: novo registro |
| Uma matrícula ativa por disciplina | `docs/adr/0002-unicidade-matricula-ativa-por-disciplina.md` | Decisão aceita: nunca duas turmas ativas da mesma disciplina |
| Modelagem física | `apps/api/prisma/schema.prisma` | `prisma validate` aprovado |
| Migração inicial | `apps/api/prisma/migrations/20261121010456_init/migration.sql` | `prisma migrate status`: esquema atualizado |
| Prisma Client | `apps/api/src/generated/prisma/` | Gerado com Prisma 7.10.1; artefato não versionado |
| Dados de desenvolvimento | `apps/api/prisma/seed.ts` | Seed executado duas vezes, sem erros |
| Verificação de dados | `apps/api/prisma/verificar-seed.ts` | Quantidades conferidas pelo responsável |

## Dados de teste

- 3 cursos: Sistemas de Informação, Ciência da Computação e Engenharia da Computação.
- 4 alunos: `aluno.si`, `aluno.cc`, `aluno.ec`, `aluno.si2`.
- 1 conta de secretaria: `secretaria`.
- 6 disciplinas, 2 professores, 7 turmas, 11 vínculos curriculares e 8 lançamentos históricos.
- Nenhuma matrícula ativa inicial, para permitir os cenários automatizados.
- Senhas de desenvolvimento informadas por variável local `SEED_PASSWORD` e armazenadas como hash Argon2id.

## Decisões e riscos

1. SQLite e Prisma 7 foram mantidos para reduzir complexidade de implantação dentro do prazo.
2. O seed busca dados existentes antes de criar; execução repetida foi verificada, mas não é um mecanismo de proteção contra duas execuções concorrentes.
3. `Curso` e `Turma` não possuem chave natural única no esquema atual; regras de unicidade de negócio serão impostas no serviço correspondente.
4. O Prisma Studio apresentou erro de suporte ao protocolo `file:./dev.db`; contagens foram verificadas via Prisma Client, sem bloquear o projeto.
5. `.env`, `dev.db`, `node_modules` e Client gerado ficam fora do controle de versão; migrações e fontes entram no Git.

## Revisão e retrospectiva

- **Funcionou:** validação do schema, migração, geração do Client, seed e reexecução do seed.
- **Dificuldades:** instalação de dependências com scripts sujeitos à aprovação do pnpm; configuração da variável `DATABASE_URL`; localização inicial de `schema.prisma`; incompatibilidade do Prisma Studio.
- **Melhoria adotada:** documentar decisões, evidências e testes em paralelo à implementação; não marcar uma User Story como concluída sem critérios de aceitação e testes.

## Definição de encerramento

A Sprint 0 não equivale a um MVP funcional. Login, matrícula, cancelamento, progresso e funcionalidades da secretaria permanecem no backlog de implementação.