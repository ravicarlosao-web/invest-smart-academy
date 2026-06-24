import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEVELS as LEVELS_STATIC, type LevelDef } from "@/data/curriculum";
import { api } from "@/lib/apiClient";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { PlanWall } from "@/components/PlanWall";
import { Check, Lock, Sparkles, ChevronRight, BookMarked, RotateCcw, Crown, Clock } from "lucide-react";

const difficultyLabel = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
} as const;

const EMPTY: string[] = [];

export default function Aprender() {
  const completed   = useAppStore((s) => s.progress.completedLessons);
  const reviewQueue = useAppStore((s) => s.progress.reviewQueue ?? EMPTY);
  const removeFromReview = useAppStore((s) => s.removeFromReview);
  const user = useAuthStore((s) => s.user);
  const { subscription, fetch: fetchSub, hasActiveSubscription } = useSubscriptionStore();

  const [levels, setLevels] = useState<LevelDef[]>(LEVELS_STATIC);
  const [showPlanWall, setShowPlanWall] = useState(false);

  useEffect(() => {
    if (user) fetchSub(user.id);
  }, [user, fetchSub]);

  useEffect(() => {
    api.content.curriculum()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setLevels(data as LevelDef[]); })
      .catch(() => {/* keep static fallback */});
  }, []);

  const isSubscribed = hasActiveSubscription();

  // Bloqueio sequencial
  const levelUnlocked = (idx: number): boolean => {
    if (idx === 0) return true;
    const prev = levels[idx - 1];
    return prev.lessons.every((l) => completed.includes(l.id));
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
          <Button size="sm" variant="outline" onClick={() => setShowPlanWall(true)}>
            Renovar
          </Button>
        </div>
      )}

      {/* ── Modal de planos ── */}
      {showPlanWall && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl">
            <PlanWall onClose={() => setShowPlanWall(false)} />
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
          // accessible === false → plano não permite este nível
          const levelPlanAccessible = (level as any).accessible !== false;
          const needsPayment = !levelPlanAccessible && !isSubscribed;
          const notInPlan    = !levelPlanAccessible && isSubscribed;
          const doneCount = level.lessons.filter((l) => completed.includes(l.id)).length;
          const pct = Math.round((doneCount / level.lessons.length) * 100);

          return (
            <Card
              key={level.id}
              className={`overflow-hidden ${(!sequentialUnlocked && !needsPayment && !notInPlan) ? "opacity-60" : ""}`}
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
                        className={`text-[10px] uppercase ${needsPayment ? "border-amber-500/50 text-amber-500" : notInPlan ? "border-muted-foreground/30 text-muted-foreground" : ""}`}
                      >
                        {needsPayment ? "Plano Premium" : notInPlan ? "Não incluído" : difficultyLabel[level.difficulty as keyof typeof difficultyLabel]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{level.subtitle}</p>
                  </div>
                </div>

                {needsPayment ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 shrink-0"
                    onClick={() => setShowPlanWall(true)}
                  >
                    Ver Planos
                  </Button>
                ) : notInPlan ? (
                  <p className="text-xs text-muted-foreground text-right shrink-0">Não incluído<br />no teu plano</p>
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
                  const isDone = completed.includes(lesson.id);
                  const isLocked = !sequentialUnlocked;
                  // accessible === false → plano não inclui esta lição
                  const lessonPlanAccessible = (lesson as any).accessible !== false;
                  const lessonNeedsPayment = !lessonPlanAccessible && !isSubscribed;
                  const lessonNotInPlan    = !lessonPlanAccessible && isSubscribed;
                  return (
                    <LessonRow
                      key={lesson.id}
                      title={lesson.title}
                      summary={lesson.summary}
                      xp={lesson.xp}
                      done={isDone}
                      locked={isLocked}
                      needsPayment={lessonNeedsPayment}
                      notInPlan={lessonNotInPlan}
                      to={`/aprender/${lesson.id}`}
                      onPaywall={() => setShowPlanWall(true)}
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
  title, summary, xp, done, locked, needsPayment, notInPlan, to, onPaywall,
}: {
  title: string; summary: string; xp: number; done: boolean; locked: boolean;
  needsPayment: boolean; notInPlan: boolean; to: string; onPaywall: () => void;
}) {
  const content = (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-1">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            done          ? "bg-bull/15 text-bull"
            : locked      ? "bg-surface-2 text-muted-foreground"
            : needsPayment ? "bg-amber-500/15 text-amber-500"
            : notInPlan   ? "bg-surface-2 text-muted-foreground"
            : "bg-primary/15 text-primary"
          }`}
        >
          {done          ? <Check className="h-4 w-4" />
           : locked      ? <Lock className="h-3.5 w-3.5" />
           : needsPayment ? <Crown className="h-3.5 w-3.5" />
           : notInPlan   ? <Lock className="h-3.5 w-3.5" />
           : <Sparkles className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className={`truncate text-sm font-medium ${(needsPayment || notInPlan) ? "text-muted-foreground" : ""}`}>{title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {notInPlan ? "Não incluído no teu plano" : summary}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={`font-mono text-xs font-semibold ${needsPayment ? "text-amber-500/60" : notInPlan ? "text-muted-foreground/40" : "text-primary"}`}>+{xp} XP</span>
        {!locked && !needsPayment && !notInPlan && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        {(needsPayment || notInPlan) && <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />}
      </div>
    </div>
  );

  if (locked || notInPlan) return <div>{content}</div>;
  if (needsPayment) return <button type="button" className="w-full text-left" onClick={onPaywall}>{content}</button>;
  return <Link to={to}>{content}</Link>;
}
