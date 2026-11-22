import { useState, type FormEvent } from "react";

import { apiRequest } from "../../api/client";
import { LogoutButton } from "../../components/LogoutButton";

interface Disciplina {
  id: number;
  codigo: string;
  nome: string;
  cargaHoraria: number;
}

interface RespostaCadastro {
  message: string;
  disciplina: Disciplina;
}

export function DisciplinasPage() {
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("60");

  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (salvando) {
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

    setSalvando(true);

    try {
      const resposta = await apiRequest<RespostaCadastro>(
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

  return (
    <main className="secretaria-page">
      <header className="secretaria-header">
        <div>
          <span className="login-brand">CINCoders</span>

          <h1>Cadastro de disciplinas</h1>

          <p>
            Gerencie as disciplinas disponíveis no sistema acadêmico.
          </p>
        </div>

        <LogoutButton />
      </header>

      <section className="secretaria-card">
        <h2>Nova disciplina</h2>

        <form onSubmit={cadastrar}>
          <label htmlFor="codigo">Código da disciplina</label>

          <input
            id="codigo"
            type="text"
            placeholder="Ex.: CIN0100"
            value={codigo}
            onChange={(evento) =>
              setCodigo(evento.target.value.toUpperCase())
            }
            maxLength={30}
            required
            disabled={salvando}
          />

          <label htmlFor="nome">Nome da disciplina</label>

          <input
            id="nome"
            type="text"
            placeholder="Ex.: Projeto de Software"
            value={nome}
            onChange={(evento) =>
              setNome(evento.target.value)
            }
            maxLength={150}
            required
            disabled={salvando}
          />

          <label htmlFor="cargaHoraria">
            Carga horária
          </label>

          <input
            id="cargaHoraria"
            type="number"
            min={15}
            max={120}
            step={15}
            value={cargaHoraria}
            onChange={(evento) =>
              setCargaHoraria(evento.target.value)
            }
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
            {salvando ? "Cadastrando..." : "Cadastrar disciplina"}
          </button>
        </form>
      </section>
    </main>
  );
}
