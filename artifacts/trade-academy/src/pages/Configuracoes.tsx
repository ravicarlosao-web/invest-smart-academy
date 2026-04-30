import { useState } from "react";
import { Settings, RotateCcw, Bell, Globe, Shield, Info, ChevronRight, AlertTriangle, Palette, Sun, Moon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";

const VERSION = "1.0.0";
const TOTAL_LESSONS = 40;

export default function Configuracoes() {
  const [confirmReset, setConfirmReset] = useState<"progress" | "simulator" | null>(null);
  const { theme, setTheme } = useTheme();

  const xp = useAppStore((s) => s.progress.xp);
  const completedCount = useAppStore((s) => s.progress.completedLessons.length);
  const resetProgress  = useAppStore((s) => s.resetProgress);
  const resetSimulator = useAppStore((s) => s.resetSim);
  const canResetSim    = useAppStore((s) => s.canResetSim);
  const simZeroedAt    = useAppStore((s) => s.simZeroedAt);
  const settings       = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  function handleResetProgress() {
    if (confirmReset === "progress") {
      resetProgress();
      setConfirmReset(null);
      toast.success("Progresso de aprendizado resetado.");
    } else {
      setConfirmReset("progress");
    }
  }

  function handleResetSim() {
    if (!canResetSim()) {
      const cooldownEnd = simZeroedAt != null ? simZeroedAt + 30 * 24 * 60 * 60 * 1000 : null;
      const remaining = cooldownEnd ? cooldownEnd - Date.now() : 0;
      const days = Math.ceil(remaining / 86_400_000);
      toast.error(`Conta em quarentena — reset disponível em ${days} dia${days !== 1 ? "s" : ""}.`);
      setConfirmReset(null);
      return;
    }
    if (confirmReset === "simulator") {
      resetSimulator();
      setConfirmReset(null);
      toast.success("Conta do simulador reiniciada com $10.000.");
    } else {
      setConfirmReset("simulator");
    }
  }

  return (
    <div className="min-h-full p-4 sm:p-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Configurações</h2>
        </div>
        <p className="text-sm text-muted-foreground">Preferências e controles da plataforma</p>
      </div>

      <div className="space-y-6">
        {/* Language */}
        <Section icon={Globe} title="Idioma e Região" color="text-info">
          <SettingRow
            label="Idioma"
            description="Idioma da interface da plataforma"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium flex items-center gap-2"><span className="text-xs font-bold text-green-500 bg-green-500/10 rounded px-1">PT</span>Português</span>
              <Badge variant="outline" className="text-[10px] h-5">
                Único disponível
              </Badge>
            </div>
          </SettingRow>
        </Section>

        {/* Appearance */}
        <Section icon={Palette} title="Aparência" color="text-primary">
          <SettingRow
            label="Tema da interface"
            description="Alterne entre modo claro e modo escuro"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {theme === "dark" ? "Escuro" : "Claro"}
              </span>
              <ThemeToggle />
            </div>
          </SettingRow>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                theme === "light"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface-1 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="h-4 w-4" /> Claro
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                theme === "dark"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface-1 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="h-4 w-4" /> Escuro
            </button>
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notificações" color="text-warning">
          <SettingRow
            label="Alertas de metas"
            description="Notificar quando atingir marcos de XP e aulas"
          >
            <Switch
              checked={settings.notifyGoals}
              onCheckedChange={(v) => updateSettings({ notifyGoals: v })}
            />
          </SettingRow>
          <SettingRow
            label="Dica diária"
            description="Mostrar dica de trading ao abrir o app"
          >
            <Switch
              checked={settings.dailyTip}
              onCheckedChange={(v) => updateSettings({ dailyTip: v })}
            />
          </SettingRow>
          <SettingRow
            label="Resumo semanal"
            description="Resumo do progresso de aprendizado aos domingos"
          >
            <Switch
              checked={settings.weeklyReport}
              onCheckedChange={(v) => updateSettings({ weeklyReport: v })}
            />
          </SettingRow>
        </Section>

        {/* Simulator preferences */}
        <Section icon={Settings} title="Simulador" color="text-primary">
          <SettingRow
            label="Confirmar ordens"
            description="Exigir confirmação antes de executar ordens a mercado"
          >
            <Switch
              checked={settings.confirmOrders}
              onCheckedChange={(v) => updateSettings({ confirmOrders: v })}
            />
          </SettingRow>
          <SettingRow
            label="Mostrar P&L em tempo real"
            description="Atualizar lucro/perda das posições abertas a cada tick"
          >
            <Switch
              checked={settings.realtimePnl}
              onCheckedChange={(v) => updateSettings({ realtimePnl: v })}
            />
          </SettingRow>
          <SettingRow
            label="Salvar notas automaticamente"
            description="Gravar o diário de trade ao fechar posição"
          >
            <Switch
              checked={settings.autoSaveNotes}
              onCheckedChange={(v) => updateSettings({ autoSaveNotes: v })}
            />
          </SettingRow>
        </Section>

        {/* Data / Reset */}
        <Section icon={Shield} title="Dados e Privacidade" color="text-bear">
          {/* Progress summary */}
          <div className="rounded-lg bg-surface-2 px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Seu progresso atual
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-primary">{xp}</p>
                <p className="text-[10px] text-muted-foreground">XP Total</p>
              </div>
              <div>
                <p className="text-lg font-bold">{completedCount}</p>
                <p className="text-[10px] text-muted-foreground">Aulas concluídas</p>
              </div>
              <div>
                <p className="text-lg font-bold">{TOTAL_LESSONS - completedCount}</p>
                <p className="text-[10px] text-muted-foreground">Aulas restantes</p>
              </div>
            </div>
          </div>

          {/* Reset simulator */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium">Reiniciar simulador</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Redefine a conta demo para $10.000 e apaga todo o histórico
              </p>
            </div>
            {confirmReset === "simulator" ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmReset(null)}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetSim}
                  className="flex items-center gap-1 text-xs font-semibold text-white bg-bear rounded-md px-3 py-1.5"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Confirmar
                </button>
              </div>
            ) : (
              <button
                onClick={handleResetSim}
                className="flex items-center gap-1.5 text-xs font-medium text-bear hover:text-bear/80 bg-bear/10 hover:bg-bear/20 rounded-md px-3 py-1.5 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reiniciar
              </button>
            )}
          </div>

          {/* Reset learning progress */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">Zerar progresso de aprendizado</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Apaga XP, aulas concluídas e conquistas — ação irreversível
              </p>
            </div>
            {confirmReset === "progress" ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmReset(null)}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetProgress}
                  className="flex items-center gap-1 text-xs font-semibold text-white bg-bear rounded-md px-3 py-1.5"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Confirmar
                </button>
              </div>
            ) : (
              <button
                onClick={handleResetProgress}
                className="flex items-center gap-1.5 text-xs font-medium text-bear hover:text-bear/80 bg-bear/10 hover:bg-bear/20 rounded-md px-3 py-1.5 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Zerar tudo
              </button>
            )}
          </div>
        </Section>

        {/* About */}
        <Section icon={Info} title="Sobre" color="text-muted-foreground">
          <SettingRow label="Versão do app" description="TradeAcademy Web">
            <span className="text-xs font-mono text-muted-foreground">{VERSION}</span>
          </SettingRow>
          <SettingRow label="Dados" description="Todos os dados são armazenados localmente no browser">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </SettingRow>
          <SettingRow label="Aviso legal" description="Plataforma educacional — não constitui aconselhamento financeiro">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </SettingRow>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2/50">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="px-4 divide-y divide-border">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
