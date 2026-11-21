import type { Request, Response } from "express";
import { consultarOfertas } from "./ofertas.service";

function lerInteiroPositivo(
  valor: unknown,
  padrao: number
): number | null {
  if (valor === undefined) {
    return padrao;
  }

  if (
    typeof valor !== "string" ||
    !/^[1-9]\d*$/.test(valor)
  ) {
    return null;
  }

  const numero = Number(valor);

  if (!Number.isSafeInteger(numero)) {
    return null;
  }

  return numero;
}

export async function listarOfertas(
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

  const pagina = lerInteiroPositivo(req.query.pagina, 1);
  const limite = lerInteiroPositivo(req.query.limite, 10);

  if (
    pagina === null ||
    limite === null ||
    limite > 50 ||
    !Number.isSafeInteger((pagina - 1) * limite)
  ) {
    res.status(400).json({
      message: "Parâmetros de paginação inválidos.",
    });
    return;
  }

  const busca = req.query.busca ?? "";

  if (
    typeof busca !== "string" ||
    busca.length > 100
  ) {
    res.status(400).json({
      message: "Parâmetro de busca inválido.",
    });
    return;
  }

  try {
    const resultado = await consultarOfertas({
      usuarioId: usuario.id,
      busca,
      pagina,
      limite,
    });

    if (!resultado) {
      res.status(403).json({
        message: "Aluno não possui cadastro acadêmico.",
      });
      return;
    }

    res.status(200).json(resultado);
  } catch (erro) {
    console.error("Erro ao consultar ofertas:", erro);

    res.status(500).json({
      message: "Não foi possível consultar as ofertas.",
    });
  }
}