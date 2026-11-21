import { createContext } from "react";
import type { Usuario } from "../types/auth";

export interface AuthContextType {
  usuario: Usuario | null;
  carregando: boolean;
  login: (username: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);