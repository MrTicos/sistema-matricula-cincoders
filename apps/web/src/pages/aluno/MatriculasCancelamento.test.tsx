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
import { MemoryRouter } from "react-router-dom";

import { MatriculasPage } from "./MatriculasPage";
import { apiRequest } from "../../api/client";
import { cancelarMatricula } from "../../api/cancelamento";

import type { RespostaMatriculas } from "../../types/matriculas";

vi.mock("../../api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../../api/cancelamento", () => ({
  cancelarMatricula: vi.fn(),
}));

vi.mock("../../components/LogoutButton", () => ({
  LogoutButton: () => <button type="button">Sair</button>,
}));

const resposta: RespostaMatriculas = {
  matriculas: [
    {
      id: 15,
      turmaId: 3,
      criadaEm: "2026-11-21T18:00:00.000Z",
      disciplina: {
        id: 2,
        codigo: "CIN0002",
        nome: "Banco de Dados",
        cargaHoraria: 60,
      },
      professor: {
        id: 1,
        nome: "Prof. Marina Oliveira",
      },
    },
  ],
};

function renderizarPagina() {
  return render(
    <MemoryRouter initialEntries={["/aluno/matriculas"]}>
      <MatriculasPage />
    </MemoryRouter>
  );
}

describe("US-06 — Cancelamento de matrícula", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(apiRequest).mockResolvedValue(resposta);
    vi.mocked(cancelarMatricula).mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it("CT-01: deve solicitar confirmação antes do cancelamento", async () => {
    const usuario = userEvent.setup();

    renderizarPagina();

    await screen.findByText("Banco de Dados");

    await usuario.click(
      screen.getByRole("button", {
        name: "Cancelar matrícula",
      })
    );

    expect(
      screen.getByText(
        /Tem certeza de que deseja cancelar/i
      )
    ).toBeTruthy();

    expect(
      cancelarMatricula
    ).not.toHaveBeenCalled();
  });

  it("CT-02: deve permitir desistir do cancelamento", async () => {
    const usuario = userEvent.setup();

    renderizarPagina();

    await screen.findByText("Banco de Dados");

    await usuario.click(
      screen.getByRole("button", {
        name: "Cancelar matrícula",
      })
    );

    await usuario.click(
      screen.getByRole("button", {
        name: "Voltar",
      })
    );

    expect(
      screen.getByText("Banco de Dados")
    ).toBeTruthy();

    expect(
      cancelarMatricula
    ).not.toHaveBeenCalled();
  });

  it("CT-03: deve cancelar a matrícula confirmada", async () => {
    const usuario = userEvent.setup();

    renderizarPagina();

    await screen.findByText("Banco de Dados");

    await usuario.click(
      screen.getByRole("button", {
        name: "Cancelar matrícula",
      })
    );

    await usuario.click(
      screen.getByRole("button", {
        name: "Confirmar cancelamento",
      })
    );

    await waitFor(() => {
      expect(cancelarMatricula).toHaveBeenCalledWith(15);
    });

    expect(
      await screen.findByText(
        "Matrícula cancelada com sucesso!"
      )
    ).toBeTruthy();

    expect(
      screen.queryByText("Banco de Dados")
    ).toBeNull();
  });

  it("CT-04: deve apresentar erro quando o cancelamento falhar", async () => {
    vi.mocked(cancelarMatricula).mockRejectedValue(
      new Error("Não foi possível cancelar a matrícula.")
    );

    const usuario = userEvent.setup();

    renderizarPagina();

    await screen.findByText("Banco de Dados");

    await usuario.click(
      screen.getByRole("button", {
        name: "Cancelar matrícula",
      })
    );

    await usuario.click(
      screen.getByRole("button", {
        name: "Confirmar cancelamento",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveProperty(
      "textContent",
      "Não foi possível cancelar a matrícula."
    );

    expect(
      screen.getByText("Banco de Dados")
    ).toBeTruthy();
  });
});