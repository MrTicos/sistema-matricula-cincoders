export interface IndicadorProgresso {
  exigida: number;
  integralizada: number;
  emCurso: number;
  faltante: number;
  percentual: number;
}

export interface RespostaProgresso {
  curso: {
    id: number;
    nome: string;
  };

  progresso: {
    obrigatoria: IndicadorProgresso;
    perfil: IndicadorProgresso;
    livre: IndicadorProgresso;
    total: IndicadorProgresso;
  };

  cargaHorariaEmCurso: number;
}