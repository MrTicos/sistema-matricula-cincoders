// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  render,
  waitFor,
} from "@testing-library/react";

import { AppRoutes } from "./AppRoutes";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const login = vi.fn(async () => {});
const logout = vi.fn(async () => {});

type Perfil = "ALUNO" | "SECRETARIA";

function simularUsuario(perfil: Perfil | null) {
  vi.mocked(useAuth).mockReturnValue({
    usuario: perfil
      ? {
          id: 1,
          username: perfil === "ALUNO" ? "aluno.si" : "secretaria",
          perfil,
        }
      : null,
    carregando: false,
    login,
    logout,
  });
}

function abrirRota(caminho: string) {
  window.history.pushState({}, "", caminho);
  render(<AppRoutes />);
}

describe("US-02 — Proteção de rotas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it("CT-08: deve redirecionar visitante para login", async () => {
    simularUsuario(null);
    abrirRota("/aluno/ofertas");

    await waitFor(() => {
      expect(window.location.pathname).toBe("/login");
    });
  });

  it("CT-09: deve impedir aluno de acessar secretaria", async () => {
    simularUsuario("ALUNO");
    abrirRota("/secretaria");

    await waitFor(() => {
      expect(window.location.pathname).toBe("/aluno/ofertas");
    });
  });

  it("CT-10: deve impedir secretaria de acessar área do aluno", async () => {
    simularUsuario("SECRETARIA");
    abrirRota("/aluno/ofertas");

    await waitFor(() => {
      expect(window.location.pathname).toBe("/secretaria");
    });
  });

  it("CT-11: deve permitir acesso do aluno autenticado", async () => {
    simularUsuario("ALUNO");
    abrirRota("/aluno/ofertas");

    await waitFor(() => {
      expect(window.location.pathname).toBe("/aluno/ofertas");
    });
  });
});