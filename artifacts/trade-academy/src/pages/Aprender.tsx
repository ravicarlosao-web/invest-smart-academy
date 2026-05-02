import { useEffect, useState } from "react";
import { usePlanConfig } from "@/hooks/usePlanConfig";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEVELS as LEVELS_STATIC, type LevelDef } from "@/data/curriculum";
import { api } from "@/lib/apiClient";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { PaymentWall } from "@/components/PaymentWall";
import { Check, Lock, Sparkles, ChevronRight, BookMarked, RotateCcw, Crown, Clock } from "lucide-react";

const difficultyLabel = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
} as const;

/** Níveis que requerem subscrição paga */
const PREMIUM_DIFFICULTIES: string[] = ["intermediario", "avancado"];

const EMPTY: string[] = [];

export default function Aprender() {
  const { priceAoa } = usePlanConfig();
  const completed   = useAppStore((s) => s.progress.completedLessons);
  const reviewQueue = useAppStore((s) => s.progress.reviewQueue ?? EMPTY);
  const removeFromReview = useAppStore((s) => s.removeFromReview);
  const user = useAuthStore((s) => s.user);
  const { subscription, fetch: fetchSub, hasActiveSubscription } = useSubscriptionStore();

  const [levels, setLevels] = useState<LevelDef[]>(LEVELS_STATIC);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (user) fetchSub(user.id);
  }, [user, fetchSub]);

  useEffect(() => {
    api.content.curriculum()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setLevels(data as LevelDef[]); })
      .catch(() => {/* keep static fallback */});
  }, []);

  const isSubscribed = hasActiveSubscription();

  // Verifica se um nível precisa de subscrição
  const isPremiumLevel = (difficulty: string) => PREMIUM_DIFFICULTIES.includes(difficulty);

  // Bloqueio sequencial (só se aplica a níveis gratuitos)
  const levelUnlocked = (idx: number): boolean => {
    if (idx === 0) return true;
    const prev = levels[idx - 1];
    return prev.lessons.every((l) => completed.includes(l.id));
  };

  // Nível premium: sempre mostra paywall se sem subscrição (independente do progresso sequencial)
  // Nível gratuito: aplica bloqueio sequencial
  const levelAccessible = (idx: number): boolean => {
    if (isPremiumLevel(levels[idx].difficulty)) {
      return isSubscribed && levelUnlocked(idx);
    }
    return levelUnlocked(idx);
  };

  // Review lessons
  const reviewLessons = reviewQueue
    .map((id) => {
      for (const lvl of levels) {
        const ls = lvl.lessons.find((l) => l.id === id);
        if (ls) return { lesson: ls, level: lvl };
      }
      return null;
    })
    .filter(Boolean) as { lesson: LevelDef["lessons"][0]; level: LevelDef }[];

  // Estado da subscrição para banner
  const subBanner = (() => {
    if (!subscription) return null;
    if (subscription.status === "pending") return "pending";
    if (subscription.status === "active") {
      if (subscription.expiresAt && subscription.expiresAt - Date.now() < 7 * 24 * 60 * 60 * 1000)
        return "expiring_soon";
      return null;
    }
    return null;
  })();

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Trilha de aprendizado</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Avance pelos níveis na ordem. Cada aula libera a próxima e dá XP.
        </p>
      </div>

      {/* ── Banner de subscrição pendente ── */}
      {subBanner === "pending" && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
          <Clock className="h-4 w-4 shrink-0 text-warning" />
          <p className="text-sm text-warning">
            O teu pedido de subscrição está a ser verificado. O acesso será ativado assim que o pagamento for confirmado.
          </p>
        </div>
      )}

      {/* ── Banner de subscrição a expirar ── */}
      {subBanner === "expiring_soon" && subscription?.expiresAt && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <Crown className="h-4 w-4 shrink-0 text-warning" />
            <p className="text-sm text-warning">
              A tua subscrição expira em {Math.ceil((subscription.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))} dias.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowPaywall(true)}>
            Renovar
          </Button>
        </div>
      )}

      {/* ── Modal de pagamento ── */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl">
            <PaymentWall onClose={() => setShowPaywall(false)} />
          </div>
        </div>
      )}

      {/* ── Review Queue ── */}
      {reviewLessons.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookMarked className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold text-warning">Para Revisar ({reviewLessons.length})</h3>
          </div>
          <Card className="overflow-hidden border-warning/30">
            <div className="divide-y divide-border">
              {reviewLessons.map(({ lesson, level }) => (
                <div key={lesson.id} className="flex items-center justify-between gap-3 px-5 py-3.5 bg-warning/5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{lesson.title}</p>
                      <p className="truncate text-xs text-muted-foreground">N{level.id} · {level.title}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      to={`/aprender/${lesson.id}`}
                      className="rounded-md bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning hover:bg-warning/25 transition-colors"
                    >
                      Rever
                    </Link>
                    <button
                      onClick={() => removeFromReview(lesson.id)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      title="Remover da lista de revisão"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        {levels.map((level, idx) => {
          const sequentialUnlocked = levelUnlocked(idx);
          const accessible = levelAccessible(idx);
          // Premium levels always show paywall (even if sequentially locked)
          const needsPayment = isPremiumLevel(level.difficulty) && !isSubscribed;
          const doneCount = level.lessons.filter((l) => completed.includes(l.id)).length;
          const pct = Math.round((doneCount / level.lessons.length) * 100);

          return (
            <Card
              key={level.id}
              className={`overflow-hidden ${(!sequentialUnlocked && !needsPayment) ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between border-b border-border bg-surface-1 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-mono text-sm font-bold text-primary-foreground ${needsPayment ? "bg-gradient-to-br from-yellow-500 to-amber-600" : "bg-gradient-primary"}`}>
                    {needsPayment ? <Crown className="h-5 w-5" /> : level.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{level.title}</h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase ${needsPayment ? "border-amber-500/50 text-amber-500" : ""}`}
                      >
                        {needsPayment ? "Premium" : difficultyLabel[level.difficulty]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{level.subtitle}</p>
                  </div>
                </div>

                {needsPayment ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                    onClick={() => setShowPaywall(true)}
                  >
                    Subscrever — {priceAoa.toLocaleString("pt-AO")} AOA/mês
                  </Button>
                ) : (
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">{pct}%</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {doneCount}/{level.lessons.length}
                    </p>
                  </div>
                )}
              </div>

              <div className="divide-y divide-border">
                {level.lessons.map((lesson) => {
                  const isDone    = completed.includes(lesson.id);
                  const isLocked  = !accessible;
                  const isPremium = needsPayment;
                  return (
                    <LessonRow
                      key={lesson.id}
                      title={lesson.title}
                      summary={lesson.summary}
                      xp={lesson.xp}
                      done={isDone}
                      locked={isLocked}
                      premium={isPremium}
                      to={`/aprender/${lesson.id}`}
                      onPaywall={() => setShowPaywall(true)}
                    />
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function LessonRow({
  title, summary, xp, done, locked, premium, to, onPaywall,
}: {
  title: string; summary: string; xp: number; done: boolean; locked: boolean;
  premium: boolean; to: string; onPaywall: () => void;
}) {
  const content = (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-1">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            done    ? "bg-bull/15 text-bull"
            : locked ? "bg-surface-2 text-muted-foreground"
            : premium ? "bg-amber-500/15 text-amber-500"
            : "bg-primary/15 text-primary"
          }`}
        >
          {done    ? <Check className="h-4 w-4" />
           : locked  ? <Lock className="h-3.5 w-3.5" />
           : premium ? <Crown className="h-3.5 w-3.5" />
           : <Sparkles className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className={`truncate text-sm font-medium ${premium ? "text-muted-foreground" : ""}`}>{title}</p>
          <p className="truncate text-xs text-muted-foreground">{summary}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={`font-mono text-xs font-semibold ${premium ? "text-amber-500/60" : "text-primary"}`}>+{xp} XP</span>
        {!locked && !premium && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        {premium && <Lock className="h-3.5 w-3.5 text-amber-500/60" />}
      </div>
    </div>
  );

  if (locked) return <div>{content}</div>;
  if (premium) return <button className="w-full text-left" onClick={onPaywall}>{content}</button>;
  return <Link to={to}>{content}</Link>;
}
