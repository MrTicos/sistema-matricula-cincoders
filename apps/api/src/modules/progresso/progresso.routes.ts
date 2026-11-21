import { Router } from "express";

import { exigirPerfil } from "../../middlewares/auth.middleware";
import { obterProgresso } from "./progresso.controller";

export const progressoRoutes = Router();

progressoRoutes.get(
  "/",
  exigirPerfil("ALUNO"),
  obterProgresso
);