import { useEffect, useState } from "react";
import { AlunoNav } from "../../components/AlunoNav";

import { apiRequest } from "../../api/client";
import { LogoutButton } from "../../components/LogoutButton";

import type {
  IndicadorProgresso,
  RespostaProgresso,
} from "../../types/progresso";

interface EstadoConsulta {
  carregando: boolean;
  dados: RespostaProgresso | null;
  erro: string | null;
}

interface CardProgressoProps {
  titulo: string;
  indicador: IndicadorProgresso;
}

function CardProgresso({
  titulo,
  indicador,
}: CardProgressoProps) {
  return (
    <article className="progresso-card">
      <h2>{titulo}</h2>

      <div className="progresso-percentual">
        {indicador.percentual}%
      </div>

      <label htmlFor={`progresso-${titulo}`}>
        Percentual concluído
      </label>

      <progress
        id={`progresso-${titulo}`}
        value={indicador.percentual}
        max={100}
      />

      <div className="progresso-detalhes">
        <p>
          Carga horária exigida:{" "}
          <strong>{indicador.exigida}h</strong>
        </p>

        <p>
          Carga horária integralizada:{" "}
          <strong>{indicador.integralizada}h</strong>
        </p>

        <p>
          Carga horária faltante:{" "}
          <strong>{indicador.faltante}h</strong>
        </p>

        <p>
          Em andamento:{" "}
          <strong>{indicador.emCurso}h</strong>
        </p>
      </div>
    </article>
  );
}

export function ProgressoPage() {
  const [estado, setEstado] = useState<EstadoConsulta>({
    carregando: true,
    dados: null,
    erro: null,
  });

  const [tentativaConsulta, setTentativaConsulta] = useState(0);

  useEffect(() => {
    let ativo = true;

    apiRequest<RespostaProgresso>("/api/aluno/progresso")
      .then((dados) => {
        if (ativo) {
          setEstado({
            carregando: false,
            dados,
            erro: null,
          });
        }
      })
      .catch((erro: unknown) => {
        if (ativo) {
          setEstado({
            carregando: false,
            dados: null,
            erro:
              erro instanceof TypeError
                ? "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
                : erro instanceof Error
                  ? erro.message
                  : "Não foi possível consultar o progresso curricular.",
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

  return (
    <main className="progresso-page">
      <header className="progresso-header">
        <div>
          <span className="login-brand">CINCoders</span>

          <h1>Progresso curricular</h1>

          <p>
            Acompanhe sua carga horária e o andamento
            da sua graduação.
          </p>
        </div>

        <LogoutButton />
      </header>

      <AlunoNav />

      {estado.carregando && (
        <p role="status">Carregando progresso curricular...</p>
      )}

    {/* Erro na consulta */}
    {!estado.carregando && estado.erro && (
      <div className="progresso-erro">
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

      {!estado.carregando && estado.dados && (
        <>
          <section className="progresso-resumo">
            <h2>{estado.dados.curso.nome}</h2>

            <p>Progresso total do curso</p>

            <strong className="progresso-total">
              {estado.dados.progresso.total.percentual}%
            </strong>

            <progress
              aria-label="Progresso total do curso"
              value={estado.dados.progresso.total.percentual}
              max={100}
            />

            <p>
              {estado.dados.progresso.total.integralizada}h
              {" de "}
              {estado.dados.progresso.total.exigida}h
              {" integralizadas"}
            </p>
          </section>

          <section className="progresso-grid">
            <CardProgresso
              titulo="Disciplinas obrigatórias"
              indicador={estado.dados.progresso.obrigatoria}
            />

            <CardProgresso
              titulo="Eletivas de perfil"
              indicador={estado.dados.progresso.perfil}
            />

            <CardProgresso
              titulo="Disciplinas livres"
              indicador={estado.dados.progresso.livre}
            />
          </section>

          <section className="progresso-observacao">
            <h2>Disciplinas em andamento</h2>

            <p>
              Você possui{" "}
              <strong>
                {estado.dados.cargaHorariaEmCurso}h
              </strong>{" "}
              de disciplinas em andamento.
            </p>

            <p>
              Essas horas ainda não são consideradas
              integralizadas. Elas somente serão contabilizadas
              após a aprovação nas respectivas disciplinas.
            </p>
          </section>
        </>
      )}
    </main>
  );
}