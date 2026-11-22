// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";

import { ProfessoresPage } from "./ProfessoresPage";
import { apiRequest } from "../../api/client";

vi.mock("../../api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../../components/LogoutButton", () => ({
  LogoutButton: () => <button type="button">Sair</button>,
}));

const listaVazia = {
  professores: [],
  paginacao: {
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  },
};

const professorExemplo = {
  id: 10,
  nome: "Ana Carolina",
  email: "ana.carolina@cin.ufpe.br",
};

const listaComProfessor = {
  professores: [professorExemplo],
  paginacao: {
    pagina: 1,
    limite: 10,
    total: 1,
    totalPaginas: 1,
  },
};

function LocalizacaoTeste() {
  const localizacao = useLocation();
  return <output data-testid="url-atual">{localizacao.search}</output>;
}

function renderizarPagina(url = "/secretaria/professores") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ProfessoresPage />
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

describe("US-10 — Cadastro de professores", () => {
  it("CT-01: deve apresentar os campos obrigatórios", () => {
    renderizarPagina();

    expect(screen.getByLabelText("Nome do professor")).toBeTruthy();
    expect(screen.getByLabelText("E-mail do professor")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cadastrar professor" })).toBeTruthy();
  });

  it("CT-02: deve cadastrar professor válido e atualizar a lista", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(listaVazia)
      .mockResolvedValueOnce({
        message: "Professor cadastrado com sucesso.",
        professor: professorExemplo,
      })
      .mockResolvedValueOnce(listaComProfessor);

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("Nenhum professor cadastrado.");

    await usuario.type(screen.getByLabelText("Nome do professor"), "Ana Carolina");
    await usuario.type(
      screen.getByLabelText("E-mail do professor"),
      "ANA.CAROLINA@CIN.UFPE.BR"
    );
    await usuario.click(screen.getByRole("button", { name: "Cadastrar professor" }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        "/api/secretaria/professores",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            nome: "Ana Carolina",
            email: "ana.carolina@cin.ufpe.br",
          }),
        })
      );
    });

    expect(
      await screen.findByText("Professor Ana Carolina cadastrado com sucesso!")
    ).toBeTruthy();
    expect(await screen.findByText("ana.carolina@cin.ufpe.br")).toBeTruthy();
  });

  it("CT-03: deve apresentar erro de e-mail duplicado", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(listaVazia)
      .mockRejectedValueOnce(new Error("Já existe um professor com esse e-mail."));

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("Nenhum professor cadastrado.");

    await usuario.type(screen.getByLabelText("Nome do professor"), "Ana Carolina");
    await usuario.type(
      screen.getByLabelText("E-mail do professor"),
      "ana.carolina@cin.ufpe.br"
    );
    await usuario.click(screen.getByRole("button", { name: "Cadastrar professor" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent", "Já existe um professor com esse e-mail."
    );
  });

  it("CT-04: deve impedir cadastro com e-mail inválido", async () => {
    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("Nenhum professor cadastrado.");

    await usuario.type(screen.getByLabelText("Nome do professor"), "Ana Carolina");
    const campoEmail = screen.getByLabelText("E-mail do professor") as HTMLInputElement;
    await usuario.type(campoEmail, "semarroba");

    expect(campoEmail.validity.valid).toBe(false);
    await usuario.click(screen.getByRole("button", { name: "Cadastrar professor" }));

    // A consulta GET inicial ocorreu, mas nenhum POST deve ser enviado.
    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it("CT-05: deve impedir novo envio durante o cadastro", async () => {
    let concluirCadastro!: (valor: unknown) => void;
    const cadastroPendente = new Promise<unknown>((resolve) => {
      concluirCadastro = resolve;
    });

    vi.mocked(apiRequest)
      .mockResolvedValueOnce(listaVazia)
      .mockReturnValueOnce(cadastroPendente)
      .mockResolvedValueOnce(listaComProfessor);

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("Nenhum professor cadastrado.");

    await usuario.type(screen.getByLabelText("Nome do professor"), "Ana Carolina");
    await usuario.type(
      screen.getByLabelText("E-mail do professor"),
      "ana.carolina@cin.ufpe.br"
    );
    await usuario.click(screen.getByRole("button", { name: "Cadastrar professor" }));

    expect(screen.getByRole("button", { name: "Cadastrando..." })).toHaveProperty(
      "disabled", true
    );
    expect(screen.getByLabelText("Nome do professor")).toHaveProperty("disabled", true);
    expect(screen.getByLabelText("E-mail do professor")).toHaveProperty("disabled", true);

    concluirCadastro({
      message: "Professor cadastrado com sucesso.",
      professor: professorExemplo,
    });

    expect(
      await screen.findByText("Professor Ana Carolina cadastrado com sucesso!")
    ).toBeTruthy();
  });
});

describe("US-10 — Consulta de professores", () => {
  it("CT-01: deve exibir os professores retornados", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce(listaComProfessor);

    renderizarPagina();

    expect(await screen.findByText("Ana Carolina")).toBeTruthy();
    expect(screen.getByText("ana.carolina@cin.ufpe.br")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("CT-02: deve pesquisar e refletir a busca na URL", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(listaVazia)
      .mockResolvedValueOnce(listaComProfessor);

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("Nenhum professor cadastrado.");

    await usuario.type(
      screen.getByLabelText("Pesquisar professores por nome ou e-mail"),
      "Ana"
    );
    await usuario.click(screen.getByRole("button", { name: "Pesquisar" }));

    expect(await screen.findByText("Ana Carolina")).toBeTruthy();
    expect(screen.getByTestId("url-atual").textContent).toContain("busca=Ana");
    expect(screen.getByTestId("url-atual").textContent).toContain("pagina=1");
    expect(apiRequest).toHaveBeenLastCalledWith(
      expect.stringContaining("busca=Ana")
    );
  });

  it("CT-03: deve avançar a página e atualizar a URL", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({
        professores: [professorExemplo],
        paginacao: { pagina: 1, limite: 10, total: 11, totalPaginas: 2 },
      })
      .mockResolvedValueOnce({
        professores: [{
          id: 11,
          nome: "Bruno Silva",
          email: "bruno@cin.ufpe.br",
        }],
        paginacao: { pagina: 2, limite: 10, total: 11, totalPaginas: 2 },
      });

    const usuario = userEvent.setup();
    renderizarPagina();
    await screen.findByText("Ana Carolina");

    await usuario.click(screen.getByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("Bruno Silva")).toBeTruthy();
    expect(screen.getByTestId("url-atual").textContent).toContain("pagina=2");
    expect(apiRequest).toHaveBeenLastCalledWith(
      expect.stringContaining("pagina=2")
    );
  });

  it("CT-04: deve apresentar mensagem de lista vazia", async () => {
    renderizarPagina("/secretaria/professores?busca=INEXISTENTE&pagina=1");

    expect(
      await screen.findByText('Nenhum professor encontrado para "INEXISTENTE".')
    ).toBeTruthy();
  });

  it("CT-05: deve permitir tentar novamente após erro de rede", async () => {
    vi.mocked(apiRequest)
      .mockRejectedValueOnce(new Error("Falha de conexão"))
      .mockResolvedValueOnce(listaVazia);

    const usuario = userEvent.setup();
    renderizarPagina();

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent", "Falha de conexão"
    );

    await usuario.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Nenhum professor cadastrado.")).toBeTruthy();
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it("CT-06: deve informar carregamento enquanto consulta", async () => {
    renderizarPagina();

    expect(screen.getByText("Carregando professores...")).toBeTruthy();
    expect(await screen.findByText("Nenhum professor cadastrado.")).toBeTruthy();
  });
});