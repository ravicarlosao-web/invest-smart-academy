import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEVELS } from "@/data/curriculum";
import { useAppStore } from "@/store/useAppStore";
import { Check, Lock, Sparkles, ChevronRight } from "lucide-react";

const difficultyLabel = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
} as const;

export default function Aprender() {
  const completed = useAppStore((s) => s.progress.completedLessons);

  // desbloqueio sequencial: nível desbloqueado se nível anterior 100% feito (nível 1 sempre liberado)
  const levelUnlocked = (idx: number): boolean => {
    if (idx === 0) return true;
    const prev = LEVELS[idx - 1];
    return prev.lessons.every((l) => completed.includes(l.id));
  };

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Trilha de aprendizado</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Avance pelos níveis na ordem. Cada aula libera a próxima e dá XP.
        </p>
      </div>

      <div className="space-y-4">
        {LEVELS.map((level, idx) => {
          const unlocked = levelUnlocked(idx);
          const doneCount = level.lessons.filter((l) => completed.includes(l.id)).length;
          const pct = Math.round((doneCount / level.lessons.length) * 100);

          return (
            <Card key={level.id} className={`overflow-hidden ${!unlocked ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between border-b border-border bg-surface-1 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary font-mono text-sm font-bold text-primary-foreground">
                    {level.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{level.title}</h3>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {difficultyLabel[level.difficulty]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{level.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{pct}%</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {doneCount}/{level.lessons.length}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-border">
                {level.lessons.map((lesson) => {
                  const isDone = completed.includes(lesson.id);
                  const lessonLocked = !unlocked;
                  return (
                    <LessonRow
                      key={lesson.id}
                      title={lesson.title}
                      summary={lesson.summary}
                      xp={lesson.xp}
                      done={isDone}
                      locked={lessonLocked}
                      to={`/aprender/${lesson.id}`}
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
  title, summary, xp, done, locked, to,
}: {
  title: string; summary: string; xp: number; done: boolean; locked: boolean; to: string;
}) {
  const content = (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-1">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            done ? "bg-bull/15 text-bull" : locked ? "bg-surface-2 text-muted-foreground" : "bg-primary/15 text-primary"
          }`}
        >
          {done ? <Check className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : <Sparkles className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{summary}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-mono text-xs font-semibold text-primary">+{xp} XP</span>
        {!locked && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    </div>
  );
  if (locked) return <div>{content}</div>;
  return <Link to={to}>{content}</Link>;
}
