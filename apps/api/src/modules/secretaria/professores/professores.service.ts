import { prisma } from "../../../config/database";

interface CriarProfessorInput {
  nome: string;
  email: string;
}

interface ConsultarProfessoresInput {
  busca: string;
  pagina: number;
  limite: number;
}

interface Professor {
  id: number;
  nome: string;
  email: string;
}

type ResultadoCriacao =
  | {
      tipo: "CRIADO";
      professor: Professor;
    }
  | {
      tipo: "EMAIL_DUPLICADO";
    };

export async function cadastrarProfessor(
  dados: CriarProfessorInput
): Promise<ResultadoCriacao> {
  const nome = dados.nome.trim();
  const email = dados.email.trim().toLowerCase();

  try {
    const professor = await prisma.professor.create({
      data: {
        nome,
        email,
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    return {
      tipo: "CRIADO",
      professor,
    };
  } catch (erro) {
    // O banco garante a unicidade do e-mail,
    // inclusive em requisições simultâneas.
    if (
      typeof erro === "object" &&
      erro !== null &&
      "code" in erro &&
      erro.code === "P2002"
    ) {
      return {
        tipo: "EMAIL_DUPLICADO",
      };
    }

    throw erro;
  }
}

export async function consultarProfessores(
  dados: ConsultarProfessoresInput
) {
  const { busca, pagina, limite } = dados;

  const where = busca
    ? {
        OR: [
          {
            nome: {
              contains: busca,
            },
          },
          {
            email: {
              contains: busca.toLowerCase(),
            },
          },
        ],
      }
    : undefined;

  const [total, professores] = await prisma.$transaction([
    prisma.professor.count({
      where,
    }),
    prisma.professor.findMany({
      where,
      orderBy: [
        { nome: "asc" },
        { id: "asc" },
      ],
      skip: (pagina - 1) * limite,
      take: limite,
      select: {
        id: true,
        nome: true,
        email: true,
      },
    }),
  ]);

  return {
    professores,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  };
}