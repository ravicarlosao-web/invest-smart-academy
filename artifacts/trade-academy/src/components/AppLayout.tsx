import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
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
  const title = titles[baseKey] ?? titles[pathname] ?? "TradeAcademy";

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "T";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <h1 className="text-base font-semibold tracking-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-1 sm:flex">
                <Flame className="h-3.5 w-3.5 text-warning" />
                <span className="font-mono text-xs font-semibold">{streak}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">dias</span>
              </div>
              <NotificationCenter />
              <ThemeToggle />
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground cursor-default select-none"
                title={user?.name ?? ""}
              >
                {initial}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Terminar sessão"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 animate-fade-in-up">
            <Outlet />
          </main>
        </div>
      </div>
      {!onboarded && <OnboardingOverlay />}
    </SidebarProvider>
  );
}
