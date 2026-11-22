import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { sessionMiddleware } from "./config/session";
import { authRoutes } from "./modules/auth/auth.routes";
import { ofertasRoutes } from "./modules/ofertas/ofertas.routes";
import { matriculasRoutes } from "./modules/matriculas/matriculas.routes";
import { progressoRoutes } from "./modules/progresso/progresso.routes";
import { disciplinasRoutes } from "./modules/secretaria/disciplinas/disciplinas.routes";
import { professoresRoutes } from "./modules/secretaria/professores/professores.routes";
import { turmasRoutes } from "./modules/secretaria/turmas/turmas.routes";

export const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/aluno/ofertas", ofertasRoutes);
app.use("/api/aluno/matriculas", matriculasRoutes);
app.use("/api/aluno/progresso", progressoRoutes);
app.use("/api/secretaria/disciplinas", disciplinasRoutes);
app.use("/api/secretaria/professores", professoresRoutes);
app.use("/api/secretaria/turmas", turmasRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API CINCoders funcionando!",
  });
});