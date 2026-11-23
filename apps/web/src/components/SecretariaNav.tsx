import { NavLink } from "react-router-dom";

const navegacao = [
  {
    caminho: "/secretaria",
    nome: "Disciplinas",
  },
  {
    caminho: "/secretaria/professores",
    nome: "Professores",
  },
  {
    caminho: "/secretaria/turmas",
    nome: "Turmas",
  },
];

export function SecretariaNav() {
  return (
    <nav
      className="secretaria-navegacao"
      aria-label="Navegação da secretaria"
    >
      {navegacao.map((item) => (
        <NavLink
          key={item.caminho}
          to={item.caminho}
          end={item.caminho === "/secretaria"}
          className={({ isActive }) =>
            isActive
              ? "secretaria-link secretaria-link--ativo"
              : "secretaria-link"
          }
        >
          {item.nome}
        </NavLink>
      ))}
    </nav>
  );
}