import "dotenv/config";

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

import { app } from "../src/app";
import { prisma } from "../src/config/database";

// Registros criados exclusivamente por esta suíte.
const disciplinasCriadas: number[] = [];
const turmasCriadas: number[] = [];

let professorId: number;
let alunoSIId: number;
let alunoCCId: number;

async function agenteAutenticado(username: string) {
  const senha = process.env.SEED_PASSWORD;

  if (!senha) {
    throw new Error("SEED_PASSWORD não configurada.");
  }

  const agente = request.agent(app).set("Origin", "http://localhost:5173");

  await agente
    .post("/api/auth/login")
    .send({ username, senha })
    .expect(200);

  return agente;
}

async function criarTurmaDeTeste(
  vagasTotais = 2,
  disciplinaExistenteId?: number
) {
  let disciplinaId = disciplinaExistenteId;

  if (disciplinaId === undefined) {
    const disciplina = await prisma.disciplina.create({
      data: {
        codigo: `TEST-${randomUUID()}`,
        nome: "Disciplina para testes de matrícula",
        cargaHoraria: 60,
      },
    });

    disciplinaId = disciplina.id;
    disciplinasCriadas.push(disciplina.id);
  }

  const turma = await prisma.turma.create({
    data: {
      disciplinaId,
      professorId,
      vagasTotais,
    },
  });

  turmasCriadas.push(turma.id);

  return turma;
}

beforeAll(async () => {
  // Impede alterações acidentais no banco de desenvolvimento.
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (!/test/i.test(databaseUrl)) {
    throw new Error(
      "Os testes de matrícula exigem DATABASE_URL apontando para um banco de teste."
    );
  }

  const professor = await prisma.professor.findFirst({
    select: { id: true },
  });

  const alunoSI = await prisma.aluno.findFirst({
    where: {
      usuario: { username: "aluno.si" },
    },
    select: { id: true },
  });

  const alunoCC = await prisma.aluno.findFirst({
    where: {
      usuario: { username: "aluno.cc" },
    },
    select: { id: true },
  });

  if (!professor || !alunoSI || !alunoCC) {
    throw new Error(
      "O banco de testes precisa estar populado com o seed."
    );
  }

  professorId = professor.id;
  alunoSIId = alunoSI.id;
  alunoCCId = alunoCC.id;
});

afterAll(async () => {
  // Remove somente os registros desta suíte.
  if (turmasCriadas.length > 0) {
    await prisma.matricula.deleteMany({
      where: {
        turmaId: { in: turmasCriadas },
      },
    });

    await prisma.turma.deleteMany({
      where: {
        id: { in: turmasCriadas },
      },
    });
  }

  if (disciplinasCriadas.length > 0) {
    await prisma.historico.deleteMany({
      where: {
        disciplinaId: { in: disciplinasCriadas },
      },
    });

    await prisma.disciplina.deleteMany({
      where: {
        id: { in: disciplinasCriadas },
      },
    });
  }
});

describe("US-04 — Realizar matrícula", () => {
  it("CT-01: deve realizar matrícula válida", async () => {
    const turma = await criarTurmaDeTeste();
    const agente = await agenteAutenticado("aluno.si");

    const resposta = await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: turma.id })
      .expect(201);

    expect(resposta.body.matricula).toMatchObject({
      turmaId: turma.id,
      situacao: "ATIVA",
    });

    expect(resposta.body.matricula.id).toEqual(
      expect.any(Number)
    );
  });

  it("CT-02: deve negar acesso sem autenticação", async () => {
    await request(app)
      .post("/api/aluno/matriculas")
      .send({ turmaId: 1 })
      .expect(401);
  });

  it("CT-03: deve impedir matrícula pela secretaria", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: 1 })
      .expect(403);
  });

  it("CT-04: deve rejeitar turma inexistente", async () => {
    const agente = await agenteAutenticado("aluno.si");

    await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: 999999999 })
      .expect(404);
  });

  it("CT-05: deve rejeitar turmaId inválido", async () => {
    const agente = await agenteAutenticado("aluno.si");

    const valoresInvalidos = [
      0,
      -1,
      1.5,
      "1",
      null,
    ];

    for (const turmaId of valoresInvalidos) {
      await agente
        .post("/api/aluno/matriculas")
        .send({ turmaId })
        .expect(400);
    }

    await agente
      .post("/api/aluno/matriculas")
      .send({})
      .expect(400);
  });

  it("CT-06: deve impedir matrícula em disciplina aprovada", async () => {
    const turma = await criarTurmaDeTeste();

    await prisma.historico.create({
      data: {
        alunoId: alunoSIId,
        disciplinaId: turma.disciplinaId,
        situacao: "APROVADA",
      },
    });

    const agente = await agenteAutenticado("aluno.si");

    await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: turma.id })
      .expect(409);
  });

  it("CT-07: deve impedir duas matrículas ativas na mesma disciplina", async () => {
    const primeiraTurma = await criarTurmaDeTeste(3);

    const segundaTurma = await criarTurmaDeTeste(
      3,
      primeiraTurma.disciplinaId
    );

    const agente = await agenteAutenticado("aluno.si");

    await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: primeiraTurma.id })
      .expect(201);

    await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: segundaTurma.id })
      .expect(409);
  });

  it("CT-08: deve impedir matrícula em turma lotada", async () => {
    const turma = await criarTurmaDeTeste(1);

    await prisma.matricula.create({
      data: {
        alunoId: alunoCCId,
        turmaId: turma.id,
        situacao: "ATIVA",
      },
    });

    const agente = await agenteAutenticado("aluno.si");

    await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: turma.id })
      .expect(409);
  });

  it("CT-09: deve criar novo registro após cancelamento", async () => {
    const turma = await criarTurmaDeTeste();
    const agente = await agenteAutenticado("aluno.si");

    const primeira = await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: turma.id })
      .expect(201);

    const primeiraId = primeira.body.matricula.id;

    // Simula um cancelamento no banco.
    // O endpoint de cancelamento será implementado na US-06.
    await prisma.matricula.update({
      where: { id: primeiraId },
      data: {
        situacao: "CANCELADA",
        canceladaEm: new Date(),
      },
    });

    const segunda = await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: turma.id })
      .expect(201);

    expect(segunda.body.matricula.id).not.toBe(primeiraId);

    const registros = await prisma.matricula.findMany({
      where: {
        alunoId: alunoSIId,
        turmaId: turma.id,
      },
      orderBy: { id: "asc" },
    });

    expect(registros).toHaveLength(2);
    expect(registros[0].situacao).toBe("CANCELADA");
    expect(registros[1].situacao).toBe("ATIVA");
  });

  it("CT-10: deve impedir duas matrículas na última vaga", async () => {
    const turma = await criarTurmaDeTeste(1);

    const alunoSI = await agenteAutenticado("aluno.si");
    const alunoCC = await agenteAutenticado("aluno.cc");

    const respostas = await Promise.all([
      alunoSI
        .post("/api/aluno/matriculas")
        .send({ turmaId: turma.id }),

      alunoCC
        .post("/api/aluno/matriculas")
        .send({ turmaId: turma.id }),
    ]);

    const status = respostas
      .map((resposta) => resposta.status)
      .sort((a, b) => a - b);

    expect(status).toEqual([201, 409]);

    const ocupacao = await prisma.matricula.count({
      where: {
        turmaId: turma.id,
        situacao: "ATIVA",
      },
    });

    expect(ocupacao).toBe(1);
  });

  it("CT-11: deve permitir matrícula após reprovação", async () => {
    const turma = await criarTurmaDeTeste();

    await prisma.historico.create({
      data: {
        alunoId: alunoSIId,
        disciplinaId: turma.disciplinaId,
        situacao: "REPROVADA",
      },
    });

    const agente = await agenteAutenticado("aluno.si");

    await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: turma.id })
      .expect(201);
  });

  it("CT-12: deve atualizar a ocupação exibida nas ofertas", async () => {
    const turma = await criarTurmaDeTeste(2);
    const agente = await agenteAutenticado("aluno.si");

    await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: turma.id })
      .expect(201);

    const resposta = await agente
      .get(`/api/aluno/ofertas?busca=TEST-`)
      .expect(200);

    const oferta = resposta.body.ofertas.find(
      (item: { turmaId: number }) =>
        item.turmaId === turma.id
    );

    expect(oferta).toBeDefined();
    expect(oferta.vagasOcupadas).toBe(1);
    expect(oferta.vagasDisponiveis).toBe(1);
  });
});
