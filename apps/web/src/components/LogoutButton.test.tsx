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
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import { LogoutButton } from "./LogoutButton";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const login = vi.fn(async () => {});
const logout = vi.fn(async () => {});

function prepararAutenticacao() {
  vi.mocked(useAuth).mockReturnValue({
    usuario: {
      id: 2,
      username: "aluno.si",
      perfil: "ALUNO",
    },
    carregando: false,
    login,
    logout,
  });
}

function renderizarLogout() {
  return render(
    <MemoryRouter initialEntries={["/aluno/ofertas"]}>
      <Routes>
        <Route
          path="/aluno/ofertas"
          element={<LogoutButton />}
        />
        <Route
          path="/login"
          element={<p>Tela de login</p>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("US-02 — Logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prepararAutenticacao();
  });

  afterEach(() => {
    cleanup();
  });

  it("CT-05: deve apresentar o botão de sair", () => {
    renderizarLogout();

    expect(
      screen.getByRole("button", { name: "Sair" })
    ).toBeTruthy();
  });

  it("CT-06: deve encerrar a sessão e redirecionar", async () => {
    const usuario = userEvent.setup();

    renderizarLogout();

    await usuario.click(
      screen.getByRole("button", { name: "Sair" })
    );

    await waitFor(() => {
      expect(logout).toHaveBeenCalledOnce();
    });

    expect(
      await screen.findByText("Tela de login")
    ).toBeTruthy();
  });

  it("CT-07: deve apresentar erro quando o logout falhar", async () => {
    logout.mockRejectedValueOnce(
      new Error("Falha ao encerrar a sessão")
    );

    const usuario = userEvent.setup();

    renderizarLogout();

    await usuario.click(
      screen.getByRole("button", { name: "Sair" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveProperty(
      "textContent",
      "Não foi possível encerrar a sessão."
    );
  });
});