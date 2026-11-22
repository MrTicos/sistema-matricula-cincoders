import { prisma } from "../../../config/database";

interface ConsultarTurmasInput {
  busca: string;
  pagina: number;
  limite: number;
}

interface AbrirTurmaInput {
  disciplinaId: number;
  professorId: number;
  vagasTotais: number;
}

export async function consultarTurmas(dados: ConsultarTurmasInput) {
  const { busca, pagina, limite } = dados;

  const where = busca
    ? {
        OR: [
          {
            disciplina: {
              is: { codigo: { contains: busca.toUpperCase() } },
            },
          },
          {
            disciplina: {
              is: { nome: { contains: busca } },
            },
          },
          {
            professor: {
              is: { nome: { contains: busca } },
            },
          },
        ],
      }
    : undefined;

  const [total, registros] = await prisma.$transaction([
    prisma.turma.count({ where }),
    prisma.turma.findMany({
      where,
      orderBy: [{ id: "asc" }],
      skip: (pagina - 1) * limite,
      take: limite,
      select: {
        id: true,
        disciplinaId: true,
        professorId: true,
        vagasTotais: true,
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
            email: true,
          },
        },
        _count: {
          select: {
            matriculas: {
              where: { situacao: "ATIVA" },
            },
          },
        },
      },
    }),
  ]);

  const turmas = registros.map(({ _count, ...turma }) => {
    const vagasOcupadas = _count.matriculas;

    return {
      ...turma,
      vagasOcupadas,
      vagasDisponiveis: Math.max(0, turma.vagasTotais - vagasOcupadas),
    };
  });

  return {
    turmas,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  };
}

export async function abrirTurma(dados: AbrirTurmaInput) {
  const [disciplina, professor] = await prisma.$transaction([
    prisma.disciplina.findUnique({
      where: { id: dados.disciplinaId },
      select: { id: true },
    }),
    prisma.professor.findUnique({
      where: { id: dados.professorId },
      select: { id: true },
    }),
  ]);

  if (!disciplina) {
    return { tipo: "DISCIPLINA_NAO_ENCONTRADA" as const };
  }

  if (!professor) {
    return { tipo: "PROFESSOR_NAO_ENCONTRADO" as const };
  }

  try {
    const turma = await prisma.turma.create({
      data: {
        disciplinaId: dados.disciplinaId,
        professorId: dados.professorId,
        vagasTotais: dados.vagasTotais,
      },
      select: {
        id: true,
        disciplinaId: true,
        professorId: true,
        vagasTotais: true,
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
            email: true,
          },
        },
      },
    });

    return {
      tipo: "CRIADA" as const,
      turma: {
        ...turma,
        vagasOcupadas: 0,
        vagasDisponiveis: turma.vagasTotais,
      },
    };
  } catch (erro) {
    // Uma referência pode deixar de existir entre a consulta e a criação.
    if (
      typeof erro === "object" &&
      erro !== null &&
      "code" in erro &&
      erro.code === "P2003"
    ) {
      return { tipo: "REFERENCIA_NAO_ENCONTRADA" as const };
    }

    throw erro;
  }
}
