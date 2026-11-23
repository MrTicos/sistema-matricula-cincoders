import "dotenv/config";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

import { app } from "../src/app";
import { prisma } from "../src/config/database";

const identificador = Date.now();
const nomeBusca = `BuscaUS10${identificador}`;
const prefixoEmail = `us10-${identificador}`;

const professoresTeste = [
  {
    nome: `${nomeBusca} A`,
    email: `${prefixoEmail}-a@example.com`,
  },
  {
    nome: `${nomeBusca} B`,
    email: `${prefixoEmail}-b@example.com`,
  },
  {
    nome: `${nomeBusca} C`,
    email: `${prefixoEmail}-c@example.com`,
  },
];

const idsCriados: number[] = [];

function exigirBancoDeTestes() {
  if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Os testes da US-10 exigem um banco SQLite de teste.");
  }
}

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

describe("US-10 — Listagem e cadastro de professores", () => {
  beforeAll(async () => {
    exigirBancoDeTestes();

    for (const dados of professoresTeste) {
      const professor = await prisma.professor.create({ data: dados });
      idsCriados.push(professor.id);
    }
  });

  afterAll(async () => {
    // Se a preparação falhar antes de criar algum registro,
    // não tente excluir professores de outros testes.
    if (!/test/i.test(process.env.DATABASE_URL ?? "")) return;
    if (idsCriados.length === 0) return;

    await prisma.professor.deleteMany({
      where: { id: { in: idsCriados } },
    });
  });

  it("CT-01: deve negar consulta sem autenticação", async () => {
    await request(app)
      .get("/api/secretaria/professores")
      .expect(401);
  });

  it("CT-02: deve impedir consulta pelo aluno", async () => {
    const agente = await agenteAutenticado("aluno.si");

    await agente
      .get("/api/secretaria/professores")
      .expect(403);
  });

  it("CT-03: deve listar professores para a secretaria", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/professores")
      .query({ busca: nomeBusca, pagina: 1, limite: 10 })
      .expect(200);

    expect(resposta.body.professores).toHaveLength(3);
    expect(resposta.body.professores).toEqual(
      expect.arrayContaining([
        expect.objectContaining(professoresTeste[0]),
        expect.objectContaining(professoresTeste[1]),
        expect.objectContaining(professoresTeste[2]),
      ])
    );

    expect(resposta.body.paginacao).toMatchObject({
      pagina: 1,
      limite: 10,
      total: 3,
      totalPaginas: 1,
    });
  });

  it("CT-04: deve pesquisar professor pelo nome", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/professores")
      .query({ busca: `${nomeBusca} B` })
      .expect(200);

    expect(resposta.body.professores).toHaveLength(1);
    expect(resposta.body.professores[0]).toMatchObject(professoresTeste[1]);
  });

  it("CT-05: deve pesquisar professor pelo e-mail", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/professores")
      .query({ busca: professoresTeste[1].email })
      .expect(200);

    expect(resposta.body.professores).toHaveLength(1);
    expect(resposta.body.professores[0]).toMatchObject(professoresTeste[1]);
  });

  it("CT-06: deve paginar sem repetir professores", async () => {
    const agente = await agenteAutenticado("secretaria");

    const primeira = await agente
      .get("/api/secretaria/professores")
      .query({ busca: nomeBusca, pagina: 1, limite: 2 })
      .expect(200);

    const segunda = await agente
      .get("/api/secretaria/professores")
      .query({ busca: nomeBusca, pagina: 2, limite: 2 })
      .expect(200);

    expect(primeira.body.professores.map(
      (professor: { nome: string }) => professor.nome
    )).toEqual([professoresTeste[0].nome, professoresTeste[1].nome]);

    expect(segunda.body.professores.map(
      (professor: { nome: string }) => professor.nome
    )).toEqual([professoresTeste[2].nome]);

    expect(primeira.body.paginacao).toMatchObject({
      pagina: 1,
      limite: 2,
      total: 3,
      totalPaginas: 2,
    });
  });

  it("CT-07: deve rejeitar parâmetros inválidos", async () => {
    const agente = await agenteAutenticado("secretaria");

    const consultasInvalidas = [
      { pagina: 0 },
      { pagina: -1 },
      { pagina: "abc" },
      { pagina: "1.5" },
      { limite: 0 },
      { limite: 51 },
      { busca: "x".repeat(101) },
    ];

    for (const consulta of consultasInvalidas) {
      await agente
        .get("/api/secretaria/professores")
        .query(consulta)
        .expect(400);
    }
  });

  it("CT-08: deve retornar lista vazia sem resultados", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/professores")
      .query({ busca: `INEXISTENTE${identificador}` })
      .expect(200);

    expect(resposta.body.professores).toEqual([]);
    expect(resposta.body.paginacao).toMatchObject({
      total: 0,
      totalPaginas: 0,
    });
  });

  it("CT-09: deve cadastrar professor válido e persistir no banco", async () => {
    const agente = await agenteAutenticado("secretaria");
    const email = `${prefixoEmail}-novo@example.com`;

    const resposta = await agente
      .post("/api/secretaria/professores")
      .send({
        nome: "  Professor de Teste US-10  ",
        email: ` ${email.toUpperCase()} `,
      })
      .expect(201);

    expect(resposta.body.message).toBe("Professor cadastrado com sucesso.");
    expect(resposta.body.professor).toMatchObject({
      nome: "Professor de Teste US-10",
      email,
    });
    expect(resposta.body.professor.id).toEqual(expect.any(Number));

    idsCriados.push(resposta.body.professor.id);

    const registro = await prisma.professor.findUnique({
      where: { email },
    });

    expect(registro).toMatchObject({
      nome: "Professor de Teste US-10",
      email,
    });
  });

  it("CT-10: deve rejeitar e-mail duplicado", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .post("/api/secretaria/professores")
      .send({
        nome: "Professor Duplicado",
        email: professoresTeste[1].email.toUpperCase(),
      })
      .expect(409);

    expect(resposta.body.message).toBe(
      "Já existe um professor com esse e-mail."
    );

    expect(await prisma.professor.count({
      where: { email: professoresTeste[1].email },
    })).toBe(1);
  });

  it("CT-11: deve rejeitar nome inválido", async () => {
    const agente = await agenteAutenticado("secretaria");

    const nomesInvalidos = ["", "   ", null, 42, "x".repeat(151)];

    for (const nome of nomesInvalidos) {
      await agente
        .post("/api/secretaria/professores")
        .send({ nome, email: `${prefixoEmail}-invalido@example.com` })
        .expect(400);
    }
  });

  it("CT-12: deve rejeitar e-mail inválido", async () => {
    const agente = await agenteAutenticado("secretaria");

    const emailsInvalidos = [
      "",
      "   ",
      "semarroba",
      "professor@",
      "@example.com",
      "professor@example",
      "nome com espaco@example.com",
      null,
      42,
      `${"a".repeat(255)}@example.com`,
    ];

    for (const email of emailsInvalidos) {
      await agente
        .post("/api/secretaria/professores")
        .send({ nome: "Professor Inválido", email })
        .expect(400);
    }
  });

  it("CT-13: deve impedir cadastro pelo aluno", async () => {
    const agente = await agenteAutenticado("aluno.si");

    await agente
      .post("/api/secretaria/professores")
      .send({
        nome: "Cadastro Indevido",
        email: `${prefixoEmail}-aluno@example.com`,
      })
      .expect(403);
  });

  it("CT-14: deve impedir cadastro sem autenticação", async () => {
    await request(app)
      .post("/api/secretaria/professores")
      .send({
        nome: "Cadastro Indevido",
        email: `${prefixoEmail}-anonimo@example.com`,
      })
      .expect(401);
  });
});
