import type { Request, Response } from "express";

import { consultarProgresso } from "./progresso.service";

export async function obterProgresso(
  req: Request,
  res: Response
): Promise<void> {
  const usuario = req.session.usuario;

  if (!usuario) {
    res.status(401).json({
      message: "Usuário não autenticado.",
    });
    return;
  }

  try {
    const resultado = await consultarProgresso(
      usuario.id
    );

    if (!resultado) {
      res.status(403).json({
        message: "Aluno não possui cadastro acadêmico.",
      });
      return;
    }

    res.status(200).json(resultado);
  } catch (erro) {
    console.error(
      "Erro ao consultar progresso curricular:",
      erro
    );

    res.status(500).json({
      message: "Não foi possível consultar o progresso curricular.",
    });
  }
}