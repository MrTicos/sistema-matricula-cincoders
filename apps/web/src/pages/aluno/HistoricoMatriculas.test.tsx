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
  act,
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { HistoricoMatriculas } from "./HistoricoMatriculas";
import { MatriculasPage } from "./MatriculasPage";
import { apiRequest } from "../../api/client";

vi.mock("../../api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../../components/LogoutButton", () => ({
  LogoutButton: () => <button type="button">Sair</button>,
}));

const matriculaCancelada = {
  id: 77,
  turmaId: 12,
  situacao: "CANCELADA",
  criadaEm: "2026-11-01T12:00:00.000Z",
  canceladaEm: "2026-11-20T12:00:00.000Z",
  disciplina: {
    id: 5,
    codigo: "CIN0100",
    nome: "Projeto de Software",
    cargaHoraria: 60,
  },
  professor: {
    id: 3,
    nome: "Ana Lima",
  },
};

const respostaHistorico = {
  matriculas: [matriculaCancelada],
  paginacao: {
    pagina: 1,
    limite: 10,
    total: 1,
    totalPaginas: 1,
  },
};

describe("US-13 — Histórico de matrículas canceladas", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(apiRequest).mockResolvedValue(
      respostaHistorico
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("CT-01: deve consultar e exibir as matrículas canceladas", async () => {
    render(<HistoricoMatriculas />);

    expect(
      await screen.findByText("Projeto de Software")
    ).toBeTruthy();

    expect(screen.getByText("CIN0100")).toBeTruthy();

    expect(
      screen.getByText("Professor: Ana Lima")
    ).toBeTruthy();

    expect(
      screen.getByText("Cancelada")
    ).toBeTruthy();

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/aluno/matriculas/historico?pagina=1&limite=10"
    );
  });

  it("CT-02: deve informar carregamento durante a consulta", async () => {
    let resolver!: (valor: typeof respostaHistorico) => void;

    const promessa = new Promise<typeof respostaHistorico>(
      (resolve) => {
        resolver = resolve;
      }
    );

    vi.mocked(apiRequest).mockReturnValue(promessa);

    render(<HistoricoMatriculas />);

    expect(
      screen.getByRole("status")
    ).toHaveProperty(
      "textContent",
      "Carregando histórico de matrículas..."
    );

    await act(async () => {
      resolver(respostaHistorico);
    });

    expect(
      screen.getByText("Projeto de Software")
    ).toBeTruthy();
  });

  it("CT-03: deve informar quando não houver cancelamentos", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      matriculas: [],
      paginacao: {
        pagina: 1,
        limite: 10,
        total: 0,
        totalPaginas: 0,
      },
    });

    render(<HistoricoMatriculas />);

    expect(
      await screen.findByText(
        "Nenhum cancelamento encontrado"
      )
    ).toBeTruthy();
  });

  it("CT-04: deve apresentar erro quando a consulta falhar", async () => {
    vi.mocked(apiRequest).mockRejectedValue(
      new Error("Falha na conexão com o servidor.")
    );

    render(<HistoricoMatriculas />);

    expect(
      await screen.findByRole("alert")
    ).toHaveProperty(
      "textContent",
      "Falha na conexão com o servidor."
    );

    expect(
      screen.getByRole("button", {
        name: "Tentar novamente",
      })
    ).toBeTruthy();
  });

  it("CT-05: deve permitir tentar novamente após erro", async () => {
    vi.mocked(apiRequest)
      .mockRejectedValueOnce(
        new Error("Erro temporário.")
      )
      .mockResolvedValueOnce(respostaHistorico);

    const usuario = userEvent.setup();

    render(<HistoricoMatriculas />);

    expect(
      await screen.findByRole("alert")
    ).toBeTruthy();

    await usuario.click(
      screen.getByRole("button", {
        name: "Tentar novamente",
      })
    );

    expect(
      await screen.findByText("Projeto de Software")
    ).toBeTruthy();

    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it("CT-06: deve avançar e voltar entre páginas", async () => {
    const primeiraPagina = Array.from(
      { length: 10 },
      (_, indice) => ({
        ...matriculaCancelada,
        id: indice + 1,
        disciplina: {
          ...matriculaCancelada.disciplina,
          nome: `Disciplina ${indice + 1}`,
        },
      })
    );

    const segundaPagina = [
      {
        ...matriculaCancelada,
        id: 11,
        disciplina: {
          ...matriculaCancelada.disciplina,
          nome: "Disciplina 11",
        },
      },
    ];

    vi.mocked(apiRequest)
      .mockResolvedValueOnce({
        matriculas: primeiraPagina,
        paginacao: {
          pagina: 1,
          limite: 10,
          total: 11,
          totalPaginas: 2,
        },
      })
      .mockResolvedValueOnce({
        matriculas: segundaPagina,
        paginacao: {
          pagina: 2,
          limite: 10,
          total: 11,
          totalPaginas: 2,
        },
      })
      .mockResolvedValueOnce({
        matriculas: primeiraPagina,
        paginacao: {
          pagina: 1,
          limite: 10,
          total: 11,
          totalPaginas: 2,
        },
      });

    const usuario = userEvent.setup();

    render(<HistoricoMatriculas />);

    expect(
      await screen.findByText("Disciplina 1")
    ).toBeTruthy();

    await usuario.click(
      screen.getByRole("button", {
        name: "Próxima",
      })
    );

    expect(
      await screen.findByText("Disciplina 11")
    ).toBeTruthy();

    expect(apiRequest).toHaveBeenLastCalledWith(
      "/api/aluno/matriculas/historico?pagina=2&limite=10"
    );

    expect(
      screen.getByText("Página 2 de 2")
    ).toBeTruthy();

    await usuario.click(
      screen.getByRole("button", {
        name: "Anterior",
      })
    );

    expect(
      await screen.findByText("Disciplina 1")
    ).toBeTruthy();

    await waitFor(() => {
      expect(apiRequest).toHaveBeenLastCalledWith(
        "/api/aluno/matriculas/historico?pagina=1&limite=10"
      );
    });
  });

  it("CT-07: não deve apresentar paginação quando houver uma página", async () => {
    render(<HistoricoMatriculas />);

    expect(
      await screen.findByText("Projeto de Software")
    ).toBeTruthy();

    expect(
      screen.queryByRole("navigation", {
        name: "Paginação do histórico",
      })
    ).toBeNull();
  });

  it("CT-08: deve lidar com data de cancelamento não informada", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      ...respostaHistorico,
      matriculas: [
        {
          ...matriculaCancelada,
          canceladaEm: null,
        },
      ],
    });

    render(<HistoricoMatriculas />);

    expect(
      await screen.findByText("Projeto de Software")
    ).toBeTruthy();

    expect(
      screen.getByText(/Não informada/)
    ).toBeTruthy();
  });

  it("CT-09: deve carregar histórico somente após selecionar a aba", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({
        matriculas: [],
      })
      .mockResolvedValueOnce(respostaHistorico);

    const usuario = userEvent.setup();

    render(
      <MemoryRouter>
        <MatriculasPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByText("Nenhuma matrícula ativa")
    ).toBeTruthy();

    expect(apiRequest).toHaveBeenCalledTimes(1);

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/aluno/matriculas"
    );

    await usuario.click(
      screen.getByRole("button", {
        name: "Histórico de cancelamentos",
      })
    );

    expect(
      await screen.findByText("Projeto de Software")
    ).toBeTruthy();

    expect(apiRequest).toHaveBeenCalledTimes(2);

    expect(apiRequest).toHaveBeenLastCalledWith(
      "/api/aluno/matriculas/historico?pagina=1&limite=10"
    );
  });
});