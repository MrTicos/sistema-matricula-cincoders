import "dotenv/config";

import { randomUUID } from "node:crypto";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";

import { app } from "../src/app";
import { prisma } from "../src/config/database";

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

async function criarCenario(vagasTotais = 2, alunoId = alunoSIId) {
  const disciplina = await prisma.disciplina.create({
    data: {
      codigo: `US06-${randomUUID()}`,
      nome: "Disciplina para testes de cancelamento",
      cargaHoraria: 60,
    },
  });

  disciplinasCriadas.push(disciplina.id);

  const turma = await prisma.turma.create({
    data: {
      disciplinaId: disciplina.id,
      professorId,
      vagasTotais,
    },
  });

  turmasCriadas.push(turma.id);

  const matricula = await prisma.matricula.create({
    data: {
      alunoId,
      turmaId: turma.id,
      situacao: "ATIVA",
    },
  });

  return { disciplina, turma, matricula };
}

beforeAll(async () => {
  if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
    throw new Error(
      "Os testes de cancelamento exigem um banco de teste."
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
    throw new Error("Seed de testes incompleto.");
  }

  professorId = professor.id;
  alunoSIId = alunoSI.id;
  alunoCCId = alunoCC.id;
});

afterAll(async () => {
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
    await prisma.disciplina.deleteMany({
      where: {
        id: { in: disciplinasCriadas },
      },
    });
  }
});

describe("US-06 — Cancelamento de matrícula", () => {
  it("CT-01: deve negar cancelamento sem autenticação", async () => {
    await request(app)
      .patch("/api/aluno/matriculas/1/cancelar")
      .expect(401);
  });

  it("CT-02: deve impedir cancelamento pela secretaria", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .patch("/api/aluno/matriculas/1/cancelar")
      .expect(403);
  });

  it("CT-03: deve rejeitar identificador inválido", async () => {
    const agente = await agenteAutenticado("aluno.si");

    for (const id of ["0", "-1", "abc", "1.5"]) {
      await agente
        .patch(`/api/aluno/matriculas/${id}/cancelar`)
        .expect(400);
    }
  });

  it("CT-04: deve rejeitar matrícula inexistente", async () => {
    const agente = await agenteAutenticado("aluno.si");

    await agente
      .patch("/api/aluno/matriculas/999999999/cancelar")
      .expect(404);
  });

  it("CT-05: deve cancelar matrícula própria", async () => {
    const { matricula } = await criarCenario();
    const agente = await agenteAutenticado("aluno.si");

    const resposta = await agente
      .patch(`/api/aluno/matriculas/${matricula.id}/cancelar`)
      .expect(200);

    expect(resposta.body.matricula.situacao).toBe("CANCELADA");

    const registro = await prisma.matricula.findUniqueOrThrow({
      where: { id: matricula.id },
    });

    expect(registro.situacao).toBe("CANCELADA");
    expect(registro.canceladaEm).not.toBeNull();

    const listagem = await agente
      .get("/api/aluno/matriculas")
      .expect(200);

    const ids = listagem.body.matriculas.map(
      (item: { id: number }) => item.id
    );

    expect(ids).not.toContain(matricula.id);
  });

  it("CT-06: deve impedir cancelamento de outro aluno", async () => {
    const { matricula } = await criarCenario(2, alunoCCId);

    const agente = await agenteAutenticado("aluno.si");

    await agente
      .patch(`/api/aluno/matriculas/${matricula.id}/cancelar`)
      .expect(404);

    const registro = await prisma.matricula.findUniqueOrThrow({
      where: { id: matricula.id },
    });

    expect(registro.situacao).toBe("ATIVA");
    expect(registro.canceladaEm).toBeNull();
  });

  it("CT-07: deve impedir cancelamento repetido", async () => {
    const { matricula } = await criarCenario();
    const agente = await agenteAutenticado("aluno.si");

    await agente
      .patch(`/api/aluno/matriculas/${matricula.id}/cancelar`)
      .expect(200);

    const primeira = await prisma.matricula.findUniqueOrThrow({
      where: { id: matricula.id },
    });

    await agente
      .patch(`/api/aluno/matriculas/${matricula.id}/cancelar`)
      .expect(409);

    const segunda = await prisma.matricula.findUniqueOrThrow({
      where: { id: matricula.id },
    });

    expect(segunda.canceladaEm?.getTime()).toBe(
      primeira.canceladaEm?.getTime()
    );
  });

  it("CT-08: deve liberar a vaga após cancelamento", async () => {
    const { disciplina, turma, matricula } =
      await criarCenario(1);

    const agente = await agenteAutenticado("aluno.si");

    const antes = await agente
      .get(`/api/aluno/ofertas?busca=${disciplina.codigo}`)
      .expect(200);

    const ofertaAntes = antes.body.ofertas.find(
      (item: { turmaId: number }) =>
        item.turmaId === turma.id
    );

    expect(ofertaAntes.vagasOcupadas).toBe(1);
    expect(ofertaAntes.vagasDisponiveis).toBe(0);

    await agente
      .patch(`/api/aluno/matriculas/${matricula.id}/cancelar`)
      .expect(200);

    const depois = await agente
      .get(`/api/aluno/ofertas?busca=${disciplina.codigo}`)
      .expect(200);

    const ofertaDepois = depois.body.ofertas.find(
      (item: { turmaId: number }) =>
        item.turmaId === turma.id
    );

    expect(ofertaDepois.vagasOcupadas).toBe(0);
    expect(ofertaDepois.vagasDisponiveis).toBe(1);
  });

  it("CT-09: deve permitir rematrícula após cancelamento", async () => {
    const { turma, matricula } = await criarCenario();

    const agente = await agenteAutenticado("aluno.si");

    await agente
      .patch(`/api/aluno/matriculas/${matricula.id}/cancelar`)
      .expect(200);

    const resposta = await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: turma.id })
      .expect(201);

    expect(resposta.body.matricula.id).not.toBe(matricula.id);

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

  it("CT-10: deve processar apenas um cancelamento simultâneo", async () => {
    const { matricula } = await criarCenario();
    const agente = await agenteAutenticado("aluno.si");

    const respostas = await Promise.all([
      agente.patch(
        `/api/aluno/matriculas/${matricula.id}/cancelar`
      ),
      agente.patch(
        `/api/aluno/matriculas/${matricula.id}/cancelar`
      ),
    ]);

    const status = respostas
      .map((resposta) => resposta.status)
      .sort((a, b) => a - b);

    expect(status).toEqual([200, 409]);

    const registro = await prisma.matricula.findUniqueOrThrow({
      where: { id: matricula.id },
    });

    expect(registro.situacao).toBe("CANCELADA");
    expect(registro.canceladaEm).not.toBeNull();
  });
});
