import { useMemo, useState, useCallback, useEffect } from "react";
import { usePlanConfig } from "@/hooks/usePlanConfig";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LEVELS as LEVELS_STATIC, type LevelDef } from "@/data/curriculum";
import type { Question } from "@/data/curriculum";
import { api } from "@/lib/apiClient";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { ArrowLeft, Check, X, Trophy, ChevronRight, Lightbulb, BookOpen, Crown, Headphones, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { ChartMarkExercise, evaluateMarks, type MarkLine } from "@/components/ChartMarkExercise";

type Answer = number | boolean | MarkLine[];

type Phase = "content" | "quiz" | "result";

export default function Licao() {
  const { priceAoa } = usePlanConfig();
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const completeLesson = useAppStore((s) => s.completeLesson);
  const user = useAuthStore((s) => s.user);
  const { fetch: fetchSub, hasActiveSubscription } = useSubscriptionStore();
  const [levels, setLevels] = useState<LevelDef[]>(LEVELS_STATIC);

  useEffect(() => {
    if (user) fetchSub(user.id);
  }, [user, fetchSub]);

  useEffect(() => {
    api.content.curriculum()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setLevels(data as LevelDef[]); })
      .catch(() => {/* keep static fallback */});
  }, []);

  const found = useMemo(() => {
    for (const lvl of levels) {
      const ls = lvl.lessons.find((l) => l.id === lessonId);
      if (ls) return { level: lvl, lesson: ls };
    }
    return null;
  }, [levels, lessonId]);

  const [phase, setPhase] = useState<Phase>("content");
  const [contentIdx, setContentIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [audioOpen, setAudioOpen] = useState(false);
  const [selected, setSelected] = useState<Answer | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Reset all lesson state whenever lessonId changes or new lesson data arrives
  useEffect(() => {
    setPhase("content");
    setContentIdx(0);
    setQIdx(0);
    setAudioOpen(false);
    setSelected(null);
    setRevealed(false);
    setCorrectCount(0);
  }, [lessonId, found?.lesson.id]);

  if (!found) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Aula não encontrada.</p>
        <Button asChild variant="link"><Link to="/aprender">Voltar para trilha</Link></Button>
      </div>
    );
  }

  // Bloquear acesso direto a lições premium sem subscrição
  if (["intermediario", "avancado"].includes(found.level.difficulty) && !hasActiveSubscription()) {
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-md text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 mx-auto">
            <Crown className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold">Conteúdo Premium</h2>
          <p className="text-muted-foreground text-sm">
            Esta aula faz parte do nível <strong>{found.level.title}</strong> que requer uma subscrição ativa.
            Subscreve por {priceAoa.toLocaleString("pt-AO")} AOA/mês para ter acesso total.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/aprender">Voltar</Link>
            </Button>
            <Button asChild>
              <Link to="/perfil">Ver subscrição</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { level, lesson } = found;
  const totalSteps = lesson.content.length + lesson.questions.length;
  const currentStep = phase === "content" ? contentIdx : lesson.content.length + qIdx;
  const stepProgress = ((currentStep + (phase === "result" ? 1 : 0)) / totalSteps) * 100;

  const advanceContent = () => {
    if (contentIdx < lesson.content.length - 1) {
      setContentIdx(contentIdx + 1);
    } else if (lesson.questions.length > 0) {
      setPhase("quiz");
    } else {
      // No questions — complete lesson directly
      completeLesson(lesson.id, lesson.xp, 100);
      toast.success(`+${lesson.xp} XP`, { description: "Aula concluída!" });
      setPhase("result");
    }
  };

  const submitAnswer = () => {
    const q = lesson.questions[qIdx];
    if (selected === null) return;
    setRevealed(true);
    if (isCorrect(q, selected)) setCorrectCount((c) => c + 1);
  };

  const nextQuestion = () => {
    if (qIdx < lesson.questions.length - 1) {
      setQIdx(qIdx + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      // Resultado
      const finalCorrect = correctCount; // já incluído
      const scorePct = Math.round((finalCorrect / lesson.questions.length) * 100);
      const earnedXp = scorePct >= 50 ? lesson.xp : Math.round(lesson.xp * 0.4);
      completeLesson(lesson.id, earnedXp, scorePct);
      toast.success(`+${earnedXp} XP`, { description: `Aula concluída com ${scorePct}% de acerto.` });
      setPhase("result");
    }
  };

  return (
    <div className="container max-w-3xl py-6 lg:py-8">
      {/* topo */}
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link to="/aprender"><ArrowLeft className="mr-1.5 h-4 w-4" />Trilha</Link>
        </Button>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nível {level.id} · {level.title}
          </p>
          <p className="text-sm font-semibold">{lesson.title}</p>
        </div>
      </div>

      <Progress value={stepProgress} className="mb-6 h-1.5" />

      {/* Audio player card — only when admin has enabled audio for this lesson */}
      {lesson.audioUrl && lesson.audioEnabled && (
        <Card className="mb-4 overflow-hidden border-primary/20 bg-primary/5">
          <button
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/10"
            onClick={() => setAudioOpen((o) => !o)}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Headphones className="h-4 w-4 text-primary" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Áudio da lição</p>
              <p className="text-xs text-muted-foreground">
                {audioOpen ? "Clica para fechar o player" : "Ouve enquanto lês o conteúdo"}
              </p>
            </div>
            <Volume2 className={`h-4 w-4 transition-colors ${audioOpen ? "text-primary" : "text-muted-foreground"}`} />
          </button>
          {audioOpen && (
            <div className="border-t border-primary/10 px-4 py-3">
              <audio
                src={lesson.audioUrl}
                controls
                className="w-full"
                style={{ height: 40 }}
              />
            </div>
          )}
        </Card>
      )}

      {phase === "content" && lesson.content[contentIdx] && (
        <ContentStep
          item={lesson.content[contentIdx]}
          stepLabel={`${contentIdx + 1}/${lesson.content.length}`}
          onNext={advanceContent}
          isLast={contentIdx === lesson.content.length - 1}
        />
      )}

      {phase === "quiz" && lesson.questions[qIdx] && (
        <QuizStep
          question={lesson.questions[qIdx]}
          stepLabel={`Pergunta ${qIdx + 1}/${lesson.questions.length}`}
          selected={selected}
          revealed={revealed}
          onSelect={setSelected}
          onSubmit={submitAnswer}
          onNext={nextQuestion}
          isLast={qIdx === lesson.questions.length - 1}
        />
      )}

      {phase === "result" && (
        <ResultStep
          xp={lesson.xp}
          correct={correctCount}
          total={lesson.questions.length}
          onContinue={() => navigate("/aprender")}
          onSimulate={() => navigate("/simular")}
        />
      )}
    </div>
  );
}

function isCorrect(q: Question, ans: Answer): boolean {
  if (q.type === "multiple") return ans === q.correctIndex;
  if (q.type === "truefalse") return ans === q.correct;
  if (q.type === "markChart") {
    if (!Array.isArray(ans)) return false;
    const tol = (q.tolerancePct / 100) * computePriceRange(q.candles);
    return evaluateMarks(ans as MarkLine[], q.supports, q.resistances, tol).correct;
  }
  return false;
}

function computePriceRange(candles: { l: number; h: number }[]) {
  let lo = Infinity, hi = -Infinity;
  for (const c of candles) {
    if (c.l < lo) lo = c.l;
    if (c.h > hi) hi = c.h;
  }
  // mesmo padding usado no componente (8% top/bottom)
  const pad = (hi - lo) * 0.08;
  return (hi + pad) - (lo - pad);
}

function ContentStep({
  item, stepLabel, onNext, isLast,
}: {
  item: ReturnType<typeof Object.assign> & any;
  stepLabel: string;
  onNext: () => void;
  isLast: boolean;
}) {
  const Icon = item.type === "tip" ? Lightbulb : BookOpen;
  const tone = item.type === "tip" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary";

  return (
    <Card className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {stepLabel}
        </span>
      </div>
      {item.title && <h2 className="mb-3 text-lg sm:text-xl font-bold leading-snug">{item.title}</h2>}
      <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/90">{item.body}</p>

      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} size="lg">
          {isLast ? "Ir para quiz" : "Continuar"}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function QuizStep({
  question, stepLabel, selected, revealed, onSelect, onSubmit, onNext, isLast,
}: {
  question: Question;
  stepLabel: string;
  selected: Answer | null;
  revealed: boolean;
  onSelect: (v: Answer) => void;
  onSubmit: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const correct = selected !== null && isCorrect(question, selected);
  const canSubmit =
    selected !== null &&
    (question.type !== "markChart" || (Array.isArray(selected) && selected.length > 0));

  // estável p/ evitar setState em loop dentro do ChartMarkExercise
  const handleMarkChange = useCallback((lines: MarkLine[]) => {
    onSelect(lines);
  }, [onSelect]);

  return (
    <Card className="p-4 sm:p-6 lg:p-8">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
        {stepLabel}
      </p>
      <h2 className="mb-5 text-base sm:text-lg font-semibold leading-snug">{question.prompt}</h2>

      {question.type === "multiple" && (
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const isSel = selected === i;
            const isRight = revealed && i === question.correctIndex;
            const isWrong = revealed && isSel && i !== question.correctIndex;
            return (
              <button
                key={i}
                disabled={revealed}
                onClick={() => onSelect(i)}
                className={`flex w-full items-center justify-between rounded-lg border p-4 text-left text-sm transition-all
                  ${isRight ? "border-bull bg-bull/10 text-foreground" :
                    isWrong ? "border-bear bg-bear/10 text-foreground" :
                    isSel ? "border-primary bg-primary/10" :
                    "border-border bg-surface-1 hover:border-primary/40 hover:bg-surface-2"}`}
              >
                <span>{opt}</span>
                {isRight && <Check className="h-4 w-4 text-bull" />}
                {isWrong && <X className="h-4 w-4 text-bear" />}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "truefalse" && (
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map((v) => {
            const isSel = selected === v;
            const isRight = revealed && v === question.correct;
            const isWrong = revealed && isSel && v !== question.correct;
            return (
              <button
                key={String(v)}
                disabled={revealed}
                onClick={() => onSelect(v)}
                className={`rounded-lg border p-5 text-center text-sm font-semibold transition-all
                  ${isRight ? "border-bull bg-bull/10" :
                    isWrong ? "border-bear bg-bear/10" :
                    isSel ? "border-primary bg-primary/10" :
                    "border-border bg-surface-1 hover:border-primary/40"}`}
              >
                {v ? "Verdadeiro" : "Falso"}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "markChart" && (
        <ChartMarkExercise
          candles={question.candles}
          supports={question.supports}
          resistances={question.resistances}
          tolerancePct={question.tolerancePct}
          revealed={revealed}
          onChange={handleMarkChange}
        />
      )}

      {revealed && (
        <div className={`mt-4 rounded-lg border p-4 ${correct ? "border-bull/30 bg-bull/5" : "border-bear/30 bg-bear/5"}`}>
          <p className={`mb-1 text-xs font-bold uppercase tracking-wider ${correct ? "text-bull" : "text-bear"}`}>
            {correct ? "Correto!" : "Resposta incorreta"}
          </p>
          <p className="text-sm text-foreground/90">{question.explanation}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        {!revealed ? (
          <Button size="lg" disabled={!canSubmit} onClick={onSubmit}>
            Confirmar
          </Button>
        ) : (
          <Button size="lg" onClick={onNext}>
            {isLast ? "Ver resultado" : "Próxima"}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

function ResultStep({
  xp, correct, total, onContinue, onSimulate,
}: {
  xp: number; correct: number; total: number; onContinue: () => void; onSimulate: () => void;
}) {
  const pct = Math.round((correct / total) * 100);
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
        <Trophy className="h-8 w-8 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-bold">Aula concluída!</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Você acertou {correct} de {total} perguntas ({pct}%).
      </p>
      <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
        <Trophy className="h-4 w-4" />
        <span className="font-mono text-sm font-bold">+{pct >= 50 ? xp : Math.round(xp * 0.4)} XP</span>
      </div>
      <div className="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
        <Button onClick={onContinue} size="lg" variant="outline">
          Voltar para trilha
        </Button>
        <Button onClick={onSimulate} size="lg" className="bg-gradient-primary">
          Praticar no simulador
        </Button>
      </div>
    </Card>
  );
}
