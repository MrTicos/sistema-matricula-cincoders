// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";

import { TurmasPage } from "./TurmasPage";
import { apiRequest } from "../../api/client";

vi.mock("../../api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../../components/LogoutButton", () => ({
  LogoutButton: () => <button type="button">Sair</button>,
}));

const disciplina = {
  id: 3,
  codigo: "CIN0100",
  nome: "Projeto de Software",
  cargaHoraria: 60,
};

const professor = {
  id: 8,
  nome: "Ana Carolina",
  email: "ana@cin.ufpe.br",
};

const turma = {
  id: 20,
  disciplinaId: 3,
  professorId: 8,
  vagasTotais: 30,
  vagasOcupadas: 2,
  vagasDisponiveis: 28,
  disciplina,
  professor,
};

const respostaPadrao = {
  turmas: [turma],
  disciplinas: [disciplina],
  professores: [professor],
  paginacao: {
    pagina: 1,
    limite: 10,
    total: 1,
    totalPaginas: 1,
  },
};

const respostaVazia = {
  ...respostaPadrao,
  turmas: [],
  paginacao: {
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  },
};

function configurarApi(
  responder: (
    endpoint: string,
    options?: RequestInit
  ) => unknown | Promise<unknown>
) {
  vi.mocked(apiRequest).mockImplementation(
    ((endpoint: string, options?: RequestInit) =>
      Promise.resolve(responder(endpoint, options))) as typeof apiRequest
  );
}

function LocalizacaoTeste() {
  const localizacao = useLocation();
  return <output data-testid="url-atual">{localizacao.search}</output>;
}

function renderizarPagina(url = "/secretaria/turmas") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <TurmasPage />
      <LocalizacaoTeste />
    </MemoryRouter>
  );
}

async function preencherFormulario(usuario: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("option", {
    name: "CIN0100 — Projeto de Software",
  });
  await screen.findByRole("option", {
    name: "Ana Carolina — ana@cin.ufpe.br",
  });

  await usuario.selectOptions(screen.getByLabelText("Disciplina"), "3");
  await usuario.selectOptions(screen.getByLabelText("Professor"), "8");
}

beforeEach(() => {
  vi.resetAllMocks();
  configurarApi(() => respostaPadrao);
});

afterEach(() => {
  cleanup();
});

describe("US-11 — Consulta de turmas", () => {
  it("CT-01: deve exibir turmas e vagas ocupadas, totais e disponíveis", async () => {
    renderizarPagina();

    const tabela = await screen.findByRole("table");
    expect(within(tabela).getByText("CIN0100 — Projeto de Software")).toBeTruthy();
    expect(screen.getByText("2/30")).toBeTruthy();
    expect(screen.getByText("28")).toBeTruthy();
  });

  it("CT-02: deve pesquisar e refletir a busca na URL", async () => {
    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("2/30");

    await usuario.type(
      screen.getByLabelText("Pesquisar por disciplina ou professor"),
      "CIN0100"
    );
    await usuario.click(screen.getByRole("button", { name: "Pesquisar turmas" }));

    await waitFor(() => {
      expect(screen.getByTestId("url-atual").textContent).toContain(
        "busca=CIN0100"
      );
      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining("/api/secretaria/turmas?pagina=1&limite=10&busca=CIN0100")
      );
    });
  });

  it("CT-03: deve avançar a página preservando a busca", async () => {
    const outraTurma = {
      ...turma,
      id: 21,
      vagasTotais: 15,
      vagasOcupadas: 0,
      vagasDisponiveis: 15,
    };

    configurarApi((endpoint) => {
      if (endpoint.startsWith("/api/secretaria/turmas?")) {
        const pagina2 = endpoint.includes("pagina=2");

        return {
          turmas: [pagina2 ? outraTurma : turma],
          paginacao: {
            pagina: pagina2 ? 2 : 1,
            limite: 10,
            total: 11,
            totalPaginas: 2,
          },
        };
      }

      return respostaPadrao;
    });

    const usuario = userEvent.setup();
    renderizarPagina("/secretaria/turmas?busca=CIN0100&pagina=1");
    await screen.findByText("2/30");

    await usuario.click(screen.getByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("0/15")).toBeTruthy();
    expect(screen.getByTestId("url-atual").textContent).toContain("pagina=2");
    expect(screen.getByTestId("url-atual").textContent).toContain("busca=CIN0100");
  });

  it("CT-04: deve apresentar mensagem de lista vazia", async () => {
    configurarApi((endpoint) =>
      endpoint.startsWith("/api/secretaria/turmas?")
        ? respostaVazia
        : respostaPadrao
    );

    renderizarPagina("/secretaria/turmas?busca=INEXISTENTE&pagina=1");

    expect(
      await screen.findByText('Nenhuma turma encontrada para "INEXISTENTE".')
    ).toBeTruthy();
  });

  it("CT-05: deve permitir tentar novamente após falha de rede", async () => {
    let chamadas = 0;

    configurarApi((endpoint) => {
      if (endpoint.startsWith("/api/secretaria/turmas?") && chamadas++ === 0) {
        return Promise.reject(new Error("Falha de conexão"));
      }

      return respostaPadrao;
    });

    const usuario = userEvent.setup();
    renderizarPagina();

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Falha de conexão"
    );

    await usuario.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("2/30")).toBeTruthy();
  });

  it("CT-06: deve informar carregamento durante a consulta", async () => {
    renderizarPagina();

    expect(screen.getByText("Carregando turmas...")).toBeTruthy();
    expect(await screen.findByText("2/30")).toBeTruthy();
  });
});

describe("US-11 — Abertura de turmas", () => {
  it("CT-01: deve apresentar disciplina, professor e vagas obrigatórios", () => {
    renderizarPagina();

    expect(screen.getByLabelText("Disciplina")).toBeTruthy();
    expect(screen.getByLabelText("Professor")).toBeTruthy();
    expect(screen.getByLabelText("Quantidade de vagas")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Abrir turma" })).toBeTruthy();
  });

  it("CT-02: deve abrir turma válida e atualizar a lista preservando URL", async () => {
    const novaTurma = {
      ...turma,
      id: 22,
      vagasTotais: 30,
      vagasOcupadas: 0,
      vagasDisponiveis: 30,
    };
    let cadastrada = false;

    configurarApi((endpoint, options) => {
      if (endpoint === "/api/secretaria/turmas" && options?.method === "POST") {
        cadastrada = true;
        return { message: "Turma aberta com sucesso.", turma: novaTurma };
      }

      if (endpoint.startsWith("/api/secretaria/turmas?")) {
        return cadastrada
          ? {
              turmas: [novaTurma],
              paginacao: respostaPadrao.paginacao,
            }
          : respostaPadrao;
      }

      return respostaPadrao;
    });

    const usuario = userEvent.setup();
    renderizarPagina("/secretaria/turmas?busca=CIN0100&pagina=1");
    await preencherFormulario(usuario);

    await usuario.click(screen.getByRole("button", { name: "Abrir turma" }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        "/api/secretaria/turmas",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            disciplinaId: 3,
            professorId: 8,
            vagasTotais: 30,
          }),
        })
      );
    });

    expect(await screen.findByText("Turma 22 aberta com sucesso!")).toBeTruthy();
    expect(await screen.findByText("0/30")).toBeTruthy();
    expect(screen.getByTestId("url-atual").textContent).toContain("busca=CIN0100");
  });

  it("CT-03: deve impedir vagas inválidas sem chamar POST", async () => {
    const usuario = userEvent.setup();
    renderizarPagina();
    await preencherFormulario(usuario);

    const campo = screen.getByLabelText("Quantidade de vagas") as HTMLInputElement;
    await usuario.clear(campo);
    await usuario.type(campo, "0");

    expect(campo.validity.valid).toBe(false);
    await usuario.click(screen.getByRole("button", { name: "Abrir turma" }));

    expect(
      vi.mocked(apiRequest).mock.calls.filter(([, opcoes]) => opcoes?.method === "POST")
    ).toHaveLength(0);
  });

  it("CT-04: deve exigir disciplina e professor selecionados", async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    await screen.findByRole("option", {
      name: "CIN0100 — Projeto de Software",
    });
    await screen.findByRole("option", {
      name: "Ana Carolina — ana@cin.ufpe.br",
    });

    await usuario.click(screen.getByRole("button", { name: "Abrir turma" }));

    expect(
      vi.mocked(apiRequest).mock.calls.filter(([, opcoes]) => opcoes?.method === "POST")
    ).toHaveLength(0);
  });

  it("CT-05: deve apresentar erro da API sem perder o formulário", async () => {
    configurarApi((endpoint, options) => {
      if (endpoint === "/api/secretaria/turmas" && options?.method === "POST") {
        return Promise.reject(new Error("Disciplina não encontrada."));
      }

      return respostaPadrao;
    });

    const usuario = userEvent.setup();
    renderizarPagina();
    await preencherFormulario(usuario);

    await usuario.click(screen.getByRole("button", { name: "Abrir turma" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Disciplina não encontrada."
    );
    expect(screen.getByLabelText("Disciplina")).toHaveProperty("value", "3");
    expect(screen.getByLabelText("Professor")).toHaveProperty("value", "8");
  });

  it("CT-06: deve impedir reenvio durante a abertura", async () => {
    let concluirAbertura!: (valor: unknown) => void;
    const respostaPendente = new Promise<unknown>((resolve) => {
      concluirAbertura = resolve;
    });

    configurarApi((endpoint, options) => {
      if (endpoint === "/api/secretaria/turmas" && options?.method === "POST") {
        return respostaPendente;
      }

      return respostaPadrao;
    });

    const usuario = userEvent.setup();
    renderizarPagina();
    await preencherFormulario(usuario);
    await usuario.click(screen.getByRole("button", { name: "Abrir turma" }));

    expect(screen.getByRole("button", { name: "Abrindo turma..." })).toHaveProperty(
      "disabled",
      true
    );
    expect(screen.getByLabelText("Disciplina")).toHaveProperty("disabled", true);
    expect(screen.getByLabelText("Professor")).toHaveProperty("disabled", true);

    concluirAbertura({
      message: "Turma aberta com sucesso.",
      turma: { ...turma, id: 22, vagasOcupadas: 0, vagasDisponiveis: 30 },
    });

    expect(await screen.findByText("Turma 22 aberta com sucesso!")).toBeTruthy();
  });

  it("CT-07: deve buscar opções de disciplinas por código", async () => {
    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByRole("option", { name: "CIN0100 — Projeto de Software" });

    await usuario.type(screen.getByLabelText("Buscar disciplina para a turma"), "CIN0100");
    await usuario.click(screen.getByRole("button", { name: "Buscar disciplinas" }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining("/api/secretaria/disciplinas?pagina=1&limite=50&busca=CIN0100")
      );
    });
  });

  it("CT-08: deve permitir tentar carregar disciplinas após falha", async () => {
    let chamadas = 0;

    configurarApi((endpoint) => {
      if (
        endpoint.startsWith("/api/secretaria/disciplinas?") &&
        chamadas++ === 0
      ) {
        return Promise.reject(new Error("Erro ao buscar disciplinas"));
      }

      return respostaPadrao;
    });

    const usuario = userEvent.setup();
    renderizarPagina();

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Erro ao buscar disciplinas"
    );

    await usuario.click(
      screen.getByRole("button", { name: "Tentar carregar disciplinas" })
    );

    expect(
      await screen.findByRole("option", { name: "CIN0100 — Projeto de Software" })
    ).toBeTruthy();
  });
});
