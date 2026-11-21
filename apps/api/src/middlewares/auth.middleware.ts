import type {
  Request,
  Response,
  NextFunction,
} from "express";

type Perfil = "ALUNO" | "SECRETARIA";

export function exigirAutenticacao(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.session.usuario) {
    res.status(401).json({
      message: "Usuário não autenticado.",
    });
    return;
  }

  next();
}

export function exigirPerfil(...perfis: Perfil[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const usuario = req.session.usuario;

    if (!usuario) {
      res.status(401).json({
        message: "Usuário não autenticado.",
      });
      return;
    }

    if (!perfis.includes(usuario.perfil)) {
      res.status(403).json({
        message: "Acesso não autorizado.",
      });
      return;
    }

    next();
  };
}