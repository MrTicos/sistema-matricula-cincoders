import type { Request, Response } from "express";

import { abrirTurma, consultarTurmas, alterarCapacidadeTurma } from "./turmas.service";

const MAIOR_INTEIRO_PRISMA = 2_147_483_647;

function lerInteiroPositivo(
  valor: unknown,
  padrao: number
): number | null {
  if (valor === undefined) {
    return padrao;
  }

  if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isSafeInteger(numero) ||
    numero < 1 ||
    numero > MAIOR_INTEIRO_PRISMA
  ) {
    return null;
  }

  return numero;
}

function inteiroValido(valor: unknown): valor is number {
  return (
    typeof valor === "number" &&
    Number.isSafeInteger(valor) &&
    valor >= 1 &&
    valor <= MAIOR_INTEIRO_PRISMA
  );
}

export async function listarTurmas(
  req: Request,
  res: Response
): Promise<void> {
  const pagina = lerInteiroPositivo(req.query.pagina, 1);
  const limite = lerInteiroPositivo(req.query.limite, 10);
  const buscaParametro = req.query.busca;

  if (
    pagina === null ||
    limite === null ||
    limite > 50 ||
    (buscaParametro !== undefined &&
      typeof buscaParametro !== "string")
  ) {
    res.status(400).json({ message: "Parâmetros de consulta inválidos." });
    return;
  }

  const busca =
    typeof buscaParametro === "string" ? buscaParametro.trim() : "";

  if (
    busca.length > 100 ||
    !Number.isSafeInteger((pagina - 1) * limite)
  ) {
    res.status(400).json({ message: "Parâmetros de consulta inválidos." });
    return;
  }

  try {
    const resultado = await consultarTurmas({ busca, pagina, limite });
    res.status(200).json(resultado);
  } catch (erro) {
    console.error("Erro ao listar turmas:", erro);
    res.status(500).json({
      message: "Não foi possível consultar as turmas.",
    });
  }
}

export async function criarTurma(
  req: Request,
  res: Response
): Promise<void> {
  const { disciplinaId, professorId, vagasTotais } = req.body ?? {};

  if (
    !inteiroValido(disciplinaId) ||
    !inteiroValido(professorId) ||
    !inteiroValido(vagasTotais)
  ) {
    res.status(400).json({
      message:
        "Disciplina, professor e número de vagas devem ser inteiros positivos.",
    });
    return;
  }

  try {
    const resultado = await abrirTurma({
      disciplinaId,
      professorId,
      vagasTotais,
    });

    if (resultado.tipo === "DISCIPLINA_NAO_ENCONTRADA") {
      res.status(404).json({ message: "Disciplina não encontrada." });
      return;
    }

    if (resultado.tipo === "PROFESSOR_NAO_ENCONTRADO") {
      res.status(404).json({ message: "Professor não encontrado." });
      return;
    }

    if (resultado.tipo === "REFERENCIA_NAO_ENCONTRADA") {
      res.status(404).json({
        message: "Disciplina ou professor não encontrado.",
      });
      return;
    }

    res.status(201).json({
      message: "Turma aberta com sucesso.",
      turma: resultado.turma,
    });
  } catch (erro) {
    console.error("Erro ao abrir turma:", erro);
    res.status(500).json({ message: "Não foi possível abrir a turma." });
  }
}

export async function atualizarCapacidadeTurma(
  req: Request,
  res: Response
): Promise<void> {
  const idParametro = req.params.id;

  const turmaId =
    typeof idParametro === "string" &&
    /^[1-9]\d*$/.test(idParametro)
      ? Number(idParametro)
      : NaN;

  const vagasTotais = req.body?.vagasTotais;

  if (
    !inteiroValido(turmaId) ||
    !inteiroValido(vagasTotais)
  ) {
    res.status(400).json({
      message:
        "ID da turma e quantidade de vagas devem ser inteiros positivos.",
    });
    return;
  }

  try {
    const resultado = await alterarCapacidadeTurma({
      turmaId,
      vagasTotais,
    });

    if (resultado.tipo === "TURMA_NAO_ENCONTRADA") {
      res.status(404).json({
        message: "Turma não encontrada.",
      });
      return;
    }

    if (resultado.tipo === "CAPACIDADE_INSUFICIENTE") {
      res.status(409).json({
        message:
          "A capacidade não pode ser inferior ao número de matrículas ativas.",
        vagasOcupadas: resultado.vagasOcupadas,
      });
      return;
    }

    res.status(200).json({
      message: "Capacidade da turma atualizada com sucesso.",
      turma: resultado.turma,
    });
  } catch (erro) {
    console.error(
      "Erro ao atualizar capacidade da turma:",
      erro
    );

    res.status(500).json({
      message:
        "Não foi possível atualizar a capacidade da turma.",
    });
  }
}