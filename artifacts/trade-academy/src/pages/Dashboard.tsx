import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { usePlanConfig } from "@/hooks/usePlanConfig";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, LineChart, TrendingUp, Trophy, Flame, Wallet, Target,
  Crown, AlertTriangle, Clock, CreditCard,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { LEVELS, TOTAL_LESSONS } from "@/data/curriculum";
import { fmtUSD } from "@/lib/market";

export default function Dashboard() {
  useSEO({ title: "Dashboard — ALUKA", noindex: true });
  const { priceAoa } = usePlanConfig();
  const progress = useAppStore((s) => s.progress);
  const sim = useAppStore((s) => s.sim);
  const user = useAuthStore((s) => s.user);
  const { subscription, fetch: fetchSub, hasActiveSubscription } = useSubscriptionStore();

  useEffect(() => {
    if (user) fetchSub(user.id);
  }, [user, fetchSub]);

  const completedPct = (progress.completedLessons.length / TOTAL_LESSONS) * 100;

  // próxima lição não-completada
  const nextLesson = (() => {
    for (const lvl of LEVELS) {
      for (const ls of lvl.lessons) {
        if (!progress.completedLessons.includes(ls.id)) return { lvl, ls };
      }
    }
    return null;
  })();

  const winRate = sim.history.length
    ? (sim.history.filter((t) => t.pnl > 0).length / sim.history.length) * 100
    : 0;
  const totalPnl = sim.history.reduce((s, t) => s + t.pnl, 0);

  const isActive = hasActiveSubscription();
  const daysLeft = subscription?.expiresAt
    ? Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / 86_400_000))
    : null;
  const expiringSoon = isActive && daysLeft !== null && daysLeft <= 7;
  const isPending = subscription?.status === "pending";
  const isExpired = subscription?.status === "expired" || subscription?.status === "rejected";

  return (
    <div className="container py-6 lg:py-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-surface p-6 lg:p-8">
        <div className="absolute inset-0 bg-gradient-glow opacity-60" />
        <div className="relative">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Bem-vindo</p>
          <h2 className="max-w-2xl text-2xl font-bold tracking-tight lg:text-3xl">
            Aprenda trading do zero. Pratique sem arriscar dinheiro real.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Conclua aulas curtas e teste o que aprendeu no simulador com $10.000 de saldo demo.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <Link to="/aprender">
                <GraduationCap className="mr-2 h-4 w-4" />
                {nextLesson ? "Continuar aprendendo" : "Começar aulas"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/simular">
                <LineChart className="mr-2 h-4 w-4" />
                Abrir simulador
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Subscription banners */}
      {expiringSoon && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>A tua subscrição expira em <strong>{daysLeft} dia{daysLeft !== 1 ? "s" : ""}</strong>. Renova para manter o acesso ao conteúdo premium.</span>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-warning/50 text-warning hover:bg-warning/10">
            <Link to="/financeiro">Renovar</Link>
          </Button>
        </div>
      )}
      {isPending && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          <Clock className="h-4 w-4 shrink-0" />
          <span>O teu pedido de subscrição está <strong>a aguardar aprovação</strong>. Receberás uma notificação assim que for processado.</span>
        </div>
      )}
      {isExpired && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-bear/30 bg-bear/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-bear">
            <CreditCard className="h-4 w-4 shrink-0" />
            <span>A tua subscrição expirou. <strong>Renova</strong> para aceder ao conteúdo Intermédio e Avançado.</span>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-bear/50 text-bear hover:bg-bear/10">
            <Link to="/financeiro">Renovar</Link>
          </Button>
        </div>
      )}
      {!subscription && user && !isPending && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Crown className="h-4 w-4 shrink-0 text-primary" />
            <span>Nível Iniciante é <strong>gratuito</strong>. Subscreve por {priceAoa.toLocaleString("pt-AO")} AOA/mês para aceder ao conteúdo Intermédio e Avançado.</span>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link to="/financeiro">Subscrever</Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="XP acumulado"
          value={progress.xp.toString()}
          icon={<Trophy className="h-4 w-4" />}
          accent="primary"
        />
        <StatCard
          label="Sequência"
          value={`${progress.streakDays} dias`}
          icon={<Flame className="h-4 w-4" />}
          accent="warning"
        />
        <StatCard
          label="Saldo demo"
          value={fmtUSD(sim.cashBalance)}
          icon={<Wallet className="h-4 w-4" />}
          accent="info"
        />
        <StatCard
          label="P&L realizado"
          value={fmtUSD(totalPnl)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent={totalPnl >= 0 ? "bull" : "bear"}
        />
      </section>

      {/* Progress + Next */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Progresso geral</h3>
              <p className="text-xs text-muted-foreground">
                {progress.completedLessons.length} de {TOTAL_LESSONS} aulas concluídas
              </p>
            </div>
            <span className="font-mono text-sm font-bold text-primary">
              {Math.round(completedPct)}%
            </span>
          </div>
          <Progress value={completedPct} className="h-2" />

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {LEVELS.slice(0, 4).map((lvl) => {
              const done = lvl.lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
              const pct = (done / lvl.lessons.length) * 100;
              return (
                <Link
                  key={lvl.id}
                  to="/aprender"
                  className="group flex items-center justify-between rounded-lg border border-border bg-surface-1 p-3 transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-3 font-mono text-[10px] font-bold">
                        {lvl.id}
                      </span>
                      <span className="truncate text-sm font-medium">{lvl.title}</span>
                    </div>
                    <p className="ml-8 mt-0.5 truncate text-[11px] text-muted-foreground">{lvl.subtitle}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{Math.round(pct)}%</span>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <h3 className="text-sm font-semibold">Próxima aula</h3>
          {nextLesson ? (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                Nível {nextLesson.lvl.id} · {nextLesson.lvl.title}
              </p>
              <p className="mt-3 text-base font-semibold leading-snug">{nextLesson.ls.title}</p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{nextLesson.ls.summary}</p>
              <div className="mt-auto pt-4">
                <Button asChild className="w-full" variant="default">
                  <Link to={`/aprender/${nextLesson.ls.id}`}>
                    <Target className="mr-2 h-4 w-4" />
                    Iniciar aula · +{nextLesson.ls.xp} XP
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Você concluiu todas as aulas disponíveis. Mais conteúdo em breve!
              </p>
              <div className="mt-auto pt-4">
                <Button asChild className="w-full" variant="outline">
                  <Link to="/simular">Ir para o simulador</Link>
                </Button>
              </div>
            </>
          )}
          {sim.history.length > 0 && (
            <div className="mt-4 rounded-md bg-surface-1 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sua taxa de acerto
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold">{winRate.toFixed(1)}%</p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  label, value, icon, accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "primary" | "bull" | "bear" | "warning" | "info";
}) {
  const colorMap: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    bull: "text-bull bg-bull/10",
    bear: "text-bear bg-bear/10",
    warning: "text-warning bg-warning/10",
    info: "text-info bg-info/10",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${colorMap[accent]}`}>{icon}</span>
      </div>
      <p className="mt-2 font-mono text-xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}
