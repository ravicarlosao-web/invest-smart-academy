import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { LEVELS, TOTAL_LESSONS } from "@/data/curriculum";
import { fmtUSD } from "@/lib/market";
import {
  ACHIEVEMENTS,
  XP_RANKS,
  getRank,
  getNextRank,
  rankProgress,
  getDailyMissions,
} from "@/data/gamification";
import { api } from "@/lib/apiClient";
import {
  Trophy,
  Flame,
  BookCheck,
  TrendingUp,
  Award,
  Target,
  Medal,
  Zap,
  CheckCircle2,
  Clock,
  Crown,
  PartyPopper,
  CreditCard,
  AlertTriangle,
  BookOpen,
  BarChart2,
  Mail,
  User,
} from "lucide-react";
import { IconByName } from "@/components/IconByName";

const CATEGORY_LABELS = {
  aprendizado: { label: "Aprendizado", color: "bg-primary/15 text-primary" },
  trading:     { label: "Trading",     color: "bg-bull/15 text-bull" },
  streak:      { label: "Streak",      color: "bg-warning/15 text-warning" },
  especial:    { label: "Especial",    color: "bg-purple-500/15 text-purple-400" },
};

type Tab = "conquistas" | "missoes" | "leaderboard";

export default function Perfil() {
  const [tab, setTab] = useState<Tab>("conquistas");
  const progress = useAppStore((s) => s.progress);
  const sim = useAppStore((s) => s.sim);
  const user = useAuthStore((s) => s.user);
  const { subscription, fetch: fetchSub, hasActiveSubscription } = useSubscriptionStore();

  useEffect(() => {
    if (user?.id) fetchSub(user.id);
  }, [user?.id, fetchSub]);

  const displayName = user?.name || user?.email?.split("@")[0] || "Utilizador";
  const initials = displayName.slice(0, 2).toUpperCase();

  const completedLessons = progress.completedLessons.length;
  const completedPct = (completedLessons / TOTAL_LESSONS) * 100;

  const trades = sim.history;
  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.filter((t) => t.pnl <= 0).length;
  const winRate = trades.length ? (wins / trades.length) * 100 : 0;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const avgWin = wins ? trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / wins : 0;
  const avgLoss = losses ? trades.filter((t) => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0) / losses : 0;

  const avgQuiz = (() => {
    const scores = Object.values(progress.quizScores);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  })();

  const rank = getRank(progress.xp);
  const nextRank = getNextRank(progress.xp);
  const rankPct = rankProgress(progress.xp);
  const unlockedCount = ACHIEVEMENTS.filter((a) => progress.achievements.includes(a.id)).length;

  const isActive = hasActiveSubscription();
  const isPending = subscription?.status === "pending";
  const isExpired = subscription?.status === "expired" || subscription?.status === "rejected";
  const daysLeft = subscription?.expiresAt
    ? Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / 86_400_000))
    : null;
  const expiringSoon = isActive && daysLeft !== null && daysLeft <= 7;

  return (
    <div className="container max-w-6xl py-6 lg:py-8 space-y-5">

      {/* ── Profile Header ── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-surface p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">

            {/* Avatar */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-glow">
              {initials}
              <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-background p-1 shadow">
                <IconByName name={rank.icon} className="h-4 w-4" />
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold leading-tight">{displayName}</h2>
                  {user?.email && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />{user.email}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${rank.bgColor} ${rank.color}`}>
                      <IconByName name={rank.icon} className="h-3 w-3" /> {rank.label}
                    </span>
                    <Badge className="bg-warning/15 text-warning hover:bg-warning/20">
                      <Flame className="mr-1 h-3 w-3" />{progress.streakDays} dias de sequência
                    </Badge>
                    <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                      <Trophy className="mr-1 h-3 w-3" />{progress.xp} XP
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{unlockedCount}<span className="text-sm font-normal text-muted-foreground">/{ACHIEVEMENTS.length}</span></p>
                  <p className="text-xs text-muted-foreground">conquistas</p>
                </div>
              </div>

              {/* Rank progression */}
              <div className="mt-4 space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{rank.label} → {nextRank?.label ?? "Nível Máximo"}</span>
                    <span className="font-mono font-semibold">{nextRank ? `${progress.xp} / ${nextRank.minXp} XP` : "MAX"}</span>
                  </div>
                  <Progress value={rankPct} className="h-2" />
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    {XP_RANKS.map((r) => (
                      <span key={r.id} title={r.label} className={progress.xp >= r.minXp ? `font-bold ${r.color}` : "opacity-25"}>
                        <IconByName name={r.icon} className="h-3 w-3 inline" />
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Progresso da trilha</span>
                    <span className="font-mono font-semibold">{completedLessons} / {TOTAL_LESSONS} aulas</span>
                  </div>
                  <Progress value={completedPct} className="h-1.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={<BookOpen className="h-5 w-5 text-primary" />}
          label="Aulas concluídas"
          value={`${completedLessons}`}
          sub={`de ${TOTAL_LESSONS} no total`}
          color="bg-primary/8"
        />
        <KpiCard
          icon={<Flame className="h-5 w-5 text-warning" />}
          label="Sequência"
          value={`${progress.streakDays}`}
          sub="dias consecutivos"
          color="bg-warning/8"
        />
        <KpiCard
          icon={<BarChart2 className="h-5 w-5 text-bull" />}
          label="Taxa de acerto"
          value={`${winRate.toFixed(1)}%`}
          sub={`${trades.length} trades`}
          color="bg-bull/8"
          accent={winRate >= 50 ? "bull" : undefined}
        />
        <KpiCard
          icon={<Trophy className="h-5 w-5 text-primary" />}
          label="XP Total"
          value={progress.xp.toLocaleString()}
          sub={rank.label}
          color="bg-primary/8"
        />
      </div>

      {/* ── Main Content: 2 Columns ── */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Left: Learning (wider) */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5">
            <SectionTitle icon={<BookCheck className="h-4 w-4 text-primary" />} title="Aprendizado" />
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MiniStat label="Média nos quizzes" value={`${avgQuiz.toFixed(0)}%`} />
              <MiniStat label="Quizzes perfeitos" value={`${progress.perfectQuizCount}`} />
              <MiniStat label="Para revisar" value={`${(progress.reviewQueue ?? []).length}`} sub="aulas" />
            </div>

            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progresso por módulo</p>
            <div className="space-y-2.5">
              {LEVELS.map((lvl) => {
                const done = lvl.lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
                const pct = (done / lvl.lessons.length) * 100;
                const complete = done === lvl.lessons.length;
                return (
                  <div key={lvl.id} className="flex items-center gap-3">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      complete ? "bg-bull/20 text-bull" : "bg-surface-2 text-muted-foreground"
                    }`}>
                      {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : lvl.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="truncate text-foreground/80">{lvl.title}</span>
                        <span className="font-mono ml-2 shrink-0 text-muted-foreground">{done}/{lvl.lessons.length}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className={`h-full rounded-full transition-all ${complete ? "bg-bull" : "bg-gradient-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Trading + Subscription */}
        <div className="lg:col-span-2 space-y-4">

          {/* Trading Stats */}
          <Card className="p-5">
            <SectionTitle icon={<TrendingUp className="h-4 w-4 text-bull" />} title="Simulador" />
            <div className="space-y-0.5">
              <Row label="Total de trades" value={`${trades.length}`} />
              <Row label="Ganhos" value={`${wins}`} accent="bull" />
              <Row label="Perdas" value={`${losses}`} accent="bear" />
              <Row label="P&L total" value={fmtUSD(totalPnl)} accent={totalPnl >= 0 ? "bull" : "bear"} />
              <Row label="Ganho médio" value={fmtUSD(avgWin)} accent="bull" />
              <Row label="Perda média" value={fmtUSD(avgLoss)} accent="bear" />
              <Row label="Saldo atual" value={fmtUSD(sim.cashBalance)} />
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground text-center">
              Dados do simulador — sem dinheiro real envolvido
            </p>
          </Card>

          {/* Subscription */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={<CreditCard className="h-4 w-4 text-primary" />} title="Subscrição" />
              <Link to="/financeiro" className="text-xs text-primary hover:underline">Gerir →</Link>
            </div>

            {expiringSoon && (
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2.5 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Expira em <strong>{daysLeft} dia{daysLeft !== 1 ? "s" : ""}</strong>. Renova para manter o acesso.</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isActive ? "bg-bull/15" : isPending ? "bg-warning/15" : "bg-surface-2"
              }`}>
                <Crown className={`h-5 w-5 ${isActive ? "text-bull" : isPending ? "text-warning" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                {isActive ? (
                  <>
                    <p className="text-sm font-semibold text-bull">Subscrição Ativa</p>
                    <p className="text-xs text-muted-foreground">
                      {daysLeft !== null ? `Expira em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}` : "Acesso completo"}
                    </p>
                  </>
                ) : isPending ? (
                  <>
                    <p className="text-sm font-semibold text-warning">A aguardar confirmação</p>
                    <p className="text-xs text-muted-foreground">O admin irá confirmar em breve</p>
                  </>
                ) : isExpired ? (
                  <>
                    <p className="text-sm font-semibold text-bear">Subscrição Expirada</p>
                    <p className="text-xs text-muted-foreground">Renova para aceder ao conteúdo premium</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold">Sem subscrição</p>
                    <p className="text-xs text-muted-foreground">Nível Iniciante gratuito</p>
                  </>
                )}
              </div>
              {!isActive && !isPending && (
                <Link to="/financeiro">
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer text-[10px] shrink-0">
                    Subscrever
                  </Badge>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-3 border-b border-border">
          {([
            { id: "conquistas",   label: "Conquistas",  icon: Award  },
            { id: "missoes",      label: "Missões",     icon: Target },
            { id: "leaderboard",  label: "Ranking",     icon: Crown  },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors ${
                tab === id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === "conquistas"  && <AchievementsTab achievements={progress.achievements} />}
          {tab === "missoes"     && <MissoesTab progress={progress} />}
          {tab === "leaderboard" && <LeaderboardTab xp={progress.xp} userId={user?.id} />}
        </div>
      </Card>
    </div>
  );
}

/* ── Sub-components ── */

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
      {icon}{title}
    </h3>
  );
}

function KpiCard({
  icon, label, value, sub, color, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  accent?: "bull" | "bear";
}) {
  const valColor = accent === "bull" ? "text-bull" : accent === "bear" ? "text-bear" : "text-foreground";
  return (
    <Card className={`p-4 ${color ?? ""}`}>
      <div className="mb-2">{icon}</div>
      <p className={`text-2xl font-bold leading-none ${valColor}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-surface-1 px-3 py-2.5">
      <p className="text-lg font-bold leading-none">{value}{sub && <span className="text-xs font-normal text-muted-foreground ml-0.5">{sub}</span>}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{label}</p>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "bull" | "bear" }) {
  const color = accent === "bull" ? "text-bull" : accent === "bear" ? "text-bear" : "text-foreground";
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}

/* ── Achievements Tab ── */
function AchievementsTab({ achievements }: { achievements: string[] }) {
  const categories = ["aprendizado", "trading", "streak", "especial"] as const;
  const unlockedCount = ACHIEVEMENTS.filter((a) => achievements.includes(a.id)).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unlockedCount} de {ACHIEVEMENTS.length} desbloqueadas
        </p>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-primary"
            style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>
      </div>

      {categories.map((cat) => {
        const items = ACHIEVEMENTS.filter((a) => a.category === cat);
        const { label, color } = CATEGORY_LABELS[cat];
        return (
          <div key={cat} className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Badge className={`text-[10px] border-0 ${color}`}>{label}</Badge>
              <span className="text-xs text-muted-foreground">
                {items.filter((a) => achievements.includes(a.id)).length}/{items.length}
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((a) => {
                const unlocked = achievements.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={`rounded-xl border p-3.5 transition-all ${
                      unlocked ? "border-primary/30 bg-primary/5" : "border-border bg-surface-1 opacity-50"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <IconByName name={a.icon} className="h-5 w-5" />
                      {unlocked && <CheckCircle2 className="h-3.5 w-3.5 text-bull" />}
                    </div>
                    <p className="text-xs font-semibold leading-tight">{a.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground leading-snug">{a.desc}</p>
                    {a.xpBonus > 0 && (
                      <p className="mt-1.5 text-[10px] font-semibold text-primary">+{a.xpBonus} XP</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Daily Missions Tab ── */
function MissoesTab({ progress }: { progress: ReturnType<typeof useAppStore.getState>["progress"] }) {
  const today = new Date().toISOString().slice(0, 10);
  const isSameDay = progress.missionDate === today;
  const missionDefs = getDailyMissions(today);
  const missionStates = isSameDay ? progress.dailyMissions : missionDefs.map((m) => ({ id: m.id, progress: 0, completed: false }));

  const completedCount = missionStates.filter((m) => m.completed).length;
  const totalXpReward = missionDefs.reduce((s, m) => s + m.xpReward, 0);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Missões de hoje</p>
          <p className="text-xs text-muted-foreground">Renovam à meia-noite · Bônus de XP ao completar</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary">{completedCount}/{missionDefs.length}</p>
          <p className="text-[10px] text-muted-foreground">+{totalXpReward} XP possíveis</p>
        </div>
      </div>

      <div className="space-y-3">
        {missionDefs.map((def) => {
          const state = missionStates.find((m) => m.id === def.id) ?? { id: def.id, progress: 0, completed: false };
          const pct = Math.min(100, Math.round((state.progress / def.target) * 100));
          return (
            <div
              key={def.id}
              className={`rounded-xl border p-4 transition-all ${
                state.completed ? "border-bull/30 bg-bull/5" : "border-border bg-surface-1"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <IconByName name={def.icon} className="h-5 w-5" />
                  <div>
                    <p className={`text-sm font-medium ${state.completed ? "line-through text-muted-foreground" : ""}`}>
                      {def.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {state.progress}/{def.target} · +{def.xpReward} XP
                    </p>
                  </div>
                </div>
                {state.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-bull" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full transition-all ${state.completed ? "bg-bull" : "bg-gradient-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {completedCount === missionDefs.length && (
        <div className="mt-4 rounded-xl border border-bull/30 bg-bull/5 p-4 text-center">
          <PartyPopper className="h-7 w-7 mx-auto mb-1 text-bull" />
          <p className="text-sm font-semibold text-bull">Todas as missões concluídas!</p>
          <p className="text-xs text-muted-foreground">Volta amanhã para novas missões</p>
        </div>
      )}

      <div className="mt-5 rounded-xl bg-surface-2 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-warning" />
          <p className="text-sm font-semibold">Como funciona</p>
        </div>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• As missões são renovadas automaticamente à meia-noite</li>
          <li>• Complete aulas e trades para progredir</li>
          <li>• O XP bônus é concedido automaticamente ao completar</li>
          <li>• Missões diferentes surgem todos os dias</li>
        </ul>
      </div>
    </div>
  );
}

/* ── Leaderboard Tab ── */
function LeaderboardTab({ xp, userId }: { xp: number; userId?: string }) {
  const [board, setBoard] = useState<{ rank: number; userId: string; name: string; xp: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard()
      .then(setBoard)
      .catch(() => setBoard([]))
      .finally(() => setLoading(false));
  }, []);

  const userEntry = board.find((e) => e.userId === userId);

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm font-medium">Ranking de alunos</p>
        <p className="text-xs text-muted-foreground">Ordenado por XP total acumulado · Dados reais</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-surface-1 animate-pulse" />
          ))}
        </div>
      ) : board.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Ainda não há dados suficientes para o ranking.</p>
          <p className="text-xs mt-1">Complete aulas para aparecer aqui!</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {board.slice(0, 10).map((entry) => {
              const r = getRank(entry.xp);
              const isTop3 = entry.rank <= 3;
              const isMe = entry.userId === userId;
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                    isMe
                      ? "border-primary/40 bg-primary/5"
                      : isTop3
                      ? "border-warning/30 bg-warning/5"
                      : "border-border bg-surface-1"
                  }`}
                >
                  <div className="w-8 text-center">
                    {isTop3 ? (
                      <Medal className={`h-5 w-5 mx-auto ${entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-slate-400" : "text-amber-600"}`} />
                    ) : (
                      <span className="font-mono text-sm font-bold text-muted-foreground">#{entry.rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                      {entry.name}{isMe && <span className="ml-1 text-xs font-normal">(você)</span>}
                    </p>
                    <p className={`text-[11px] ${r.color} flex items-center gap-1`}>
                      <IconByName name={r.icon} className="h-3 w-3 inline" />{r.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold">{entry.xp.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                  </div>
                </div>
              );
            })}
          </div>

          {userEntry && userEntry.rank > 10 && (
            <>
              <div className="my-3 flex items-center gap-2 text-muted-foreground">
                <div className="flex-1 border-t border-dashed border-border" />
                <span className="text-xs">···</span>
                <div className="flex-1 border-t border-dashed border-border" />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
                <span className="w-8 text-center font-mono text-sm font-bold text-muted-foreground">#{userEntry.rank}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary">{userEntry.name} <span className="text-xs font-normal">(você)</span></p>
                  <p className={`text-[11px] ${getRank(xp).color} flex items-center gap-1`}>
                    <IconByName name={getRank(xp).icon} className="h-3 w-3 inline" />{getRank(xp).label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold">{xp.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">XP</p>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div className="mt-4 rounded-xl bg-surface-2 p-3 text-center">
        <p className="text-xs text-muted-foreground">
          <Medal className="inline h-3 w-3 mr-1" />
          Complete aulas e quizzes para subir no ranking
        </p>
      </div>
    </div>
  );
}
