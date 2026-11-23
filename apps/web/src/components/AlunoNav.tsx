import { NavLink } from "react-router-dom";

export function AlunoNav() {
  return (
    <nav
      className="matriculas-navegacao aluno-navegacao"
      aria-label="Navegação do aluno"
    >
      <NavLink to="/aluno/ofertas">
        Consultar ofertas
      </NavLink>

      <NavLink to="/aluno/matriculas">
        Minhas matrículas
      </NavLink>

      <NavLink to="/aluno/progresso">
        Progresso curricular
      </NavLink>
    </nav>
  );
}