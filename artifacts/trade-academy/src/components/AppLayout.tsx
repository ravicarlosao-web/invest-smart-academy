import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import OnboardingOverlay from "./OnboardingOverlay";
import { NotificationCenter } from "./NotificationCenter";
import { Flame, LogOut } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/aprender": "Aprender",
  "/simular": "Simulador de Trading",
  "/perfil": "Perfil",
  "/glossario": "Glossário",
  "/recursos": "Recursos",
  "/configuracoes": "Configurações",
  "/duelo": "Duelos",
  "/biblioteca": "Biblioteca",
  "/estrategias": "Estratégias",
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const streak    = useAppStore((s) => s.progress.streakDays);
  const onboarded = useAppStore((s) => s.onboarded);
  const { user, logout } = useAuthStore();

  const baseKey = "/" + (pathname.split("/")[1] ?? "");
  const title = titles[baseKey] ?? titles[pathname] ?? "ALUKA";

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "T";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar — hidden on mobile, desktop shows collapsed icon rail */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Sidebar trigger — only desktop */}
              <span className="hidden md:block">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              </span>
              <h1 className="text-sm font-semibold tracking-tight sm:text-base truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Streak badge */}
              <div className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 sm:px-2.5">
                <Flame className="h-3 w-3 text-warning sm:h-3.5 sm:w-3.5" />
                <span className="font-mono text-xs font-semibold">{streak}</span>
                <span className="hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">dias</span>
              </div>
              <NotificationCenter />
              <ThemeToggle />
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-[11px] font-bold text-primary-foreground cursor-default select-none sm:h-8 sm:w-8 sm:text-xs"
                title={user?.name ?? ""}
              >
                {initial}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground sm:h-8 sm:w-8"
                title="Terminar sessão"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </header>

          {/* Page content — extra bottom padding on mobile for the BottomNav */}
          <main className="flex-1 animate-fade-in-up pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Bottom navigation — mobile only */}
      <BottomNav />

      {!onboarded && <OnboardingOverlay />}
    </SidebarProvider>
  );
}
