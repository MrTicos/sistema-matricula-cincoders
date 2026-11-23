import { useEffect, useState } from "react";

import { apiRequest } from "../../api/client";

import type { MatriculaAtiva } from "../../types/matriculas";

type MatriculaCancelada = Pick<
  MatriculaAtiva,
  "id" | "turmaId" | "criadaEm" | "disciplina" | "professor"
> & {
  situacao: "CANCELADA";
  canceladaEm: string | null;
};

interface Paginacao {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

interface RespostaHistorico {
  matriculas: MatriculaCancelada[];
  paginacao: Paginacao;
}

interface EstadoHistorico {
  carregando: boolean;
  matriculas: MatriculaCancelada[];
  paginacao: Paginacao;
  erro: string | null;
}

const LIMITE = 10;

function formatarData(data: string | null) {
  if (!data) {
    return "Não informada";
  }

  const dataFormatada = new Date(data);

  if (Number.isNaN(dataFormatada.getTime())) {
    return "Não informada";
  }

  return dataFormatada.toLocaleDateString("pt-BR");
}

export function HistoricoMatriculas() {
  const [pagina, setPagina] = useState(1);
  const [tentativa, setTentativa] = useState(0);

  const [estado, setEstado] = useState<EstadoHistorico>({
    carregando: true,
    matriculas: [],
    paginacao: {
      pagina: 1,
      limite: LIMITE,
      total: 0,
      totalPaginas: 0,
    },
    erro: null,
  });

  useEffect(() => {
    let ativo = true;

    apiRequest<RespostaHistorico>(
      `/api/aluno/matriculas/historico?pagina=${pagina}&limite=${LIMITE}`
    )
      .then((resposta) => {
        if (!ativo) {
          return;
        }

        setEstado({
          carregando: false,
          matriculas: resposta.matriculas,
          paginacao: resposta.paginacao,
          erro: null,
        });
      })
      .catch((erro: unknown) => {
        if (!ativo) {
          return;
        }

        setEstado((anterior) => ({
          ...anterior,
          carregando: false,
          erro:
            erro instanceof Error
              ? erro.message
              : "Não foi possível consultar o histórico.",
        }));
      });

    return () => {
      ativo = false;
    };
  }, [pagina, tentativa]);

  function alterarPagina(novaPagina: number) {
    setEstado((anterior) => ({
      ...anterior,
      carregando: true,
      erro: null,
    }));

    setPagina(novaPagina);
  }

  function tentarNovamente() {
    setEstado((anterior) => ({
      ...anterior,
      carregando: true,
      erro: null,
    }));

    setTentativa((anterior) => anterior + 1);
  }

  return (
    <section
      className="matriculas-historico"
      aria-labelledby="titulo-historico"
    >
      <header className="matriculas-historico-header">
        <h2 id="titulo-historico">
          Histórico de cancelamentos
        </h2>

        <p>
          Consulte as disciplinas cujas matrículas foram
          canceladas anteriormente.
        </p>
      </header>

      {estado.carregando && (
        <p role="status">
          Carregando histórico de matrículas...
        </p>
      )}

      {!estado.carregando && estado.erro && (
        <div className="matriculas-erro">
          <p className="mensagem-erro" role="alert">
            {estado.erro}
          </p>

          <button
            type="button"
            onClick={tentarNovamente}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!estado.carregando &&
        !estado.erro &&
        estado.matriculas.length === 0 && (
          <div className="matriculas-vazio">
            <h3>Nenhum cancelamento encontrado</h3>

            <p>
              Você não possui matrículas canceladas
              nesta consulta.
            </p>
          </div>
        )}

      {!estado.carregando &&
        !estado.erro &&
        estado.matriculas.length > 0 && (
          <>
            <p className="matriculas-resumo">
              Total de matrículas canceladas:{" "}
              <strong>{estado.paginacao.total}</strong>
            </p>

            <div className="matriculas-grid">
              {estado.matriculas.map((matricula) => (
                <article
                  className="matricula-card"
                  key={matricula.id}
                >
                  <div className="matricula-card-topo">
                    <span>
                      {matricula.disciplina.codigo}
                    </span>

                    <span className="matricula-status matricula-status-cancelada">
                      Cancelada
                    </span>
                  </div>

                  <h3>
                    {matricula.disciplina.nome}
                  </h3>

                  <p>
                    Professor: {matricula.professor.nome}
                  </p>

                  <p>
                    Carga horária:{" "}
                    {matricula.disciplina.cargaHoraria}h
                  </p>

                  <p>
                    Turma #{matricula.turmaId}
                  </p>

                  <p>
                    Matrícula realizada em:{" "}
                    {formatarData(matricula.criadaEm)}
                  </p>

                  <p>
                    Cancelada em:{" "}
                    {formatarData(matricula.canceladaEm)}
                  </p>
                </article>
              ))}
            </div>

            {estado.paginacao.totalPaginas > 1 && (
              <nav
                className="matriculas-paginacao"
                aria-label="Paginação do histórico"
              >
                <button
                  type="button"
                  disabled={pagina <= 1}
                  onClick={() =>
                    alterarPagina(pagina - 1)
                  }
                >
                  Anterior
                </button>

                <span>
                  Página {estado.paginacao.pagina} de{" "}
                  {estado.paginacao.totalPaginas}
                </span>

                <button
                  type="button"
                  disabled={
                    pagina >=
                    estado.paginacao.totalPaginas
                  }
                  onClick={() =>
                    alterarPagina(pagina + 1)
                  }
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        )}
    </section>
  );
}