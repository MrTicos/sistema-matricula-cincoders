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

import { DisciplinasPage } from "./DisciplinasPage";
import { apiRequest } from "../../api/client";

vi.mock("../../api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../../components/LogoutButton", () => ({
  LogoutButton: () => <button type="button">Sair</button>,
}));

describe("US-08 — Cadastro de disciplinas", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("CT-01: deve apresentar os campos obrigatórios", () => {
    render(<DisciplinasPage />);

    expect(
      screen.getByLabelText("Código da disciplina")
    ).toBeTruthy();

    expect(
      screen.getByLabelText("Nome da disciplina")
    ).toBeTruthy();

    expect(
      screen.getByLabelText("Carga horária")
    ).toBeTruthy();
  });

  it("CT-02: deve cadastrar uma disciplina válida", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      message: "Disciplina cadastrada com sucesso.",
      disciplina: {
        id: 10,
        codigo: "CIN0100",
        nome: "Projeto de Software",
        cargaHoraria: 60,
      },
    });

    const usuario = userEvent.setup();

    render(<DisciplinasPage />);

    await usuario.type(
      screen.getByLabelText("Código da disciplina"),
      "cin0100"
    );

    await usuario.type(
      screen.getByLabelText("Nome da disciplina"),
      "Projeto de Software"
    );

    await usuario.click(
      screen.getByRole("button", {
        name: "Cadastrar disciplina",
      })
    );

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        "/api/secretaria/disciplinas",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            codigo: "CIN0100",
            nome: "Projeto de Software",
            cargaHoraria: 60,
          }),
        })
      );
    });

    expect(
      await screen.findByText(
        "Disciplina CIN0100 cadastrada com sucesso!"
      )
    ).toBeTruthy();
  });

  it("CT-03: deve apresentar erro de código duplicado", async () => {
    vi.mocked(apiRequest).mockRejectedValue(
      new Error("Já existe uma disciplina com esse código.")
    );

    const usuario = userEvent.setup();

    render(<DisciplinasPage />);

    await usuario.type(
      screen.getByLabelText("Código da disciplina"),
      "CIN0100"
    );

    await usuario.type(
      screen.getByLabelText("Nome da disciplina"),
      "Projeto de Software"
    );

    await usuario.click(
      screen.getByRole("button", {
        name: "Cadastrar disciplina",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveProperty(
      "textContent",
      "Já existe uma disciplina com esse código."
    );
  });

  it("CT-04: deve impedir cadastro com carga horária inválida", async () => {
    const usuario = userEvent.setup();

    render(<DisciplinasPage />);

    await usuario.type(
      screen.getByLabelText("Código da disciplina"),
      "CIN0200"
    );

    await usuario.type(
      screen.getByLabelText("Nome da disciplina"),
      "Disciplina Inválida"
    );

    const carga = screen.getByLabelText(
      "Carga horária"
    ) as HTMLInputElement;

    await usuario.clear(carga);
    await usuario.type(carga, "16");

    expect(carga.validity.valid).toBe(false);

    await usuario.click(
      screen.getByRole("button", {
        name: "Cadastrar disciplina",
      })
    );

    expect(apiRequest).not.toHaveBeenCalled();
  });
});
