import "dotenv/config";

import argon2 from "argon2";
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

const identificador = randomUUID();

const disciplinasCriadas: number[] = [];
const usuariosCriados: number[] = [];
const alunosCriados: number[] = [];

let cursoId: number;
let turmaId: number;

let alunoPrincipalId: number;
let alunoSemHistoricoId: number;

let obrigatoriaId: number;
let perfilExtraId: number;
let livreId: number;

const usernamePrincipal = `progresso.${identificador}`;
const usernameSemHistorico = `progresso.vazio.${identificador}`;

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
      "Os testes de progresso exigem um banco de teste."
    );
  }

  const senha = process.env.SEED_PASSWORD;

  if (!senha) {
    throw new Error("SEED_PASSWORD não configurada.");
  }

  const professor = await prisma.professor.findFirst({
    select: { id: true },
  });

  if (!professor) {
    throw new Error("Seed de professores não encontrado.");
  }

  const curso = await prisma.curso.create({
    data: {
      nome: `Curso de teste ${identificador}`,
      chMinObrigatoria: 120,
      chMinPerfil: 60,
      chMinLivre: 30,
    },
  });

  cursoId = curso.id;

  async function criarDisciplina(nome: string) {
    const disciplina = await prisma.disciplina.create({
      data: {
        codigo: `PROG-${randomUUID()}`,
        nome,
        cargaHoraria: 60,
      },
    });

    disciplinasCriadas.push(disciplina.id);

    return disciplina;
  }

  const obrigatoria = await criarDisciplina("Obrigatória");
  const perfilInicial = await criarDisciplina("Perfil inicial");
  const perfilExtra = await criarDisciplina("Perfil excedente");
  const livre = await criarDisciplina("Livre");
  const reprovada = await criarDisciplina("Reprovada");

  obrigatoriaId = obrigatoria.id;
  perfilExtraId = perfilExtra.id;
  livreId = livre.id;

  await prisma.estruturaCurricular.createMany({
    data: [
      {
        cursoId,
        disciplinaId: obrigatoria.id,
        categoria: "OBRIGATORIA",
      },
      {
        cursoId,
        disciplinaId: perfilInicial.id,
        categoria: "ELETIVA_PERFIL",
      },
      {
        cursoId,
        disciplinaId: perfilExtra.id,
        categoria: "ELETIVA_PERFIL",
      },
    ],
  });

  const hash = await argon2.hash(senha);

  async function criarAluno(username: string) {
    const usuario = await prisma.usuario.create({
      data: {
        username,
        nome: "Aluno de Teste",
        senhaHash: hash,
        perfil: "ALUNO",
      },
    });

    usuariosCriados.push(usuario.id);

    const aluno = await prisma.aluno.create({
      data: {
        usuarioId: usuario.id,
        cursoId,
      },
    });

    alunosCriados.push(aluno.id);

    return aluno;
  }

  const principal = await criarAluno(usernamePrincipal);
  const semHistorico = await criarAluno(usernameSemHistorico);

  alunoPrincipalId = principal.id;
  alunoSemHistoricoId = semHistorico.id;

  await prisma.historico.createMany({
    data: [
      {
        alunoId: alunoPrincipalId,
        disciplinaId: obrigatoria.id,
        situacao: "APROVADA",
      },
      {
        alunoId: alunoPrincipalId,
        disciplinaId: perfilInicial.id,
        situacao: "APROVADA",
      },
      {
        alunoId: alunoPrincipalId,
        disciplinaId: reprovada.id,
        situacao: "REPROVADA",
      },
    ],
  });

  const turma = await prisma.turma.create({
    data: {
      disciplinaId: livre.id,
      professorId: professor.id,
      vagasTotais: 10,
    },
  });

  turmaId = turma.id;
});

afterAll(async () => {
  if (alunosCriados.length > 0) {
    await prisma.matricula.deleteMany({
      where: {
        alunoId: { in: alunosCriados },
      },
    });

    await prisma.historico.deleteMany({
      where: {
        alunoId: { in: alunosCriados },
      },
    });
  }

  if (turmaId !== undefined) {
    await prisma.turma.deleteMany({
      where: { id: turmaId },
    });
  }

  if (cursoId !== undefined) {
    await prisma.estruturaCurricular.deleteMany({
      where: { cursoId },
    });
  }

  if (alunosCriados.length > 0) {
    await prisma.aluno.deleteMany({
      where: {
        id: { in: alunosCriados },
      },
    });
  }

  if (usuariosCriados.length > 0) {
    await prisma.usuario.deleteMany({
      where: {
        id: { in: usuariosCriados },
      },
    });
  }

  if (cursoId !== undefined) {
    await prisma.curso.delete({
      where: { id: cursoId },
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

describe("US-07 — Progresso curricular", () => {
  it("CT-01: deve negar acesso sem autenticação", async () => {
    await request(app)
      .get("/api/aluno/progresso")
      .expect(401);
  });

  it("CT-02: deve impedir acesso da secretaria", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .get("/api/aluno/progresso")
      .expect(403);
  });

  it("CT-03: deve calcular a CH aprovada por categoria", async () => {
    const agente = await agenteAutenticado(usernamePrincipal);

    const resposta = await agente
      .get("/api/aluno/progresso")
      .expect(200);

    const { progresso } = resposta.body;

    expect(progresso.obrigatoria).toMatchObject({
      exigida: 120,
      integralizada: 60,
      faltante: 60,
      percentual: 50,
    });

    expect(progresso.perfil).toMatchObject({
      exigida: 60,
      integralizada: 60,
      faltante: 0,
      percentual: 100,
    });

    expect(progresso.livre).toMatchObject({
      exigida: 30,
      integralizada: 0,
      faltante: 30,
      percentual: 0,
    });

    expect(progresso.total).toMatchObject({
      exigida: 210,
      integralizada: 120,
      faltante: 90,
      percentual: 57.14,
    });
  });

  it("CT-04: deve retornar progresso vazio para aluno sem histórico", async () => {
    const agente = await agenteAutenticado(
      usernameSemHistorico
    );

    const resposta = await agente
      .get("/api/aluno/progresso")
      .expect(200);

    expect(resposta.body.progresso.total).toMatchObject({
      exigida: 210,
      integralizada: 0,
      faltante: 210,
      percentual: 0,
    });
  });

  it("CT-05: não deve integralizar disciplinas reprovadas", async () => {
    const agente = await agenteAutenticado(usernamePrincipal);

    const resposta = await agente
      .get("/api/aluno/progresso")
      .expect(200);

    expect(resposta.body.progresso.livre.integralizada).toBe(0);
  });

  it("CT-06: deve transferir excedente de perfil para livre", async () => {
    const historico = await prisma.historico.create({
      data: {
        alunoId: alunoPrincipalId,
        disciplinaId: perfilExtraId,
        situacao: "APROVADA",
      },
    });

    try {
      const agente = await agenteAutenticado(
        usernamePrincipal
      );

      const resposta = await agente
        .get("/api/aluno/progresso")
        .expect(200);

      const { progresso } = resposta.body;

      expect(progresso.perfil.integralizada).toBe(60);
      expect(progresso.perfil.percentual).toBe(100);

      expect(progresso.livre.integralizada).toBe(30);
      expect(progresso.livre.percentual).toBe(100);
      expect(progresso.livre.faltante).toBe(0);

      expect(progresso.total.integralizada).toBe(150);
    } finally {
      await prisma.historico.delete({
        where: { id: historico.id },
      });
    }
  });

  it("CT-07: não deve contar aprovação duplicada duas vezes", async () => {
    const duplicada = await prisma.historico.create({
      data: {
        alunoId: alunoPrincipalId,
        disciplinaId: obrigatoriaId,
        situacao: "APROVADA",
      },
    });

    try {
      const agente = await agenteAutenticado(
        usernamePrincipal
      );

      const resposta = await agente
        .get("/api/aluno/progresso")
        .expect(200);

      expect(
        resposta.body.progresso.obrigatoria.integralizada
      ).toBe(60);
    } finally {
      await prisma.historico.delete({
        where: { id: duplicada.id },
      });
    }
  });

  it("CT-08: deve apresentar matrícula ativa como CH em curso", async () => {
    const matricula = await prisma.matricula.create({
      data: {
        alunoId: alunoPrincipalId,
        turmaId,
        situacao: "ATIVA",
      },
    });

    try {
      const agente = await agenteAutenticado(
        usernamePrincipal
      );

      const resposta = await agente
        .get("/api/aluno/progresso")
        .expect(200);

      expect(resposta.body.progresso.livre.emCurso).toBe(60);

      expect(
        resposta.body.progresso.livre.integralizada
      ).toBe(0);

      expect(resposta.body.cargaHorariaEmCurso).toBe(60);
    } finally {
      await prisma.matricula.delete({
        where: { id: matricula.id },
      });
    }
  });

  it("CT-09: não deve contar matrícula cancelada como CH em curso", async () => {
    const matricula = await prisma.matricula.create({
      data: {
        alunoId: alunoPrincipalId,
        turmaId,
        situacao: "CANCELADA",
        canceladaEm: new Date(),
      },
    });

    try {
      const agente = await agenteAutenticado(
        usernamePrincipal
      );

      const resposta = await agente
        .get("/api/aluno/progresso")
        .expect(200);

      expect(resposta.body.cargaHorariaEmCurso).toBe(0);
    } finally {
      await prisma.matricula.delete({
        where: { id: matricula.id },
      });
    }
  });

  it("CT-10: deve impedir consulta de progresso de outro aluno", async () => {
    const agente = await agenteAutenticado(usernamePrincipal);

    const resposta = await agente
      .get("/api/aluno/progresso")
      .query({ alunoId: alunoSemHistoricoId })
      .expect(200);

    expect(
      resposta.body.progresso.total.integralizada
    ).toBe(120);

    expect(resposta.body.curso.id).toBe(cursoId);
  });
});
