// @vitest-environment node

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { apiRequest } from "./client";

describe("Cliente HTTP — Expiração de sessão", () => {
  const buscar = vi.fn();
  const redirecionar = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    vi.stubGlobal("fetch", buscar);

    vi.stubGlobal("window", {
      location: {
        replace: redirecionar,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function respostaErro(status: number, message: string) {
    return {
      ok: false,
      status,
      json: async () => ({ message }),
    };
  }

  it("CT-01: deve redirecionar ao login quando a sessão expirar", async () => {
    buscar.mockResolvedValue(
      respostaErro(401, "Usuário não autenticado.")
    );

    await expect(
      apiRequest("/api/aluno/progresso")
    ).rejects.toThrow(/sessão expirou/i);

    expect(redirecionar).toHaveBeenCalledWith("/login");
  });

  it("CT-02: não deve redirecionar quando a senha estiver incorreta", async () => {
    buscar.mockResolvedValue(
      respostaErro(401, "Credenciais inválidas.")
    );

    await expect(
      apiRequest("/api/auth/login", {
        method: "POST",
      })
    ).rejects.toThrow("Credenciais inválidas.");

    expect(redirecionar).not.toHaveBeenCalled();
  });

  it("CT-03: deve preservar a verificação inicial de autenticação", async () => {
    buscar.mockResolvedValue(
      respostaErro(401, "Usuário não autenticado.")
    );

    await expect(
      apiRequest("/api/auth/me")
    ).rejects.toThrow("Usuário não autenticado.");

    expect(redirecionar).not.toHaveBeenCalled();
  });
});