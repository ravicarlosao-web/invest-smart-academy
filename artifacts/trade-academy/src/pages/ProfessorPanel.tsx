// @ts-nocheck
import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, PlayCircle, Compass, BookMarked, BookText,
  Library, LogOut, Home, ChevronRight, Eye, EyeOff, Loader2,
  LayoutDashboard, RefreshCw, ArrowRight, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/apiClient";
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
  { id: "overview",    label: "Início",                icon: LayoutDashboard, section: "geral"    },
  { id: "curriculum",  label: "Trilha de Aprendizado", icon: GraduationCap,   section: "conteudo" },
  { id: "videos",      label: "Vídeo Aulas",           icon: PlayCircle,      section: "conteudo" },
  { id: "strategies",  label: "Estratégias",           icon: Compass,         section: "conteudo" },
  { id: "books",       label: "Biblioteca",            icon: BookMarked,      section: "conteudo" },
  { id: "glossary",    label: "Glossário",             icon: BookText,        section: "conteudo" },
  { id: "resources",   label: "Recursos",              icon: Library,         section: "conteudo" },
] as const;

type ProfNavId = (typeof PROF_NAV)[number]["id"];

/* ── Content stats ───────────────────────────────────────────────────────── */
type ContentStats = {
  levels: number;
  lessons: number;
  videos: number;
  books: number;
  strategies: number;
  glossaryTerms: number;
  resources: number;
};

/* ── Stat card used in overview ──────────────────────────────────────────── */
function ContentStatCard({
  icon: Icon, label, count, sub, color, onClick,
}: {
  icon: React.ElementType;
  label: string;
  count: number | undefined;
  sub: string;
  color: "cyan" | "violet" | "amber" | "emerald" | "rose" | "sky";
  onClick: () => void;
}) {
  const styles = {
    cyan:    { card: "border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40",      icon: "text-cyan-500",    num: "text-cyan-600 dark:text-cyan-400"    },
    violet:  { card: "border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40", icon: "text-violet-500",  num: "text-violet-600 dark:text-violet-400"  },
    amber:   { card: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40",   icon: "text-amber-500",   num: "text-amber-600 dark:text-amber-400"   },
    emerald: { card: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40", icon: "text-emerald-500", num: "text-emerald-600 dark:text-emerald-400" },
    rose:    { card: "border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40",      icon: "text-rose-500",    num: "text-rose-600 dark:text-rose-400"    },
    sky:     { card: "border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40",         icon: "text-sky-500",     num: "text-sky-600 dark:text-sky-400"      },
  }[color];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer",
        styles.card,
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className={cn("h-5 w-5", styles.icon)} />
        <ArrowRight className={cn("h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity", styles.icon)} />
      </div>
      <div>
        <p className={cn("font-mono text-3xl font-bold leading-none tabular-nums", styles.num)}>
          {count ?? "—"}
        </p>
        <p className="mt-1.5 text-xs font-semibold text-foreground/80">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </button>
  );
}

/* ── Quick action card ───────────────────────────────────────────────────── */
function QuickAction({
  icon: Icon, label, desc, color, onClick,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  onClick: () => void;
}) {
  const iconStyles: Record<string, string> = {
    cyan:    "text-cyan-500 bg-cyan-500/10",
    violet:  "text-violet-500 bg-violet-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber:   "text-amber-500 bg-amber-500/10",
    rose:    "text-rose-500 bg-rose-500/10",
    sky:     "text-sky-500 bg-sky-500/10",
  };
  const [iconColor, iconBg] = iconStyles[color]?.split(" ") ?? ["text-muted-foreground", "bg-muted"];

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3.5 rounded-xl border border-border/60 bg-card p-4 text-left hover:border-border hover:shadow-sm transition-all"
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors shrink-0" />
    </button>
  );
}

/* ── Professor Dashboard Tab ─────────────────────────────────────────────── */
function ProfessorOverviewTab({ onNavigate }: { onNavigate: (tab: ProfNavId) => void }) {
  const { user } = useAuthStore();
  const [stats,   setStats]   = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    setLoading(true);
    try {
      const [curriculum, videos, books, strategies, glossary, resources] = await Promise.all([
        api.admin.getCurriculumDb(),
        api.admin.getVideos(),
        api.admin.getBooks(),
        api.admin.getStrategies(),
        api.admin.getGlossary(),
        api.admin.getResources(),
      ]);
      const levelsData = (curriculum as any[]) ?? [];
      setStats({
        levels:       levelsData.length,
        lessons:      levelsData.reduce((sum: number, lv: any) => sum + (lv.lessons?.length ?? 0), 0),
        videos:       ((videos as any[]) ?? []).length,
        books:        ((books  as any[]) ?? []).length,
        strategies:   ((strategies as any[]) ?? []).length,
        glossaryTerms:((glossary   as any[]) ?? []).length,
        resources:    ((resources  as any[]) ?? []).length,
      });
    } catch {
      toast.error("Erro ao carregar estatísticas de conteúdo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Bom dia" : hour < 19 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] ?? "Professor";
  const today     = new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const STAT_CARDS: Array<{
    label: string; sub: string; count: keyof ContentStats | string;
    icon: React.ElementType; color: ContentStatCard extends (props: infer P) => any ? P["color"] : never;
    tab: ProfNavId;
  }> = [
    { label: "Níveis",      sub: `${stats?.lessons ?? "—"} lições no total`, count: "levels",        icon: GraduationCap, color: "cyan",    tab: "curriculum" },
    { label: "Vídeo Aulas", sub: "publicadas na plataforma",                  count: "videos",        icon: PlayCircle,    color: "violet",  tab: "videos"     },
    { label: "Livros",      sub: "no catálogo da biblioteca",                 count: "books",         icon: BookMarked,    color: "amber",   tab: "books"      },
    { label: "Estratégias", sub: "disponíveis para alunos",                   count: "strategies",    icon: Compass,       color: "emerald", tab: "strategies" },
    { label: "Glossário",   sub: "termos definidos",                          count: "glossaryTerms", icon: BookText,      color: "rose",    tab: "glossary"   },
    { label: "Recursos",    sub: "links e ferramentas",                       count: "resources",     icon: Library,       color: "sky",     tab: "resources"  },
  ];

  const QUICK_ACTIONS = [
    { icon: GraduationCap, label: "Trilha de Aprendizado", desc: "Criar níveis, lições e quizzes interactivos", color: "cyan",    tab: "curriculum" as ProfNavId },
    { icon: PlayCircle,    label: "Vídeo Aulas",           desc: "Adicionar e ordenar vídeos do YouTube",        color: "violet",  tab: "videos"     as ProfNavId },
    { icon: Compass,       label: "Estratégias",           desc: "Publicar estratégias e técnicas de trading",   color: "emerald", tab: "strategies" as ProfNavId },
    { icon: BookMarked,    label: "Biblioteca",            desc: "Gerir o catálogo de livros educativos",        color: "amber",   tab: "books"      as ProfNavId },
    { icon: BookText,      label: "Glossário",             desc: "Definir e organizar termos técnicos",          color: "rose",    tab: "glossary"   as ProfNavId },
    { icon: Library,       label: "Recursos",              desc: "Links úteis, ferramentas e referências",       color: "sky",     tab: "resources"  as ProfNavId },
  ];

  return (
    <div className="space-y-8 pb-4">

      {/* ── Welcome banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent p-6">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-500/80">{today}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {greeting}, {firstName}&nbsp;👋
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground leading-relaxed">
              Bem-vindo à tua área de gestão de conteúdo. Aqui encontras um resumo de tudo o que tens publicado na plataforma ALUKA.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
            className="shrink-0 self-start"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/5 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-4 h-28 w-28 rounded-full bg-cyan-400/5 blur-xl" />
      </div>

      {/* ── Content stats ──────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Conteúdo publicado
          </h3>
          {stats && (
            <span className="text-[11px] text-muted-foreground">
              {stats.levels + stats.videos + stats.books + stats.strategies + stats.glossaryTerms + stats.resources} itens no total
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl border border-border/40 bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {STAT_CARDS.map((c) => (
              <ContentStatCard
                key={c.tab}
                icon={c.icon}
                label={c.label}
                count={stats?.[c.count as keyof ContentStats]}
                sub={c.sub}
                color={c.color as any}
                onClick={() => onNavigate(c.tab)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Quick actions ──────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Acções rápidas
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <QuickAction
              key={a.tab}
              icon={a.icon}
              label={a.label}
              desc={a.desc}
              color={a.color}
              onClick={() => onNavigate(a.tab)}
            />
          ))}
        </div>
      </section>

      {/* ── Tips ───────────────────────────────────────────────────────── */}
      <section>
        <Card className="border-border/50 bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-500" />
              Boas práticas de conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Mantém os quizzes actualizados com exemplos reais do mercado angolano.",
                "Adiciona legendas ou descrições detalhadas em cada vídeo aula.",
                "Usa o glossário para definir termos técnicos logo que aparecem nas lições.",
                "Verifica regularmente se os links de recursos ainda estão activos.",
                "Organiza as estratégias por nível de dificuldade para facilitar a progressão.",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-[9px] font-bold text-cyan-600">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
            <GraduationCap className="h-6 w-6 text-cyan-500" />
          </div>
          <CardTitle className="mt-3">Área do Professor</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Acesso exclusivo para professores da plataforma ALUKA.
          </p>
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

/* ── Initials avatar ─────────────────────────────────────────────────────── */
function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className={cn(
      "flex items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-600 font-bold text-xs select-none",
      className,
    )}>
      {initials || "P"}
    </div>
  );
}

/* ── Role badge label ────────────────────────────────────────────────────── */
function rolePtLabel(role: string) {
  if (role === "professor")    return "Professor";
  if (role === "administrador") return "Administrador";
  if (role === "master")       return "Master";
  return role;
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

  const [active,      setActive]      = useState<ProfNavId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!hasAccess) return <ProfessorGateLogin />;

  const TABS: Record<ProfNavId, React.ReactNode> = {
    overview:   <ProfessorOverviewTab onNavigate={setActive} />,
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
  const geral     = PROF_NAV.filter((n) => n.section === "geral");
  const conteudo  = PROF_NAV.filter((n) => n.section === "conteudo");

  const SectionLabel = ({ label }: { label: string }) =>
    sidebarOpen ? (
      <p className="px-2 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50">
        {label}
      </p>
    ) : (
      <div className="mx-auto my-1 h-px w-6 bg-border/60" />
    );

  const NavButton = ({ item }: { item: typeof PROF_NAV[number] }) => {
    const isActive = active === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setActive(item.id)}
        title={!sidebarOpen ? item.label : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-all",
          isActive
            ? "bg-cyan-500/12 text-cyan-600 font-medium shadow-[inset_0_0_0_1px_rgba(6,182,212,0.15)]"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
        )}
      >
        <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-cyan-500")} />
        {sidebarOpen && <span className="truncate">{item.label}</span>}
        {isActive && sidebarOpen && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-500" />
        )}
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-200",
        sidebarOpen ? "w-56" : "w-14",
      )}>

        {/* Logo strip */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
            <GraduationCap className="h-4 w-4 text-cyan-500" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-sm font-bold leading-none tracking-tight">Professor</div>
              <div className="text-[10px] text-muted-foreground tracking-wide mt-0.5">ALUKA Educação</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", sidebarOpen && "rotate-180")} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          <SectionLabel label="Geral" />
          <div className="space-y-0.5">
            {geral.map((item) => <NavButton key={item.id} item={item} />)}
          </div>

          <SectionLabel label="Conteúdo" />
          <div className="space-y-0.5">
            {conteudo.map((item) => <NavButton key={item.id} item={item} />)}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2 space-y-1">
          {/* Profile card */}
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-2.5 py-2 mb-1">
              <InitialsAvatar name={authUser?.name ?? "P"} className="h-7 w-7 shrink-0 text-[10px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold leading-none">{authUser?.name ?? authUser?.email}</p>
                <Badge variant="outline" className="mt-1 border-cyan-500/30 text-[9px] text-cyan-600 h-4 px-1.5">
                  {rolePtLabel(authUser?.role ?? "professor")}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-1">
              <InitialsAvatar
                name={authUser?.name ?? "P"}
                className="h-8 w-8 text-[10px] cursor-default"
                title={authUser?.name ?? authUser?.email}
              />
            </div>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            title={!sidebarOpen ? "Voltar ao app" : undefined}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Voltar ao app</span>}
          </button>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Sair" : undefined}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-5 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            {activeItem && (
              <activeItem.icon className="h-4 w-4 shrink-0 text-cyan-500" />
            )}
            <span className="font-semibold text-sm truncate">
              {activeItem?.label ?? "Professor"}
            </span>
            {active === "overview" && (
              <Badge
                variant="outline"
                className="ml-1 shrink-0 text-[9px] border-cyan-500/30 text-cyan-600 px-1.5"
              >
                DASHBOARD
              </Badge>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              {new Date().toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {sidebarOpen ? null : (
              <div className="flex items-center gap-1.5">
                <InitialsAvatar name={authUser?.name ?? "P"} className="h-7 w-7 text-[10px]" />
                <span className="text-xs font-medium truncate max-w-[120px]">
                  {authUser?.name || authUser?.email}
                </span>
              </div>
            )}
            {!sidebarOpen && (
              <Badge
                variant="outline"
                className="text-[9px] border-cyan-500/30 text-cyan-600 px-1.5"
              >
                {rolePtLabel(authUser?.role ?? "professor").toUpperCase()}
              </Badge>
            )}
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-6xl w-full">
          {TABS[active]}
        </main>
      </div>
    </div>
  );
}
