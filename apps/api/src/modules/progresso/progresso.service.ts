import { prisma } from "../../config/database";

type Categoria = "obrigatoria" | "perfil" | "livre";

type HorasPorCategoria = Record<Categoria, number>;

function calcularIndicador(
  exigida: number,
  aprovada: number,
  emCurso: number
) {
  const integralizada = Math.min(exigida, aprovada);

  const faltante = Math.max(
    0,
    exigida - integralizada
  );

  const percentual =
    exigida === 0
      ? 100
      : Math.min(
          100,
          Number(
            ((integralizada / exigida) * 100).toFixed(2)
          )
        );

  return {
    exigida,
    integralizada,
    emCurso,
    faltante,
    percentual,
  };
}

export async function consultarProgresso(
  usuarioId: number
) {
  const aluno = await prisma.aluno.findUnique({
    where: { usuarioId },
    select: {
      id: true,
      cursoId: true,
      curso: {
        select: {
          id: true,
          nome: true,
          chMinObrigatoria: true,
          chMinPerfil: true,
          chMinLivre: true,
        },
      },
    },
  });

  if (!aluno) {
    return null;
  }

  const [estruturas, historicos, matriculas] =
    await Promise.all([
      prisma.estruturaCurricular.findMany({
        where: {
          cursoId: aluno.cursoId,
        },
        select: {
          disciplinaId: true,
          categoria: true,
        },
      }),

      prisma.historico.findMany({
        where: {
          alunoId: aluno.id,
          situacao: "APROVADA",
        },
        select: {
          disciplinaId: true,
          disciplina: {
            select: {
              cargaHoraria: true,
            },
          },
        },
      }),

      prisma.matricula.findMany({
        where: {
          alunoId: aluno.id,
          situacao: "ATIVA",
        },
        select: {
          turma: {
            select: {
              disciplinaId: true,
              disciplina: {
                select: {
                  cargaHoraria: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const categorias = new Map(
    estruturas.map((estrutura) => [
      estrutura.disciplinaId,
      estrutura.categoria,
    ])
  );

  function classificar(disciplinaId: number): Categoria {
    const categoria = categorias.get(disciplinaId);

    if (categoria === "OBRIGATORIA") {
      return "obrigatoria";
    }

    if (categoria === "ELETIVA_PERFIL") {
      return "perfil";
    }

    return "livre";
  }

  const aprovadas: HorasPorCategoria = {
    obrigatoria: 0,
    perfil: 0,
    livre: 0,
  };

  const emCurso: HorasPorCategoria = {
    obrigatoria: 0,
    perfil: 0,
    livre: 0,
  };

  // Evita contabilizar duas vezes a mesma disciplina
  // caso existam lançamentos duplicados no histórico.
  const disciplinasAprovadas = new Set<number>();

  for (const historico of historicos) {
    if (disciplinasAprovadas.has(historico.disciplinaId)) {
      continue;
    }

    disciplinasAprovadas.add(historico.disciplinaId);

    const categoria = classificar(historico.disciplinaId);

    aprovadas[categoria] +=
      historico.disciplina.cargaHoraria;
  }

  // Matrículas em andamento não integralizam CH.
  const disciplinasEmCurso = new Set<number>();

  for (const matricula of matriculas) {
    const disciplinaId = matricula.turma.disciplinaId;

    if (disciplinasEmCurso.has(disciplinaId)) {
      continue;
    }

    disciplinasEmCurso.add(disciplinaId);

    const categoria = classificar(disciplinaId);

    emCurso[categoria] +=
      matricula.turma.disciplina.cargaHoraria;
  }

  const curso = aluno.curso;

  // Excedente aprovado de perfil passa a contar
  // para a categoria livre.
  const excedentePerfil = Math.max(
    0,
    aprovadas.perfil - curso.chMinPerfil
  );

  const obrigatoria = calcularIndicador(
    curso.chMinObrigatoria,
    aprovadas.obrigatoria,
    emCurso.obrigatoria
  );

  const perfil = calcularIndicador(
    curso.chMinPerfil,
    aprovadas.perfil,
    emCurso.perfil
  );

  const livre = calcularIndicador(
    curso.chMinLivre,
    aprovadas.livre + excedentePerfil,
    emCurso.livre
  );

  const exigidaTotal =
    obrigatoria.exigida +
    perfil.exigida +
    livre.exigida;

  const integralizadaTotal =
    obrigatoria.integralizada +
    perfil.integralizada +
    livre.integralizada;

  const emCursoTotal =
    obrigatoria.emCurso +
    perfil.emCurso +
    livre.emCurso;

  const total = calcularIndicador(
    exigidaTotal,
    integralizadaTotal,
    emCursoTotal
  );

  return {
    curso: {
      id: curso.id,
      nome: curso.nome,
    },
    progresso: {
      obrigatoria,
      perfil,
      livre,
      total,
    },
    cargaHorariaEmCurso: emCursoTotal,
  };
}