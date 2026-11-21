export type ClassificacaoCurricular =
  | "OBRIGATORIA"
  | "ELETIVA_PERFIL"
  | "LIVRE";

export interface Oferta {
  turmaId: number;

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

  vagasTotais: number;
  vagasOcupadas: number;
  vagasDisponiveis: number;

  classificacao: ClassificacaoCurricular;
}

export interface RespostaOfertas {
  ofertas: Oferta[];

  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}