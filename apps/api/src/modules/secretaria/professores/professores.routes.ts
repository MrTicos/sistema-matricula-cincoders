import { Router } from "express";

import { exigirPerfil } from "../../../middlewares/auth.middleware";

import {
  criarProfessor,
  listarProfessores,
} from "./professores.controller";

export const professoresRoutes = Router();

professoresRoutes.get(
  "/",
  exigirPerfil("SECRETARIA"),
  listarProfessores
);

professoresRoutes.post(
  "/",
  exigirPerfil("SECRETARIA"),
  criarProfessor
);