import "dotenv/config";

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";

import { app } from "../src/app";
import { prisma } from "../src/config/database";

const marcador = `TUS11${Date.now()}`;
const nomeDisciplina = `BuscaDisciplina${marcador}`;
const nomeProfessor = `BuscaProfessor${marcador}`;

let disciplinaId = 0;
let professorId = 0;
const idsTurmasCriadas: number[] = [];

function exigirBancoTeste() {
  if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("A US-11 deve ser testada apenas no banco de testes.");
  }
}

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

describe("US-11 — Consulta e abertura de turmas", () => {
  beforeAll(async () => {
    exigirBancoTeste();

    const disciplina = await prisma.disciplina.create({
      data: {
        codigo: marcador,
        nome: nomeDisciplina,
        cargaHoraria: 60,
      },
    });
    disciplinaId = disciplina.id;

    const professor = await prisma.professor.create({
      data: {
        nome: nomeProfessor,
        email: `${marcador.toLowerCase()}@example.com`,
      },
    });
    professorId = professor.id;

    for (const vagasTotais of [2, 4, 6]) {
      const turma = await prisma.turma.create({
        data: { disciplinaId, professorId, vagasTotais },
      });
      idsTurmasCriadas.push(turma.id);
    }

    const aluno = await prisma.aluno.findFirst({
      select: { id: true },
    });

    if (!aluno) {
      throw new Error("O seed de testes precisa conter ao menos um aluno.");
    }

    await prisma.matricula.createMany({
      data: [
        {
          alunoId: aluno.id,
          turmaId: idsTurmasCriadas[0],
          situacao: "ATIVA",
        },
        {
          alunoId: aluno.id,
          turmaId: idsTurmasCriadas[0],
          situacao: "CANCELADA",
          canceladaEm: new Date(),
        },
      ],
    });
  });

  afterAll(async () => {
    if (!/test/i.test(process.env.DATABASE_URL ?? "")) return;

    if (idsTurmasCriadas.length > 0) {
      await prisma.matricula.deleteMany({
        where: { turmaId: { in: idsTurmasCriadas } },
      });
      await prisma.turma.deleteMany({
        where: { id: { in: idsTurmasCriadas } },
      });
    }

    if (disciplinaId > 0) {
      await prisma.disciplina.deleteMany({ where: { id: disciplinaId } });
    }

    if (professorId > 0) {
      await prisma.professor.deleteMany({ where: { id: professorId } });
    }
  });

  it("CT-01: deve negar consulta sem autenticação", async () => {
    await request(app).get("/api/secretaria/turmas").expect(401);
  });

  it("CT-02: deve negar consulta ao aluno", async () => {
    const agente = await agenteAutenticado("aluno.si");

    await agente.get("/api/secretaria/turmas").expect(403);
  });

  it("CT-03: deve listar turmas com disciplina, professor e vagas ativas", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/turmas")
      .query({ busca: marcador, pagina: 1, limite: 10 })
      .expect(200);

    expect(resposta.body.turmas).toHaveLength(3);
    expect(resposta.body.turmas[0]).toMatchObject({
      id: idsTurmasCriadas[0],
      disciplinaId,
      professorId,
      vagasTotais: 2,
      vagasOcupadas: 1,
      vagasDisponiveis: 1,
      disciplina: {
        codigo: marcador,
        nome: nomeDisciplina,
      },
      professor: {
        nome: nomeProfessor,
      },
    });

    expect(resposta.body.paginacao).toMatchObject({
      pagina: 1,
      limite: 10,
      total: 3,
      totalPaginas: 1,
    });
  });

  it("CT-04: deve pesquisar pelo código da disciplina", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/turmas")
      .query({ busca: marcador.toLowerCase() })
      .expect(200);

    expect(resposta.body.turmas).toHaveLength(3);
  });

  it("CT-05: deve pesquisar pelo nome do professor", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/turmas")
      .query({ busca: nomeProfessor })
      .expect(200);

    expect(resposta.body.turmas).toHaveLength(3);
  });

  it("CT-06: deve paginar em ordem estável sem repetir turmas", async () => {
    const agente = await agenteAutenticado("secretaria");

    const primeira = await agente
      .get("/api/secretaria/turmas")
      .query({ busca: marcador, pagina: 1, limite: 2 })
      .expect(200);

    const segunda = await agente
      .get("/api/secretaria/turmas")
      .query({ busca: marcador, pagina: 2, limite: 2 })
      .expect(200);

    expect(
      primeira.body.turmas.map((turma: { id: number }) => turma.id)
    ).toEqual(idsTurmasCriadas.slice(0, 2));

    expect(
      segunda.body.turmas.map((turma: { id: number }) => turma.id)
    ).toEqual([idsTurmasCriadas[2]]);

    expect(primeira.body.paginacao.totalPaginas).toBe(2);
  });

  it("CT-07: deve rejeitar parâmetros inválidos", async () => {
    const agente = await agenteAutenticado("secretaria");

    const invalidos = [
      { pagina: 0 },
      { pagina: -1 },
      { pagina: "abc" },
      { pagina: "1.5" },
      { limite: 0 },
      { limite: 51 },
      { busca: "x".repeat(101) },
    ];

    for (const parametros of invalidos) {
      await agente
        .get("/api/secretaria/turmas")
        .query(parametros)
        .expect(400);
    }
  });

  it("CT-08: deve retornar lista vazia sem resultados", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .get("/api/secretaria/turmas")
      .query({ busca: `INEXISTENTE${marcador}` })
      .expect(200);

    expect(resposta.body.turmas).toEqual([]);
    expect(resposta.body.paginacao).toMatchObject({
      total: 0,
      totalPaginas: 0,
    });
  });

  it("CT-09: deve abrir turma válida e persistir no banco", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .post("/api/secretaria/turmas")
      .send({ disciplinaId, professorId, vagasTotais: 20 })
      .expect(201);

    const turmaCriada = resposta.body.turma;
    idsTurmasCriadas.push(turmaCriada.id);

    expect(turmaCriada).toMatchObject({
      disciplinaId,
      professorId,
      vagasTotais: 20,
      vagasOcupadas: 0,
      vagasDisponiveis: 20,
    });

    const persistida = await prisma.turma.findUnique({
      where: { id: turmaCriada.id },
    });

    expect(persistida).toMatchObject({
      disciplinaId,
      professorId,
      vagasTotais: 20,
    });
  });

  it("CT-10: deve rejeitar vagas inválidas sem criar turma", async () => {
    const agente = await agenteAutenticado("secretaria");

    for (const vagasTotais of [0, -1, 2.5, "10", 2_147_483_648]) {
      await agente
        .post("/api/secretaria/turmas")
        .send({ disciplinaId, professorId, vagasTotais })
        .expect(400);
    }
  });

  it("CT-11: deve rejeitar IDs inválidos", async () => {
    const agente = await agenteAutenticado("secretaria");

    for (const dados of [
      { disciplinaId: "1", professorId, vagasTotais: 10 },
      { disciplinaId: 0, professorId, vagasTotais: 10 },
      { disciplinaId, professorId: -1, vagasTotais: 10 },
      { disciplinaId, professorId: null, vagasTotais: 10 },
    ]) {
      await agente.post("/api/secretaria/turmas").send(dados).expect(400);
    }
  });

  it("CT-12: deve rejeitar disciplina inexistente", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .post("/api/secretaria/turmas")
      .send({
        disciplinaId: 2_147_483_647,
        professorId,
        vagasTotais: 10,
      })
      .expect(404);
  });

  it("CT-13: deve rejeitar professor inexistente", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .post("/api/secretaria/turmas")
      .send({
        disciplinaId,
        professorId: 2_147_483_647,
        vagasTotais: 10,
      })
      .expect(404);
  });

  it("CT-14: deve negar abertura sem autenticação", async () => {
    await request(app)
      .post("/api/secretaria/turmas")
      .send({ disciplinaId, professorId, vagasTotais: 10 })
      .expect(401);
  });

  it("CT-15: deve negar abertura pelo aluno", async () => {
    const agente = await agenteAutenticado("aluno.si");

    await agente
      .post("/api/secretaria/turmas")
      .send({ disciplinaId, professorId, vagasTotais: 10 })
      .expect(403);
  });
});

const codigoUS12 = `TUS12${Date.now()}`;

let turmaIdUS12 = 0;
let disciplinaIdUS12 = 0;
let professorIdUS12 = 0;

describe("US-12 — Alteração da capacidade das turmas", () => {
  beforeAll(async () => {
    exigirBancoTeste();

    const alunos = await prisma.aluno.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
      take: 3,
    });

    if (alunos.length < 3) {
      throw new Error(
        "O banco de testes precisa conter pelo menos três alunos."
      );
    }

    const disciplina = await prisma.disciplina.create({
      data: {
        codigo: codigoUS12,
        nome: "Disciplina de Teste US-12",
        cargaHoraria: 60,
      },
    });

    disciplinaIdUS12 = disciplina.id;

    const professor = await prisma.professor.create({
      data: {
        nome: "Professor de Teste US-12",
        email: `${codigoUS12.toLowerCase()}@example.com`,
      },
    });

    professorIdUS12 = professor.id;

    const turma = await prisma.turma.create({
      data: {
        disciplinaId: disciplinaIdUS12,
        professorId: professorIdUS12,
        vagasTotais: 5,
      },
    });

    turmaIdUS12 = turma.id;

    // Duas matrículas ativas e uma cancelada.
    await prisma.matricula.createMany({
      data: [
        {
          alunoId: alunos[0].id,
          turmaId: turmaIdUS12,
          situacao: "ATIVA",
        },
        {
          alunoId: alunos[1].id,
          turmaId: turmaIdUS12,
          situacao: "ATIVA",
        },
        {
          alunoId: alunos[2].id,
          turmaId: turmaIdUS12,
          situacao: "CANCELADA",
          canceladaEm: new Date(),
        },
      ],
    });
  });

  beforeEach(async () => {
    // Cada teste começa com cinco vagas.
    if (turmaIdUS12 > 0) {
      await prisma.turma.update({
        where: { id: turmaIdUS12 },
        data: { vagasTotais: 5 },
      });
    }
  });

  afterAll(async () => {
    if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
      return;
    }

    if (turmaIdUS12 > 0) {
      await prisma.matricula.deleteMany({
        where: { turmaId: turmaIdUS12 },
      });

      await prisma.turma.deleteMany({
        where: { id: turmaIdUS12 },
      });
    }

    if (disciplinaIdUS12 > 0) {
      await prisma.disciplina.deleteMany({
        where: { id: disciplinaIdUS12 },
      });
    }

    if (professorIdUS12 > 0) {
      await prisma.professor.deleteMany({
        where: { id: professorIdUS12 },
      });
    }
  });

  it("CT-01: deve negar alteração sem autenticação", async () => {
    await request(app)
      .patch(`/api/secretaria/turmas/${turmaIdUS12}/vagas`)
      .send({ vagasTotais: 10 })
      .expect(401);
  });

  it("CT-02: deve impedir alteração pelo aluno", async () => {
    const agente = await agenteAutenticado("aluno.si");

    await agente
      .patch(`/api/secretaria/turmas/${turmaIdUS12}/vagas`)
      .send({ vagasTotais: 10 })
      .expect(403);
  });

  it("CT-03: deve aumentar a capacidade da turma", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .patch(`/api/secretaria/turmas/${turmaIdUS12}/vagas`)
      .send({ vagasTotais: 10 })
      .expect(200);

    expect(resposta.body.turma).toMatchObject({
      id: turmaIdUS12,
      vagasTotais: 10,
      vagasOcupadas: 2,
      vagasDisponiveis: 8,
    });

    const turma = await prisma.turma.findUnique({
      where: { id: turmaIdUS12 },
    });

    expect(turma?.vagasTotais).toBe(10);
  });

  it("CT-04: deve reduzir a capacidade respeitando a ocupação", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .patch(`/api/secretaria/turmas/${turmaIdUS12}/vagas`)
      .send({ vagasTotais: 3 })
      .expect(200);

    expect(resposta.body.turma).toMatchObject({
      vagasTotais: 3,
      vagasOcupadas: 2,
      vagasDisponiveis: 1,
    });
  });

  it("CT-05: deve permitir capacidade igual às matrículas ativas", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .patch(`/api/secretaria/turmas/${turmaIdUS12}/vagas`)
      .send({ vagasTotais: 2 })
      .expect(200);

    expect(resposta.body.turma).toMatchObject({
      vagasTotais: 2,
      vagasOcupadas: 2,
      vagasDisponiveis: 0,
    });

    // A matrícula cancelada não ocupa uma terceira vaga.
  });

  it("CT-06: deve impedir redução abaixo das matrículas ativas", async () => {
    const agente = await agenteAutenticado("secretaria");

    const resposta = await agente
      .patch(`/api/secretaria/turmas/${turmaIdUS12}/vagas`)
      .send({ vagasTotais: 1 })
      .expect(409);

    expect(resposta.body.vagasOcupadas).toBe(2);

    const turma = await prisma.turma.findUnique({
      where: { id: turmaIdUS12 },
    });

    // A alteração rejeitada não pode modificar o banco.
    expect(turma?.vagasTotais).toBe(5);
  });

  it("CT-07: deve rejeitar capacidades inválidas", async () => {
    const agente = await agenteAutenticado("secretaria");

    const valoresInvalidos = [
      0,
      -1,
      1.5,
      "10",
      null,
      2_147_483_648,
    ];

    for (const vagasTotais of valoresInvalidos) {
      await agente
        .patch(`/api/secretaria/turmas/${turmaIdUS12}/vagas`)
        .send({ vagasTotais })
        .expect(400);
    }

    const turma = await prisma.turma.findUnique({
      where: { id: turmaIdUS12 },
    });

    expect(turma?.vagasTotais).toBe(5);
  });

  it("CT-08: deve rejeitar identificadores inválidos", async () => {
    const agente = await agenteAutenticado("secretaria");

    const identificadoresInvalidos = [
      "abc",
      "0",
      "-1",
      "1.5",
      "2147483648",
    ];

    for (const id of identificadoresInvalidos) {
      await agente
        .patch(`/api/secretaria/turmas/${id}/vagas`)
        .send({ vagasTotais: 10 })
        .expect(400);
    }
  });

  it("CT-09: deve rejeitar turma inexistente", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .patch("/api/secretaria/turmas/2147483647/vagas")
      .send({ vagasTotais: 10 })
      .expect(404);
  });

  it("CT-10: deve refletir a capacidade atualizada na consulta", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .patch(`/api/secretaria/turmas/${turmaIdUS12}/vagas`)
      .send({ vagasTotais: 7 })
      .expect(200);

    const resposta = await agente
      .get("/api/secretaria/turmas")
      .query({ busca: codigoUS12 })
      .expect(200);

    expect(resposta.body.turmas).toHaveLength(1);

    expect(resposta.body.turmas[0]).toMatchObject({
      id: turmaIdUS12,
      vagasTotais: 7,
      vagasOcupadas: 2,
      vagasDisponiveis: 5,
    });
  });
});