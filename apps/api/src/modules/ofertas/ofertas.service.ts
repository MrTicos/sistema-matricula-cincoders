import { prisma } from "../../config/database";
import type { Prisma } from "../../generated/prisma/client";

interface ConsultarOfertasInput {
  usuarioId: number;
  busca: string;
  pagina: number;
  limite: number;
}

export async function consultarOfertas({
  usuarioId,
  busca,
  pagina,
  limite,
}: ConsultarOfertasInput) {
  // Identifica o curso a partir do usuário autenticado.
  const aluno = await prisma.aluno.findUnique({
    where: {
      usuarioId,
    },
    select: {
      id: true,
      cursoId: true,
    },
  });

  if (!aluno) {
    return null;
  }

  const termo = busca.trim();

  // Pesquisa por código ou nome da disciplina.
  const where: Prisma.TurmaWhereInput = termo
    ? {
        disciplina: {
          is: {
            OR: [
              {
                codigo: {
                  contains: termo,
                },
              },
              {
                nome: {
                  contains: termo,
                },
              },
            ],
          },
        },
      }
    : {};

  const total = await prisma.turma.count({
    where,
  });

  const turmas = await prisma.turma.findMany({
    where,

    orderBy: {
      id: "asc",
    },

    skip: (pagina - 1) * limite,
    take: limite,

    select: {
      id: true,
      vagasTotais: true,

      professor: {
        select: {
          id: true,
          nome: true,
        },
      },

      disciplina: {
        select: {
          id: true,
          codigo: true,
          nome: true,
          cargaHoraria: true,

          componentes: {
            where: {
              cursoId: aluno.cursoId,
            },
            select: {
              categoria: true,
            },
          },
        },
      },

      _count: {
        select: {
          matriculas: {
            where: {
              situacao: "ATIVA",
            },
          },
        },
      },
    },
  });

  const ofertas = turmas.map((turma) => {
    const vagasOcupadas = turma._count.matriculas;

    const vagasDisponiveis = Math.max(
      0,
      turma.vagasTotais - vagasOcupadas
    );

    const classificacao =
      turma.disciplina.componentes[0]?.categoria ?? "LIVRE";

    return {
      turmaId: turma.id,

      disciplina: {
        id: turma.disciplina.id,
        codigo: turma.disciplina.codigo,
        nome: turma.disciplina.nome,
        cargaHoraria: turma.disciplina.cargaHoraria,
      },

      professor: turma.professor,

      vagasTotais: turma.vagasTotais,
      vagasOcupadas,
      vagasDisponiveis,

      classificacao,
    };
  });

  return {
    ofertas,

    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  };
}