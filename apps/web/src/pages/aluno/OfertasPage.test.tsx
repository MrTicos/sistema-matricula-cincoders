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

import { OfertasPage } from "./OfertasPage";
import { apiRequest } from "../../api/client";
import { criarMatricula } from "../../api/matriculas";

import type { RespostaOfertas } from "../../types/ofertas";

vi.mock("../../api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../../api/matriculas", () => ({
  criarMatricula: vi.fn(),
}));

vi.mock("../../components/LogoutButton", () => ({
  LogoutButton: () => <button type="button">Sair</button>,
}));

const respostaOfertas: RespostaOfertas = {
  ofertas: [
    {
      turmaId: 3,
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
      vagasTotais: 2,
      vagasOcupadas: 0,
      vagasDisponiveis: 2,
      classificacao: "OBRIGATORIA",
    },
  ],
  paginacao: {
    pagina: 1,
    limite: 10,
    total: 1,
    totalPaginas: 1,
  },
};

function renderizarOfertas() {
  render(
    <MemoryRouter initialEntries={["/aluno/ofertas"]}>
      <OfertasPage />
    </MemoryRouter>
  );
}

describe("US-03 e US-04 — Ofertas e matrícula", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue(respostaOfertas);
  });

  afterEach(() => {
    cleanup();
  });

  it("CT-01: deve apresentar as ofertas disponíveis", async () => {
    renderizarOfertas();

    expect(
      await screen.findByText("Banco de Dados")
    ).toBeTruthy();

    expect(
      screen.getByText("Prof. Marina Oliveira", {
        exact: false,
      })
    ).toBeTruthy();
  });

  it("CT-02: deve pesquisar pelo código da disciplina", async () => {
    const usuario = userEvent.setup();

    renderizarOfertas();

    await screen.findByText("Banco de Dados");

    await usuario.type(
      screen.getByRole("searchbox"),
      "CIN0002"
    );

    await usuario.click(
      screen.getByRole("button", { name: "Pesquisar" })
    );

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining("busca=CIN0002")
      );
    });
  });

  it("CT-03: deve solicitar a matrícula na turma selecionada", async () => {
    vi.mocked(criarMatricula).mockResolvedValue({});

    const usuario = userEvent.setup();

    renderizarOfertas();

    await screen.findByText("Banco de Dados");

    await usuario.click(
      screen.getByRole("button", { name: "Matricular-se" })
    );

    await waitFor(() => {
      expect(criarMatricula).toHaveBeenCalledWith({
        turmaId: 3,
      });
    });

    expect(
      await screen.findByText("Matrícula realizada com sucesso!")
    ).toBeTruthy();
  });

  it("CT-04: deve apresentar erro quando matrícula for rejeitada", async () => {
    vi.mocked(criarMatricula).mockRejectedValue(
      new Error("Você já foi aprovado nesta disciplina.")
    );

    const usuario = userEvent.setup();

    renderizarOfertas();

    await screen.findByText("Banco de Dados");

    await usuario.click(
      screen.getByRole("button", { name: "Matricular-se" })
    );

    expect(
      await screen.findByText(
        "Você já foi aprovado nesta disciplina."
      )
    ).toBeTruthy();
  });

  it("CT-05: deve impedir matrícula em turma lotada", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      ...respostaOfertas,
      ofertas: [
        {
          ...respostaOfertas.ofertas[0],
          vagasOcupadas: 2,
          vagasDisponiveis: 0,
        },
      ],
    });

    renderizarOfertas();

    const botao = await screen.findByRole("button", {
      name: "Turma lotada",
    });

    expect(botao.hasAttribute("disabled")).toBe(true);
  });
});