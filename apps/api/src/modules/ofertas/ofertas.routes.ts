import { Router } from "express";

import { exigirPerfil } from "../../middlewares/auth.middleware";
import { listarOfertas } from "./ofertas.controller";

export const ofertasRoutes = Router();

ofertasRoutes.get(
  "/",
  exigirPerfil("ALUNO"),
  listarOfertas
);