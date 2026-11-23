import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { SecretariaNav } from "../../components/SecretariaNav";

import { apiRequest } from "../../api/client";
import { LogoutButton } from "../../components/LogoutButton";

const LIMITE_POR_PAGINA = 10;
const LIMITE_OPCOES = 50;
const MAIOR_INTEIRO_PRISMA = 2_147_483_647;

interface Disciplina {
  id: number;
  codigo: string;
  nome: string;
  cargaHoraria: number;
}

interface Professor {
  id: number;
  nome: string;
  email: string;
}

interface Turma {
  id: number;
  disciplinaId: number;
  professorId: number;
  vagasTotais: number;
  vagasOcupadas: number;
  vagasDisponiveis: number;
  disciplina: Disciplina;
  professor: Professor;
}

interface Paginacao {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

interface RespostaTurmas {
  turmas: Turma[];
  paginacao: Paginacao;
}

interface RespostaDisciplinas {
  disciplinas: Disciplina[];
  paginacao: Paginacao;
}

interface RespostaProfessores {
  professores: Professor[];
  paginacao: Paginacao;
}

interface RespostaAbertura {
  message: string;
  turma: Turma;
}

interface RespostaAtualizacaoCapacidade {
  message: string;
  turma: Turma;
}

function lerPagina(valor: string | null): number {
  if (!valor || !/^[1-9]\d*$/.test(valor)) return 1;

  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : 1;
}

function parametrosOpcoes(busca: string): string {
  const parametros = new URLSearchParams({
    pagina: "1",
    limite: String(LIMITE_OPCOES),
  });

  if (busca) parametros.set("busca", busca);

  return parametros.toString();
}

export function TurmasPage() {
  const [parametros, setParametros] = useSearchParams();
  const buscaUrl = (parametros.get("busca") ?? "").trim();
  const paginaAtual = lerPagina(parametros.get("pagina"));

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [versaoLista, setVersaoLista] = useState(0);

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [carregandoDisciplinas, setCarregandoDisciplinas] = useState(true);
  const [carregandoProfessores, setCarregandoProfessores] = useState(true);
  const [erroDisciplinas, setErroDisciplinas] = useState("");
  const [erroProfessores, setErroProfessores] = useState("");
  const [versaoDisciplinas, setVersaoDisciplinas] = useState(0);
  const [versaoProfessores, setVersaoProfessores] = useState(0);

  const [textoBuscaDisciplina, setTextoBuscaDisciplina] = useState("");
  const [textoBuscaProfessor, setTextoBuscaProfessor] = useState("");
  const [buscaDisciplina, setBuscaDisciplina] = useState("");
  const [buscaProfessor, setBuscaProfessor] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [vagasTotais, setVagasTotais] = useState("30");
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");
  const [turmaEmEdicao, setTurmaEmEdicao] = useState<Turma | null>(null);
  const [vagasEmEdicao, setVagasEmEdicao] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");
  const [sucessoEdicao, setSucessoEdicao] = useState("");

  useEffect(() => {
    if (parametros.get("pagina") !== String(paginaAtual)) {
      const corrigidos = new URLSearchParams(parametros);
      corrigidos.set("pagina", String(paginaAtual));
      setParametros(corrigidos, { replace: true });
      return;
    }

    let ativo = true;

    async function carregarTurmas() {
      setCarregandoLista(true);
      setErroLista("");

      const consulta = new URLSearchParams({
        pagina: String(paginaAtual),
        limite: String(LIMITE_POR_PAGINA),
      });

      if (buscaUrl) consulta.set("busca", buscaUrl);

      try {
        const resposta = await apiRequest<RespostaTurmas>(
          `/api/secretaria/turmas?${consulta.toString()}`
        );

        if (!ativo) return;

        setTurmas(resposta.turmas);
        setPaginacao(resposta.paginacao);
      } catch (erro) {
        if (!ativo) return;

        setTurmas([]);
        setPaginacao(null);
        setErroLista(
          erro instanceof Error
            ? erro.message
            : "Não foi possível consultar as turmas."
        );
      } finally {
        if (ativo) setCarregandoLista(false);
      }
    }

    void carregarTurmas();

    return () => {
      ativo = false;
    };
  }, [parametros, setParametros, buscaUrl, paginaAtual, versaoLista]);

  useEffect(() => {
    let ativo = true;

    async function carregarDisciplinas() {
      setCarregandoDisciplinas(true);
      setErroDisciplinas("");

      try {
        const resposta = await apiRequest<RespostaDisciplinas>(
          `/api/secretaria/disciplinas?${parametrosOpcoes(buscaDisciplina)}`
        );

        if (ativo) setDisciplinas(resposta.disciplinas);
      } catch (erro) {
        if (!ativo) return;

        setDisciplinas([]);
        setErroDisciplinas(
          erro instanceof Error
            ? erro.message
            : "Não foi possível carregar as disciplinas."
        );
      } finally {
        if (ativo) setCarregandoDisciplinas(false);
      }
    }

    void carregarDisciplinas();

    return () => {
      ativo = false;
    };
  }, [buscaDisciplina, versaoDisciplinas]);

  useEffect(() => {
    let ativo = true;

    async function carregarProfessores() {
      setCarregandoProfessores(true);
      setErroProfessores("");

      try {
        const resposta = await apiRequest<RespostaProfessores>(
          `/api/secretaria/professores?${parametrosOpcoes(buscaProfessor)}`
        );

        if (ativo) setProfessores(resposta.professores);
      } catch (erro) {
        if (!ativo) return;

        setProfessores([]);
        setErroProfessores(
          erro instanceof Error
            ? erro.message
            : "Não foi possível carregar os professores."
        );
      } finally {
        if (ativo) setCarregandoProfessores(false);
      }
    }

    void carregarProfessores();

    return () => {
      ativo = false;
    };
  }, [buscaProfessor, versaoProfessores]);

  function pesquisar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const dados = new FormData(evento.currentTarget);
    const texto = String(dados.get("busca") ?? "").trim();
    const novosParametros = new URLSearchParams();

    if (texto) novosParametros.set("busca", texto);
    novosParametros.set("pagina", "1");
    setParametros(novosParametros);
  }

  function mudarPagina(novaPagina: number) {
    const novosParametros = new URLSearchParams();

    if (buscaUrl) novosParametros.set("busca", buscaUrl);
    novosParametros.set("pagina", String(novaPagina));
    setParametros(novosParametros);
  }

  function pesquisarDisciplinas() {
    if (salvando) return;
    setDisciplinaId("");
    const texto = textoBuscaDisciplina.trim();

    if (texto === buscaDisciplina) {
      setVersaoDisciplinas((anterior) => anterior + 1);
    } else {
      setBuscaDisciplina(texto);
    }
  }

  function pesquisarProfessores() {
    if (salvando) return;
    setProfessorId("");
    const texto = textoBuscaProfessor.trim();

    if (texto === buscaProfessor) {
      setVersaoProfessores((anterior) => anterior + 1);
    } else {
      setBuscaProfessor(texto);
    }
  }

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (salvando) return;

    setMensagemSucesso("");
    setMensagemErro("");

    const idDisciplina = Number(disciplinaId);
    const idProfessor = Number(professorId);
    const quantidadeVagas = Number(vagasTotais);

    if (
      !Number.isSafeInteger(idDisciplina) ||
      idDisciplina < 1 ||
      !Number.isSafeInteger(idProfessor) ||
      idProfessor < 1 ||
      !Number.isSafeInteger(quantidadeVagas) ||
      quantidadeVagas < 1 ||
      quantidadeVagas > MAIOR_INTEIRO_PRISMA
    ) {
      setMensagemErro(
        "Selecione uma disciplina e um professor e informe vagas inteiras positivas."
      );
      return;
    }

    setSalvando(true);

    try {
      const resposta = await apiRequest<RespostaAbertura>(
        "/api/secretaria/turmas",
        {
          method: "POST",
          body: JSON.stringify({
            disciplinaId: idDisciplina,
            professorId: idProfessor,
            vagasTotais: quantidadeVagas,
          }),
        }
      );

      setMensagemSucesso(
        `Turma ${resposta.turma.id} aberta com sucesso!`
      );
      setDisciplinaId("");
      setProfessorId("");
      setVagasTotais("30");
      setVersaoLista((anterior) => anterior + 1);
    } catch (erro) {
      setMensagemErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível abrir a turma."
      );
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(turma: Turma) {
  if (salvandoEdicao) {
    return;
  }

  setTurmaEmEdicao(turma);
  setVagasEmEdicao(String(turma.vagasTotais));

  setErroEdicao("");
  setSucessoEdicao("");
}

function cancelarEdicao() {
  if (salvandoEdicao) {
    return;
  }

  setTurmaEmEdicao(null);
  setVagasEmEdicao("");
  setErroEdicao("");
}

async function salvarCapacidade(
  evento: FormEvent<HTMLFormElement>
) {
  evento.preventDefault();

  if (!turmaEmEdicao || salvandoEdicao) {
    return;
  }

  setErroEdicao("");
  setSucessoEdicao("");

  const novaCapacidade = Number(vagasEmEdicao);

  if (
    !Number.isSafeInteger(novaCapacidade) ||
    novaCapacidade < 1 ||
    novaCapacidade > MAIOR_INTEIRO_PRISMA
  ) {
    setErroEdicao(
      "A quantidade de vagas deve ser um inteiro positivo."
    );
    return;
  }

  if (novaCapacidade < turmaEmEdicao.vagasOcupadas) {
    setErroEdicao(
      "A capacidade não pode ser inferior ao número de matrículas ativas."
    );
    return;
  }

  setSalvandoEdicao(true);

  try {
    const resposta =
      await apiRequest<RespostaAtualizacaoCapacidade>(
        `/api/secretaria/turmas/${turmaEmEdicao.id}/vagas`,
        {
          method: "PATCH",
          body: JSON.stringify({
            vagasTotais: novaCapacidade,
          }),
        }
      );

    setSucessoEdicao(
      `Capacidade da turma ${resposta.turma.id} atualizada para ${resposta.turma.vagasTotais} vagas!`
    );

    setTurmaEmEdicao(null);
    setVagasEmEdicao("");

    // Atualiza os dados preservando busca e paginação.
    setVersaoLista((anterior) => anterior + 1);
  } catch (erro) {
    setErroEdicao(
      erro instanceof Error
        ? erro.message
        : "Não foi possível atualizar a capacidade da turma."
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
          <h1>Turmas</h1>
          <p>Consulte as ofertas abertas e cadastre novas turmas.</p>
          <SecretariaNav />
        </div>
        <LogoutButton />
      </header>

      <section className="secretaria-card secretaria-card--listagem" aria-labelledby="titulo-listagem-turmas">
        <h2 id="titulo-listagem-turmas">Turmas cadastradas</h2>

        <form className="secretaria-busca" onSubmit={pesquisar}>
          <label htmlFor="buscaTurmas">
            Pesquisar por disciplina ou professor
          </label>
          <div className="secretaria-busca-controles">
            <input
              key={`${buscaUrl}:${paginaAtual}`}
              id="buscaTurmas"
              name="busca"
              type="search"
              defaultValue={buscaUrl}
              maxLength={100}
              placeholder="Ex.: CIN0100 ou Ana"
            />
            <button type="submit">Pesquisar turmas</button>
          </div>
        </form>

        {carregandoLista && <p role="status">Carregando turmas...</p>}

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

        {!carregandoLista && !erroLista && turmas.length === 0 && (
          <p>
            {buscaUrl
              ? `Nenhuma turma encontrada para "${buscaUrl}".`
              : "Nenhuma turma cadastrada."}
          </p>
        )}

        {!carregandoLista && !erroLista && turmas.length > 0 && (
          <div className="secretaria-tabela-container">
            <table className="secretaria-tabela">
              <caption>Resultados da consulta de turmas</caption>
              <thead>
                <tr>
                  <th scope="col">Turma</th>
                  <th scope="col">Disciplina</th>
                  <th scope="col">Professor</th>
                  <th scope="col">Vagas ocupadas/total</th>
                  <th scope="col">Disponíveis</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {turmas.map((turma) => (
                  <tr key={turma.id}>
                    <td>{turma.id}</td>
                    <td>
                      {turma.disciplina.codigo} — {turma.disciplina.nome}
                    </td>
                    <td>{turma.professor.nome}</td>
                    <td>
                      {turma.vagasOcupadas}/{turma.vagasTotais}
                    </td>
                    <td>{turma.vagasDisponiveis}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(turma)}
                        disabled={salvandoEdicao || salvando}
                      >
                        Editar vagas
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
              {paginacao.total} turma(s) — página {paginacao.pagina} de{" "}
              {Math.max(1, paginacao.totalPaginas)}
            </p>
            {paginacao.totalPaginas > 1 && (
              <nav aria-label="Paginação de turmas">
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

      {sucessoEdicao && (
        <p className="mensagem-sucesso" role="status">
          {sucessoEdicao}
        </p>
      )}

      {turmaEmEdicao && (
        <div className="secretaria-edicao-turma">
          <h3>
            Editar capacidade da turma {turmaEmEdicao.id}
          </h3>

          <p>
            Disciplina: {turmaEmEdicao.disciplina.codigo}
            {" — "}
            {turmaEmEdicao.disciplina.nome}
          </p>

          <p>
            Vagas ocupadas: {turmaEmEdicao.vagasOcupadas}
          </p>

          <form onSubmit={salvarCapacidade}>
            <label htmlFor="vagasEdicaoTurma">
              Nova quantidade de vagas
            </label>

            <input
              id="vagasEdicaoTurma"
              type="number"
              min={Math.max(1, turmaEmEdicao.vagasOcupadas)}
              max={MAIOR_INTEIRO_PRISMA}
              step={1}
              value={vagasEmEdicao}
              onChange={(evento) =>
                setVagasEmEdicao(evento.target.value)
              }
              required
              disabled={salvandoEdicao}
            />

            {erroEdicao && (
              <p className="mensagem-erro" role="alert">
                {erroEdicao}
              </p>
            )}

            <div className="secretaria-busca-controles">
              <button
                type="submit"
                disabled={salvandoEdicao}
              >
                {salvandoEdicao
                  ? "Salvando capacidade..."
                  : "Salvar capacidade"}
              </button>

              <button
                type="button"
                onClick={cancelarEdicao}
                disabled={salvandoEdicao}
              >
                Cancelar edição
              </button>
            </div>
          </form>
        </div>
      )}

      </section>

      <section className="secretaria-card secretaria-card--listagem" aria-labelledby="titulo-abertura-turma">
        <h2 id="titulo-abertura-turma">Abrir nova turma</h2>
        <p>Pesquise disciplina e professor pelo nome antes de selecionar.</p>

        <form onSubmit={cadastrar}>
          <label htmlFor="buscaDisciplinaTurma">Buscar disciplina para a turma</label>
          <div className="secretaria-busca-controles">
            <input
              id="buscaDisciplinaTurma"
              type="search"
              value={textoBuscaDisciplina}
              onChange={(evento) => setTextoBuscaDisciplina(evento.target.value)}
              maxLength={100}
              placeholder="Ex.: CIN0100"
              disabled={salvando}
            />
            <button
              type="button"
              disabled={salvando}
              onClick={pesquisarDisciplinas}
            >
              Buscar disciplinas
            </button>
          </div>

          <label htmlFor="disciplinaTurma">Disciplina</label>
          <select
            id="disciplinaTurma"
            value={disciplinaId}
            onChange={(evento) => setDisciplinaId(evento.target.value)}
            required
            disabled={salvando || carregandoDisciplinas || !!erroDisciplinas}
          >
            <option value="">Selecione uma disciplina</option>
            {disciplinas.map((disciplina) => (
              <option key={disciplina.id} value={disciplina.id}>
                {disciplina.codigo} — {disciplina.nome}
              </option>
            ))}
          </select>
          {carregandoDisciplinas && <p>Carregando disciplinas...</p>}
          {erroDisciplinas && (
            <div>
              <p role="alert">{erroDisciplinas}</p>
              <button
                type="button"
                onClick={() => setVersaoDisciplinas((anterior) => anterior + 1)}
              >
                Tentar carregar disciplinas
              </button>
            </div>
          )}
          {!carregandoDisciplinas && !erroDisciplinas && disciplinas.length === 0 && (
            <p>Nenhuma disciplina encontrada. Tente outra busca.</p>
          )}

          <label htmlFor="buscaProfessorTurma">Buscar professor para a turma</label>
          <div className="secretaria-busca-controles">
            <input
              id="buscaProfessorTurma"
              type="search"
              value={textoBuscaProfessor}
              onChange={(evento) => setTextoBuscaProfessor(evento.target.value)}
              maxLength={100}
              placeholder="Ex.: Ana"
              disabled={salvando}
            />
            <button
              type="button"
              disabled={salvando}
              onClick={pesquisarProfessores}
            >
              Buscar professores
            </button>
          </div>

          <label htmlFor="professorTurma">Professor</label>
          <select
            id="professorTurma"
            value={professorId}
            onChange={(evento) => setProfessorId(evento.target.value)}
            required
            disabled={salvando || carregandoProfessores || !!erroProfessores}
          >
            <option value="">Selecione um professor</option>
            {professores.map((professor) => (
              <option key={professor.id} value={professor.id}>
                {professor.nome} — {professor.email}
              </option>
            ))}
          </select>
          {carregandoProfessores && <p>Carregando professores...</p>}
          {erroProfessores && (
            <div>
              <p role="alert">{erroProfessores}</p>
              <button
                type="button"
                onClick={() => setVersaoProfessores((anterior) => anterior + 1)}
              >
                Tentar carregar professores
              </button>
            </div>
          )}
          {!carregandoProfessores && !erroProfessores && professores.length === 0 && (
            <p>Nenhum professor encontrado. Tente outra busca.</p>
          )}

          <label htmlFor="vagasTurma">Quantidade de vagas</label>
          <input
            id="vagasTurma"
            type="number"
            min={1}
            max={MAIOR_INTEIRO_PRISMA}
            step={1}
            value={vagasTotais}
            onChange={(evento) => setVagasTotais(evento.target.value)}
            required
            disabled={salvando}
          />

          {mensagemErro && (
            <p className="mensagem-erro" role="alert">{mensagemErro}</p>
          )}
          {mensagemSucesso && (
            <p className="mensagem-sucesso" role="status">{mensagemSucesso}</p>
          )}

          <button
            type="submit"
            disabled={salvando || carregandoDisciplinas || carregandoProfessores || !!erroDisciplinas || !!erroProfessores}
          >
            {salvando ? "Abrindo turma..." : "Abrir turma"}
          </button>
        </form>
      </section>
    </main>
  );
}
