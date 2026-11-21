// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { LoginPage } from "./LoginPage";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const login = vi.fn<(
  username: string,
  senha: string
) => Promise<void>>(async () => {});const logout = vi.fn(async () => {});

function prepararAutenticacao() {
  vi.mocked(useAuth).mockReturnValue({
    usuario: null,
    carregando: false,
    login,
    logout,
  });
}

function renderizarLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Página inicial</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("US-02 — Interface de login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prepararAutenticacao();
  });

  afterEach(() => {
    cleanup();
  });

  it("CT-01: deve apresentar os campos de autenticação", () => {
    renderizarLogin();

    expect(screen.getByLabelText("Usuário")).toBeTruthy();
    expect(screen.getByLabelText("Senha")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Entrar" })
    ).toBeTruthy();
  });

  it("CT-02: deve enviar as credenciais informadas", async () => {
    const usuario = userEvent.setup();

    renderizarLogin();

    await usuario.type(
      screen.getByLabelText("Usuário"),
      "aluno.si"
    );

    await usuario.type(
      screen.getByLabelText("Senha"),
      "senha-de-teste"
    );

    await usuario.click(
      screen.getByRole("button", { name: "Entrar" })
    );

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(
        "aluno.si",
        "senha-de-teste"
      );
    });

    expect(
      await screen.findByText("Página inicial")
    ).toBeTruthy();
  });

  it("CT-03: deve informar credenciais inválidas", async () => {
    login.mockRejectedValueOnce(
      new Error("Usuário ou senha inválidos.")
    );

    const usuario = userEvent.setup();

    renderizarLogin();

    await usuario.type(
      screen.getByLabelText("Usuário"),
      "aluno.si"
    );

    await usuario.type(
      screen.getByLabelText("Senha"),
      "senha-incorreta"
    );

    await usuario.click(
      screen.getByRole("button", { name: "Entrar" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveProperty(
      "textContent",
      "Usuário ou senha inválidos."
    );
  });

  it("CT-04: deve impedir novo envio durante o login", async () => {
    login.mockImplementationOnce(
      () => new Promise<void>(() => {})
    );

    const usuario = userEvent.setup();

    renderizarLogin();

    await usuario.type(
      screen.getByLabelText("Usuário"),
      "aluno.si"
    );

    await usuario.type(
      screen.getByLabelText("Senha"),
      "senha-de-teste"
    );

    await usuario.click(
      screen.getByRole("button", { name: "Entrar" })
    );

    expect(
      screen.getByRole("button", { name: "Entrando..." })
        .hasAttribute("disabled")
    ).toBe(true);
  });
});