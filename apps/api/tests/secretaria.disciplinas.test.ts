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

describe("US-09 — Cadastro de disciplinas", () => {
  beforeAll(() => {
    if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
      throw new Error(
        "Os testes da US-08 exigem um banco SQLite de teste."
      );
    }
  });

  afterAll(async () => {
    if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
        return;
    }
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

const codigoListagem = `TUS08LIST${Date.now()}`;

const disciplinasListagem = [
  {
    codigo: `${codigoListagem}A`,
    nome: `BuscaNome${codigoListagem}`,
    cargaHoraria: 30,
  },
  {
    codigo: `${codigoListagem}B`,
    nome: "Disciplina de Listagem B",
    cargaHoraria: 60,
  },
  {
    codigo: `${codigoListagem}C`,
    nome: "Disciplina de Listagem C",
    cargaHoraria: 90,
  },
];

describe("US-08 — Consulta de disciplinas", () => {
  beforeAll(async () => {
    if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
      throw new Error(
        "A listagem deve ser testada somente no banco de testes."
      );
    }

    await prisma.disciplina.createMany({
      data: disciplinasListagem,
    });
  });

  afterAll(async () => {
    if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
      return;
    }

    await prisma.disciplina.deleteMany({
      where: {
        codigo: {
          in: disciplinasListagem.map(
            (disciplina) => disciplina.codigo
          ),
        },
      },
    });
  });

  it("CT-01: deve negar consulta sem autenticação", async () => {
    await request(app)
      .get("/api/secretaria/disciplinas")
      .expect(401);
  });

  it("CT-02: deve impedir consulta pelo aluno", async () => {
    const agente = await agenteAutenticado("aluno.si");

    await agente
      .get("/api/secretaria/disciplinas")
      .expect(403);
  });

  it("CT-03: deve listar disciplinas para a secretaria", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/disciplinas")
      .query({
        busca: codigoListagem,
        pagina: 1,
        limite: 10,
      })
      .expect(200);

    expect(resposta.body.disciplinas).toHaveLength(3);

    expect(resposta.body.paginacao).toMatchObject({
      pagina: 1,
      limite: 10,
      total: 3,
      totalPaginas: 1,
    });
  });

  it("CT-04: deve pesquisar pelo código", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/disciplinas")
      .query({
        busca: `${codigoListagem}B`,
      })
      .expect(200);

    expect(resposta.body.disciplinas).toHaveLength(1);

    expect(resposta.body.disciplinas[0].codigo).toBe(
      `${codigoListagem}B`
    );
  });

  it("CT-05: deve pesquisar pelo nome", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/disciplinas")
      .query({
        busca: `BuscaNome${codigoListagem}`,
      })
      .expect(200);

    expect(resposta.body.disciplinas).toHaveLength(1);

    expect(resposta.body.disciplinas[0].nome).toBe(
      `BuscaNome${codigoListagem}`
    );
  });

  it("CT-06: deve paginar sem repetir disciplinas", async () => {
    const agente = await agenteAutenticado("secretaria");

    const primeira = await agente
      .get("/api/secretaria/disciplinas")
      .query({
        busca: codigoListagem,
        pagina: 1,
        limite: 2,
      })
      .expect(200);

    const segunda = await agente
      .get("/api/secretaria/disciplinas")
      .query({
        busca: codigoListagem,
        pagina: 2,
        limite: 2,
      })
      .expect(200);

    expect(
      primeira.body.disciplinas.map(
        (disciplina: { codigo: string }) => disciplina.codigo
      )
    ).toEqual([
      `${codigoListagem}A`,
      `${codigoListagem}B`,
    ]);

    expect(
      segunda.body.disciplinas.map(
        (disciplina: { codigo: string }) => disciplina.codigo
      )
    ).toEqual([
      `${codigoListagem}C`,
    ]);

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
    ];

    for (const consulta of consultasInvalidas) {
      await agente
        .get("/api/secretaria/disciplinas")
        .query(consulta)
        .expect(400);
    }
  });

  it("CT-08: deve retornar lista vazia quando não encontrar resultados", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/disciplinas")
      .query({
        busca: `INEXISTENTE${codigoListagem}`,
      })
      .expect(200);

    expect(resposta.body.disciplinas).toEqual([]);

    expect(resposta.body.paginacao).toMatchObject({
      total: 0,
      totalPaginas: 0,
    });
  });
});