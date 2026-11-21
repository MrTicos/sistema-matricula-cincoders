import "express-session";

declare module "express-session" {
  interface SessionData {
    usuario?: {
      id: number;
      username: string;
      perfil: "ALUNO" | "SECRETARIA";
    };
  }
}