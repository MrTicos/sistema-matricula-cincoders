import "dotenv/config";
import argon2 from "argon2";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL ausente em apps/api/.env");

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

// Somente desenvolvimento. Defina SEED_PASSWORD no .env local, sem versionar.
function obterSenhaSeed(): string {
  const senha = process.env.SEED_PASSWORD;

  if (!senha || senha.length < 12) {
    throw new Error(
      "Defina SEED_PASSWORD com pelo menos 12 caracteres no .env local"
    );
  }

  return senha;
}

const senha = obterSenhaSeed();

async function main() {
  const hash = await argon2.hash(senha, { type: argon2.argon2id });

  // Curso não tem chave única no MER inicial: procurar antes de criar.
  async function curso(nome: string, obrigatoria: number, perfil: number, livre: number) {
    const existente = await prisma.curso.findFirst({ where: { nome } });
    if (existente) return existente;
    return prisma.curso.create({
      data: { nome, chMinObrigatoria: obrigatoria, chMinPerfil: perfil, chMinLivre: livre },
    });
  }

  const si = await curso("Sistemas de Informação", 120, 60, 30);
  const cc = await curso("Ciência da Computação", 120, 60, 30);
  const ec = await curso("Engenharia da Computação", 120, 60, 30);

  const disciplinas = [
    { codigo: "CIN0001", nome: "Introdução à Programação", cargaHoraria: 60 },
    { codigo: "CIN0002", nome: "Banco de Dados", cargaHoraria: 60 },
    { codigo: "CIN0003", nome: "Circuitos Digitais", cargaHoraria: 60 },
    { codigo: "CIN0004", nome: "Estruturas de Dados", cargaHoraria: 60 },
    { codigo: "CIN0005", nome: "Engenharia de Software", cargaHoraria: 60 },
    { codigo: "CIN0006", nome: "Redes de Computadores", cargaHoraria: 60 },
  ] as const;

  for (const disciplina of disciplinas) {
    await prisma.disciplina.upsert({
      where: { codigo: disciplina.codigo },
      update: {},
      create: disciplina,
    });
  }
  const ds = await prisma.disciplina.findMany({
    where: { codigo: { in: disciplinas.map((d) => d.codigo) } },
  });
  const porCodigo = new Map(ds.map((d) => [d.codigo, d]));
  function id(codigo: string) {
    const d = porCodigo.get(codigo);
    if (!d) throw new Error(`Disciplina não encontrada: ${codigo}`);
    return d.id;
  }

  // Disciplina ausente da estrutura é LIVRE nesse curso.
  const estruturas = [
    [si.id, "CIN0001", "OBRIGATORIA"], [si.id, "CIN0002", "OBRIGATORIA"],
    [si.id, "CIN0004", "OBRIGATORIA"], [si.id, "CIN0005", "ELETIVA_PERFIL"],
    [cc.id, "CIN0001", "OBRIGATORIA"], [cc.id, "CIN0004", "OBRIGATORIA"],
    [cc.id, "CIN0002", "ELETIVA_PERFIL"], [cc.id, "CIN0003", "ELETIVA_PERFIL"],
    [ec.id, "CIN0001", "OBRIGATORIA"], [ec.id, "CIN0003", "OBRIGATORIA"],
    [ec.id, "CIN0006", "ELETIVA_PERFIL"],
  ] as const;
  for (const [cursoId, codigo, categoria] of estruturas) {
    await prisma.estruturaCurricular.upsert({
      where: { cursoId_disciplinaId: { cursoId, disciplinaId: id(codigo) } },
      update: {},
      create: { cursoId, disciplinaId: id(codigo), categoria },
    });
  }

  await prisma.usuario.upsert({
    where: { username: "secretaria" },
    update: {},
    create: { username: "secretaria", nome: "Secretaria de Testes", senhaHash: hash, perfil: "SECRETARIA" },
  });

  const alunos = [
    { username: "aluno.si", nome: "Ana Silva", cursoId: si.id },
    { username: "aluno.cc", nome: "Bruno Costa", cursoId: cc.id },
    { username: "aluno.ec", nome: "Carla Lima", cursoId: ec.id },
    { username: "aluno.si2", nome: "Diego Souza", cursoId: si.id },
  ];
  for (const a of alunos) {
    const usuario = await prisma.usuario.upsert({
      where: { username: a.username },
      update: {},
      create: { username: a.username, nome: a.nome, senhaHash: hash, perfil: "ALUNO" },
    });
    const matriculado = await prisma.aluno.findUnique({ where: { usuarioId: usuario.id } });
    if (!matriculado) {
      await prisma.aluno.create({ data: { usuarioId: usuario.id, cursoId: a.cursoId } });
    }
  }

  const professores = [
    { nome: "Prof. Marina Oliveira", email: "marina@example.test" },
    { nome: "Prof. Rafael Pereira", email: "rafael@example.test" },
  ];
  for (const p of professores) {
    await prisma.professor.upsert({ where: { email: p.email }, update: {}, create: p });
  }
  const marina = await prisma.professor.findUniqueOrThrow({ where: { email: "marina@example.test" } });
  const rafael = await prisma.professor.findUniqueOrThrow({ where: { email: "rafael@example.test" } });

  // Duas turmas da mesma disciplina para testar proibição de duplicidade.
  const ofertas = [
    { disciplinaId: id("CIN0001"), professorId: marina.id, vagasTotais: 2 },
    { disciplinaId: id("CIN0001"), professorId: rafael.id, vagasTotais: 3 },
    { disciplinaId: id("CIN0002"), professorId: marina.id, vagasTotais: 2 },
    { disciplinaId: id("CIN0003"), professorId: rafael.id, vagasTotais: 1 },
    { disciplinaId: id("CIN0004"), professorId: marina.id, vagasTotais: 3 },
    { disciplinaId: id("CIN0005"), professorId: rafael.id, vagasTotais: 2 },
    { disciplinaId: id("CIN0006"), professorId: marina.id, vagasTotais: 2 },
  ];
  for (const oferta of ofertas) {
    const existente = await prisma.turma.findFirst({ where: { disciplinaId: oferta.disciplinaId, professorId: oferta.professorId } });
    if (!existente) await prisma.turma.create({ data: oferta });
  }

  // Histórico: inclui aprovações e reprovações, sem repetir lançamentos.
  const historicos = [
    ["aluno.si", "CIN0002", "APROVADA"], ["aluno.si", "CIN0004", "REPROVADA"],
    ["aluno.cc", "CIN0003", "APROVADA"], ["aluno.cc", "CIN0002", "REPROVADA"],
    ["aluno.ec", "CIN0006", "APROVADA"], ["aluno.ec", "CIN0004", "REPROVADA"],
    ["aluno.si2", "CIN0005", "APROVADA"], ["aluno.si2", "CIN0003", "REPROVADA"],
  ] as const;
  for (const [username, codigo, situacao] of historicos) {
    const aluno = await prisma.aluno.findFirstOrThrow({ where: { usuario: { username } } });
    const disciplinaId = id(codigo);
    const existente = await prisma.historico.findFirst({ where: { alunoId: aluno.id, disciplinaId, situacao } });
    if (!existente) await prisma.historico.create({ data: { alunoId: aluno.id, disciplinaId, situacao } });
  }

  // Não criar matrículas ativas automaticamente: deixam os cenários de teste livres.
  console.log("Seed concluído: 3 cursos, 4 alunos, 1 secretaria, 6 disciplinas, 2 professores e 7 turmas.");
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
