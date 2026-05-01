import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, GraduationCap, LineChart, User2, Compass,
} from "lucide-react";

const TABS = [
  { title: "Início",    url: "/dashboard",    icon: LayoutDashboard },
  { title: "Aprender",  url: "/aprender",     icon: GraduationCap },
  { title: "Simular",   url: "/simular",      icon: LineChart },
  { title: "Estratégias", url: "/estrategias", icon: Compass },
  { title: "Perfil",    url: "/perfil",       icon: User2 },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch border-t border-border bg-background/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
        {TABS.map((tab) => {
          const active = isActive(tab.url);
          return (
            <NavLink
              key={tab.url}
              to={tab.url}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                active ? "bg-primary/15 scale-105" : ""
              }`}>
                <tab.icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.5 : 1.8} />
                {active && (
                  <span className="absolute -bottom-0.5 h-0.5 w-4 rounded-full bg-primary" />
                )}
              </div>
              <span className={`text-[9.5px] font-medium tracking-wide leading-tight ${
                active ? "text-primary" : "text-muted-foreground/80"
              }`}>
                {tab.title}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
