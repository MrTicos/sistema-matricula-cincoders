import { Router } from "express";

import { exigirPerfil } from "../../../middlewares/auth.middleware";
import { criarTurma, listarTurmas } from "./turmas.controller";

export const turmasRoutes = Router();

turmasRoutes.get("/", exigirPerfil("SECRETARIA"), listarTurmas);
turmasRoutes.post("/", exigirPerfil("SECRETARIA"), criarTurma);
