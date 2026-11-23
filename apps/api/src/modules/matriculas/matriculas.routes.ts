import { Router } from "express";

import { exigirPerfil } from "../../middlewares/auth.middleware";

import {
  criarMatricula,
  listarMatriculasAtivas,
  listarMatriculasCanceladas,
  cancelarMatricula,
} from "./matriculas.controller";

export const matriculasRoutes = Router();

// US-04 — Realizar matrícula
matriculasRoutes.post(
  "/",
  exigirPerfil("ALUNO"),
  criarMatricula
);

// US-05 — Consultar matrículas ativas
matriculasRoutes.get(
  "/",
  exigirPerfil("ALUNO"),
  listarMatriculasAtivas
);

// US-13 — Consultar histórico de cancelamentos
matriculasRoutes.get(
  "/historico",
  exigirPerfil("ALUNO"),
  listarMatriculasCanceladas
);

// US-06 — Cancelar matrícula
matriculasRoutes.patch(
  "/:matriculaId/cancelar",
  exigirPerfil("ALUNO"),
  cancelarMatricula
);