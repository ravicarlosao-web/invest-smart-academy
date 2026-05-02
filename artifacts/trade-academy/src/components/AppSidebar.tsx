import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  LineChart,
  User2,
  BookOpen,
  Library,
  BookMarked,
  Settings,
  Swords,
  Compass,
  PlayCircle,
  CreditCard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/store/useAppStore";
import { TOTAL_LESSONS } from "@/data/curriculum";

const mainItems = [
  { title: "Dashboard",    url: "/dashboard",     icon: LayoutDashboard },
  { title: "Aprender",     url: "/aprender",      icon: GraduationCap },
  { title: "Vídeo Aulas",  url: "/video-aulas",   icon: PlayCircle },
  { title: "Simular",      url: "/simular",       icon: LineChart },
  { title: "Estratégias",  url: "/estrategias",   icon: Compass },
  { title: "Duelos",       url: "/duelo",         icon: Swords },
  { title: "Biblioteca",   url: "/biblioteca",    icon: BookMarked },
  { title: "Perfil",       url: "/perfil",        icon: User2 },
  { title: "Financeiro",   url: "/financeiro",    icon: CreditCard },
];

const extraItems = [
  { title: "Glossário",      url: "/glossario",     icon: BookOpen },
  { title: "Recursos",       url: "/recursos",      icon: Library },
  { title: "Configurações",  url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const xp = useAppStore((s) => s.progress.xp);
  const completed = useAppStore((s) => s.progress.completedLessons.length);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden">
            <img src="/logo-transparent.png" alt="ALUKA" className="w-9 h-9 object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">ALUKA</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Aprenda • Simule
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Main nav */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-1">
              Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-primary"
                  >
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-[18px] w-[18px]" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Extra nav */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-1">
              Referência
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {extraItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-primary"
                  >
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-[18px] w-[18px]" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="border-t border-sidebar-border p-3">
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
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
