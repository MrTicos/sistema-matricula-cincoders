import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlunoNav } from "../../components/AlunoNav";

import { apiRequest } from "../../api/client";
import { cancelarMatricula } from "../../api/cancelamento";
import { LogoutButton } from "../../components/LogoutButton";
import { HistoricoMatriculas } from "./HistoricoMatriculas";

import type {
  MatriculaAtiva,
  RespostaMatriculas,
} from "../../types/matriculas";

interface EstadoConsulta {
  carregando: boolean;
  matriculas: MatriculaAtiva[];
  erro: string | null;
}

export function MatriculasPage() {
  const [estado, setEstado] = useState<EstadoConsulta>({
    carregando: true,
    matriculas: [],
    erro: null,
});

  const [tentativaConsulta, setTentativaConsulta] = useState(0);

    const [exibicao, setExibicao] = useState<
      "ativas" | "historico"
    >("ativas");

  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);

  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  // Consulta as matrículas ativas do aluno.
  useEffect(() => {
    let ativo = true;

    apiRequest<RespostaMatriculas>("/api/aluno/matriculas")
      .then((resposta) => {
        if (ativo) {
          setEstado({
            carregando: false,
            matriculas: resposta.matriculas,
            erro: null,
          });
        }
      })
      .catch((erro: unknown) => {
        if (ativo) {
          setEstado({
            carregando: false,
            matriculas: [],
           erro:
            erro instanceof TypeError
              ? "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
              : erro instanceof Error
                ? erro.message
                : "Não foi possível consultar suas matrículas.",
          });
        }
      });

    return () => {
      ativo = false;
    };
  }, [tentativaConsulta]);

  function tentarNovamente() {
  setEstado((anterior) => ({
    ...anterior,
    carregando: true,
    erro: null,
  }));

  setTentativaConsulta((anterior) => anterior + 1);
}

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString("pt-BR");
  }

  // Abre a confirmação do cancelamento.
  function solicitarCancelamento(matriculaId: number) {
    setConfirmandoId(matriculaId);
    setMensagemSucesso("");
    setMensagemErro("");
  }

  // Fecha a confirmação sem alterar a matrícula.
  function desistirCancelamento() {
    setConfirmandoId(null);
  }

  // Executa o cancelamento após a confirmação.
  async function confirmarCancelamento(matriculaId: number) {
    if (cancelandoId !== null) {
      return;
    }

    setCancelandoId(matriculaId);
    setMensagemErro("");
    setMensagemSucesso("");

    try {
      await cancelarMatricula(matriculaId);

      // Remove a matrícula cancelada da listagem.
      setEstado((anterior) => ({
        ...anterior,
        matriculas: anterior.matriculas.filter(
          (matricula) => matricula.id !== matriculaId
        ),
      }));

      setMensagemSucesso("Matrícula cancelada com sucesso!");
      setConfirmandoId(null);
    } catch (erro) {
      setMensagemErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível cancelar a matrícula."
      );
    } finally {
      setCancelandoId(null);
    }
  }

  return (
    <main className="matriculas-page">
      <header className="matriculas-header">
        <div>
          <span className="login-brand">CINCoders</span>

          <h1>Minhas matrículas</h1>

          <p>Consulte e gerencie suas disciplinas matriculadas.</p>
        </div>

        <LogoutButton />
      </header>

      {/* Navegação */}
      <AlunoNav />

        <div
        className="matriculas-abas"
        role="group"
        aria-label="Tipos de matrícula"
        >
        <button
          type="button"
          className={
            exibicao === "ativas"
              ? "matriculas-aba matriculas-aba--ativa"
              : "matriculas-aba"
          }
          aria-pressed={exibicao === "ativas"}
          disabled={cancelandoId !== null}
          onClick={() => setExibicao("ativas")}
        >
          Matrículas ativas
        </button>

        <button
          type="button"
          className={
            exibicao === "historico"
              ? "matriculas-aba matriculas-aba--ativa"
              : "matriculas-aba"
          }
          aria-pressed={exibicao === "historico"}
          disabled={cancelandoId !== null}
          onClick={() => setExibicao("historico")}
        >
          Histórico de cancelamentos
        </button>
      </div>

      {/* Mensagens */}
      {mensagemSucesso && (
        <p className="mensagem-sucesso" role="status">
          {mensagemSucesso}
        </p>
      )}

      {mensagemErro && (
        <p className="mensagem-erro" role="alert">
          {mensagemErro}
        </p>
      )}

      {/* Carregamento */}
      {exibicao === "ativas" && estado.carregando && (
        <p role="status">Carregando matrículas...</p>
      )}

    {/* Erro na consulta */}
    {exibicao === "ativas" &&
      !estado.carregando &&
      estado.erro && (
        <div className="matriculas-erro">
          <p role="alert" className="mensagem-erro">
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

      {/* Nenhuma matrícula */}
      {exibicao === "ativas" &&
        !estado.carregando &&
        !estado.erro &&
        estado.matriculas.length === 0 && (
          <section className="matriculas-vazio">
            <h2>Nenhuma matrícula ativa</h2>

            <p>
              Você não possui matrículas ativas no momento.
            </p>

            <Link to="/aluno/ofertas">
              Consultar disciplinas disponíveis
            </Link>
          </section>
        )}

      {/* Matrículas ativas */}
      {exibicao === "ativas" &&
        !estado.carregando &&
        !estado.erro &&
        estado.matriculas.length > 0 && (
          <>
            <p>
              Você possui{" "}
              <strong>{estado.matriculas.length}</strong>{" "}
              matrícula(s) ativa(s).
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

                    <span className="matricula-status">
                      Ativa
                    </span>
                  </div>

                  <h2>{matricula.disciplina.nome}</h2>

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

                  {/* Solicitação de cancelamento */}
                  {confirmandoId !== matricula.id && (
                    <button
                      type="button"
                      className="botao-cancelar"
                      disabled={cancelandoId !== null}
                      onClick={() =>
                        solicitarCancelamento(matricula.id)
                      }
                    >
                      Cancelar matrícula
                    </button>
                  )}

                  {/* Confirmação de cancelamento */}
                  {confirmandoId === matricula.id && (
                    <div className="confirmacao-cancelamento">
                      <p>
                        Tem certeza de que deseja cancelar
                        esta matrícula?
                      </p>

                      <div className="confirmacao-acoes">
                        <button
                          type="button"
                          disabled={cancelandoId !== null}
                          onClick={desistirCancelamento}
                        >
                          Voltar
                        </button>

                        <button
                          type="button"
                          className="botao-confirmar"
                          disabled={cancelandoId !== null}
                          onClick={() =>
                            void confirmarCancelamento(matricula.id)
                          }
                        >
                          {cancelandoId === matricula.id
                            ? "Cancelando..."
                            : "Confirmar cancelamento"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}

      {exibicao === "historico" && (
        <HistoricoMatriculas />
      )}
    </main>
  );
}