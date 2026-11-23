import type { RequestHandler } from "express";
import { frontendOrigin } from "../config/frontend-origin";

const metodosDeConsulta = new Set(["GET", "HEAD", "OPTIONS"]);

export const exigirOrigemConfiavel: RequestHandler = (req, res, next) => {
  if (metodosDeConsulta.has(req.method)) {
    next();
    return;
  }

  // Login também cria uma sessão. Para outras rotas, a checagem
  // é necessária quando há um usuário autenticado por cookie.
  // Sem sessão, a autorização da rota mantém sua resposta 401/403.
  const login = req.path === "/api/auth/login";
  if (!login && !req.session.usuario) {
    next();
    return;
  }

  const origin = req.get("Origin");
  const referer = req.get("Referer");
  let origemConfiavel = false;

  if (origin) {
    // A origem é comparada integralmente, sem startsWith.
    origemConfiavel = origin === frontendOrigin;
  } else if (referer) {
    try {
      origemConfiavel = new URL(referer).origin === frontendOrigin;
    } catch {
      origemConfiavel = false;
    }
  }

  if (!origemConfiavel) {
    res.status(403).json({
      message: "Origem da requisição não permitida.",
    });
    return;
  }

  next();
};
