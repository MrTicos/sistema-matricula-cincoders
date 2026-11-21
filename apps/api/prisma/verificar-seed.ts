import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const resultado = {
    cursos: await prisma.curso.count(),
    alunos: await prisma.aluno.count(),
    usuarios: await prisma.usuario.count(),
    disciplinas: await prisma.disciplina.count(),
    professores: await prisma.professor.count(),
    turmas: await prisma.turma.count(),
    estruturasCurriculares: await prisma.estruturaCurricular.count(),
    historicos: await prisma.historico.count(),
    matriculas: await prisma.matricula.count(),
  };

  console.table(resultado);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });