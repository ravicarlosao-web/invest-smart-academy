import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AppLayout    from "./components/AppLayout";
import AuthGuard    from "./components/AuthGuard";

import Landing      from "./pages/Landing";
import Login        from "./pages/Login";
import Cadastrar    from "./pages/Cadastrar";

import Dashboard    from "./pages/Dashboard";
import Aprender     from "./pages/Aprender";
import Licao        from "./pages/Licao";
import Simular      from "./pages/Simular";
import Perfil       from "./pages/Perfil";
import Glossario    from "./pages/Glossario";
import Recursos     from "./pages/Recursos";
import Configuracoes from "./pages/Configuracoes";
import Duelo        from "./pages/Duelo";
import Biblioteca   from "./pages/Biblioteca";
import BookReader   from "./pages/BookReader";
import Estrategias  from "./pages/Estrategias";
import VideoAulas   from "./pages/VideoAulas";
import Financeiro   from "./pages/Financeiro";
import Admin        from "./pages/Admin";
import NotFound     from "./pages/NotFound.tsx";
import UserStateSync from "./components/UserStateSync";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserStateSync />
        <Routes>
          {/* ── Páginas públicas ─────────────────────────────── */}
          <Route path="/"          element={<Landing />} />
          <Route path="/entrar"    element={<Login />} />
          <Route path="/login"     element={<Navigate to="/entrar" replace />} />
          <Route path="/cadastrar" element={<Cadastrar />} />
          <Route path="/register"  element={<Navigate to="/cadastrar" replace />} />

          {/* ── Gestão interna (protegida por senha) ── */}
          <Route path="/ta-painel-gestao" element={<Admin />} />

          {/* ── Páginas protegidas (requerem login) ──────────── */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"             element={<Dashboard />} />
              <Route path="/aprender"              element={<Aprender />} />
              <Route path="/aprender/:lessonId"    element={<Licao />} />
              <Route path="/simular"               element={<Simular />} />
              <Route path="/perfil"                element={<Perfil />} />
              <Route path="/glossario"             element={<Glossario />} />
              <Route path="/recursos"              element={<Recursos />} />
              <Route path="/configuracoes"         element={<Configuracoes />} />
              <Route path="/duelo"                 element={<Duelo />} />
              <Route path="/biblioteca"            element={<Biblioteca />} />
              <Route path="/biblioteca/:bookId"    element={<BookReader />} />
              <Route path="/estrategias"           element={<Estrategias />} />
              <Route path="/video-aulas"           element={<VideoAulas />} />
              <Route path="/video-aulas/:videoId"  element={<VideoAulas />} />
              <Route path="/financeiro"            element={<Financeiro />} />
            </Route>
          </Route>

          {/* Compatibilidade com links antigos que usavam "/" como dashboard */}
          <Route path="/index" element={<Navigate to="/dashboard" replace />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
