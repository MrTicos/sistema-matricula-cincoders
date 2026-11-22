import { Router } from "express";

import { exigirPerfil } from "../../../middlewares/auth.middleware";

import {
  criarDisciplina,
  editarDisciplina,
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

disciplinasRoutes.patch(
  "/:id",
  exigirPerfil("SECRETARIA"),
  editarDisciplina
);