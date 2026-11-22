import type { Request, Response } from "express";

import { cadastrarDisciplina, consultarDisciplinas } from "./disciplinas.service";

export async function criarDisciplina(
  req: Request,
  res: Response
): Promise<void> {
  const { codigo, nome, cargaHoraria } = req.body ?? {};

  if (
    typeof codigo !== "string" ||
    codigo.trim().length === 0 ||
    typeof nome !== "string" ||
    nome.trim().length === 0
  ) {
    res.status(400).json({
      message: "Código e nome são obrigatórios.",
    });
    return;
  }

  if (
    !Number.isInteger(cargaHoraria) ||
    cargaHoraria < 15 ||
    cargaHoraria > 120 ||
    cargaHoraria % 15 !== 0
  ) {
    res.status(400).json({
      message:
        "A carga horária deve estar entre 15 e 120 horas e ser múltipla de 15.",
    });
    return;
  }

  try {
    const resultado = await cadastrarDisciplina({
      codigo,
      nome,
      cargaHoraria,
    });

    if (resultado.tipo === "CODIGO_DUPLICADO") {
      res.status(409).json({
        message: "Já existe uma disciplina com esse código.",
      });
      return;
    }

    res.status(201).json({
      message: "Disciplina cadastrada com sucesso.",
      disciplina: resultado.disciplina,
    });
  } catch (erro) {
    console.error("Erro ao cadastrar disciplina:", erro);

    res.status(500).json({
      message: "Não foi possível cadastrar a disciplina.",
    });
  }
}

function lerInteiroPositivo(
  valor: unknown,
  padrao: number
): number | null {
  if (valor === undefined) {
    return padrao;
  }

  if (
    typeof valor !== "string" ||
    !/^\d+$/.test(valor)
  ) {
    return null;
  }

  const numero = Number(valor);

  if (!Number.isSafeInteger(numero) || numero < 1) {
    return null;
  }

  return numero;
}

export async function listarDisciplinas(
  req: Request,
  res: Response
): Promise<void> {
  const pagina = lerInteiroPositivo(req.query.pagina, 1);
  const limite = lerInteiroPositivo(req.query.limite, 10);
  const buscaParam = req.query.busca;

  if (
    pagina === null ||
    limite === null ||
    limite > 50 ||
    (buscaParam !== undefined &&
      typeof buscaParam !== "string")
  ) {
    res.status(400).json({
      message: "Parâmetros de consulta inválidos.",
    });
    return;
  }

  const busca =
    typeof buscaParam === "string"
      ? buscaParam.trim()
      : "";

  if (
    busca.length > 100 ||
    !Number.isSafeInteger((pagina - 1) * limite)
  ) {
    res.status(400).json({
      message: "Parâmetros de consulta inválidos.",
    });
    return;
  }

  try {
    const resultado = await consultarDisciplinas({
      busca,
      pagina,
      limite,
    });

    res.status(200).json(resultado);
  } catch (erro) {
    console.error("Erro ao listar disciplinas:", erro);

    res.status(500).json({
      message: "Não foi possível consultar as disciplinas.",
    });
  }
}