// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";

import { DisciplinasPage } from "./DisciplinasPage";
import { apiRequest } from "../../api/client";

vi.mock("../../api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../../components/LogoutButton", () => ({
  LogoutButton: () => <button type="button">Sair</button>,
}));

const listaVazia = {
  disciplinas: [],
  paginacao: {
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  },
};

const disciplinaExemplo = {
  id: 10,
  codigo: "CIN0100",
  nome: "Projeto de Software",
  cargaHoraria: 60,
};

function LocalizacaoTeste() {
  const localizacao = useLocation();
  return <output data-testid="url-atual">{localizacao.search}</output>;
}

function renderizarPagina(url = "/secretaria") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <DisciplinasPage />
      <LocalizacaoTeste />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(apiRequest).mockResolvedValue(listaVazia);
});

afterEach(() => {
  cleanup();
});

describe("US-09 — Cadastro de disciplinas", () => {
  it("CT-01: deve apresentar os campos obrigatórios", () => {
    renderizarPagina();

    expect(screen.getByLabelText("Código da disciplina")).toBeTruthy();
    expect(screen.getByLabelText("Nome da disciplina")).toBeTruthy();
    expect(screen.getByLabelText("Carga horária")).toBeTruthy();
  });

  it("CT-02: deve cadastrar uma disciplina válida e atualizar a lista", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(listaVazia)
      .mockResolvedValueOnce({
        message: "Disciplina cadastrada com sucesso.",
        disciplina: disciplinaExemplo,
      })
      .mockResolvedValueOnce({
        disciplinas: [disciplinaExemplo],
        paginacao: {
          pagina: 1,
          limite: 10,
          total: 1,
          totalPaginas: 1,
        },
      });

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("Nenhuma disciplina cadastrada.");

    await usuario.type(screen.getByLabelText("Código da disciplina"), "cin0100");
    await usuario.type(
      screen.getByLabelText("Nome da disciplina"),
      "Projeto de Software"
    );
    await usuario.click(
      screen.getByRole("button", { name: "Cadastrar disciplina" })
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
      await screen.findByText("Disciplina CIN0100 cadastrada com sucesso!")
    ).toBeTruthy();
    expect(await screen.findByText("Projeto de Software")).toBeTruthy();
  });

  it("CT-03: deve apresentar erro de código duplicado", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(listaVazia)
      .mockRejectedValueOnce(new Error("Já existe uma disciplina com esse código."));

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("Nenhuma disciplina cadastrada.");

    await usuario.type(screen.getByLabelText("Código da disciplina"), "CIN0100");
    await usuario.type(
      screen.getByLabelText("Nome da disciplina"),
      "Projeto de Software"
    );
    await usuario.click(
      screen.getByRole("button", { name: "Cadastrar disciplina" })
    );

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Já existe uma disciplina com esse código."
    );
  });

  it("CT-04: deve impedir cadastro com carga horária inválida", async () => {
    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("Nenhuma disciplina cadastrada.");

    await usuario.type(screen.getByLabelText("Código da disciplina"), "CIN0200");
    await usuario.type(
      screen.getByLabelText("Nome da disciplina"),
      "Disciplina Inválida"
    );

    const carga = screen.getByLabelText("Carga horária") as HTMLInputElement;
    await usuario.clear(carga);
    await usuario.type(carga, "16");

    expect(carga.validity.valid).toBe(false);
    await usuario.click(
      screen.getByRole("button", { name: "Cadastrar disciplina" })
    );

    // A chamada GET inicial existe; nenhum POST deve ter sido enviado.
    expect(apiRequest).toHaveBeenCalledTimes(1);
  });
});

describe("US-08 — Consulta de disciplinas", () => {
  it("CT-01: deve exibir as disciplinas retornadas", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      disciplinas: [disciplinaExemplo],
      paginacao: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 },
    });

    renderizarPagina();

    expect(await screen.findByText("CIN0100")).toBeTruthy();
    expect(screen.getByText("Projeto de Software")).toBeTruthy();
    expect(screen.getByText("60 h")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("CT-02: deve pesquisar e refletir a busca na URL", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(listaVazia)
      .mockResolvedValueOnce({
        disciplinas: [disciplinaExemplo],
        paginacao: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 },
      });

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("Nenhuma disciplina cadastrada.");

    await usuario.type(
      screen.getByLabelText("Pesquisar disciplinas por código ou nome"),
      "CIN0100"
    );
    await usuario.click(screen.getByRole("button", { name: "Pesquisar" }));

    expect(await screen.findByText("Projeto de Software")).toBeTruthy();
    expect(screen.getByTestId("url-atual").textContent).toContain("busca=CIN0100");
    expect(screen.getByTestId("url-atual").textContent).toContain("pagina=1");
    expect(apiRequest).toHaveBeenLastCalledWith(
      expect.stringContaining("busca=CIN0100")
    );
  });

  it("CT-03: deve avançar a página e atualizar a URL", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({
        disciplinas: [disciplinaExemplo],
        paginacao: { pagina: 1, limite: 10, total: 11, totalPaginas: 2 },
      })
      .mockResolvedValueOnce({
        disciplinas: [{ ...disciplinaExemplo, id: 11, codigo: "CIN0200" }],
        paginacao: { pagina: 2, limite: 10, total: 11, totalPaginas: 2 },
      });

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("CIN0100");

    await usuario.click(screen.getByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("CIN0200")).toBeTruthy();
    expect(screen.getByTestId("url-atual").textContent).toContain("pagina=2");
    expect(apiRequest).toHaveBeenLastCalledWith(
      expect.stringContaining("pagina=2")
    );
  });

  it("CT-04: deve apresentar mensagem de lista vazia", async () => {
    renderizarPagina("/secretaria?busca=INEXISTENTE&pagina=1");

    expect(
      await screen.findByText('Nenhuma disciplina encontrada para "INEXISTENTE".')
    ).toBeTruthy();
  });

  it("CT-05: deve permitir tentar novamente após erro de rede", async () => {
    vi.mocked(apiRequest)
      .mockRejectedValueOnce(new Error("Falha de conexão"))
      .mockResolvedValueOnce(listaVazia);

    const usuario = userEvent.setup();
    renderizarPagina();

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Falha de conexão"
    );

    await usuario.click(
      screen.getByRole("button", { name: "Tentar novamente" })
    );

    expect(await screen.findByText("Nenhuma disciplina cadastrada.")).toBeTruthy();
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it("CT-06: deve informar carregamento enquanto consulta", async () => {
    renderizarPagina();

    expect(screen.getByText("Carregando disciplinas...")).toBeTruthy();
    expect(await screen.findByText("Nenhuma disciplina cadastrada.")).toBeTruthy();
  });
});

describe("US-09 — Edição de disciplinas", () => {
  const listaComDisciplina = {
    disciplinas: [disciplinaExemplo],
    paginacao: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 },
  };

  it("CT-01: deve abrir formulário preenchido com os dados da disciplina", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce(listaComDisciplina);

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("CIN0100");

    await usuario.click(screen.getByRole("button", { name: "Editar CIN0100" }));

    expect(screen.getByLabelText("Código da disciplina em edição")).toHaveProperty(
      "value", "CIN0100"
    );
    expect(screen.getByLabelText("Nome da disciplina em edição")).toHaveProperty(
      "value", "Projeto de Software"
    );
    expect(screen.getByLabelText("Carga horária em edição")).toHaveProperty(
      "value", "60"
    );
  });

  it("CT-02: deve cancelar a edição sem chamar a API", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce(listaComDisciplina);

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("CIN0100");

    await usuario.click(screen.getByRole("button", { name: "Editar CIN0100" }));
    await usuario.click(screen.getByRole("button", { name: "Cancelar edição" }));

    expect(screen.queryByRole("heading", { name: "Editar disciplina CIN0100" })).toBeNull();
    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it("CT-03: deve salvar a edição, atualizar a lista e preservar a URL", async () => {
    const atualizada = { ...disciplinaExemplo, nome: "Projeto de Software Atualizado" };

    vi.mocked(apiRequest)
      .mockResolvedValueOnce(listaComDisciplina)
      .mockResolvedValueOnce({
        message: "Disciplina atualizada com sucesso.",
        disciplina: atualizada,
      })
      .mockResolvedValueOnce({
        disciplinas: [atualizada],
        paginacao: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 },
      });

    const usuario = userEvent.setup();
    renderizarPagina("/secretaria?busca=CIN0100&pagina=1");
    await screen.findByText("CIN0100");

    await usuario.click(screen.getByRole("button", { name: "Editar CIN0100" }));
    const campoNome = screen.getByLabelText("Nome da disciplina em edição");
    await usuario.clear(campoNome);
    await usuario.type(campoNome, "Projeto de Software Atualizado");
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        "/api/secretaria/disciplinas/10",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            codigo: "CIN0100",
            nome: "Projeto de Software Atualizado",
            cargaHoraria: 60,
          }),
        })
      );
    });

    expect(
      await screen.findByText("Disciplina CIN0100 atualizada com sucesso!")
    ).toBeTruthy();
    expect(await screen.findByText("Projeto de Software Atualizado")).toBeTruthy();
    expect(screen.getByTestId("url-atual").textContent).toContain("busca=CIN0100");
    expect(screen.getByTestId("url-atual").textContent).toContain("pagina=1");
  });

  it("CT-04: deve mostrar erro quando o novo código já existir", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(listaComDisciplina)
      .mockRejectedValueOnce(new Error("Já existe uma disciplina com esse código."));

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("CIN0100");

    await usuario.click(screen.getByRole("button", { name: "Editar CIN0100" }));
    const campoCodigo = screen.getByLabelText("Código da disciplina em edição");
    await usuario.clear(campoCodigo);
    await usuario.type(campoCodigo, "CIN0200");
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent", "Já existe uma disciplina com esse código."
    );
    expect(screen.getByRole("heading", { name: "Editar disciplina CIN0100" })).toBeTruthy();
  });

  it("CT-05: deve impedir envio com carga horária inválida", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce(listaComDisciplina);

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("CIN0100");

    await usuario.click(screen.getByRole("button", { name: "Editar CIN0100" }));
    const campoCarga = screen.getByLabelText("Carga horária em edição") as HTMLInputElement;
    await usuario.clear(campoCarga);
    await usuario.type(campoCarga, "16");

    expect(campoCarga.validity.valid).toBe(false);
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    // Somente a consulta inicial; nenhuma requisição PATCH.
    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it("CT-06: deve bloquear novo envio e cancelamento enquanto salva", async () => {
    const atualizada = { ...disciplinaExemplo, nome: "Nome Atualizado" };
    let concluirAtualizacao!: (valor: unknown) => void;
    const requisicaoPendente = new Promise<unknown>((resolve) => {
      concluirAtualizacao = resolve;
    });

    vi.mocked(apiRequest)
      .mockResolvedValueOnce(listaComDisciplina)
      .mockReturnValueOnce(requisicaoPendente)
      .mockResolvedValueOnce({ disciplinas: [atualizada], paginacao: listaComDisciplina.paginacao });

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("CIN0100");

    await usuario.click(screen.getByRole("button", { name: "Editar CIN0100" }));
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(screen.getByRole("button", { name: "Salvando..." })).toHaveProperty(
      "disabled", true
    );
    expect(screen.getByRole("button", { name: "Cancelar edição" })).toHaveProperty(
      "disabled", true
    );

    concluirAtualizacao({ message: "Disciplina atualizada com sucesso.", disciplina: atualizada });

    expect(
      await screen.findByText("Disciplina CIN0100 atualizada com sucesso!")
    ).toBeTruthy();
  });

  it("CT-07: deve permitir nova tentativa após erro na edição", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(listaComDisciplina)
      .mockRejectedValueOnce(new Error("Falha temporária"))
      .mockResolvedValueOnce({
        message: "Disciplina atualizada com sucesso.",
        disciplina: disciplinaExemplo,
      })
      .mockResolvedValueOnce(listaComDisciplina);

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("CIN0100");

    await usuario.click(screen.getByRole("button", { name: "Editar CIN0100" }));
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent", "Falha temporária"
    );

    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(
      await screen.findByText("Disciplina CIN0100 atualizada com sucesso!")
    ).toBeTruthy();
  });
});