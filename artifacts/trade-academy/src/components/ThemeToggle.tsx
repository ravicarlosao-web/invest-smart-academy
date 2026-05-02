import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle({ size = "icon" }: { size?: "icon" | "default" }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled aria-label="Tema">
        <span className="h-4 w-4 block rounded bg-muted animate-pulse" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  if (size === "default") {
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="flex w-full items-center justify-between rounded-lg px-1 py-0.5"
        aria-label="Alternar tema"
      >
        <span className="flex items-center gap-2 text-sm">
          {isDark ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-warning" />}
          {isDark ? "Modo Escuro" : "Modo Claro"}
        </span>
        <span className="text-xs text-muted-foreground">{isDark ? "ativo" : "ativo"}</span>
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {isDark
        ? <Sun className="h-4 w-4" />
        : <Moon className="h-4 w-4" />
      }
    </Button>
  );
}
