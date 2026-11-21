import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { apiRequest } from "../api/client";
import { AuthContext } from "./auth-context";

import type {
  Usuario,
  RespostaAutenticacao,
} from "../types/auth";

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    apiRequest<RespostaAutenticacao>("/api/auth/me")
      .then((resposta) => {
        if (ativo) {
          setUsuario(resposta.usuario);
        }
      })
      .catch(() => {
        if (ativo) {
          setUsuario(null);
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function login(username: string, senha: string) {
    const resposta = await apiRequest<RespostaAutenticacao>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, senha }),
      }
    );

    setUsuario(resposta.usuario);
  }

  async function logout() {
    await apiRequest<void>("/api/auth/logout", {
      method: "POST",
    });

    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}