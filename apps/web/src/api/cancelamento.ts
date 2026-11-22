import { apiRequest } from "./client";

export interface RespostaCancelamento {
  message?: string;
  matricula?: {
    id: number;
    turmaId: number;
    situacao: "CANCELADA";
    canceladaEm: string;
  };
}

export async function cancelarMatricula(
  matriculaId: number
): Promise<RespostaCancelamento> {
  return apiRequest<RespostaCancelamento>(
    `/api/aluno/matriculas/${matriculaId}/cancelar`,
    {
      method: "PATCH",
    }
  );
}