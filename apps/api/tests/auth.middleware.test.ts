import "dotenv/config";

import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { sessionMiddleware } from "../src/config/session";
import { authRoutes } from "../src/modules/auth/auth.routes";

import {
  exigirAutenticacao,
  exigirPerfil,
} from "../src/middlewares/auth.middleware";

// Aplicação criada exclusivamente para os testes.
const appTeste = express();

appTeste.use(express.json());
appTeste.use(sessionMiddleware);

appTeste.use("/api/auth", authRoutes);

// Rota fictícia, disponível apenas nesta aplicação de testes.
appTeste.get(
  "/api/test-secretaria",
  exigirAutenticacao,
  exigirPerfil("SECRETARIA"),
  (_req, res) => {
    res.status(200).json({
      message: "Acesso permitido.",
    });
  }
);

describe("US-01 — Autorização por perfil", () => {
  it("deve negar acesso sem autenticação", async () => {
    const resposta = await request(appTeste)
      .get("/api/test-secretaria");

    expect(resposta.status).toBe(401);
  });

  it("deve impedir que um aluno acesse a secretaria", async () => {
    const senha = process.env.SEED_PASSWORD;

    if (!senha) {
      throw new Error("SEED_PASSWORD não configurada.");
    }

    const agente = request.agent(appTeste);

    await agente
      .post("/api/auth/login")
      .send({
        username: "aluno.si",
        senha,
      })
      .expect(200);

    const resposta = await agente
      .get("/api/test-secretaria");

    expect(resposta.status).toBe(403);
    expect(resposta.body.message).toBe(
      "Acesso não autorizado."
    );
  });

  it("deve permitir acesso para a secretaria", async () => {
    const senha = process.env.SEED_PASSWORD;

    if (!senha) {
      throw new Error("SEED_PASSWORD não configurada.");
    }

    const agente = request.agent(appTeste);

    await agente
      .post("/api/auth/login")
      .send({
        username: "secretaria",
        senha,
      })
      .expect(200);

    const resposta = await agente
      .get("/api/test-secretaria");

    expect(resposta.status).toBe(200);
    expect(resposta.body.message).toBe(
      "Acesso permitido."
    );
  });
});