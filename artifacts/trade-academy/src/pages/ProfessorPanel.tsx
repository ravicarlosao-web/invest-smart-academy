// @ts-nocheck
import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, PlayCircle, Compass, BookMarked, BookText,
  Library, LogOut, Home, ChevronRight, Eye, EyeOff, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import {
  CurriculumTab,
  VideosTab,
  StrategiesTab,
  BooksTab,
  GlossaryTab,
  ResourcesTab,
} from "./Admin";

/* ── Navigation ──────────────────────────────────────────────────────────── */
const PROF_NAV = [
  { id: "curriculum",  label: "Trilha de Aprendizado", icon: GraduationCap },
  { id: "videos",      label: "Vídeo Aulas",           icon: PlayCircle    },
  { id: "strategies",  label: "Estratégias",           icon: Compass       },
  { id: "books",       label: "Biblioteca",            icon: BookMarked    },
  { id: "glossary",    label: "Glossário",             icon: BookText      },
  { id: "resources",   label: "Recursos",              icon: Library       },
] as const;

type ProfNavId = (typeof PROF_NAV)[number]["id"];

/* ── Login gate ──────────────────────────────────────────────────────────── */
function ProfessorGateLogin() {
  const { login } = useAuthStore();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error ?? "Credenciais inválidas.");
      return;
    }
    const user = useAuthStore.getState().user;
    if (!["professor", "administrador", "master"].includes(user?.role ?? "")) {
      useAuthStore.getState().logout();
      toast.error("Esta conta não tem acesso à área de professor.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
            <GraduationCap className="h-6 w-6 text-cyan-500" />
          </div>
          <CardTitle className="mt-3">Área do Professor</CardTitle>
          <CardDescription>
            Acesso exclusivo para professores da plataforma ALUKA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="prof-email">E-mail</Label>
              <Input
                id="prof-email"
                type="email"
                autoFocus
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="professor@exemplo.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-pw">Password</Label>
              <div className="relative">
                <Input
                  id="prof-pw"
                  type={showPw ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
              disabled={loading || !email || !password}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />A verificar…</>
                : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function ProfessorPanel() {
  useSEO({ title: "Área do Professor — ALUKA", noindex: true });
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuthStore();

  const isProf   = authUser?.role === "professor";
  const isAdmin  = authUser?.role === "administrador";
  const isMaster = authUser?.role === "master";
  const hasAccess = isProf || isAdmin || isMaster;

  const [active,      setActive]      = useState<ProfNavId>("curriculum");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!hasAccess) return <ProfessorGateLogin />;

  const TABS: Record<ProfNavId, React.ReactNode> = {
    curriculum: <CurriculumTab />,
    videos:     <VideosTab />,
    strategies: <StrategiesTab />,
    books:      <BooksTab />,
    glossary:   <GlossaryTab />,
    resources:  <ResourcesTab />,
  };

  function handleLogout() {
    logout();
    toast.success("Sessão encerrada");
  }

  const activeItem = PROF_NAV.find((n) => n.id === active);

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-200",
        sidebarOpen ? "w-56" : "w-14",
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
            <GraduationCap className="h-4 w-4" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-sm font-bold leading-none tracking-tight">Professor</div>
              <div className="text-[10px] text-muted-foreground tracking-wide mt-0.5">ALUKA</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-muted-foreground hover:text-foreground p-0.5 rounded"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", sidebarOpen && "rotate-180")} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {sidebarOpen && (
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Conteúdo
            </p>
          )}
          <div className="space-y-0.5">
            {PROF_NAV.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  title={!sidebarOpen ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-cyan-500/10 text-cyan-600 font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-cyan-500")} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-1.5 space-y-0.5">
          <button
            onClick={() => navigate("/dashboard")}
            title={!sidebarOpen ? "Voltar ao app" : undefined}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Voltar ao app</span>}
          </button>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Sair" : undefined}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {activeItem && <activeItem.icon className="h-4 w-4 text-cyan-500" />}
            <span className="font-semibold text-sm">
              {activeItem?.label ?? "Professor"}
            </span>
            <Badge
              variant="outline"
              className="ml-1 text-[10px] border-cyan-500/40 text-cyan-600"
            >
              PROFESSOR
            </Badge>
          </div>
          <div className="ml-auto text-xs text-muted-foreground truncate max-w-[160px]">
            {authUser?.name || authUser?.email}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-6xl">
          {TABS[active]}
        </main>
      </div>
    </div>
  );
}
