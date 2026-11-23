import { prisma } from "../../config/database";

type ResultadoMatricula =
  | {
      tipo: "CRIADA";
      matricula: {
        id: number;
        turmaId: number;
        situacao: string;
        criadaEm: Date;
      };
    }
  | {
      tipo:
        | "ALUNO_NAO_ENCONTRADO"
        | "TURMA_NAO_ENCONTRADA"
        | "DISCIPLINA_APROVADA"
        | "MATRICULA_DUPLICADA"
        | "TURMA_LOTADA";
    };

export async function realizarMatricula(
  usuarioId: number,
  turmaId: number
): Promise<ResultadoMatricula> {
  const aluno = await prisma.aluno.findUnique({
    where: { usuarioId },
    select: { id: true },
  });

  if (!aluno) {
    return { tipo: "ALUNO_NAO_ENCONTRADO" };
  }

  return prisma.$transaction(async (tx) => {
    // Reserva a escrita no SQLite antes das verificações.
    // Isso ajuda a evitar que duas operações leiam
    // simultaneamente a mesma disponibilidade de vagas.
    const reserva = await tx.turma.updateMany({
      where: { id: turmaId },
      data: {
        vagasTotais: { increment: 0 },
      },
    });

    if (reserva.count === 0) {
      return { tipo: "TURMA_NAO_ENCONTRADA" };
    }

    const turma = await tx.turma.findUnique({
      where: { id: turmaId },
      select: {
        id: true,
        disciplinaId: true,
        vagasTotais: true,
      },
    });

    if (!turma) {
      return { tipo: "TURMA_NAO_ENCONTRADA" };
    }

    // Regra 1: aluno não pode cursar novamente
    // uma disciplina que já foi aprovada.
    const aprovacao = await tx.historico.findFirst({
      where: {
        alunoId: aluno.id,
        disciplinaId: turma.disciplinaId,
        situacao: "APROVADA",
      },
      select: { id: true },
    });

    if (aprovacao) {
      return { tipo: "DISCIPLINA_APROVADA" };
    }

    // Regra 2: não pode existir matrícula ativa
    // em outra turma da mesma disciplina.
    const matriculaAtiva = await tx.matricula.findFirst({
      where: {
        alunoId: aluno.id,
        situacao: "ATIVA",
        turma: {
          is: {
            disciplinaId: turma.disciplinaId,
          },
        },
      },
      select: { id: true },
    });

    if (matriculaAtiva) {
      return { tipo: "MATRICULA_DUPLICADA" };
    }

    // Regra 3: verificar a capacidade da turma.
    const vagasOcupadas = await tx.matricula.count({
      where: {
        turmaId: turma.id,
        situacao: "ATIVA",
      },
    });

    if (vagasOcupadas >= turma.vagasTotais) {
      return { tipo: "TURMA_LOTADA" };
    }

    // Regra 4: criar um NOVO registro.
    // Matrículas canceladas anteriormente são preservadas.
    const matricula = await tx.matricula.create({
      data: {
        alunoId: aluno.id,
        turmaId: turma.id,
        situacao: "ATIVA",
      },
      select: {
        id: true,
        turmaId: true,
        situacao: true,
        criadaEm: true,
      },
    });

    return {
      tipo: "CRIADA",
      matricula,
    };
  });
}

export async function consultarMatriculasAtivas(
  usuarioId: number
) {
  const aluno = await prisma.aluno.findUnique({
    where: { usuarioId },
    select: { id: true },
  });

  if (!aluno) {
    return null;
  }

  const registros = await prisma.matricula.findMany({
    where: {
      alunoId: aluno.id,
      situacao: "ATIVA",
    },
    select: {
      id: true,
      turmaId: true,
      criadaEm: true,
      turma: {
        select: {
          disciplina: {
            select: {
              id: true,
              codigo: true,
              nome: true,
              cargaHoraria: true,
            },
          },
          professor: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
    },
    orderBy: [
      { criadaEm: "desc" },
      { id: "desc" },
    ],
  });

  return {
    matriculas: registros.map((registro) => ({
      id: registro.id,
      turmaId: registro.turmaId,
      criadaEm: registro.criadaEm,
      disciplina: registro.turma.disciplina,
      professor: registro.turma.professor,
    })),
  };
}

export async function cancelarMatriculaDoAluno(
  usuarioId: number,
  matriculaId: number
) {
  const aluno = await prisma.aluno.findUnique({
    where: { usuarioId },
    select: { id: true },
  });

  if (!aluno) {
    return { tipo: "ALUNO_NAO_ENCONTRADO" as const };
  }

  const resultado = await prisma.matricula.updateMany({
    where: {
      id: matriculaId,
      alunoId: aluno.id,
      situacao: "ATIVA",
    },
    data: {
      situacao: "CANCELADA",
      canceladaEm: new Date(),
    },
  });

  if (resultado.count === 1) {
    const matricula = await prisma.matricula.findUniqueOrThrow({
      where: { id: matriculaId },
      select: {
        id: true,
        turmaId: true,
        situacao: true,
        canceladaEm: true,
      },
    });

    return {
      tipo: "CANCELADA" as const,
      matricula,
    };
  }

  // Somente verifica se a matrícula pertence ao próprio aluno.
  // Não revela a existência de matrículas de terceiros.
  const matriculaPropria = await prisma.matricula.findFirst({
    where: {
      id: matriculaId,
      alunoId: aluno.id,
    },
    select: {
      situacao: true,
    },
  });

  if (matriculaPropria?.situacao === "CANCELADA") {
    return { tipo: "JA_CANCELADA" as const };
  }

  return { tipo: "NAO_ENCONTRADA" as const };
}

interface ConsultarMatriculasCanceladasInput {
  usuarioId: number;
  pagina: number;
  limite: number;
}

export async function consultarMatriculasCanceladas(
  dados: ConsultarMatriculasCanceladasInput
) {
  const { usuarioId, pagina, limite } = dados;

  const aluno = await prisma.aluno.findUnique({
    where: {
      usuarioId,
    },
    select: {
      id: true,
    },
  });

  if (!aluno) {
    return null;
  }

  const where = {
    alunoId: aluno.id,
    situacao: "CANCELADA" as const,
  };

  const [total, registros] = await prisma.$transaction([
    prisma.matricula.count({
      where,
    }),

    prisma.matricula.findMany({
      where,
      orderBy: [
        { canceladaEm: "desc" },
        { id: "desc" },
      ],
      skip: (pagina - 1) * limite,
      take: limite,
      select: {
        id: true,
        turmaId: true,
        situacao: true,
        criadaEm: true,
        canceladaEm: true,

        turma: {
          select: {
            disciplina: {
              select: {
                id: true,
                codigo: true,
                nome: true,
                cargaHoraria: true,
              },
            },

            professor: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    matriculas: registros.map((registro) => ({
      id: registro.id,
      turmaId: registro.turmaId,
      situacao: registro.situacao,
      criadaEm: registro.criadaEm,
      canceladaEm: registro.canceladaEm,
      disciplina: registro.turma.disciplina,
      professor: registro.turma.professor,
    })),

    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  };
}