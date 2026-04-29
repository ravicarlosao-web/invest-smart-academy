import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Flame } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/aprender": "Aprender",
  "/simular": "Simulador de Trading",
  "/perfil": "Perfil",
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const streak = useAppStore((s) => s.progress.streakDays);

  // pega o título da rota base
  const baseKey = "/" + (pathname.split("/")[1] ?? "");
  const title = titles[baseKey] ?? titles[pathname] ?? "TradeAcademy";

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
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-1 sm:flex">
                <Flame className="h-3.5 w-3.5 text-warning" />
                <span className="font-mono text-xs font-semibold">{streak}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">dias</span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                T
              </div>
            </div>
          </header>
          <main className="flex-1 animate-fade-in-up">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
