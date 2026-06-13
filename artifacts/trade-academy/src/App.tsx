import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AppLayout    from "./components/AppLayout";
import AuthGuard    from "./components/AuthGuard";
import UserStateSync from "./components/UserStateSync";

// Páginas públicas críticas — carregadas imediatamente
import Landing        from "./pages/Landing";
import Login          from "./pages/Login";
import Cadastrar      from "./pages/Cadastrar";

// Páginas raramente acedidas — lazy
const Termos         = lazy(() => import("./pages/Termos"));
const Privacidade    = lazy(() => import("./pages/Privacidade"));
const EsqueciSenha   = lazy(() => import("./pages/EsqueciSenha"));
const RedefinirSenha       = lazy(() => import("./pages/RedefinirSenha"));
const GoogleAuthResultado  = lazy(() => import("./pages/GoogleAuthResultado"));
const NotFound             = lazy(() => import("./pages/NotFound"));

// Painel admin — lazy
const Admin        = lazy(() => import("./pages/Admin"));
const MasterLogin  = lazy(() => import("./pages/MasterLogin"));
const MasterPanel      = lazy(() => import("./pages/MasterPanel"));
const ProfessorPanel   = lazy(() => import("./pages/ProfessorPanel"));

// Páginas autenticadas — todas lazy (só carregam após login)
const Dashboard    = lazy(() => import("./pages/Dashboard"));
const Aprender     = lazy(() => import("./pages/Aprender"));
const Licao        = lazy(() => import("./pages/Licao"));
const Simular      = lazy(() => import("./pages/Simular"));
const Perfil       = lazy(() => import("./pages/Perfil"));
const Glossario    = lazy(() => import("./pages/Glossario"));
const Recursos     = lazy(() => import("./pages/Recursos"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Duelo        = lazy(() => import("./pages/Duelo"));
const Biblioteca   = lazy(() => import("./pages/Biblioteca"));
const BookReader   = lazy(() => import("./pages/BookReader"));
const Estrategias  = lazy(() => import("./pages/Estrategias"));
const VideoAulas   = lazy(() => import("./pages/VideoAulas"));
const Financeiro   = lazy(() => import("./pages/Financeiro"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserStateSync />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* ── Páginas públicas ─────────────────────────────── */}
            <Route path="/"              element={<Landing />} />
            <Route path="/entrar"        element={<Login />} />
            <Route path="/login"         element={<Navigate to="/entrar" replace />} />
            <Route path="/cadastrar"     element={<Cadastrar />} />
            <Route path="/register"      element={<Navigate to="/cadastrar" replace />} />
            <Route path="/termos"           element={<Termos />} />
            <Route path="/privacidade"      element={<Privacidade />} />
            <Route path="/esqueci-senha"    element={<EsqueciSenha />} />
            <Route path="/redefinir-senha"       element={<RedefinirSenha />} />
            <Route path="/auth/google/resultado" element={<GoogleAuthResultado />} />

            {/* ── Gestão interna ── */}
            <Route path="/master/entrar"    element={<MasterLogin />} />
            <Route path="/master/painel"    element={<MasterPanel />} />
            <Route path="/ta-painel-gestao" element={<Admin />} />
            <Route path="/professor/painel" element={<ProfessorPanel />} />

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

            {/* Compatibilidade com links antigos */}
            <Route path="/index"                    element={<Navigate to="/dashboard" replace />} />
            {/* Redirects para URLs antigas do domínio tradeacademy */}
            <Route path="/tradeacademy"             element={<Navigate to="/" replace />} />
            <Route path="/trade-academy"            element={<Navigate to="/" replace />} />
            <Route path="/tradeacademy/*"           element={<Navigate to="/" replace />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
