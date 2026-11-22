import { Router } from "express";

import { exigirPerfil } from "../../../middlewares/auth.middleware";

import {
  criarDisciplina,
  listarDisciplinas,
} from "./disciplinas.controller";

export const disciplinasRoutes = Router();

disciplinasRoutes.get(
  "/",
  exigirPerfil("SECRETARIA"),
  listarDisciplinas
);

disciplinasRoutes.post(
  "/",
  exigirPerfil("SECRETARIA"),
  criarDisciplina
);