import "dotenv/config";

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

const codigoTeste = `TUS08${Date.now()}`;

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

describe("US-08 — Cadastro de disciplinas", () => {
  beforeAll(() => {
    if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
      throw new Error(
        "Os testes da US-08 exigem um banco SQLite de teste."
      );
    }
  });

  afterAll(async () => {
    // Remove somente o registro criado por esta execução.
    await prisma.disciplina.deleteMany({
      where: {
        codigo: codigoTeste,
      },
    });
  });

  it("CT-01: deve negar acesso sem autenticação", async () => {
    await request(app)
      .post("/api/secretaria/disciplinas")
      .send({
        codigo: codigoTeste,
        nome: "Disciplina de Teste",
        cargaHoraria: 60,
      })
      .expect(401);
  });

  it("CT-02: deve impedir cadastro pelo aluno", async () => {
    const agente = await agenteAutenticado("aluno.si");

    await agente
      .post("/api/secretaria/disciplinas")
      .send({
        codigo: codigoTeste,
        nome: "Disciplina de Teste",
        cargaHoraria: 60,
      })
      .expect(403);
  });

  it("CT-03: deve cadastrar disciplina válida", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .post("/api/secretaria/disciplinas")
      .send({
        codigo: codigoTeste,
        nome: "Disciplina de Teste",
        cargaHoraria: 60,
      })
      .expect(201);

    expect(resposta.body.disciplina).toMatchObject({
      codigo: codigoTeste,
      nome: "Disciplina de Teste",
      cargaHoraria: 60,
    });

    expect(resposta.body.disciplina.id).toEqual(
      expect.any(Number)
    );
  });

  it("CT-04: deve rejeitar código duplicado", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .post("/api/secretaria/disciplinas")
      .send({
        codigo: codigoTeste,
        nome: "Disciplina Duplicada",
        cargaHoraria: 60,
      })
      .expect(409);

    expect(resposta.body.message).toBe(
      "Já existe uma disciplina com esse código."
    );
  });

  it("CT-05: deve validar a carga horária", async () => {
    const agente = await agenteAutenticado("secretaria");

    const valoresInvalidos = [0, 14, 16, 121, -15, 30.5];

    for (const cargaHoraria of valoresInvalidos) {
      await agente
        .post("/api/secretaria/disciplinas")
        .send({
          codigo: `${codigoTeste}INVALIDO`,
          nome: "Disciplina Inválida",
          cargaHoraria,
        })
        .expect(400);
    }
  });

  it("CT-06: deve exigir código e nome", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .post("/api/secretaria/disciplinas")
      .send({
        nome: "Sem código",
        cargaHoraria: 60,
      })
      .expect(400);

    await agente
      .post("/api/secretaria/disciplinas")
      .send({
        codigo: `${codigoTeste}SEM_NOME`,
        cargaHoraria: 60,
      })
      .expect(400);
  });
});