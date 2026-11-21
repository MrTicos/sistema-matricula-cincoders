import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { usuario, carregando, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (carregando) {
    return <p>Verificando sessão...</p>;
  }

  if (usuario) {
    return (
      <Navigate
        to={usuario.perfil === "ALUNO" ? "/aluno/ofertas" : "/secretaria"}
        replace
      />
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setEnviando(true);

    try {
      await login(username, senha);

      // A rota protegida será escolhida pelo perfil após a autenticação.
      navigate("/", { replace: true });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o login."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-header">
          <span className="login-brand">CINCoders</span>
          <h1>Sistema de Matrícula</h1>
          <p>Entre com suas credenciais institucionais.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            disabled={enviando}
          />

          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            required
            disabled={enviando}
          />

          {erro && (
            <p className="login-error" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}