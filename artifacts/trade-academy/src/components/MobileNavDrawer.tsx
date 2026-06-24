import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, GraduationCap, LineChart, User2, BookOpen,
  Library, BookMarked, Settings, Swords, Compass, PlayCircle,
  CreditCard, Layers, LogOut, X,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetClose, SheetTitle,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { TOTAL_LESSONS } from "@/data/curriculum";

const mainItems = [
  { title: "Dashboard",   url: "/dashboard",   icon: LayoutDashboard },
  { title: "Aprender",    url: "/aprender",    icon: GraduationCap },
  { title: "Vídeo Aulas", url: "/video-aulas", icon: PlayCircle },
  { title: "Simular",     url: "/simular",     icon: LineChart },
  { title: "Estratégias", url: "/estrategias", icon: Compass },
  { title: "Duelos",      url: "/duelo",       icon: Swords },
  { title: "Biblioteca",  url: "/biblioteca",  icon: BookMarked },
  { title: "Perfil",      url: "/perfil",      icon: User2 },
  { title: "Planos",      url: "/planos",      icon: Layers },
  { title: "Financeiro",  url: "/financeiro",  icon: CreditCard },
];

const extraItems = [
  { title: "Glossário",     url: "/glossario",     icon: BookOpen },
  { title: "Recursos",      url: "/recursos",      icon: Library },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNavDrawer({ open, onOpenChange }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const xp = useAppStore((s) => s.progress.xp);
  const completed = useAppStore((s) => s.progress.completedLessons.length);

  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  const handleNav = (url: string) => {
    navigate(url);
    onOpenChange(false);
  };

  const handleLogout = () => {
    onOpenChange(false);
    logout();
    navigate("/");
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "T";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col bg-sidebar">
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden">
              <img src="/logo-transparent.webp" alt="ALUKA" width="36" height="36" className="w-9 h-9 object-contain" loading="lazy" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">ALUKA</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Aprenda • Simule
              </span>
            </div>
          </div>
          <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4 text-sidebar-foreground" />
            <span className="sr-only">Fechar</span>
          </SheetClose>
        </div>

        {/* Nav content */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {/* Principal */}
          <div>
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Principal
            </p>
            <nav className="space-y-0.5">
              {mainItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <button
                    key={item.url}
                    onClick={() => handleNav(item.url)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-sidebar-accent text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.5 : 1.8} />
                    {item.title}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Referência */}
          <div>
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Referência
            </p>
            <nav className="space-y-0.5">
              {extraItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <button
                    key={item.url}
                    onClick={() => handleNav(item.url)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-sidebar-accent text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.5 : 1.8} />
                    {item.title}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer — user info + logout */}
        <div className="border-t border-sidebar-border p-3 space-y-3">
          {/* XP widget */}
          <div className="rounded-lg bg-sidebar-accent p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                XP Total
              </span>
              <span className="font-mono text-sm font-bold text-primary">{xp}</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {completed}/{TOTAL_LESSONS} aulas
            </div>
          </div>

          {/* User + logout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                {initial}
              </div>
              <span className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? ""}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
