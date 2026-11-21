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
            element={<h1>Minhas matrículas</h1>}
          />
          <Route
            path="/aluno/progresso"
            element={<h1>Progresso curricular</h1>}
          />
        </Route>

        <Route element={<RotaProtegida perfil="SECRETARIA" />}>
          <Route
            path="/secretaria"
            element={<h1>Painel da secretaria</h1>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}