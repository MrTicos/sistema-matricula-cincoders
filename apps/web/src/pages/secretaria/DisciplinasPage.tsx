import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { LogoutButton } from "../../components/LogoutButton";

const LIMITE_POR_PAGINA = 10;

interface Disciplina {
  id: number;
  codigo: string;
  nome: string;
  cargaHoraria: number;
}

interface RespostaDisciplina {
  message: string;
  disciplina: Disciplina;
}

interface Paginacao {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

interface RespostaListagem {
  disciplinas: Disciplina[];
  paginacao: Paginacao;
}

function lerPagina(valor: string | null): number {
  if (!valor || !/^[1-9]\d*$/.test(valor)) {
    return 1;
  }

  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : 1;
}

export function DisciplinasPage() {
  const [parametros, setParametros] = useSearchParams();
  const buscaUrl = (parametros.get("busca") ?? "").trim();
  const paginaAtual = lerPagina(parametros.get("pagina"));

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [versaoLista, setVersaoLista] = useState(0);

  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("60");
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  const [disciplinaEmEdicao, setDisciplinaEmEdicao] = useState<Disciplina | null>(null);
  const [codigoEdicao, setCodigoEdicao] = useState("");
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [cargaHorariaEdicao, setCargaHorariaEdicao] = useState("60");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [mensagemErroEdicao, setMensagemErroEdicao] = useState("");
  const [mensagemSucessoEdicao, setMensagemSucessoEdicao] = useState("");

  useEffect(() => {
    // A página corrente deve constar na URL, inclusive na primeira visita.
    if (parametros.get("pagina") !== String(paginaAtual)) {
      const corrigidos = new URLSearchParams(parametros);
      corrigidos.set("pagina", String(paginaAtual));
      setParametros(corrigidos, { replace: true });
      return;
    }

    let ativo = true;

    async function carregarDisciplinas() {
      setCarregandoLista(true);
      setErroLista("");

      const consulta = new URLSearchParams({
        pagina: String(paginaAtual),
        limite: String(LIMITE_POR_PAGINA),
      });

      if (buscaUrl) {
        consulta.set("busca", buscaUrl);
      }

      try {
        const resposta = await apiRequest<RespostaListagem>(
          `/api/secretaria/disciplinas?${consulta.toString()}`
        );

        if (!ativo) {
          return;
        }

        setDisciplinas(resposta.disciplinas);
        setPaginacao(resposta.paginacao);
      } catch (erro) {
        if (!ativo) {
          return;
        }

        setDisciplinas([]);
        setPaginacao(null);
        setErroLista(
          erro instanceof Error
            ? erro.message
            : "Não foi possível consultar as disciplinas."
        );
      } finally {
        if (ativo) {
          setCarregandoLista(false);
        }
      }
    }

    void carregarDisciplinas();

    // Evita usar o resultado de uma busca antiga após mudar a URL.
    return () => {
      ativo = false;
    };
  }, [parametros, setParametros, buscaUrl, paginaAtual, versaoLista]);

  function pesquisar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (salvandoEdicao) return;
    cancelarEdicao();

    const novosParametros = new URLSearchParams();
    const dadosFormulario = new FormData(evento.currentTarget);
    const texto = String(dadosFormulario.get("busca") ?? "").trim();

    if (texto) {
      novosParametros.set("busca", texto);
    }

    novosParametros.set("pagina", "1");
    setParametros(novosParametros);
  }

  function mudarPagina(novaPagina: number) {
    if (salvandoEdicao) return;
    cancelarEdicao();

    const novosParametros = new URLSearchParams();

    if (buscaUrl) {
      novosParametros.set("busca", buscaUrl);
    }

    novosParametros.set("pagina", String(novaPagina));
    setParametros(novosParametros);
  }

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (salvando || salvandoEdicao) {
      return;
    }

    setMensagemSucesso("");
    setMensagemErro("");

    const carga = Number(cargaHoraria);

    if (
      !Number.isInteger(carga) ||
      carga < 15 ||
      carga > 120 ||
      carga % 15 !== 0
    ) {
      setMensagemErro(
        "A carga horária deve estar entre 15 e 120 horas e ser múltipla de 15."
      );
      return;
    }

    if (!codigo.trim() || !nome.trim()) {
      setMensagemErro("Código e nome são obrigatórios.");
      return;
    }

    setSalvando(true);

    try {
      const resposta = await apiRequest<RespostaDisciplina>(
        "/api/secretaria/disciplinas",
        {
          method: "POST",
          body: JSON.stringify({
            codigo: codigo.trim(),
            nome: nome.trim(),
            cargaHoraria: carga,
          }),
        }
      );

      setMensagemSucesso(
        `Disciplina ${resposta.disciplina.codigo} cadastrada com sucesso!`
      );
      setCodigo("");
      setNome("");
      setCargaHoraria("60");
      setVersaoLista((anterior) => anterior + 1);
    } catch (erro) {
      setMensagemErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível cadastrar a disciplina."
      );
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(disciplina: Disciplina) {
    if (salvandoEdicao || salvando) return;

    setDisciplinaEmEdicao(disciplina);
    setCodigoEdicao(disciplina.codigo);
    setNomeEdicao(disciplina.nome);
    setCargaHorariaEdicao(String(disciplina.cargaHoraria));
    setMensagemErroEdicao("");
    setMensagemSucessoEdicao("");
  }

  function cancelarEdicao() {
    if (salvandoEdicao) return;

    setDisciplinaEmEdicao(null);
    setMensagemErroEdicao("");
  }

  async function salvarEdicao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!disciplinaEmEdicao || salvandoEdicao || salvando) return;

    setMensagemErroEdicao("");
    setMensagemSucessoEdicao("");

    if (!codigoEdicao.trim() || !nomeEdicao.trim()) {
      setMensagemErroEdicao("Código e nome são obrigatórios.");
      return;
    }

    const carga = Number(cargaHorariaEdicao);

    if (
      !Number.isInteger(carga) ||
      carga < 15 ||
      carga > 120 ||
      carga % 15 !== 0
    ) {
      setMensagemErroEdicao(
        "A carga horária deve estar entre 15 e 120 horas e ser múltipla de 15."
      );
      return;
    }

    setSalvandoEdicao(true);

    try {
      const resposta = await apiRequest<RespostaDisciplina>(
        `/api/secretaria/disciplinas/${disciplinaEmEdicao.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            codigo: codigoEdicao.trim(),
            nome: nomeEdicao.trim(),
            cargaHoraria: carga,
          }),
        }
      );

      setDisciplinaEmEdicao(null);
      setMensagemSucessoEdicao(
        `Disciplina ${resposta.disciplina.codigo} atualizada com sucesso!`
      );
      setVersaoLista((anterior) => anterior + 1);
    } catch (erro) {
      setMensagemErroEdicao(
        erro instanceof Error
          ? erro.message
          : "Não foi possível atualizar a disciplina."
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <main className="secretaria-page">
      <header className="secretaria-header">
        <div>
          <span className="login-brand">CINCoders</span>
          <h1>Disciplinas</h1>
          <p>Consulte, cadastre e edite disciplinas do sistema acadêmico.</p>
          <nav aria-label="Navegação da secretaria">
            <Link to="/secretaria" aria-current="page">
              Disciplinas
            </Link>
            {" · "}
            <Link to="/secretaria/professores">
              Professores
            </Link>
          </nav>
        </div>
        <LogoutButton />
      </header>

      <section className="secretaria-card" aria-labelledby="titulo-listagem">
        <h2 id="titulo-listagem">Disciplinas cadastradas</h2>

        <form className="secretaria-busca" onSubmit={pesquisar}>
          <label htmlFor="buscaDisciplinas">
            Pesquisar disciplinas por código ou nome
          </label>
          <div className="secretaria-busca-controles">
            <input
              key={`${buscaUrl}:${paginaAtual}`}
              id="buscaDisciplinas"
              name="busca"
              type="search"
              defaultValue={buscaUrl}
              maxLength={100}
              placeholder="Ex.: CIN0100 ou Projeto de Software"
            />
            <button type="submit" disabled={salvandoEdicao}>Pesquisar</button>
          </div>
        </form>

        {carregandoLista && <p role="status">Carregando disciplinas...</p>}

        {!carregandoLista && erroLista && (
          <div>
            <p role="alert">{erroLista}</p>
            <button
              type="button"
              onClick={() => setVersaoLista((anterior) => anterior + 1)}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!carregandoLista && !erroLista && disciplinas.length === 0 && (
          <p>
            {buscaUrl
              ? `Nenhuma disciplina encontrada para "${buscaUrl}".`
              : "Nenhuma disciplina cadastrada."}
          </p>
        )}

        {mensagemSucessoEdicao && (
          <p className="mensagem-sucesso" role="status">
            {mensagemSucessoEdicao}
          </p>
        )}

        {!carregandoLista && !erroLista && disciplinas.length > 0 && (
          <div className="secretaria-tabela-container">
            <table className="secretaria-tabela">
              <caption>Resultados da consulta de disciplinas</caption>
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Nome</th>
                  <th scope="col">Carga horária</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {disciplinas.map((disciplina) => (
                  <tr key={disciplina.id}>
                    <td>{disciplina.codigo}</td>
                    <td>{disciplina.nome}</td>
                    <td>{disciplina.cargaHoraria} h</td>
                    <td>
                      <button
                        type="button"
                        aria-label={`Editar ${disciplina.codigo}`}
                        disabled={salvandoEdicao || salvando}
                        onClick={() => iniciarEdicao(disciplina)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregandoLista && !erroLista && paginacao && (
          <div className="secretaria-paginacao">
            <p>
              {paginacao.total} disciplina(s) — página {paginacao.pagina} de{" "}
              {Math.max(1, paginacao.totalPaginas)}
            </p>
            {paginacao.totalPaginas > 1 && (
              <nav aria-label="Paginação de disciplinas">
                <button
                  type="button"
                  disabled={paginacao.pagina <= 1}
                  onClick={() => mudarPagina(paginacao.pagina - 1)}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={paginacao.pagina >= paginacao.totalPaginas}
                  onClick={() => mudarPagina(paginacao.pagina + 1)}
                >
                  Próxima
                </button>
              </nav>
            )}
          </div>
        )}
      </section>

      {disciplinaEmEdicao && (
        <section
          className="secretaria-card"
          aria-labelledby="titulo-edicao"
        >
          <h2 id="titulo-edicao">
            Editar disciplina {disciplinaEmEdicao.codigo}
          </h2>

          <form onSubmit={salvarEdicao}>
            <label htmlFor="editarCodigo">Código da disciplina em edição</label>
            <input
              id="editarCodigo"
              type="text"
              value={codigoEdicao}
              onChange={(evento) =>
                setCodigoEdicao(evento.target.value.toUpperCase())
              }
              maxLength={30}
              required
              disabled={salvandoEdicao}
            />

            <label htmlFor="editarNome">Nome da disciplina em edição</label>
            <input
              id="editarNome"
              type="text"
              value={nomeEdicao}
              onChange={(evento) => setNomeEdicao(evento.target.value)}
              maxLength={150}
              required
              disabled={salvandoEdicao}
            />

            <label htmlFor="editarCargaHoraria">Carga horária em edição</label>
            <input
              id="editarCargaHoraria"
              type="number"
              min={15}
              max={120}
              step={15}
              value={cargaHorariaEdicao}
              onChange={(evento) =>
                setCargaHorariaEdicao(evento.target.value)
              }
              required
              disabled={salvandoEdicao}
            />

            {mensagemErroEdicao && (
              <p className="mensagem-erro" role="alert">
                {mensagemErroEdicao}
              </p>
            )}

            <div className="secretaria-acoes-edicao">
              <button type="submit" disabled={salvandoEdicao}>
                {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
              </button>
              <button
                type="button"
                disabled={salvandoEdicao}
                onClick={cancelarEdicao}
              >
                Cancelar edição
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="secretaria-card" aria-labelledby="titulo-cadastro">
        <h2 id="titulo-cadastro">Nova disciplina</h2>

        <form onSubmit={cadastrar}>
          <label htmlFor="codigo">Código da disciplina</label>
          <input
            id="codigo"
            type="text"
            placeholder="Ex.: CIN0100"
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
            maxLength={30}
            required
            disabled={salvando || salvandoEdicao}
          />

          <label htmlFor="nome">Nome da disciplina</label>
          <input
            id="nome"
            type="text"
            placeholder="Ex.: Projeto de Software"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            maxLength={150}
            required
            disabled={salvando || salvandoEdicao}
          />

          <label htmlFor="cargaHoraria">Carga horária</label>
          <input
            id="cargaHoraria"
            type="number"
            min={15}
            max={120}
            step={15}
            value={cargaHoraria}
            onChange={(evento) => setCargaHoraria(evento.target.value)}
            required
            disabled={salvando || salvandoEdicao}
          />

          {mensagemErro && (
            <p className="mensagem-erro" role="alert">
              {mensagemErro}
            </p>
          )}

          {mensagemSucesso && (
            <p className="mensagem-sucesso" role="status">
              {mensagemSucesso}
            </p>
          )}

          <button type="submit" disabled={salvando || salvandoEdicao}>
            {salvando ? "Cadastrando..." : "Cadastrar disciplina"}
          </button>
        </form>
      </section>
    </main>
  );
}