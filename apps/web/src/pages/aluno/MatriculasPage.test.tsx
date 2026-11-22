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
} from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import { MatriculasPage } from "./MatriculasPage";
import { apiRequest } from "../../api/client";

import type { RespostaMatriculas } from "../../types/matriculas";

// Simula as respostas da API.
vi.mock("../../api/client", () => ({
  apiRequest: vi.fn(),
}));

// Evita depender do contexto de autenticação
// nos testes específicos da página.
vi.mock("../../components/LogoutButton", () => ({
  LogoutButton: () => <button type="button">Sair</button>,
}));

const respostaMatriculas: RespostaMatriculas = {
  matriculas: [
    {
      id: 1,
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

describe("US-05 — Consultar matrículas ativas", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(apiRequest).mockResolvedValue(respostaMatriculas);
  });

  afterEach(() => {
    cleanup();
  });

  it("CT-01: deve listar as matrículas do aluno", async () => {
    renderizarPagina();

    expect(
      await screen.findByText("Banco de Dados")
    ).toBeTruthy();

    expect(
      screen.getByText("CIN0002")
    ).toBeTruthy();
  });

  it("CT-02: deve apresentar os dados acadêmicos da matrícula", async () => {
    renderizarPagina();

    await screen.findByText("Banco de Dados");

    expect(
      screen.getByText("Prof. Marina Oliveira", {
        exact: false,
      })
    ).toBeTruthy();

    expect(
      screen.getByText("Turma #3")
    ).toBeTruthy();

    expect(
      screen.getByText("Ativa")
    ).toBeTruthy();

    expect(
      screen.getByText("Carga horária: 60h")
    ).toBeTruthy();
  });

  it("CT-03: deve informar quando não houver matrículas", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      matriculas: [],
    });

    renderizarPagina();

    expect(
      await screen.findByText("Nenhuma matrícula ativa")
    ).toBeTruthy();

    expect(
    screen.getByText(
        "Você não possui matrículas ativas no momento."
    )
    ).toBeTruthy();
  });

  it("CT-04: deve apresentar erro quando a API falhar", async () => {
    vi.mocked(apiRequest).mockRejectedValue(
      new Error("Não foi possível consultar suas matrículas.")
    );

    renderizarPagina();

    expect(
      await screen.findByRole("alert")
    ).toHaveProperty(
      "textContent",
      "Não foi possível consultar suas matrículas."
    );
  });

  it("CT-05: deve indicar carregamento durante a consulta", () => {
    // Mantém a requisição pendente.
    vi.mocked(apiRequest).mockImplementation(
      () => new Promise<RespostaMatriculas>(() => {})
    );

    renderizarPagina();

    expect(
      screen.getByRole("status")
    ).toHaveProperty(
      "textContent",
      "Carregando matrículas..."
    );
  });
});