import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogout() {
    setSaindo(true);
    setErro("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setErro("Não foi possível encerrar a sessão.");
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={saindo}
      >
        {saindo ? "Saindo..." : "Sair"}
      </button>

      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}