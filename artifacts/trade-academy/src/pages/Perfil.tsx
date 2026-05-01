import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { PaymentWall } from "@/components/PaymentWall";
import { LEVELS, TOTAL_LESSONS } from "@/data/curriculum";
import { fmtUSD } from "@/lib/market";
import { api, type SubscriptionData } from "@/lib/apiClient";
import {
  ACHIEVEMENTS,
  XP_RANKS,
  getRank,
  getNextRank,
  rankProgress,
  buildLeaderboard,
  getDailyMissions,
} from "@/data/gamification";
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
  FileText,
  Image,
  Download,
  RefreshCw,
} from "lucide-react";
import { IconByName } from "@/components/IconByName";

const CATEGORY_LABELS = {
  aprendizado: { label: "Aprendizado", color: "bg-primary/15 text-primary" },
  trading:     { label: "Trading",     color: "bg-bull/15 text-bull" },
  streak:      { label: "Streak",      color: "bg-warning/15 text-warning" },
  especial:    { label: "Especial",    color: "bg-purple-500/15 text-purple-400" },
};

type Tab = "conquistas" | "missoes" | "leaderboard" | "financeiro";

export default function Perfil() {
  const [tab, setTab] = useState<Tab>("conquistas");
  const [showPaywall, setShowPaywall] = useState(false);
  const progress = useAppStore((s) => s.progress);
  const sim = useAppStore((s) => s.sim);
  const user = useAuthStore((s) => s.user);
  const { subscription, fetch: fetchSub, fetchHistory, hasActiveSubscription } = useSubscriptionStore();

  useEffect(() => {
    if (user) {
      fetchSub(user.id);
      fetchHistory(user.id);
    }
  }, [user, fetchSub, fetchHistory]);

  const completedPct = (progress.completedLessons.length / TOTAL_LESSONS) * 100;
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

  return (
    <div className="container max-w-5xl py-6 lg:py-8 space-y-5">
      {/* ── Profile Header ── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-surface p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-glow">
                T
                <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
                  <IconByName name={rank.icon} className="h-3.5 w-3.5" />
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Trader</h2>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${rank.bgColor} ${rank.color}`}>
                    <IconByName name={rank.icon} className="h-3 w-3" /> {rank.label}
                  </span>
                  <Badge className="bg-warning/15 text-warning hover:bg-warning/20">
                    <Flame className="mr-1 h-3 w-3" />{progress.streakDays} dias
                  </Badge>
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                    <Trophy className="mr-1 h-3 w-3" />{progress.xp} XP
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {unlockedCount}/{ACHIEVEMENTS.length} conquistas
            </div>
          </div>

          {/* Rank progress */}
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                {rank.label} → {nextRank?.label ?? "Máximo"}
              </span>
              <span className="font-mono font-semibold">
                {nextRank ? `${progress.xp} / ${nextRank.minXp} XP` : "MAX"}
              </span>
            </div>
            <Progress value={rankPct} className="h-2.5" />
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              {XP_RANKS.map((r) => (
                <span key={r.id} className={progress.xp >= r.minXp ? `font-bold ${r.color}` : "text-muted-foreground/30"}>
                  <IconByName name={r.icon} className="h-3 w-3 inline" />
                </span>
              ))}
            </div>
          </div>

          {/* Learning progress */}
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso da trilha</span>
              <span className="font-mono font-semibold">{progress.completedLessons.length}/{TOTAL_LESSONS}</span>
            </div>
            <Progress value={completedPct} className="h-2" />
          </div>
        </div>
      </Card>

      {/* ── Modal de pagamento ── */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl">
            <PaymentWall onClose={() => setShowPaywall(false)} />
          </div>
        </div>
      )}

      {/* ── Subscrição ── */}
      <SubscriptionCard
        subscription={subscription}
        isActive={hasActiveSubscription()}
        onSubscribe={() => setShowPaywall(true)}
      />

      {/* ── Stats row ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <BookCheck className="h-4 w-4 text-primary" />Aprendizado
          </h3>
          <Row label="Aulas concluídas" value={`${progress.completedLessons.length} / ${TOTAL_LESSONS}`} />
          <Row label="Média nos quizzes" value={`${avgQuiz.toFixed(0)}%`} />
          <Row label="Quizzes perfeitos" value={`${progress.perfectQuizCount}`} />
          <Row label="Para revisar" value={`${(progress.reviewQueue ?? []).length} aulas`} />
          <Row label="Sequência atual" value={`${progress.streakDays} dias`} />
          <div className="mt-4 space-y-1.5">
            {LEVELS.map((lvl) => {
              const done = lvl.lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
              const pct = (done / lvl.lessons.length) * 100;
              return (
                <div key={lvl.id}>
                  <div className="mb-0.5 flex justify-between text-[11px]">
                    <span className="text-muted-foreground">N{lvl.id} · {lvl.title}</span>
                    <span className="font-mono">{done}/{lvl.lessons.length}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" />Trading
          </h3>
          <Row label="Total de trades" value={`${trades.length}`} />
          <Row label="Taxa de acerto" value={`${winRate.toFixed(1)}%`} accent={winRate >= 50 ? "bull" : undefined} />
          <Row label="Trades ganhos" value={`${wins}`} accent="bull" />
          <Row label="Trades perdidos" value={`${losses}`} accent="bear" />
          <Row label="P&L realizado" value={fmtUSD(totalPnl)} accent={totalPnl >= 0 ? "bull" : "bear"} />
          <Row label="Ganho médio" value={fmtUSD(avgWin)} accent="bull" />
          <Row label="Perda média" value={fmtUSD(avgLoss)} accent="bear" />
          <Row label="Saldo demo atual" value={fmtUSD(sim.cashBalance)} />
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Card className="overflow-hidden">
        <div className="flex overflow-x-auto border-b border-border scrollbar-none">
          {([
            { id: "conquistas",  label: "Conquistas",    shortLabel: "Conquistas", icon: Award },
            { id: "missoes",     label: "Missões Diárias", shortLabel: "Missões", icon: Target },
            { id: "leaderboard", label: "Leaderboard",   shortLabel: "Ranking",   icon: Crown },
            { id: "financeiro",  label: "Financeiro",    shortLabel: "Finanças",  icon: CreditCard },
          ] as { id: Tab; label: string; shortLabel: string; icon: React.ElementType }[]).map(({ id, label, shortLabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors sm:px-5 ${
                tab === id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "conquistas" && <AchievementsTab achievements={progress.achievements} />}
          {tab === "missoes" && <MissoesTab progress={progress} />}
          {tab === "leaderboard" && <LeaderboardTab xp={progress.xp} />}
          {tab === "financeiro" && (
            <FinanceiroTab
              subscription={subscription}
              isActive={hasActiveSubscription()}
              onSubscribe={() => setShowPaywall(true)}
              userId={user?.id ?? ""}
            />
          )}
        </div>
      </Card>
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
                      unlocked
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-surface-1 opacity-50"
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
        {missionDefs.map((def, i) => {
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

      {/* XP bonus info */}
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
function LeaderboardTab({ xp }: { xp: number }) {
  const board = buildLeaderboard(xp);
  const userEntry = board.find((e) => e.isCurrentUser);

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm font-medium">Top traders da semana</p>
        <p className="text-xs text-muted-foreground">Ranking baseado em XP total acumulado</p>
      </div>

      <div className="space-y-2">
        {board.slice(0, 10).map((entry) => {
          const rank = XP_RANKS.find((r) => r.id === entry.rankId) ?? XP_RANKS[0];
          const isTop3 = entry.rank <= 3;

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                entry.isCurrentUser
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
                  <span className="font-mono text-sm font-bold text-muted-foreground">
                    #{entry.rank}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${entry.isCurrentUser ? "text-primary" : ""}`}>
                  {entry.name} {entry.isCurrentUser && <span className="text-xs font-normal">(você)</span>}
                </p>
                <p className={`text-[11px] ${rank.color} flex items-center gap-1`}><IconByName name={rank.icon} className="h-3 w-3 inline" />{rank.label}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold">{entry.xp.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">XP</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* User position if not in top 10 */}
      {userEntry && userEntry.rank > 10 && (
        <>
          <div className="my-3 flex items-center gap-2 text-muted-foreground">
            <div className="flex-1 border-t border-dashed border-border" />
            <span className="text-xs">···</span>
            <div className="flex-1 border-t border-dashed border-border" />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
            <span className="w-8 text-center font-mono text-sm font-bold text-muted-foreground">
              #{userEntry.rank}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary">Você</p>
              <p className={`text-[11px] ${getRank(xp).color} flex items-center gap-1`}><IconByName name={getRank(xp).icon} className="h-3 w-3 inline" />{getRank(xp).label}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-bold">{xp.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">XP</p>
            </div>
          </div>
        </>
      )}

      <div className="mt-4 rounded-xl bg-surface-2 p-3 text-center">
        <p className="text-xs text-muted-foreground">
          <Medal className="inline h-3 w-3 mr-1" />
          Complete aulas e trades para subir no ranking
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "bull" | "bear" }) {
  const color = accent === "bull" ? "text-bull" : accent === "bear" ? "text-bear" : "text-foreground";
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}

/* ── Financeiro Tab ─────────────────────────────────────────────────────── */
function FinanceiroTab({
  subscription,
  isActive,
  onSubscribe,
  userId,
}: {
  subscription: SubscriptionData | null;
  isActive: boolean;
  onSubscribe: () => void;
  userId: string;
}) {
  const history = useSubscriptionStore((s) => s.history);
  const [receiptLoading, setReceiptLoading] = useState<string | null>(null);

  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString("pt-AO", { day: "2-digit", month: "2-digit", year: "numeric" });

  const statusInfo = (status: string) => {
    switch (status) {
      case "active":   return { label: "Ativo",                    color: "text-bull",    bg: "bg-bull/15",    icon: <CheckCircle2 className="h-3.5 w-3.5" /> };
      case "pending":  return { label: "Aguardando confirmação",   color: "text-warning", bg: "bg-warning/15", icon: <Clock className="h-3.5 w-3.5" /> };
      case "expired":  return { label: "Expirada",                 color: "text-bear",    bg: "bg-bear/15",    icon: <Crown className="h-3.5 w-3.5" /> };
      case "rejected": return { label: "Rejeitada",                color: "text-bear",    bg: "bg-bear/15",    icon: <Crown className="h-3.5 w-3.5" /> };
      default:         return { label: status,                     color: "text-muted-foreground", bg: "bg-surface-2", icon: null };
    }
  };

  const viewReceipt = async (subId: string) => {
    if (!userId) return;
    setReceiptLoading(subId);
    try {
      const data = await api.subscription.getReceipt(userId, subId);
      const url = `data:${data.receiptMimeType};base64,${data.receiptData}`;
      if (data.receiptMimeType === "application/pdf") {
        const blob = await (await fetch(url)).blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = data.receiptFilename || "comprovativo.pdf";
        link.click();
      } else {
        window.open(url, "_blank");
      }
    } catch {
      // silent
    } finally {
      setReceiptLoading(null);
    }
  };

  const daysLeft = subscription?.expiresAt
    ? Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return (
    <div className="space-y-6">
      {/* ── Estado atual ── */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="h-4 w-4 text-primary" />
          Estado da Subscrição
        </h3>

        {!subscription ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-1 p-6 text-center">
            <Crown className="mx-auto h-8 w-8 text-amber-500 mb-2" />
            <p className="text-sm font-medium mb-1">Sem subscrição ativa</p>
            <p className="text-xs text-muted-foreground mb-4">
              Subscreve por 5.000 AOA/mês para aceder aos conteúdos Intermediário e Avançado.
            </p>
            <Button onClick={onSubscribe} size="sm">Subscrever agora</Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold">Mensalidade Premium</span>
              </div>
              {(() => {
                const { label, color, bg, icon } = statusInfo(subscription.status);
                return (
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${bg} ${color}`}>
                    {icon} {label}
                  </span>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="font-semibold">{subscription.amount.toLocaleString("pt-AO")} AOA/mês</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pedido em</p>
                <p className="font-medium">{fmt(subscription.createdAt)}</p>
              </div>
              {subscription.approvedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Aprovado em</p>
                  <p className="font-medium">{fmt(subscription.approvedAt)}</p>
                </div>
              )}
              {subscription.expiresAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Expira em</p>
                  <p className={`font-medium ${daysLeft !== null && daysLeft <= 7 ? "text-warning" : ""}`}>
                    {fmt(subscription.expiresAt)} {daysLeft !== null && `(${daysLeft} dias)`}
                  </p>
                </div>
              )}
              {subscription.paymentReference && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Referência bancária</p>
                  <p className="font-mono text-xs">{subscription.paymentReference}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
              {subscription.hasReceipt && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  disabled={receiptLoading === subscription.id}
                  onClick={() => viewReceipt(subscription.id)}
                >
                  {subscription.receiptMimeType === "application/pdf"
                    ? <FileText className="h-3 w-3" />
                    : <Image className="h-3 w-3" />}
                  {receiptLoading === subscription.id ? "A carregar…" : "Ver comprovativo"}
                  <Download className="h-3 w-3" />
                </Button>
              )}
              {(subscription.status === "expired" || subscription.status === "rejected" || isActive) && (
                <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={onSubscribe}>
                  <RefreshCw className="h-3 w-3" />
                  {isActive && daysLeft !== null && daysLeft <= 7 ? "Renovar" : isActive ? "Renovar" : "Novo pedido"}
                </Button>
              )}
              {subscription.status === "pending" && !subscription.hasReceipt && (
                <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={onSubscribe}>
                  Adicionar comprovativo
                </Button>
              )}
            </div>

            {subscription.status === "rejected" && subscription.notes && (
              <div className="border-t border-bear/20 bg-bear/5 px-4 py-3">
                <p className="text-xs text-bear"><span className="font-semibold">Motivo:</span> {subscription.notes}</p>
              </div>
            )}
            {daysLeft !== null && daysLeft <= 7 && subscription.status === "active" && (
              <div className="border-t border-warning/20 bg-warning/5 px-4 py-3">
                <p className="text-xs text-warning">A subscrição expira em {daysLeft} dias. Renova para não perder o acesso.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Histórico ── */}
      {history.length > 1 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-primary" />
            Histórico de pagamentos
          </h3>
          <div className="space-y-2">
            {history.map((sub, i) => {
              const { label, color, bg, icon } = statusInfo(sub.status);
              const isFirst = i === 0;
              return (
                <div
                  key={sub.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${isFirst ? "border-primary/20 bg-primary/5" : "border-border bg-surface-1"}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{fmt(sub.createdAt)}</span>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${bg} ${color}`}>
                        {icon} {label}
                      </span>
                      {isFirst && <span className="text-xs text-muted-foreground">(atual)</span>}
                    </div>
                    {sub.paymentReference && (
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">Ref: {sub.paymentReference}</p>
                    )}
                    {sub.expiresAt && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {sub.status === "expired" ? "Expirou" : "Expira"}: {fmt(sub.expiresAt)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-sm">{sub.amount.toLocaleString("pt-AO")} AOA</p>
                    {sub.hasReceipt && (
                      <button
                        className="mt-1 flex items-center gap-1 text-[10px] text-primary hover:underline disabled:opacity-50"
                        disabled={receiptLoading === sub.id}
                        onClick={() => viewReceipt(sub.id)}
                      >
                        <Download className="h-2.5 w-2.5" />
                        {receiptLoading === sub.id ? "…" : "comprovativo"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Info ── */}
      <div className="rounded-xl bg-surface-2 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground text-sm mb-2">Como funciona o pagamento</p>
        <p>1. Efetua uma transferência de <strong>5.000 AOA</strong> para a conta BFA indicada.</p>
        <p>2. Envia o comprovativo (foto ou PDF) no modal de pagamento.</p>
        <p>3. O admin confirma o pagamento e ativa o acesso por 30 dias.</p>
        <p>4. Podes renovar antes ou depois de expirar fazendo uma nova transferência.</p>
      </div>
    </div>
  );
}

function SubscriptionCard({
  subscription,
  isActive,
  onSubscribe,
}: {
  subscription: SubscriptionData | null;
  isActive: boolean;
  onSubscribe: () => void;
}) {
  const statusConfig = {
    active: {
      label: "Ativo",
      color: "text-bull",
      bg: "bg-bull/15",
      icon: <CheckCircle2 className="h-4 w-4 text-bull" />,
    },
    pending: {
      label: "Aguardando confirmação",
      color: "text-warning",
      bg: "bg-warning/15",
      icon: <Clock className="h-4 w-4 text-warning" />,
    },
    expired: {
      label: "Expirada",
      color: "text-bear",
      bg: "bg-bear/15",
      icon: <Crown className="h-4 w-4 text-bear" />,
    },
    rejected: {
      label: "Rejeitada",
      color: "text-bear",
      bg: "bg-bear/15",
      icon: <Crown className="h-4 w-4 text-bear" />,
    },
  };

  const status = subscription?.status ?? null;
  const cfg = status ? statusConfig[status as keyof typeof statusConfig] : null;

  const daysLeft = subscription?.expiresAt
    ? Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-surface-1 px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Crown className="h-4 w-4 text-amber-500" />
          Subscrição Premium
        </h3>
        {cfg && (
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
        )}
      </div>

      <div className="p-5">
        {isActive && subscription ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Aprovado em</p>
                <p className="font-medium">{subscription.approvedAt ? fmt(subscription.approvedAt) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expira em</p>
                <p className={`font-medium ${daysLeft !== null && daysLeft <= 7 ? "text-warning" : ""}`}>
                  {subscription.expiresAt ? fmt(subscription.expiresAt) : "—"}
                  {daysLeft !== null && ` (${daysLeft} dias)`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="font-medium">{subscription.amount.toLocaleString("pt-AO")} AOA</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ref. pagamento</p>
                <p className="font-mono text-xs">{subscription.paymentReference ?? "—"}</p>
              </div>
            </div>
            {daysLeft !== null && daysLeft <= 7 && (
              <div className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/10 px-3 py-2">
                <p className="text-xs text-warning">A subscrição expira em breve</p>
                <Button size="sm" variant="outline" onClick={onSubscribe} className="h-7 text-xs border-warning/50 text-warning">
                  Renovar
                </Button>
              </div>
            )}
          </div>
        ) : status === "pending" ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Pedido enviado em {subscription?.createdAt ? fmt(subscription.createdAt) : "—"}. A aguardar confirmação do administrador.
            </p>
            {subscription?.paymentReference && (
              <p className="text-xs text-muted-foreground">
                Referência: <span className="font-mono">{subscription.paymentReference}</span>
              </p>
            )}
            {!subscription?.paymentReference && (
              <Button size="sm" variant="outline" onClick={onSubscribe}>
                Adicionar referência de pagamento
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-sm text-muted-foreground max-w-sm">
              {status === "expired"
                ? "A tua subscrição expirou. Renova para continuar com acesso ao conteúdo Intermediário e Avançado."
                : status === "rejected"
                  ? `Pedido rejeitado${subscription?.notes ? `: ${subscription.notes}` : ""}. Faz um novo pedido.`
                  : "Subscreve por 5.000 AOA/mês para ter acesso aos níveis Intermediário e Avançado."}
            </p>
            <Button onClick={onSubscribe}>
              {status === "expired" || status === "rejected" ? "Renovar subscrição" : "Subscrever agora"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
