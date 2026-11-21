import type { Request, Response } from "express";
import { realizarMatricula } from "./matriculas.service";

export async function criarMatricula(
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

  const turmaId = req.body?.turmaId;

  if (
    typeof turmaId !== "number" ||
    !Number.isSafeInteger(turmaId) ||
    turmaId <= 0
  ) {
    res.status(400).json({
      message: "O campo turmaId deve ser um inteiro positivo.",
    });
    return;
  }

  try {
    const resultado = await realizarMatricula(
      usuario.id,
      turmaId
    );

    switch (resultado.tipo) {
      case "CRIADA":
        res.status(201).json({
          message: "Matrícula realizada com sucesso.",
          matricula: resultado.matricula,
        });
        return;

      case "ALUNO_NAO_ENCONTRADO":
        res.status(403).json({
          message: "Aluno não possui cadastro acadêmico.",
        });
        return;

      case "TURMA_NAO_ENCONTRADA":
        res.status(404).json({
          message: "Turma não encontrada.",
        });
        return;

      case "DISCIPLINA_APROVADA":
        res.status(409).json({
          message: "Aluno já foi aprovado nesta disciplina.",
        });
        return;

      case "MATRICULA_DUPLICADA":
        res.status(409).json({
          message: "Aluno já possui matrícula ativa nesta disciplina.",
        });
        return;

      case "TURMA_LOTADA":
        res.status(409).json({
          message: "Turma sem vagas disponíveis.",
        });
        return;
    }
  } catch (erro) {
    console.error("Erro ao realizar matrícula:", erro);

    res.status(500).json({
      message: "Não foi possível realizar a matrícula.",
    });
  }
}