# Modelo físico inicial — Sistema de Matrícula CINCoders

**Versão:** 0.1 — aprovada para implementação inicial  
**ORM escolhido:** Prisma ORM 7 + SQLite

## Decisões refletidas no schema

- `Usuario` autentica com `username` único e `senhaHash` obrigatório. O hash é produzido pela aplicação; nunca persistir senha em texto puro.
- `Aluno` utiliza `id` numérico autoincremental e se relaciona 1:1 a `Usuario`; a secretaria é um `Usuario` com perfil `SECRETARIA`, sem tabela específica.
- `Curso` contém as três CH mínimas exigidas. `EstruturaCurricular` estabelece a categoria obrigatória ou eletiva de perfil por par curso-disciplina; disciplina fora dessa relação é eletiva livre.
- `Turma` aponta para uma disciplina e um professor. Seu número de vagas ocupadas é **derivado** da contagem de matrículas ativas, não duplicado na tabela.
- `Matricula` conserva registros cancelados e aceita um novo registro em rematrícula, conforme ADR 0001.
- Só pode haver uma matrícula ativa por aluno-disciplina, mesmo quando existem turmas diferentes da mesma disciplina, conforme ADR 0002.
- `Historico` registra aprovação/reprovação em disciplinas anteriores, sem modelar semestres ou turmas anteriores.

## Restrições que ficam na API

O `schema.prisma` expressa chaves, unicidades simples, relações e índices. Ele **não** expressa sozinho todas as regras do edital:

1. Disciplina: `cargaHoraria` entre 15 e 120 e múltipla de 15.
2. Turma: `vagasTotais >= 1` e alteração não pode reduzir abaixo das matrículas ativas.
3. Matrícula: aluno não pode ter aprovação anterior na disciplina, não pode matricular-se em turma lotada e não pode manter matrícula ativa em outra turma da mesma disciplina.
4. Matrícula: consulta e inserção devem evitar corrida pela última vaga, inclusive em requisições concorrentes.
5. Cancelamento: somente o próprio aluno cancela; o registro recebe `canceladaEm` e não é removido.
6. Progresso: excedente de CH aprovada em perfil migra para eletivas livres; reprovações não somam; CH em curso é separada; percentual máximo de 100% e faltante mínimo de zero.

Uma restrição `@@unique([alunoId, turmaId])` **não pode ser usada**, porque bloquearia a rematrícula após cancelamento. E um índice desse par não impediria duas turmas ativas de uma mesma disciplina. Esse invariante requer uma verificação ligada à disciplina da turma e uma estratégia transacional cuidadosamente testada.

## Organização sugerida

```text
apps/
  api/
    prisma/
      schema.prisma
    prisma7.config.ts
    .env.example
    src/
      generated/prisma/  (gerado pela CLI)
      ...
docs/
  modelagem-fisica.md
  ...
  adr/
    0001-rematricula-novo-registro.md
    0002-unicidade-matricula-ativa-por-disciplina.md
    ...
```

## Instalação e validação no pacote `apps/api`

```powershell
pnpm add -D prisma@7 @types/better-sqlite3
pnpm add @prisma/client@7 @prisma/adapter-better-sqlite3 dotenv
Copy-Item .env.example .env
pnpm exec prisma validate
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate
```

**Atenção:** o `prisma` sem versão pinada pode instalar a versão 8, que usa configuração distinta e cujo suporte SQLite ainda é experimental. O código entregue aqui pressupõe Prisma ORM 7. A aplicação Express deverá instanciar o Prisma Client gerado usando o adaptador SQLite antes de consultar o banco.

O arquivo `.env`, o banco `dev.db` e outros dados locais não devem ser commitados. Configure o `.gitignore` do pacote conforme a organização definitiva do monorepo.