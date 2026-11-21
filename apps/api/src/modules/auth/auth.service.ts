import argon2 from "argon2";
import { prisma } from "../../config/database";

export async function autenticarUsuario(
  username: string,
  senha: string
) {
  const usuario = await prisma.usuario.findUnique({
    where: { username },
  });

  if (!usuario) {
    return null;
  }

  const senhaValida = await argon2.verify(
    usuario.senhaHash,
    senha
  );

  if (!senhaValida) {
    return null;
  }

  return {
    id: usuario.id,
    username: usuario.username,
    nome: usuario.nome,
    perfil: usuario.perfil,
  };
}