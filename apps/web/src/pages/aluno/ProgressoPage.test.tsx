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

import { ProgressoPage } from "./ProgressoPage";
import { apiRequest } from "../../api/client";

import type { RespostaProgresso } from "../../types/progresso";

vi.mock("../../api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../../components/LogoutButton", () => ({
  LogoutButton: () => <button type="button">Sair</button>,
}));

const resposta: RespostaProgresso = {
  curso: {
    id: 1,
    nome: "Sistemas de Informação",
  },

  progresso: {
    obrigatoria: {
      exigida: 120,
      integralizada: 60,
      emCurso: 60,
      faltante: 60,
      percentual: 50,
    },

    perfil: {
      exigida: 60,
      integralizada: 0,
      emCurso: 0,
      faltante: 60,
      percentual: 0,
    },

    livre: {
      exigida: 30,
      integralizada: 0,
      emCurso: 0,
      faltante: 30,
      percentual: 0,
    },

    total: {
      exigida: 210,
      integralizada: 60,
      emCurso: 60,
      faltante: 150,
      percentual: 28.57,
    },
  },

  cargaHorariaEmCurso: 60,
};

function renderizarPagina() {
  return render(
    <MemoryRouter initialEntries={["/aluno/progresso"]}>
      <ProgressoPage />
    </MemoryRouter>
  );
}

describe("US-07 — Progresso curricular", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(apiRequest).mockResolvedValue(resposta);
  });

  afterEach(() => {
    cleanup();
  });

  it("CT-01: deve consultar o progresso do aluno", async () => {
    renderizarPagina();

    expect(
      await screen.findByText("Sistemas de Informação")
    ).toBeTruthy();

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/aluno/progresso"
    );
  });

  it("CT-02: deve exibir as categorias curriculares", async () => {
    renderizarPagina();

    await screen.findByText("Sistemas de Informação");

    expect(
      screen.getByText("Disciplinas obrigatórias")
    ).toBeTruthy();

    expect(
      screen.getByText("Eletivas de perfil")
    ).toBeTruthy();

    expect(
      screen.getByText("Disciplinas livres")
    ).toBeTruthy();
  });

  it("CT-03: deve apresentar o percentual total", async () => {
    renderizarPagina();

    await screen.findByText("Sistemas de Informação");

    const barra = screen.getByRole("progressbar", {
      name: "Progresso total do curso",
    });

    expect(barra).toHaveProperty("value", 28.57);
    expect(barra).toHaveProperty("max", 100);
  });

  it("CT-04: deve separar horas em andamento das integralizadas", async () => {
    renderizarPagina();

    await screen.findByText("Sistemas de Informação");

    const secao = screen
      .getByText("Disciplinas em andamento")
      .closest("section");

    expect(secao?.textContent).toContain("60h");

    expect(secao?.textContent).toContain(
      "ainda não são consideradas"
    );
  });

  it("CT-05: deve apresentar erro quando a API falhar", async () => {
    vi.mocked(apiRequest).mockRejectedValue(
      new Error("Falha ao consultar progresso.")
    );

    renderizarPagina();

    expect(
      await screen.findByRole("alert")
    ).toHaveProperty(
      "textContent",
      "Falha ao consultar progresso."
    );
  });

  it("CT-06: deve permitir tentar novamente após falha de rede", async () => {
  // A primeira consulta falha e a segunda funciona.
  vi.mocked(apiRequest)
    .mockRejectedValueOnce(new TypeError("Failed to fetch"))
    .mockResolvedValue(resposta);

  const usuario = userEvent.setup();

  renderizarPagina();

  // Deve apresentar uma mensagem amigável.
  const alerta = await screen.findByRole("alert");

  expect(alerta.textContent).toContain(
    "Não foi possível conectar ao servidor."
  );

  // O botão de recuperação deve estar disponível.
  const botao = screen.getByRole("button", {
    name: "Tentar novamente",
  });

  await usuario.click(botao);

  // A API deve receber uma segunda requisição.
  await waitFor(() => {
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  // Ambas as consultas utilizam o mesmo endpoint.
  expect(apiRequest).toHaveBeenNthCalledWith(
    1,
    "/api/aluno/progresso"
  );

  expect(apiRequest).toHaveBeenNthCalledWith(
    2,
    "/api/aluno/progresso"
  );

  // Após recuperar a conexão, os dados reaparecem.
  expect(
    await screen.findByText("Sistemas de Informação")
  ).toBeTruthy();

  // O percentual total deve ser restaurado corretamente.
  const barra = screen.getByRole("progressbar", {
    name: "Progresso total do curso",
  });

  expect(barra).toHaveProperty("value", 28.57);

  // O erro e o botão de recuperação devem desaparecer.
  expect(screen.queryByRole("alert")).toBeNull();

  expect(
    screen.queryByRole("button", {
      name: "Tentar novamente",
    })
  ).toBeNull();
});
});