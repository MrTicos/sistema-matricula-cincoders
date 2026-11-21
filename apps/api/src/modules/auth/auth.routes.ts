import { Router } from "express";
import { login, logout, me } from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", login);
authRoutes.get("/me", me);
authRoutes.post("/logout", logout);