import { prisma } from "../../../config/database";

interface CriarDisciplinaInput {
  codigo: string;
  nome: string;
  cargaHoraria: number;
}

type ResultadoCriacao =
  | {
      tipo: "CRIADA";
      disciplina: {
        id: number;
        codigo: string;
        nome: string;
        cargaHoraria: number;
      };
    }
  | {
      tipo: "CODIGO_DUPLICADO";
    };

export async function cadastrarDisciplina(
  dados: CriarDisciplinaInput
): Promise<ResultadoCriacao> {
  const codigo = dados.codigo.trim().toUpperCase();
  const nome = dados.nome.trim();

  try {
    const disciplina = await prisma.disciplina.create({
      data: {
        codigo,
        nome,
        cargaHoraria: dados.cargaHoraria,
      },
      select: {
        id: true,
        codigo: true,
        nome: true,
        cargaHoraria: true,
      },
    });

    return {
      tipo: "CRIADA",
      disciplina,
    };
  } catch (erro) {
    // O banco garante a unicidade mesmo em requisições simultâneas.
    if (
      typeof erro === "object" &&
      erro !== null &&
      "code" in erro &&
      erro.code === "P2002"
    ) {
      return {
        tipo: "CODIGO_DUPLICADO",
      };
    }

    throw erro;
  }
}



interface ConsultarDisciplinasInput {
  busca: string;
  pagina: number;
  limite: number;
}

export async function consultarDisciplinas(
  dados: ConsultarDisciplinasInput
) {
  const { busca, pagina, limite } = dados;

  const where = busca
    ? {
        OR: [
          {
            codigo: {
              contains: busca.toUpperCase(),
            },
          },
          {
            nome: {
              contains: busca,
            },
          },
        ],
      }
    : undefined;

  const [total, disciplinas] = await prisma.$transaction([
    prisma.disciplina.count({
      where,
    }),
    prisma.disciplina.findMany({
      where,
      orderBy: [
        { codigo: "asc" },
        { id: "asc" },
      ],
      skip: (pagina - 1) * limite,
      take: limite,
      select: {
        id: true,
        codigo: true,
        nome: true,
        cargaHoraria: true,
      },
    }),
  ]);

  return {
    disciplinas,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  };
}

interface AtualizarDisciplinaInput {
  id: number;
  codigo?: string;
  nome?: string;
  cargaHoraria?: number;
}

type ResultadoAtualizacao =
  | {
      tipo: "ATUALIZADA";
      disciplina: {
        id: number;
        codigo: string;
        nome: string;
        cargaHoraria: number;
      };
    }
  | {
      tipo: "CODIGO_DUPLICADO";
    }
  | {
      tipo: "NAO_ENCONTRADA";
    };

export async function atualizarDisciplina(
  dados: AtualizarDisciplinaInput
): Promise<ResultadoAtualizacao> {
  const atualizacoes: {
    codigo?: string;
    nome?: string;
    cargaHoraria?: number;
  } = {};

  if (dados.codigo !== undefined) {
    atualizacoes.codigo = dados.codigo.trim().toUpperCase();
  }

  if (dados.nome !== undefined) {
    atualizacoes.nome = dados.nome.trim();
  }

  if (dados.cargaHoraria !== undefined) {
    atualizacoes.cargaHoraria = dados.cargaHoraria;
  }

  try {
    const disciplina = await prisma.disciplina.update({
      where: {
        id: dados.id,
      },
      data: atualizacoes,
      select: {
        id: true,
        codigo: true,
        nome: true,
        cargaHoraria: true,
      },
    });

    return {
      tipo: "ATUALIZADA",
      disciplina,
    };
  } catch (erro) {
    if (
      typeof erro === "object" &&
      erro !== null &&
      "code" in erro
    ) {
      if (erro.code === "P2002") {
        return {
          tipo: "CODIGO_DUPLICADO",
        };
      }

      if (erro.code === "P2025") {
        return {
          tipo: "NAO_ENCONTRADA",
        };
      }
    }

    throw erro;
  }
}