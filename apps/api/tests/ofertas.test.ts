import "dotenv/config";

import { describe, expect, it } from "vitest";
import request from "supertest";

import { app } from "../src/app";

// Realiza login e devolve um cliente com sessão autenticada.
async function agenteAutenticado(username: string) {
  const senha = process.env.SEED_PASSWORD;

  if (!senha) {
    throw new Error("SEED_PASSWORD não configurada.");
  }

  const agente = request.agent(app).set("Origin", "http://localhost:5173");

  await agente
    .post("/api/auth/login")
    .send({
      username,
      senha,
    })
    .expect(200);

  return agente;
}

describe("US-03 — Consulta de ofertas", () => {
  it("deve negar acesso sem autenticação", async () => {
    await request(app)
      .get("/api/aluno/ofertas")
      .expect(401);
  });

  it("deve impedir acesso da secretaria", async () => {
    const agente = await agenteAutenticado("secretaria");

    await agente
      .get("/api/aluno/ofertas")
      .expect(403);
  });

  it("deve listar ofertas e calcular vagas disponíveis", async () => {
    const agente = await agenteAutenticado("aluno.si");

    const resposta = await agente
      .get("/api/aluno/ofertas")
      .expect(200);

    expect(Array.isArray(resposta.body.ofertas)).toBe(true);

    expect(resposta.body.ofertas.length).toBeGreaterThan(0);

    for (const oferta of resposta.body.ofertas) {
      expect(oferta.vagasDisponiveis).toBe(
        Math.max(
          0,
          oferta.vagasTotais - oferta.vagasOcupadas
        )
      );

      expect(oferta.vagasDisponiveis).toBeGreaterThanOrEqual(0);

      expect([
        "OBRIGATORIA",
        "ELETIVA_PERFIL",
        "LIVRE",
      ]).toContain(oferta.classificacao);
    }
  });

  it("deve pesquisar ofertas pelo código da disciplina", async () => {
    const agente = await agenteAutenticado("aluno.si");

    const resposta = await agente
      .get("/api/aluno/ofertas?busca=CIN0002")
      .expect(200);

    expect(resposta.body.ofertas.length).toBeGreaterThan(0);

    for (const oferta of resposta.body.ofertas) {
      expect(oferta.disciplina.codigo).toBe("CIN0002");
    }
  });

  it("deve aplicar paginação sem repetir turmas", async () => {
    const agente = await agenteAutenticado("aluno.si");

    const primeira = await agente
      .get("/api/aluno/ofertas?pagina=1&limite=2")
      .expect(200);

    const segunda = await agente
      .get("/api/aluno/ofertas?pagina=2&limite=2")
      .expect(200);

    expect(primeira.body.ofertas).toHaveLength(2);
    expect(segunda.body.ofertas).toHaveLength(2);

    expect(primeira.body.paginacao.pagina).toBe(1);
    expect(segunda.body.paginacao.pagina).toBe(2);

    const idsPrimeira = primeira.body.ofertas.map(
      (oferta: { turmaId: number }) => oferta.turmaId
    );

    const idsSegunda = segunda.body.ofertas.map(
      (oferta: { turmaId: number }) => oferta.turmaId
    );

    for (const id of idsSegunda) {
      expect(idsPrimeira).not.toContain(id);
    }
  });

  it("deve classificar a disciplina conforme o curso do aluno", async () => {
    const alunoSI = await agenteAutenticado("aluno.si");
    const alunoCC = await agenteAutenticado("aluno.cc");

    const respostaSI = await alunoSI
      .get("/api/aluno/ofertas?busca=CIN0002")
      .expect(200);

    const respostaCC = await alunoCC
      .get("/api/aluno/ofertas?busca=CIN0002")
      .expect(200);

    expect(respostaSI.body.ofertas[0].classificacao).toBe(
      "OBRIGATORIA"
    );

    expect(respostaCC.body.ofertas[0].classificacao).toBe(
      "ELETIVA_PERFIL"
    );
  });

  it("deve identificar disciplina livre para o curso", async () => {
    const agente = await agenteAutenticado("aluno.si");

    const resposta = await agente
      .get("/api/aluno/ofertas?busca=CIN0003")
      .expect(200);

    expect(resposta.body.ofertas.length).toBeGreaterThan(0);

    expect(resposta.body.ofertas[0].classificacao).toBe(
      "LIVRE"
    );
  });

  it("deve retornar lista vazia quando não houver resultados", async () => {
    const agente = await agenteAutenticado("aluno.si");

    const resposta = await agente
      .get("/api/aluno/ofertas?busca=DISCIPLINA-INEXISTENTE-9999")
      .expect(200);

    expect(resposta.body.ofertas).toEqual([]);
    expect(resposta.body.paginacao.total).toBe(0);
  });

  it("deve rejeitar parâmetros inválidos de paginação", async () => {
    const agente = await agenteAutenticado("aluno.si");

    const parametrosInvalidos = [
      "?pagina=0",
      "?pagina=-1",
      "?pagina=abc",
      "?limite=0",
      "?limite=51",
    ];

    for (const parametros of parametrosInvalidos) {
      await agente
        .get(`/api/aluno/ofertas${parametros}`)
        .expect(400);
    }
  });
});
