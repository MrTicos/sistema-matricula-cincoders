import type { Request, Response } from "express";
import { autenticarUsuario } from "./auth.service";

export async function login(req: Request, res: Response) {
  const { username, senha } = req.body ?? {};

  if (
    typeof username !== "string" ||
    typeof senha !== "string" ||
    !username.trim() ||
    !senha
  ) {
    return res.status(400).json({
      message: "Usuário e senha são obrigatórios.",
    });
  }

  const usuario = await autenticarUsuario(username, senha);

  if (!usuario) {
    return res.status(401).json({
      message: "Usuário ou senha inválidos.",
    });
  }

  // Evita reutilizar o identificador de uma sessão anterior.
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((erro) => {
      if (erro) reject(erro);
      else resolve();
    });
  });

  req.session.usuario = {
    id: usuario.id,
    username: usuario.username,
    perfil: usuario.perfil,
  };

  await new Promise<void>((resolve, reject) => {
    req.session.save((erro) => {
      if (erro) reject(erro);
      else resolve();
    });
  });

  return res.status(200).json({
    message: "Login realizado com sucesso.",
    usuario,
  });
}

export function me(req: Request, res: Response) {
  if (!req.session.usuario) {
    return res.status(401).json({
      message: "Usuário não autenticado.",
    });
  }

  return res.status(200).json({
    usuario: req.session.usuario,
  });
}

export async function logout(req: Request, res: Response) {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((erro) => {
      if (erro) reject(erro);
      else resolve();
    });
  });

  res.clearCookie("cincoders.sid", {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(204).send();
}