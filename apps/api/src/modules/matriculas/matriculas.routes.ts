import { Router } from "express";

import { exigirPerfil } from "../../middlewares/auth.middleware";
import { criarMatricula, listarMatriculasAtivas, cancelarMatricula } from "./matriculas.controller";

export const matriculasRoutes = Router();

matriculasRoutes.post(
  "/",
  exigirPerfil("ALUNO"),
  criarMatricula
);

matriculasRoutes.get(
  "/",
  exigirPerfil("ALUNO"),
  listarMatriculasAtivas
);

matriculasRoutes.patch(
  "/:matriculaId/cancelar",
  exigirPerfil("ALUNO"),
  cancelarMatricula
);