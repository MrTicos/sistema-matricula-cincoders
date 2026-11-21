import "dotenv/config";

import { randomUUID } from "node:crypto";
import {
  beforeAll,
  afterAll,
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";

import { app } from "../src/app";
import { prisma } from "../src/config/database";

let disciplinaId: number;
let turmaId: number;

let matriculaSIId: number;
let matriculaCCId: number;
let matriculaCanceladaId: number;

async function agenteAutenticado(username: string) {
  const senha = process.env.SEED_PASSWORD;

  if (!senha) {
    throw new Error("SEED_PASSWORD não configurada.");
  }

  const agente = request.agent(app);

  await agente
    .post("/api/auth/login")
    .send({ username, senha })
    .expect(200);

  return agente;
}

beforeAll(async () => {
  if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
    throw new Error(
      "Os testes exigem um banco SQLite de teste."
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

  const disciplina = await prisma.disciplina.create({
    data: {
      codigo: `US05-${randomUUID()}`,
      nome: "Disciplina para testes da US-05",
      cargaHoraria: 60,
    },
  });

  disciplinaId = disciplina.id;

  const turma = await prisma.turma.create({
    data: {
      disciplinaId,
      professorId: professor.id,
      vagasTotais: 10,
    },
  });

  turmaId = turma.id;

  const matriculaSI = await prisma.matricula.create({
    data: {
      alunoId: alunoSI.id,
      turmaId,
      situacao: "ATIVA",
    },
  });

  matriculaSIId = matriculaSI.id;

  const matriculaCC = await prisma.matricula.create({
    data: {
      alunoId: alunoCC.id,
      turmaId,
      situacao: "ATIVA",
    },
  });

  matriculaCCId = matriculaCC.id;

  const cancelada = await prisma.matricula.create({
    data: {
      alunoId: alunoSI.id,
      turmaId,
      situacao: "CANCELADA",
      canceladaEm: new Date(),
    },
  });

  matriculaCanceladaId = cancelada.id;
});

afterAll(async () => {
  const ids = [
    matriculaSIId,
    matriculaCCId,
    matriculaCanceladaId,
  ].filter((id): id is number => Number.isInteger(id));

  if (ids.length > 0) {
    await prisma.matricula.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  if (turmaId !== undefined) {
    await prisma.turma.deleteMany({
      where: { id: turmaId },
    });
  }

  if (disciplinaId !== undefined) {
    await prisma.disciplina.deleteMany({
      where: { id: disciplinaId },
    });
  }
});

describe("US-05 — Consultar matrículas ativas", () => {
  it("CT-01: deve negar acesso sem autenticação", async () => {
    await request(app)
      .get("/api/aluno/matriculas")
      .expect(401);
  });

  it("CT-02: deve impedir acesso da secretaria", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .get("/api/aluno/matriculas")
      .expect(403);
  });

  it("CT-03: deve listar as matrículas ativas do aluno", async () => {
    const agente = await agenteAutenticado("aluno.si");

    const resposta = await agente
      .get("/api/aluno/matriculas")
      .expect(200);

    expect(Array.isArray(resposta.body.matriculas)).toBe(true);

    const matricula = resposta.body.matriculas.find(
      (item: { id: number }) => item.id === matriculaSIId
    );

    expect(matricula).toBeDefined();

    expect(matricula).toMatchObject({
      id: matriculaSIId,
      turmaId,
      disciplina: {
        codigo: expect.any(String),
        nome: expect.any(String),
        cargaHoraria: 60,
      },
      professor: {
        nome: expect.any(String),
      },
    });

    expect(matricula.criadaEm).toEqual(
      expect.any(String)
    );
  });

  it("CT-04: não deve listar matrículas canceladas", async () => {
    const agente = await agenteAutenticado("aluno.si");

    const resposta = await agente
      .get("/api/aluno/matriculas")
      .expect(200);

    const ids = resposta.body.matriculas.map(
      (item: { id: number }) => item.id
    );

    expect(ids).not.toContain(matriculaCanceladaId);
  });

  it("CT-05: não deve expor matrículas de outro aluno", async () => {
    const agente = await agenteAutenticado("aluno.si");

    const resposta = await agente
      .get("/api/aluno/matriculas")
      .expect(200);

    const ids = resposta.body.matriculas.map(
      (item: { id: number }) => item.id
    );

    expect(ids).toContain(matriculaSIId);
    expect(ids).not.toContain(matriculaCCId);
  });

  it("CT-06: deve ignorar tentativa de escolher outro aluno", async () => {
    const alunoCC = await prisma.aluno.findFirstOrThrow({
      where: {
        usuario: { username: "aluno.cc" },
      },
      select: { id: true },
    });

    const agente = await agenteAutenticado("aluno.si");

    const resposta = await agente
      .get("/api/aluno/matriculas")
      .query({ alunoId: alunoCC.id })
      .expect(200);

    const ids = resposta.body.matriculas.map(
      (item: { id: number }) => item.id
    );

    expect(ids).not.toContain(matriculaCCId);
  });

  it("CT-07: deve retornar lista vazia para aluno sem matrículas", async () => {
    const agente = await agenteAutenticado("aluno.ec");

    const resposta = await agente
        .get("/api/aluno/matriculas")
        .expect(200);

    expect(resposta.body.matriculas).toEqual([]);
    });
});