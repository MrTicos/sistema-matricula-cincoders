import { apiRequest } from "./client";

export interface CriarMatriculaInput {
  turmaId: number;
}

export async function criarMatricula(
  dados: CriarMatriculaInput
): Promise<unknown> {
  return apiRequest<unknown>("/api/aluno/matriculas", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}