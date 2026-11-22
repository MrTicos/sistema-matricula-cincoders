import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { LogoutButton } from "../../components/LogoutButton";

const LIMITE_POR_PAGINA = 10;

interface Professor {
  id: number;
  nome: string;
  email: string;
}

interface Paginacao {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

interface RespostaListagem {
  professores: Professor[];
  paginacao: Paginacao;
}

interface RespostaCadastro {
  message: string;
  professor: Professor;
}

function lerPagina(valor: string | null): number {
  if (!valor || !/^[1-9]\d*$/.test(valor)) {
    return 1;
  }

  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : 1;
}

export function ProfessoresPage() {
  const [parametros, setParametros] = useSearchParams();
  const buscaUrl = (parametros.get("busca") ?? "").trim();
  const paginaAtual = lerPagina(parametros.get("pagina"));

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [versaoLista, setVersaoLista] = useState(0);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  useEffect(() => {
    // Preserva a página atual na URL, inclusive na primeira visita.
    if (parametros.get("pagina") !== String(paginaAtual)) {
      const corrigidos = new URLSearchParams(parametros);
      corrigidos.set("pagina", String(paginaAtual));
      setParametros(corrigidos, { replace: true });
      return;
    }

    let ativo = true;

    async function carregarProfessores() {
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
          `/api/secretaria/professores?${consulta.toString()}`
        );

        if (!ativo) return;

        setProfessores(resposta.professores);
        setPaginacao(resposta.paginacao);
      } catch (erro) {
        if (!ativo) return;

        setProfessores([]);
        setPaginacao(null);
        setErroLista(
          erro instanceof Error
            ? erro.message
            : "Não foi possível consultar os professores."
        );
      } finally {
        if (ativo) {
          setCarregandoLista(false);
        }
      }
    }

    void carregarProfessores();

    // Ignora resultados de consultas anteriores ao mudar busca/página.
    return () => {
      ativo = false;
    };
  }, [parametros, setParametros, buscaUrl, paginaAtual, versaoLista]);

  function pesquisar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const dadosFormulario = new FormData(evento.currentTarget);
    const texto = String(dadosFormulario.get("busca") ?? "").trim();
    const novosParametros = new URLSearchParams();

    if (texto) {
      novosParametros.set("busca", texto);
    }

    novosParametros.set("pagina", "1");
    setParametros(novosParametros);
  }

  function mudarPagina(novaPagina: number) {
    const novosParametros = new URLSearchParams();

    if (buscaUrl) {
      novosParametros.set("busca", buscaUrl);
    }

    novosParametros.set("pagina", String(novaPagina));
    setParametros(novosParametros);
  }

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (salvando) return;

    setMensagemSucesso("");
    setMensagemErro("");

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();

    if (!nomeLimpo || nomeLimpo.length > 150) {
      setMensagemErro("O nome deve conter entre 1 e 150 caracteres.");
      return;
    }

    if (
      !emailLimpo ||
      emailLimpo.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)
    ) {
      setMensagemErro("Informe um e-mail válido.");
      return;
    }

    setSalvando(true);

    try {
      const resposta = await apiRequest<RespostaCadastro>(
        "/api/secretaria/professores",
        {
          method: "POST",
          body: JSON.stringify({ nome: nomeLimpo, email: emailLimpo }),
        }
      );

      setMensagemSucesso(
        `Professor ${resposta.professor.nome} cadastrado com sucesso!`
      );
      setNome("");
      setEmail("");
      setVersaoLista((anterior) => anterior + 1);
    } catch (erro) {
      setMensagemErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível cadastrar o professor."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="secretaria-page">
      <header className="secretaria-header">
        <div>
          <span className="login-brand">CINCoders</span>
          <h1>Professores</h1>
          <p>Consulte e cadastre professores do sistema acadêmico.</p>
          <nav aria-label="Navegação da secretaria">
            <Link to="/secretaria">
                Disciplinas
            </Link>

            {" · "}

            <Link
                to="/secretaria/professores"
                aria-current="page"
            >
                Professores
            </Link>

            {" · "}

            <Link to="/secretaria/turmas">
                Turmas
            </Link>
            </nav>
        </div>
        <LogoutButton />
      </header>

      <section className="secretaria-card" aria-labelledby="titulo-listagem-professores">
        <h2 id="titulo-listagem-professores">Professores cadastrados</h2>

        <form className="secretaria-busca" onSubmit={pesquisar}>
          <label htmlFor="buscaProfessores">
            Pesquisar professores por nome ou e-mail
          </label>
          <div className="secretaria-busca-controles">
            <input
              key={`${buscaUrl}:${paginaAtual}`}
              id="buscaProfessores"
              name="busca"
              type="search"
              defaultValue={buscaUrl}
              maxLength={100}
              placeholder="Ex.: Ana ou ana@cin.ufpe.br"
            />
            <button type="submit">Pesquisar</button>
          </div>
        </form>

        {carregandoLista && <p role="status">Carregando professores...</p>}

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

        {!carregandoLista && !erroLista && professores.length === 0 && (
          <p>
            {buscaUrl
              ? `Nenhum professor encontrado para "${buscaUrl}".`
              : "Nenhum professor cadastrado."}
          </p>
        )}

        {!carregandoLista && !erroLista && professores.length > 0 && (
          <div className="secretaria-tabela-container">
            <table className="secretaria-tabela">
              <caption>Resultados da consulta de professores</caption>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                </tr>
              </thead>
              <tbody>
                {professores.map((professor) => (
                  <tr key={professor.id}>
                    <td>{professor.nome}</td>
                    <td>{professor.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregandoLista && !erroLista && paginacao && (
          <div className="secretaria-paginacao">
            <p>
              {paginacao.total} professor(es) — página {paginacao.pagina} de{" "}
              {Math.max(1, paginacao.totalPaginas)}
            </p>
            {paginacao.totalPaginas > 1 && (
              <nav aria-label="Paginação de professores">
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

      <section className="secretaria-card" aria-labelledby="titulo-cadastro-professores">
        <h2 id="titulo-cadastro-professores">Novo professor</h2>

        <form onSubmit={cadastrar}>
          <label htmlFor="nomeProfessor">Nome do professor</label>
          <input
            id="nomeProfessor"
            type="text"
            placeholder="Ex.: Ana Carolina"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            maxLength={150}
            required
            disabled={salvando}
          />

          <label htmlFor="emailProfessor">E-mail do professor</label>
          <input
            id="emailProfessor"
            type="email"
            placeholder="Ex.: ana@cin.ufpe.br"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            maxLength={254}
            required
            disabled={salvando}
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

          <button type="submit" disabled={salvando}>
            {salvando ? "Cadastrando..." : "Cadastrar professor"}
          </button>
        </form>
      </section>
    </main>
  );
}