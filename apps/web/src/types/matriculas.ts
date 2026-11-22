export interface MatriculaAtiva {
  id: number;
  turmaId: number;
  criadaEm: string;

  disciplina: {
    id: number;
    codigo: string;
    nome: string;
    cargaHoraria: number;
  };

  professor: {
    id: number;
    nome: string;
  };
}

export interface RespostaMatriculas {
  matriculas: MatriculaAtiva[];
}