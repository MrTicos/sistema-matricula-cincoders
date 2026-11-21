export type Perfil = "ALUNO" | "SECRETARIA";

export interface Usuario {
  id: number;
  username: string;
  nome?: string;
  perfil: Perfil;
}

export interface RespostaAutenticacao {
  usuario: Usuario;
  message?: string;
}