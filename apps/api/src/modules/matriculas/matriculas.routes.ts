import { Router } from "express";

import { exigirPerfil } from "../../middlewares/auth.middleware";
import { criarMatricula } from "./matriculas.controller";

export const matriculasRoutes = Router();

matriculasRoutes.post(
  "/",
  exigirPerfil("ALUNO"),
  criarMatricula
);