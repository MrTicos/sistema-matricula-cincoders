import type { Request, Response } from "express";

import {
  cadastrarProfessor,
  consultarProfessores,
} from "./professores.service";

export async function criarProfessor(
  req: Request,
  res: Response
): Promise<void> {
  const { nome, email } = req.body ?? {};

  // Validação do nome.
  if (
    typeof nome !== "string" ||
    nome.trim().length === 0 ||
    nome.trim().length > 150
  ) {
    res.status(400).json({
      message: "O nome deve conter entre 1 e 150 caracteres.",
    });
    return;
  }

  // Validação do e-mail.
  if (
    typeof email !== "string" ||
    email.trim().length === 0 ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    res.status(400).json({
      message: "Informe um e-mail válido.",
    });
    return;
  }

  try {
    const resultado = await cadastrarProfessor({
      nome,
      email,
    });

    if (resultado.tipo === "EMAIL_DUPLICADO") {
      res.status(409).json({
        message: "Já existe um professor com esse e-mail.",
      });
      return;
    }

    res.status(201).json({
      message: "Professor cadastrado com sucesso.",
      professor: resultado.professor,
    });
  } catch (erro) {
    console.error("Erro ao cadastrar professor:", erro);

    res.status(500).json({
      message: "Não foi possível cadastrar o professor.",
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

export async function listarProfessores(
  req: Request,
  res: Response
): Promise<void> {
  const pagina = lerInteiroPositivo(req.query.pagina, 1);
  const limite = lerInteiroPositivo(req.query.limite, 10);

  const buscaParam = req.query.busca;

  // Validação dos parâmetros de consulta.
  if (
    pagina === null ||
    limite === null ||
    limite > 50 ||
    (
      buscaParam !== undefined &&
      typeof buscaParam !== "string"
    )
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
    const resultado = await consultarProfessores({
      busca,
      pagina,
      limite,
    });

    res.status(200).json(resultado);
  } catch (erro) {
    console.error("Erro ao listar professores:", erro);

    res.status(500).json({
      message: "Não foi possível consultar os professores.",
    });
  }
}