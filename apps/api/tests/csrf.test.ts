import "dotenv/config";

import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";

const origemPermitida = "http://localhost:5173";
const origemExterna = "https://site-malicioso.example";

async function alunoAutenticado() {
  const senha = process.env.SEED_PASSWORD;
  if (!senha) throw new Error("SEED_PASSWORD não configurada.");

  const agente = request.agent(app);
  await agente
    .post("/api/auth/login")
    .set("Origin", origemPermitida)
    .send({ username: "aluno.si", senha })
    .expect(200);

  return agente;
}

describe("T-32 — Proteção CSRF por origem", () => {
  it("recusa login iniciado por outra origem", async () => {
    const resposta = await request(app)
      .post("/api/auth/login")
      .set("Origin", origemExterna)
      .send({ username: "aluno.si", senha: "qualquer-senha" })
      .expect(403);

    expect(resposta.body).toEqual({
      message: "Origem da requisição não permitida.",
    });
  });

  it("recusa login sem Origin ou Referer", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ username: "aluno.si", senha: "qualquer-senha" })
      .expect(403);
  });

  it("aceita Referer confiável no login quando Origin não existe", async () => {
    await request(app)
      .post("/api/auth/login")
      .set("Referer", "http://localhost:5173/login")
      .send({ username: "aluno.si", senha: "qualquer-senha" })
      .expect(401);
  });

  it("recusa alteração autenticada sem Origin ou Referer", async () => {
    const agente = await alunoAutenticado();

    await agente
      .post("/api/aluno/matriculas")
      .send({ turmaId: 0 })
      .expect(403);
  });

  it("recusa origem externa mesmo com Referer confiável", async () => {
    const agente = await alunoAutenticado();

    await agente
      .post("/api/aluno/matriculas")
      .set("Origin", origemExterna)
      .set("Referer", "http://localhost:5173/aluno/ofertas")
      .send({ turmaId: 0 })
      .expect(403);
  });

  it("recusa Origin null", async () => {
    const agente = await alunoAutenticado();

    await agente
      .post("/api/aluno/matriculas")
      .set("Origin", "null")
      .send({ turmaId: 0 })
      .expect(403);
  });

  it("aceita origem confiável e preserva a validação do corpo", async () => {
    const agente = await alunoAutenticado();

    await agente
      .post("/api/aluno/matriculas")
      .set("Origin", origemPermitida)
      .send({ turmaId: 0 })
      .expect(400);
  });

  it("aceita Referer confiável quando Origin está ausente", async () => {
    const agente = await alunoAutenticado();

    await agente
      .post("/api/aluno/matriculas")
      .set("Referer", "http://localhost:5173/aluno/ofertas")
      .send({ turmaId: 0 })
      .expect(400);
  });

  it("protege PATCH e mantém GET acessível ao aluno autenticado", async () => {
    const agente = await alunoAutenticado();

    await agente
      .patch("/api/aluno/matriculas/1/cancelar")
      .set("Origin", origemExterna)
      .expect(403);

    await agente.get("/api/aluno/matriculas").expect(200);
  });

  it("preserva 401 para alteração sem sessão", async () => {
    await request(app)
      .post("/api/aluno/matriculas")
      .send({ turmaId: 0 })
      .expect(401);
  });
});
