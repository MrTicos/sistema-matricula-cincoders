import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { criarMatricula } from "../../api/matriculas";
import { LogoutButton } from "../../components/LogoutButton";

import type {
  ClassificacaoCurricular,
  RespostaOfertas,
} from "../../types/ofertas";

const LIMITE_POR_PAGINA = 10;

const nomesClassificacao: Record<ClassificacaoCurricular, string> = {
  OBRIGATORIA: "Obrigatória",
  ELETIVA_PERFIL: "Eletiva de perfil",
  LIVRE: "Livre",
};

interface EstadoConsulta {
  chave: string;
  dados: RespostaOfertas | null;
  erro: string | null;
}

export function OfertasPage() {
  const [parametros, setParametros] = useSearchParams();

  const busca = parametros.get("busca") ?? "";
  const pagina = Number(parametros.get("pagina") ?? "1");
  const chave = `${busca}|${pagina}`;

  const [estado, setEstado] = useState<EstadoConsulta>({
    chave: "",
    dados: null,
    erro: null,
  });

  const [matriculando, setMatriculando] = useState<number | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  const carregando = estado.chave !== chave;

  // Consulta as ofertas ao abrir a página ou alterar os filtros.
  useEffect(() => {
    let ativo = true;

    const query = new URLSearchParams({
      busca,
      pagina: String(pagina),
      limite: String(LIMITE_POR_PAGINA),
    });

    apiRequest<RespostaOfertas>(
      `/api/aluno/ofertas?${query.toString()}`
    )
      .then((dados) => {
        if (ativo) {
          setEstado({
            chave,
            dados,
            erro: null,
          });
        }
      })
      .catch((erro: unknown) => {
        if (ativo) {
          setEstado({
            chave,
            dados: null,
            erro:
              erro instanceof Error
                ? erro.message
                : "Não foi possível consultar as ofertas.",
          });
        }
      });

    return () => {
      ativo = false;
    };
  }, [busca, pagina, chave]);

  // Realiza a matrícula na turma selecionada.
  async function matricular(turmaId: number) {
    if (matriculando !== null) {
      return;
    }

    setMatriculando(turmaId);
    setMensagemSucesso("");
    setMensagemErro("");

    try {
      await criarMatricula({ turmaId });

      setMensagemSucesso("Matrícula realizada com sucesso!");

      // Atualiza a quantidade de vagas após a matrícula.
      const query = new URLSearchParams({
        busca,
        pagina: String(pagina),
        limite: String(LIMITE_POR_PAGINA),
      });

      try {
        const dadosAtualizados = await apiRequest<RespostaOfertas>(
          `/api/aluno/ofertas?${query.toString()}`
        );

        setEstado({
          chave,
          dados: dadosAtualizados,
          erro: null,
        });
      } catch {
        setMensagemErro(
          "Matrícula confirmada, mas não foi possível atualizar as vagas. Recarregue a página."
        );
      }
    } catch (erro) {
      setMensagemErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível realizar a matrícula."
      );
    } finally {
      setMatriculando(null);
    }
  }

  // Pesquisa disciplinas pelo nome ou código.
  function pesquisar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const formulario = new FormData(evento.currentTarget);
    const termo = String(formulario.get("busca") ?? "").trim();

    const novosParametros = new URLSearchParams();

    if (termo) {
      novosParametros.set("busca", termo);
    }

    novosParametros.set("pagina", "1");
    setParametros(novosParametros);

    setMensagemSucesso("");
    setMensagemErro("");
  }

  // Altera a página da listagem.
  function mudarPagina(novaPagina: number) {
    const novosParametros = new URLSearchParams(parametros);

    novosParametros.set("pagina", String(novaPagina));
    setParametros(novosParametros);

    setMensagemSucesso("");
    setMensagemErro("");
  }

  const dados = !carregando ? estado.dados : null;

  return (
    <main className="ofertas-page">
      <header className="ofertas-header">
        <div>
          <span className="login-brand">CINCoders</span>

          <h1>Ofertas de disciplinas</h1>

          <p>Consulte as turmas disponíveis para matrícula.</p>
        </div>

        <LogoutButton />
      </header>

      {/* Pesquisa */}
      <form className="ofertas-busca" onSubmit={pesquisar}>
        <label htmlFor="busca">Buscar disciplina</label>

        <div className="ofertas-busca-controles">
          <input
            key={busca}
            id="busca"
            name="busca"
            type="search"
            placeholder="Nome ou código da disciplina"
            defaultValue={busca}
            maxLength={100}
          />

          <button type="submit">Pesquisar</button>
        </div>
      </form>

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
      {carregando && (
        <p role="status">Carregando ofertas...</p>
      )}

      {/* Erro na consulta */}
      {!carregando && estado.erro && (
        <p role="alert">{estado.erro}</p>
      )}

      {/* Listagem */}
      {dados && (
        <>
          <p>
            {dados.paginacao.total} turma(s) encontrada(s).
          </p>

          {dados.ofertas.length === 0 ? (
            <p>Nenhuma turma encontrada para sua pesquisa.</p>
          ) : (
            <div className="ofertas-grid">
              {dados.ofertas.map((oferta) => (
                <article
                  className="oferta-card"
                  key={oferta.turmaId}
                >
                  <div className="oferta-topo">
                    <span>{oferta.disciplina.codigo}</span>

                    <span>
                      {nomesClassificacao[oferta.classificacao]}
                    </span>
                  </div>

                  <h2>{oferta.disciplina.nome}</h2>

                  <p>
                    Professor: {oferta.professor.nome}
                  </p>

                  <p>
                    Carga horária: {oferta.disciplina.cargaHoraria}h
                  </p>

                  <p>Turma #{oferta.turmaId}</p>

                  {/* Informações de vagas */}
                  <div className="oferta-vagas">
                    <p>
                      Vagas totais:{" "}
                      <strong>{oferta.vagasTotais}</strong>
                    </p>

                    <p>
                      Alunos matriculados:{" "}
                      <strong>{oferta.vagasOcupadas}</strong>
                    </p>

                    <p>
                      Vagas disponíveis:{" "}
                      <strong>{oferta.vagasDisponiveis}</strong>
                    </p>

                    <p>
                      {oferta.vagasDisponiveis > 0
                        ? "🟢 Turma disponível"
                        : "🔴 Turma lotada"}
                    </p>
                  </div>

                  {/* Matrícula */}
                  <button
                    type="button"
                    disabled={
                      oferta.vagasDisponiveis === 0 ||
                      matriculando !== null
                    }
                    onClick={() => void matricular(oferta.turmaId)}
                  >
                    {matriculando === oferta.turmaId
                      ? "Matriculando..."
                      : oferta.vagasDisponiveis === 0
                        ? "Turma lotada"
                        : "Matricular-se"}
                  </button>
                </article>
              ))}
            </div>
          )}

          {/* Paginação */}
          <nav
            className="ofertas-paginacao"
            aria-label="Paginação das ofertas"
          >
            <button
              type="button"
              disabled={pagina <= 1 || matriculando !== null}
              onClick={() => mudarPagina(pagina - 1)}
            >
              Anterior
            </button>

            <span>
              Página {pagina} de{" "}
              {Math.max(1, dados.paginacao.totalPaginas)}
            </span>

            <button
              type="button"
              disabled={
                pagina >= dados.paginacao.totalPaginas ||
                matriculando !== null
              }
              onClick={() => mudarPagina(pagina + 1)}
            >
              Próxima
            </button>
          </nav>
        </>
      )}
    </main>
  );
}