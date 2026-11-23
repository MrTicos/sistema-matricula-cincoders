import "dotenv/config";

import { describe, expect, it } from "vitest";
import request from "supertest";

import { app } from "../src/app";

describe("US-01 — Autenticação", () => {
  it("deve negar acesso sem autenticação", async () => {
    const resposta = await request(app)
      .get("/api/auth/me");

    expect(resposta.status).toBe(401);
    expect(resposta.body.message).toBe(
      "Usuário não autenticado."
    );
  });

  it("deve rejeitar credenciais inválidas", async () => {
    const resposta = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({
        username: "aluno.si",
        senha: "senha-incorreta",
      });

    expect(resposta.status).toBe(401);
    expect(resposta.body.message).toBe(
      "Usuário ou senha inválidos."
    );
  });

  it("deve autenticar e manter a sessão do aluno", async () => {
    const senha = process.env.SEED_PASSWORD;

    if (!senha) {
      throw new Error("SEED_PASSWORD não configurada.");
    }

    const agente = request.agent(app).set("Origin", "http://localhost:5173");

    const login = await agente
      .post("/api/auth/login")
      .send({
        username: "aluno.si",
        senha,
      });

    expect(login.status).toBe(200);

    expect(login.body.usuario).toMatchObject({
      username: "aluno.si",
      perfil: "ALUNO",
    });

    expect(login.body.usuario).not.toHaveProperty(
      "senhaHash"
    );

    const sessao = await agente.get("/api/auth/me");

    expect(sessao.status).toBe(200);
    expect(sessao.body.usuario.username).toBe(
      "aluno.si"
    );
  });

  it("deve invalidar a sessão após logout", async () => {
    const senha = process.env.SEED_PASSWORD;

    if (!senha) {
      throw new Error("SEED_PASSWORD não configurada.");
    }

    const agente = request.agent(app).set("Origin", "http://localhost:5173");

    await agente
      .post("/api/auth/login")
      .send({
        username: "aluno.si",
        senha,
      })
      .expect(200);

    await agente
      .post("/api/auth/logout")
      .expect(204);

    await agente
      .get("/api/auth/me")
      .expect(401);
  });

    it("deve rejeitar usuário inexistente com erro genérico", async () => {
    const resposta = await request(app)
        .post("/api/auth/login")
        .set("Origin", "http://localhost:5173")
        .send({
        username: "usuario.inexistente",
        senha: "qualquer-senha",
        });

    expect(resposta.status).toBe(401);

    expect(resposta.body.message).toBe(
        "Usuário ou senha inválidos."
    );
    });

    it("deve configurar os atributos de segurança do cookie", async () => {
    const senha = process.env.SEED_PASSWORD;

    if (!senha) {
        throw new Error("SEED_PASSWORD não configurada.");
    }

    const resposta = await request(app)
        .post("/api/auth/login")
        .set("Origin", "http://localhost:5173")
        .send({
        username: "aluno.si",
        senha,
        });

    expect(resposta.status).toBe(200);

    const cookies: string[] = ([] as string[]).concat(
        resposta.headers["set-cookie"] ?? []
    );

    const cookieSessao = cookies.find(
        (cookie) => cookie.startsWith("cincoders.sid=")
    );

    expect(cookieSessao).toBeDefined();
    expect(cookieSessao).toContain("HttpOnly");
    expect(cookieSessao).toContain("SameSite=Lax");
    });

    it("deve regenerar o identificador da sessão após novo login", async () => {
    const senha = process.env.SEED_PASSWORD;

    if (!senha) {
        throw new Error("SEED_PASSWORD não configurada.");
    }

    const agente = request.agent(app).set("Origin", "http://localhost:5173");

    const primeiroLogin = await agente
        .post("/api/auth/login")
        .send({
        username: "aluno.si",
        senha,
        })
        .expect(200);

    const cookiesPrimeiro: string[] = ([] as string[]).concat(
        primeiroLogin.headers["set-cookie"] ?? []
    );

    const primeiroId = cookiesPrimeiro
        .find((cookie) => cookie.startsWith("cincoders.sid="))
        ?.split(";")[0];

    const segundoLogin = await agente
        .post("/api/auth/login")
        .send({
        username: "aluno.si",
        senha,
        })
        .expect(200);

    const cookiesSegundo: string[] = ([] as string[]).concat(
        segundoLogin.headers["set-cookie"] ?? []
    );

    const segundoId = cookiesSegundo
        .find((cookie) => cookie.startsWith("cincoders.sid="))
        ?.split(";")[0];

    expect(primeiroId).toBeDefined();
    expect(segundoId).toBeDefined();

    expect(segundoId).not.toBe(primeiroId);
    });

    it("deve limpar o cookie de sessão no logout", async () => {
    const senha = process.env.SEED_PASSWORD;

    if (!senha) {
        throw new Error("SEED_PASSWORD não configurada.");
    }

    const agente = request.agent(app).set("Origin", "http://localhost:5173");

    await agente
        .post("/api/auth/login")
        .send({
        username: "aluno.si",
        senha,
        })
        .expect(200);

    const logout = await agente
        .post("/api/auth/logout")
        .expect(204);

    const cookies: string[] = ([] as string[]).concat(
        logout.headers["set-cookie"] ?? []
    );

    const cookieSessao = cookies.find(
        (cookie) => cookie.startsWith("cincoders.sid=")
    );

    expect(cookieSessao).toBeDefined();

    expect(cookieSessao).toMatch(
        /^cincoders\.sid=;/
    );

    await agente
        .get("/api/auth/me")
        .expect(401);
    });
});
