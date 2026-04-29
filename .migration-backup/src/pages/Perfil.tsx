import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { LEVELS, TOTAL_LESSONS } from "@/data/curriculum";
import { fmtUSD } from "@/lib/market";
import { Trophy, Flame, Target, BookCheck, TrendingUp, Award, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const ACHIEVEMENTS = [
  { id: "first-lesson", title: "Primeira aula", desc: "Conclua sua primeira lição.", icon: BookCheck },
  { id: "five-lessons", title: "Estudante dedicado", desc: "Conclua 5 aulas.", icon: Award },
  { id: "xp-200", title: "200 XP", desc: "Acumule 200 pontos de experiência.", icon: Trophy },
  { id: "streak-3", title: "3 dias de sequência", desc: "Estude 3 dias seguidos.", icon: Flame },
];

export default function Perfil() {
  const progress = useAppStore((s) => s.progress);
  const sim = useAppStore((s) => s.sim);
  const resetProgress = useAppStore((s) => s.resetProgress);
  const resetSim = useAppStore((s) => s.resetSim);

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

  return (
    <div className="container max-w-5xl py-6 lg:py-8">
      {/* Cabeçalho */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-surface p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-glow">
                T
              </div>
              <div>
                <h2 className="text-xl font-bold">Trader</h2>
                <p className="text-xs text-muted-foreground">Conta demo · Iniciante</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                    <Trophy className="mr-1 h-3 w-3" />{progress.xp} XP
                  </Badge>
                  <Badge className="bg-warning/15 text-warning hover:bg-warning/20">
                    <Flame className="mr-1 h-3 w-3" />{progress.streakDays} dias
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso da trilha</span>
              <span className="font-mono font-semibold">{progress.completedLessons.length}/{TOTAL_LESSONS}</span>
            </div>
            <Progress value={completedPct} className="h-2" />
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <BookCheck className="h-4 w-4 text-primary" />Aprendizado
          </h3>
          <Row label="Aulas concluídas" value={`${progress.completedLessons.length} / ${TOTAL_LESSONS}`} />
          <Row label="Média nos quizzes" value={`${avgQuiz.toFixed(0)}%`} />
          <Row label="XP total" value={`${progress.xp}`} />
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

      {/* Conquistas */}
      <Card className="mt-6 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Award className="h-4 w-4 text-primary" />Conquistas
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = progress.achievements.includes(a.id);
            return (
              <div
                key={a.id}
                className={`rounded-lg border p-3 transition-all ${
                  unlocked ? "border-primary/40 bg-primary/5" : "border-border bg-surface-1 opacity-60"
                }`}
              >
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-md ${unlocked ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground"}`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Reset */}
      <Card className="mt-6 p-5">
        <h3 className="mb-1 text-sm font-semibold">Zona de reset</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Reinicie sua conta demo ou seu progresso de aprendizado. Esta ação não pode ser desfeita.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { resetSim(); toast.info("Conta demo reiniciada para $10.000."); }}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reiniciar conta demo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { resetProgress(); toast.info("Progresso de aprendizado resetado."); }}
          >
            <Target className="mr-1.5 h-3.5 w-3.5" />Resetar progresso
          </Button>
        </div>
      </Card>
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
