import "dotenv/config";

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
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

describe("US-09 — Edição de disciplinas", () => {
  const prefixoEdicao = `TUS09EDIT${Date.now()}`;

  let sequencia = 0;
  let disciplinaEditavelId = 0;
  let codigoEditavel = "";
  let codigoEmUso = "";

  const idsCriados: number[] = [];

  function rotaEdicao() {
    return `/api/secretaria/disciplinas/${disciplinaEditavelId}`;
  }

  beforeEach(async () => {
    if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
      throw new Error(
        "Os testes de edição exigem um banco SQLite de teste."
      );
    }

    sequencia += 1;

    codigoEditavel = `${prefixoEdicao}${sequencia}A`;
    codigoEmUso = `${prefixoEdicao}${sequencia}B`;

    const editavel = await prisma.disciplina.create({
      data: {
        codigo: codigoEditavel,
        nome: "Disciplina Original",
        cargaHoraria: 60,
      },
    });

    disciplinaEditavelId = editavel.id;
    idsCriados.push(editavel.id);

    const outra = await prisma.disciplina.create({
      data: {
        codigo: codigoEmUso,
        nome: "Outra Disciplina",
        cargaHoraria: 30,
      },
    });

    idsCriados.push(outra.id);
  });

  afterEach(async () => {
    if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
      return;
    }

    if (idsCriados.length === 0) {
      return;
    }

    // Remove somente os registros criados por este teste.
    // A limpeza por ID continua funcionando mesmo após
    // a alteração do código de uma disciplina.
    await prisma.disciplina.deleteMany({
      where: {
        id: {
          in: idsCriados,
        },
      },
    });

    idsCriados.length = 0;
  });

  it("CT-01: deve atualizar uma disciplina válida", async () => {
    const agente = await agenteAutenticado("secretaria");

    const novoCodigo = `${codigoEditavel}NOVO`;

    const resposta = await agente
      .patch(rotaEdicao())
      .send({
        codigo: ` ${novoCodigo.toLowerCase()} `,
        nome: "  Engenharia de Software  ",
        cargaHoraria: 90,
      })
      .expect(200);

    expect(resposta.body.message).toBe(
      "Disciplina atualizada com sucesso."
    );

    expect(resposta.body.disciplina).toMatchObject({
      id: disciplinaEditavelId,
      codigo: novoCodigo,
      nome: "Engenharia de Software",
      cargaHoraria: 90,
    });

    // Confirma que a atualização foi persistida no banco.
    const disciplinaBanco =
      await prisma.disciplina.findUnique({
        where: {
          id: disciplinaEditavelId,
        },
      });

    expect(disciplinaBanco).toMatchObject({
      codigo: novoCodigo,
      nome: "Engenharia de Software",
      cargaHoraria: 90,
    });
  });

  it("CT-02: deve permitir atualização parcial", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .patch(rotaEdicao())
      .send({
        nome: "Nome Atualizado",
      })
      .expect(200);

    expect(resposta.body.disciplina).toMatchObject({
      id: disciplinaEditavelId,
      codigo: codigoEditavel,
      nome: "Nome Atualizado",
      cargaHoraria: 60,
    });
  });

  it("CT-03: deve negar edição sem autenticação", async () => {
    await request(app)
      .patch(rotaEdicao())
      .send({
        nome: "Alteração Indevida",
      })
      .expect(401);
  });

  it("CT-04: deve impedir edição pelo aluno", async () => {
    const agente = await agenteAutenticado("aluno.si");

    await agente
      .patch(rotaEdicao())
      .send({
        nome: "Alteração Indevida",
      })
      .expect(403);

    const disciplinaBanco =
      await prisma.disciplina.findUnique({
        where: {
          id: disciplinaEditavelId,
        },
      });

    expect(disciplinaBanco?.nome).toBe(
      "Disciplina Original"
    );
  });

  it("CT-05: deve rejeitar identificador inválido", async () => {
    const agente = await agenteAutenticado("secretaria");

    const identificadoresInvalidos = [
      "abc",
      "0",
      "-1",
      "1.5",
      "999999999999999999999",
    ];

    for (const id of identificadoresInvalidos) {
      await agente
        .patch(`/api/secretaria/disciplinas/${id}`)
        .send({
          nome: "Nome Alterado",
        })
        .expect(400);
    }
  });

  it("CT-06: deve rejeitar disciplina inexistente", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .patch("/api/secretaria/disciplinas/2000000000")
      .send({
        nome: "Disciplina Inexistente",
      })
      .expect(404);

    expect(resposta.body.message).toBe(
      "Disciplina não encontrada."
    );
  });

  it("CT-07: deve rejeitar código duplicado", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .patch(rotaEdicao())
      .send({
        codigo: codigoEmUso.toLowerCase(),
      })
      .expect(409);

    expect(resposta.body.message).toBe(
      "Já existe uma disciplina com esse código."
    );

    // A tentativa não pode alterar o registro original.
    const disciplinaBanco =
      await prisma.disciplina.findUnique({
        where: {
          id: disciplinaEditavelId,
        },
      });

    expect(disciplinaBanco?.codigo).toBe(
      codigoEditavel
    );
  });

  it("CT-08: deve rejeitar carga horária inválida", async () => {
    const agente = await agenteAutenticado("secretaria");

    const valoresInvalidos = [
      0,
      14,
      16,
      121,
      -15,
      30.5,
      "60",
      null,
    ];

    for (const cargaHoraria of valoresInvalidos) {
      await agente
        .patch(rotaEdicao())
        .send({
          cargaHoraria,
        })
        .expect(400);
    }

    const disciplinaBanco =
      await prisma.disciplina.findUnique({
        where: {
          id: disciplinaEditavelId,
        },
      });

    expect(disciplinaBanco?.cargaHoraria).toBe(60);
  });

  it("CT-09: deve exigir pelo menos um campo", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .patch(rotaEdicao())
      .send({})
      .expect(400);

    await agente
      .patch(rotaEdicao())
      .send({
        campoDesconhecido: "valor",
      })
      .expect(400);
  });

  it("CT-10: deve rejeitar código e nome inválidos", async () => {
    const agente = await agenteAutenticado("secretaria");

    const entradasInvalidas = [
      { codigo: "" },
      { codigo: "   " },
      { codigo: 123 },
      { codigo: null },
      { nome: "" },
      { nome: "   " },
      { nome: 123 },
      { nome: null },
    ];

    for (const entrada of entradasInvalidas) {
      await agente
        .patch(rotaEdicao())
        .send(entrada)
        .expect(400);
    }
  });

  it("CT-11: deve permitir manter o próprio código", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .patch(rotaEdicao())
      .send({
        codigo: codigoEditavel,
        nome: "Disciplina Renomeada",
      })
      .expect(200);

    expect(resposta.body.disciplina).toMatchObject({
      id: disciplinaEditavelId,
      codigo: codigoEditavel,
      nome: "Disciplina Renomeada",
      cargaHoraria: 60,
    });
  });
});