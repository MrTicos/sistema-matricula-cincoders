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

const prefixo = `TUS13${Date.now()}`;

const idsUsuarios: number[] = [];
const idsAlunos: number[] = [];
const idsCanceladas: number[] = [];

const usuariosTeste: {
  username: string;
  alunoId: number;
}[] = [];

let disciplinaId = 0;
let professorId = 0;
let turmaId = 0;
let matriculaAtivaId = 0;
let matriculaOutroAlunoId = 0;

function exigirBancoTeste() {
  if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
    throw new Error(
      "A US-13 deve ser testada somente no banco de testes."
    );
  }
}

function usuarioTeste(indice: number) {
  const usuario = usuariosTeste[indice];

  if (!usuario) {
    throw new Error("Usuário de teste não encontrado.");
  }

  return usuario;
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

describe("US-13 — Histórico de matrículas canceladas", () => {
  beforeAll(async () => {
    exigirBancoTeste();

    const usuarioBase = await prisma.usuario.findUnique({
      where: {
        username: "aluno.si",
      },
      select: {
        senhaHash: true,
        aluno: {
          select: {
            cursoId: true,
          },
        },
      },
    });

    if (!usuarioBase?.aluno) {
      throw new Error("Aluno base não encontrado no seed.");
    }

    // Cria três alunos exclusivos para esta execução.
    // O hash do seed é reutilizado apenas no banco de testes.
    for (let indice = 1; indice <= 3; indice++) {
      const username = `${prefixo}ALUNO${indice}`;

      const usuario = await prisma.usuario.create({
        data: {
          username,
          nome: `Aluno de Teste US-13 ${indice}`,
          senhaHash: usuarioBase.senhaHash,
          perfil: "ALUNO",
        },
      });

      idsUsuarios.push(usuario.id);

      const aluno = await prisma.aluno.create({
        data: {
          usuarioId: usuario.id,
          cursoId: usuarioBase.aluno.cursoId,
        },
      });

      idsAlunos.push(aluno.id);

      usuariosTeste.push({
        username,
        alunoId: aluno.id,
      });
    }

    const disciplina = await prisma.disciplina.create({
      data: {
        codigo: `${prefixo}DISC`,
        nome: "Disciplina do Histórico US-13",
        cargaHoraria: 60,
      },
    });

    disciplinaId = disciplina.id;

    const professor = await prisma.professor.create({
      data: {
        nome: "Professor do Histórico US-13",
        email: `${prefixo.toLowerCase()}@teste.local`,
      },
    });

    professorId = professor.id;

    const turma = await prisma.turma.create({
      data: {
        disciplinaId,
        professorId,
        vagasTotais: 10,
      },
    });

    turmaId = turma.id;

    // Aluno 1: três matrículas canceladas.
    const datasCancelamento = [
      "2026-11-19T12:00:00.000Z",
      "2026-11-20T12:00:00.000Z",
      "2026-11-21T12:00:00.000Z",
    ];

    for (const data of datasCancelamento) {
      const matricula = await prisma.matricula.create({
        data: {
          alunoId: usuarioTeste(0).alunoId,
          turmaId,
          situacao: "CANCELADA",
          criadaEm: new Date("2026-11-10T12:00:00.000Z"),
          canceladaEm: new Date(data),
        },
      });

      idsCanceladas.push(matricula.id);
    }

    // Aluno 1: uma matrícula ativa, que não deve aparecer.
    const matriculaAtiva = await prisma.matricula.create({
      data: {
        alunoId: usuarioTeste(0).alunoId,
        turmaId,
        situacao: "ATIVA",
      },
    });

    matriculaAtivaId = matriculaAtiva.id;

    // Aluno 2: uma matrícula cancelada, para testar privacidade.
    const matriculaOutroAluno = await prisma.matricula.create({
      data: {
        alunoId: usuarioTeste(1).alunoId,
        turmaId,
        situacao: "CANCELADA",
        criadaEm: new Date("2026-11-10T12:00:00.000Z"),
        canceladaEm: new Date("2026-11-21T15:00:00.000Z"),
      },
    });

    matriculaOutroAlunoId = matriculaOutroAluno.id;

    // Aluno 3 permanece sem matrículas.
  }, 30000);

  afterAll(async () => {
    if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
      return;
    }

    if (idsAlunos.length > 0) {
      await prisma.matricula.deleteMany({
        where: {
          alunoId: {
            in: idsAlunos,
          },
        },
      });
    }

    if (turmaId) {
      await prisma.turma.deleteMany({
        where: { id: turmaId },
      });
    }

    if (disciplinaId) {
      await prisma.disciplina.deleteMany({
        where: { id: disciplinaId },
      });
    }

    if (professorId) {
      await prisma.professor.deleteMany({
        where: { id: professorId },
      });
    }

    if (idsAlunos.length > 0) {
      await prisma.aluno.deleteMany({
        where: {
          id: {
            in: idsAlunos,
          },
        },
      });
    }

    if (idsUsuarios.length > 0) {
      await prisma.usuario.deleteMany({
        where: {
          id: {
            in: idsUsuarios,
          },
        },
      });
    }
  }, 30000);

  it("CT-01: deve negar acesso sem autenticação", async () => {
    await request(app)
      .get("/api/aluno/matriculas/historico")
      .expect(401);
  });

  it("CT-02: deve impedir consulta pela secretaria", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .get("/api/aluno/matriculas/historico")
      .expect(403);
  });

  it("CT-03: deve listar matrículas canceladas em ordem decrescente", async () => {
    const agente = await agenteAutenticado(
      usuarioTeste(0).username
    );

    const resposta = await agente
      .get("/api/aluno/matriculas/historico")
      .expect(200);

    expect(
      resposta.body.matriculas.map(
        (matricula: { id: number }) => matricula.id
      )
    ).toEqual([...idsCanceladas].reverse());

    expect(resposta.body.paginacao).toMatchObject({
      pagina: 1,
      limite: 10,
      total: 3,
      totalPaginas: 1,
    });
  });

  it("CT-04: não deve incluir matrículas ativas ou de outros alunos", async () => {
    const agente = await agenteAutenticado(
      usuarioTeste(0).username
    );

    const resposta = await agente
      .get("/api/aluno/matriculas/historico")
      .expect(200);

    const ids = resposta.body.matriculas.map(
      (matricula: { id: number }) => matricula.id
    );

    expect(ids).not.toContain(matriculaAtivaId);
    expect(ids).not.toContain(matriculaOutroAlunoId);

    expect(
      resposta.body.matriculas.every(
        (matricula: { situacao: string }) =>
          matricula.situacao === "CANCELADA"
      )
    ).toBe(true);
  });

  it("CT-05: deve paginar sem repetir matrículas", async () => {
    const agente = await agenteAutenticado(
      usuarioTeste(0).username
    );

    const primeira = await agente
      .get("/api/aluno/matriculas/historico")
      .query({ pagina: 1, limite: 2 })
      .expect(200);

    const segunda = await agente
      .get("/api/aluno/matriculas/historico")
      .query({ pagina: 2, limite: 2 })
      .expect(200);

    expect(
      primeira.body.matriculas.map(
        (matricula: { id: number }) => matricula.id
      )
    ).toEqual([
      idsCanceladas[2],
      idsCanceladas[1],
    ]);

    expect(
      segunda.body.matriculas.map(
        (matricula: { id: number }) => matricula.id
      )
    ).toEqual([idsCanceladas[0]]);

    expect(primeira.body.paginacao).toMatchObject({
      pagina: 1,
      limite: 2,
      total: 3,
      totalPaginas: 2,
    });
  });

  it("CT-06: deve apresentar dados da disciplina, professor e datas", async () => {
    const agente = await agenteAutenticado(
      usuarioTeste(0).username
    );

    const resposta = await agente
      .get("/api/aluno/matriculas/historico")
      .expect(200);

    expect(resposta.body.matriculas[0]).toMatchObject({
      id: idsCanceladas[2],
      turmaId,
      situacao: "CANCELADA",
      criadaEm: expect.any(String),
      canceladaEm: expect.any(String),
      disciplina: {
        codigo: `${prefixo}DISC`,
        nome: "Disciplina do Histórico US-13",
        cargaHoraria: 60,
      },
      professor: {
        nome: "Professor do Histórico US-13",
      },
    });
  });

  it("CT-07: deve rejeitar parâmetros inválidos", async () => {
    const agente = await agenteAutenticado(
      usuarioTeste(0).username
    );

    const consultasInvalidas = [
      { pagina: 0 },
      { pagina: -1 },
      { pagina: "abc" },
      { pagina: "1.5" },
      { limite: 0 },
      { limite: 51 },
      { pagina: 2147483648 },
      { pagina: 2147483647, limite: 2 },
    ];

    for (const consulta of consultasInvalidas) {
      await agente
        .get("/api/aluno/matriculas/historico")
        .query(consulta)
        .expect(400);
    }
  });

  it("CT-08: deve ignorar tentativa de consultar outro aluno", async () => {
    const agente = await agenteAutenticado(
      usuarioTeste(0).username
    );

    const resposta = await agente
      .get("/api/aluno/matriculas/historico")
      .query({
        alunoId: usuarioTeste(1).alunoId,
      })
      .expect(200);

    expect(resposta.body.paginacao.total).toBe(3);

    expect(
      resposta.body.matriculas.map(
        (matricula: { id: number }) => matricula.id
      )
    ).not.toContain(matriculaOutroAlunoId);
  });

  it("CT-09: deve retornar histórico vazio para aluno sem cancelamentos", async () => {
    const agente = await agenteAutenticado(
      usuarioTeste(2).username
    );

    const resposta = await agente
      .get("/api/aluno/matriculas/historico")
      .expect(200);

    expect(resposta.body.matriculas).toEqual([]);

    expect(resposta.body.paginacao).toMatchObject({
      pagina: 1,
      total: 0,
      totalPaginas: 0,
    });
  });

  it("CT-10: deve incluir matrícula no histórico após cancelamento", async () => {
    const agente = await agenteAutenticado(
      usuarioTeste(0).username
    );

    await agente
      .patch(
        `/api/aluno/matriculas/${matriculaAtivaId}/cancelar`
      )
      .expect(200);

    const resposta = await agente
      .get("/api/aluno/matriculas/historico")
      .expect(200);

    const matriculaCancelada =
      resposta.body.matriculas.find(
        (matricula: { id: number }) =>
          matricula.id === matriculaAtivaId
      );

    expect(matriculaCancelada).toMatchObject({
      id: matriculaAtivaId,
      situacao: "CANCELADA",
      canceladaEm: expect.any(String),
    });

    expect(resposta.body.paginacao.total).toBe(4);
  });
});
