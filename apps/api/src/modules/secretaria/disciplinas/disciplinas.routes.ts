import { Router } from "express";

import { exigirPerfil } from "../../../middlewares/auth.middleware";
import { criarDisciplina } from "./disciplinas.controller";

export const disciplinasRoutes = Router();

disciplinasRoutes.post(
  "/",
  exigirPerfil("SECRETARIA"),
  criarDisciplina
);