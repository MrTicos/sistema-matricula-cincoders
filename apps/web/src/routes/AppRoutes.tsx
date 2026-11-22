import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { LoginPage } from "../pages/LoginPage";
import { OfertasPage } from "../pages/aluno/OfertasPage";
import { MatriculasPage } from "../pages/aluno/MatriculasPage";
import { ProgressoPage } from "../pages/aluno/ProgressoPage";
import { DisciplinasPage } from "../pages/secretaria/DisciplinasPage";
import { ProfessoresPage } from "../pages/secretaria/ProfessoresPage";
import { TurmasPage } from "../pages/secretaria/TurmasPage";

type Perfil = "ALUNO" | "SECRETARIA";

function RotaProtegida({ perfil }: { perfil: Perfil }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <p>Carregando...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.perfil !== perfil) {
    return (
      <Navigate
        to={usuario.perfil === "ALUNO" ? "/aluno/ofertas" : "/secretaria"}
        replace
      />
    );
  }

  return <Outlet />;
}

function PaginaInicial() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <p>Carregando...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={usuario.perfil === "ALUNO" ? "/aluno/ofertas" : "/secretaria"}
      replace
    />
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PaginaInicial />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RotaProtegida perfil="ALUNO" />}>
          <Route
            path="/aluno/ofertas"
            element={<OfertasPage />
            }
        />
          <Route
            path="/aluno/matriculas"
            element={<MatriculasPage />}
          />
          <Route
            path="/aluno/progresso"
            element={<ProgressoPage />}
          />
        </Route>

        <Route element={<RotaProtegida perfil="SECRETARIA" />}>
          <Route
            path="/secretaria"
            element={<DisciplinasPage />}
          />

          <Route
            path="/secretaria/professores"
            element={<ProfessoresPage />}
          />

            <Route
            path="/secretaria/turmas"
            element={<TurmasPage />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}