import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Settings, RotateCcw, Bell, Globe, Shield, Info,
  AlertTriangle, Palette, Sun, Moon, User, LogOut,
  CreditCard, Crown, ChevronRight, Database, Zap,
  Monitor, BookOpen,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { toast } from "sonner";

const VERSION = "1.2.0";
const TOTAL_LESSONS = 40;

export default function Configuracoes() {
  const [confirmReset, setConfirmReset] = useState<"progress" | "simulator" | null>(null);
  const { theme, setTheme } = useTheme();

  const user            = useAuthStore((s) => s.user);
  const logout          = useAuthStore((s) => s.logout);
  const xp              = useAppStore((s) => s.progress.xp);
  const completedCount  = useAppStore((s) => s.progress.completedLessons.length);
  const streakDays      = useAppStore((s) => s.progress.streakDays);
  const resetProgress   = useAppStore((s) => s.resetProgress);
  const resetSimulator  = useAppStore((s) => s.resetSim);
  const canResetSim     = useAppStore((s) => s.canResetSim);
  const simZeroedAt     = useAppStore((s) => s.simZeroedAt);
  const settings        = useAppStore((s) => s.settings);
  const updateSettings  = useAppStore((s) => s.updateSettings);
  const { hasActiveSubscription, subscription } = useSubscriptionStore();

  const isActive   = hasActiveSubscription();
  const isPending  = subscription?.status === "pending";
  const daysLeft   = subscription?.expiresAt
    ? Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / 86_400_000))
    : null;

  const displayName = user?.name || user?.email?.split("@")[0] || "Utilizador";
  const initials    = displayName.slice(0, 2).toUpperCase();

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
      const remaining   = cooldownEnd ? cooldownEnd - Date.now() : 0;
      const days        = Math.ceil(remaining / 86_400_000);
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

  function handleLogout() {
    logout();
    toast.success("Sessão terminada.");
  }

  return (
    <div className="container max-w-3xl py-6 lg:py-8 space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Preferências e controles da tua conta
        </p>
      </div>

      {/* ── Account Card ── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-surface p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-lg font-bold text-primary-foreground shadow-glow">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base leading-tight truncate">{displayName}</p>
              {user?.email && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {isActive ? (
                  <Badge className="bg-bull/15 text-bull text-[10px] border-0">
                    <Crown className="h-2.5 w-2.5 mr-1" />Premium · {daysLeft !== null ? `${daysLeft}d restantes` : "Ativo"}
                  </Badge>
                ) : isPending ? (
                  <Badge className="bg-warning/15 text-warning text-[10px] border-0">
                    A aguardar confirmação
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Plano Gratuito</Badge>
                )}
                <Badge className="bg-primary/10 text-primary text-[10px] border-0">
                  {xp} XP
                </Badge>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-bear border border-border hover:border-bear/40 hover:bg-bear/5 rounded-lg px-3 py-2 transition-colors shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
          {[
            { label: "XP Total",         value: xp.toLocaleString() },
            { label: "Aulas concluídas", value: `${completedCount}/${TOTAL_LESSONS}` },
            { label: "Sequência",         value: `${streakDays}d` },
          ].map((s) => (
            <div key={s.label} className="px-4 py-3 text-center">
              <p className="text-base font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Subscription ── */}
      <Section icon={CreditCard} title="Subscrição" accent="text-bull">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isActive ? "bg-bull/15" : isPending ? "bg-warning/15" : "bg-surface-2"
            }`}>
              <Crown className={`h-5 w-5 ${isActive ? "text-bull" : isPending ? "text-warning" : "text-muted-foreground"}`} />
            </div>
            <div>
              {isActive ? (
                <>
                  <p className="text-sm font-semibold text-bull">Premium Ativo</p>
                  <p className="text-xs text-muted-foreground">
                    {daysLeft !== null ? `Expira em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}` : "Acesso completo"}
                  </p>
                </>
              ) : isPending ? (
                <>
                  <p className="text-sm font-semibold text-warning">A aguardar confirmação</p>
                  <p className="text-xs text-muted-foreground">O admin confirma em breve</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">Plano Gratuito</p>
                  <p className="text-xs text-muted-foreground">Subscreve para aceder aos níveis Intermediário e Avançado</p>
                </>
              )}
            </div>
          </div>
          <Link
            to="/financeiro"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
          >
            Gerir <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </Section>

      {/* ── Aparência ── */}
      <Section icon={Palette} title="Aparência" accent="text-primary">
        <SettingRow
          label="Tema da interface"
          description="Alterna entre modo claro e escuro"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {theme === "dark" ? "Escuro" : "Claro"}
            </span>
            <ThemeToggle />
          </div>
        </SettingRow>
        <div className="pb-4 pt-1 grid grid-cols-2 gap-2">
          {([
            { id: "light", label: "Claro",  icon: Sun  },
            { id: "dark",  label: "Escuro", icon: Moon },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                theme === id
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-surface-1 text-muted-foreground hover:text-foreground hover:border-border/80"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Notificações ── */}
      <Section icon={Bell} title="Notificações" accent="text-warning">
        <SettingRow
          label="Alertas de metas"
          description="Avisar quando atingires marcos de XP e aulas"
        >
          <Switch
            checked={settings.notifyGoals}
            onCheckedChange={(v) => updateSettings({ notifyGoals: v })}
          />
        </SettingRow>
        <SettingRow
          label="Dica diária"
          description="Mostrar dica de trading ao abrir a aplicação"
        >
          <Switch
            checked={settings.dailyTip}
            onCheckedChange={(v) => updateSettings({ dailyTip: v })}
          />
        </SettingRow>
        <SettingRow
          label="Resumo semanal"
          description="Resumo de progresso enviado aos domingos"
        >
          <Switch
            checked={settings.weeklyReport}
            onCheckedChange={(v) => updateSettings({ weeklyReport: v })}
          />
        </SettingRow>
      </Section>

      {/* ── Simulador ── */}
      <Section icon={Monitor} title="Simulador" accent="text-primary">
        <SettingRow
          label="Confirmar ordens"
          description="Pedir confirmação antes de executar ordens a mercado"
        >
          <Switch
            checked={settings.confirmOrders}
            onCheckedChange={(v) => updateSettings({ confirmOrders: v })}
          />
        </SettingRow>
        <SettingRow
          label="P&L em tempo real"
          description="Actualizar lucro/perda das posições abertas a cada tick"
        >
          <Switch
            checked={settings.realtimePnl}
            onCheckedChange={(v) => updateSettings({ realtimePnl: v })}
          />
        </SettingRow>
        <SettingRow
          label="Guardar notas automaticamente"
          description="Gravar o diário de trade ao fechar posição"
        >
          <Switch
            checked={settings.autoSaveNotes}
            onCheckedChange={(v) => updateSettings({ autoSaveNotes: v })}
          />
        </SettingRow>
      </Section>

      {/* ── Dados e Privacidade ── */}
      <Section icon={Shield} title="Dados e Privacidade" accent="text-bear">
        {/* Reset simulator */}
        <div className="flex items-center justify-between py-4 border-b border-border/60">
          <div>
            <p className="text-sm font-medium">Reiniciar simulador</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Repõe a conta demo em $10.000 e apaga o histórico de trades
            </p>
          </div>
          {confirmReset === "simulator" ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setConfirmReset(null)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetSim}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-bear hover:bg-bear/90 rounded-lg px-3 py-1.5 transition-colors"
              >
                <AlertTriangle className="h-3 w-3" /> Confirmar
              </button>
            </div>
          ) : (
            <button
              onClick={handleResetSim}
              className="flex items-center gap-1.5 text-xs font-medium text-bear bg-bear/10 hover:bg-bear/20 rounded-lg px-3 py-1.5 transition-colors shrink-0"
            >
              <RotateCcw className="h-3 w-3" /> Reiniciar
            </button>
          )}
        </div>

        {/* Reset progress */}
        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium">Zerar progresso de aprendizado</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Apaga XP, aulas concluídas e conquistas — irreversível
            </p>
          </div>
          {confirmReset === "progress" ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setConfirmReset(null)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetProgress}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-bear hover:bg-bear/90 rounded-lg px-3 py-1.5 transition-colors"
              >
                <AlertTriangle className="h-3 w-3" /> Confirmar
              </button>
            </div>
          ) : (
            <button
              onClick={handleResetProgress}
              className="flex items-center gap-1.5 text-xs font-medium text-bear bg-bear/10 hover:bg-bear/20 rounded-lg px-3 py-1.5 transition-colors shrink-0"
            >
              <RotateCcw className="h-3 w-3" /> Zerar tudo
            </button>
          )}
        </div>
      </Section>

      {/* ── Sobre ── */}
      <Section icon={Info} title="Sobre" accent="text-muted-foreground">
        <SettingRow label="Versão" description="TradeAcademy Web Platform">
          <span className="text-xs font-mono bg-surface-2 px-2 py-0.5 rounded text-muted-foreground">
            v{VERSION}
          </span>
        </SettingRow>
        <SettingRow label="Armazenamento" description="Os teus dados estão guardados em servidor seguro na nuvem">
          <Database className="h-4 w-4 text-muted-foreground" />
        </SettingRow>
        <SettingRow label="Idioma" description="Interface disponível em Português">
          <span className="text-xs font-bold bg-green-500/10 text-green-500 rounded px-2 py-0.5">PT</span>
        </SettingRow>
        <SettingRow label="Aviso legal" description="Plataforma educacional — não constitui aconselhamento financeiro">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </SettingRow>
      </Section>
    </div>
  );
}

/* ── Sub-components ── */

function Section({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: React.ElementType;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-surface-2/40">
        <Icon className={`h-4 w-4 ${accent}`} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="px-5 divide-y divide-border/60">{children}</div>
    </Card>
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
        <p className="text-sm font-medium leading-snug">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
