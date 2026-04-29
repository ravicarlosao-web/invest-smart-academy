import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore, calcEquity } from "@/store/useAppStore";
import { fmtUSD } from "@/lib/market";
import {
  Swords, Plus, Link2, Check, X, Copy, Trophy, Clock, Target,
  TrendingUp, AlertCircle, Users
} from "lucide-react";
import { toast } from "sonner";

function formatDeadline(ts: number) {
  const diff = ts - Date.now();
  if (diff <= 0) return "Expirado";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h restantes`;
  return `${hours}h restantes`;
}

function DuelProgress({
  currentEquity,
  startEquity,
  targetEquity,
}: {
  currentEquity: number;
  startEquity: number;
  targetEquity: number;
}) {
  const total = targetEquity - startEquity;
  const gained = currentEquity - startEquity;
  const pct = total > 0 ? Math.min(100, Math.max(0, (gained / total) * 100)) : 0;
  const isWinning = currentEquity >= startEquity;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">Progresso</span>
        <span className={`font-mono font-semibold ${isWinning ? "text-bull" : "text-bear"}`}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Início: {fmtUSD(startEquity)}</span>
        <span>Alvo: {fmtUSD(targetEquity)}</span>
      </div>
    </div>
  );
}

export default function Duelo() {
  const duelos       = useAppStore((s) => s.duelos);
  const sim          = useAppStore((s) => s.sim);
  const createDuelo  = useAppStore((s) => s.createDuelo);
  const acceptDuelo  = useAppStore((s) => s.acceptDuelo);
  const removeDuelo  = useAppStore((s) => s.removeDuelo);
  const addNotif     = useAppStore((s) => s.addNotification);

  const currentEquity = sim.cashBalance + sim.positions.reduce((s, p) => s + (p.entryPrice * p.size) / (p.leverage ?? 1), 0);

  const [tab, setTab] = useState<"active" | "create" | "join">("active");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    title: "",
    targetEquity: "12000",
    startBalance: "10000",
    maxDrawdownPct: "20",
    maxTrades: "30",
    days: "7",
  });
  const [creating, setCreating] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);

  // Join form state
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  function handleCreate() {
    const title = form.title.trim() || "Duelo de Trading";
    const targetEquity = Number(form.targetEquity);
    const startBalance = Number(form.startBalance);
    const maxDrawdownPct = Number(form.maxDrawdownPct);
    const maxTrades = Number(form.maxTrades);
    const days = Number(form.days);

    if (targetEquity <= startBalance) {
      toast.error("O alvo deve ser superior ao saldo inicial.");
      return;
    }
    if (days < 1 || days > 90) {
      toast.error("O prazo deve estar entre 1 e 90 dias.");
      return;
    }

    setCreating(true);
    const expiresAt = Date.now() + days * 86_400_000;
    const code = createDuelo({ title, targetEquity, startBalance, maxDrawdownPct, maxTrades, expiresAt });
    setLastCode(code);
    addNotif({
      type: "duelo",
      title: "⚔️ Duelo criado!",
      message: `"${title}" — partilha o código com os teus amigos`,
      link: "/duelo",
    });
    toast.success("Duelo criado! Partilha o código.");
    setCreating(false);
    setForm({ title: "", targetEquity: "12000", startBalance: "10000", maxDrawdownPct: "20", maxTrades: "30", days: "7" });
    setTab("active");
  }

  function handleJoin() {
    setJoinError("");
    const code = joinCode.trim();
    if (!code) { setJoinError("Introduz um código de duelo."); return; }
    const ok = acceptDuelo(code, currentEquity);
    if (!ok) {
      setJoinError("Código inválido. Verifica e tenta novamente.");
      return;
    }
    addNotif({
      type: "duelo",
      title: "⚔️ Entraste num Duelo!",
      message: "Segue o teu progresso no separador Activos.",
      link: "/duelo",
    });
    toast.success("Duelo aceite! Boa sorte.");
    setJoinCode("");
    setTab("active");
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const active = duelos.filter((d) => Date.now() < d.expiresAt);
  const expired = duelos.filter((d) => Date.now() >= d.expiresAt);

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Swords className="h-6 w-6 text-purple-400" />
            Duelos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cria desafios contra amigos ou entra num duelo com o código deles.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={tab === "create" ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setTab("create")}
          >
            <Plus className="h-4 w-4" /> Criar duelo
          </Button>
          <Button
            variant={tab === "join" ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setTab("join")}
          >
            <Link2 className="h-4 w-4" /> Entrar com código
          </Button>
        </div>
      </div>

      {/* ── Create tab ── */}
      {tab === "create" && (
        <Card className="mb-6 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4 text-primary" /> Novo Duelo
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Nome do duelo</Label>
              <Input
                placeholder="Ex: Quem chega a $12k primeiro"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Saldo inicial ($)</Label>
              <Input
                type="number"
                value={form.startBalance}
                onChange={(e) => setForm({ ...form, startBalance: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Alvo de capital ($)</Label>
              <Input
                type="number"
                value={form.targetEquity}
                onChange={(e) => setForm({ ...form, targetEquity: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Drawdown máximo (%)</Label>
              <Input
                type="number"
                value={form.maxDrawdownPct}
                onChange={(e) => setForm({ ...form, maxDrawdownPct: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Máx. trades</Label>
              <Input
                type="number"
                value={form.maxTrades}
                onChange={(e) => setForm({ ...form, maxTrades: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Prazo (dias)</Label>
              <Input
                type="number"
                value={form.days}
                onChange={(e) => setForm({ ...form, days: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              <Swords className="h-4 w-4" /> Criar e gerar código
            </Button>
            <Button variant="ghost" onClick={() => setTab("active")}>Cancelar</Button>
          </div>

          {lastCode && (
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="mb-2 text-xs font-semibold text-primary">Código do duelo</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded bg-surface-2 px-3 py-2 text-xs font-mono break-all">
                  {lastCode}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { navigator.clipboard.writeText(lastCode); setCopiedId("last"); setTimeout(() => setCopiedId(null), 2000); }}
                  className="shrink-0 gap-1"
                >
                  {copiedId === "last" ? <Check className="h-3.5 w-3.5 text-bull" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedId === "last" ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Envia este código a um amigo para ele entrar no duelo.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ── Join tab ── */}
      {tab === "join" && (
        <Card className="mb-6 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4 text-primary" /> Entrar num Duelo
          </h3>
          <div>
            <Label className="text-xs">Código do duelo</Label>
            <div className="mt-1 flex gap-2">
              <Input
                placeholder="Cola aqui o código que recebeste…"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value); setJoinError(""); }}
                className={joinError ? "border-destructive" : ""}
              />
              <Button onClick={handleJoin} className="shrink-0 gap-2">
                <Check className="h-4 w-4" /> Entrar
              </Button>
            </div>
            {joinError && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {joinError}
              </p>
            )}
          </div>
          <Button variant="ghost" className="mt-3" onClick={() => setTab("active")}>Cancelar</Button>
        </Card>
      )}

      {/* ── Active duelos ── */}
      <div className="space-y-4">
        {active.length === 0 && expired.length === 0 && (
          <Card className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
              <Users className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-semibold">Nenhum duelo activo</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cria um desafio ou entra num com o código de um amigo.
              </p>
            </div>
            <Button onClick={() => setTab("create")} className="gap-2">
              <Plus className="h-4 w-4" /> Criar primeiro duelo
            </Button>
          </Card>
        )}

        {active.map((d) => {
          const dPct = Math.min(100, Math.max(0, ((currentEquity - d.startEquity) / (d.targetEquity - d.startEquity)) * 100));
          const tradeCount = sim.history.length;
          const isWinning = currentEquity >= d.startEquity;
          return (
            <Card key={d.id} className="overflow-hidden">
              <div className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
                    <Swords className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{d.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDeadline(d.expiresAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" /> Alvo {fmtUSD(d.targetEquity)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {d.accepted && (
                    <Badge className={`text-xs ${isWinning ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>
                      {isWinning ? "Na frente" : "Atrás"}
                    </Badge>
                  )}
                  <button
                    onClick={() => copyCode(d.code, d.id)}
                    className="rounded-md p-1.5 hover:bg-surface-2 transition-colors"
                    title="Copiar código"
                  >
                    {copiedId === d.id ? (
                      <Check className="h-3.5 w-3.5 text-bull" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => removeDuelo(d.id)}
                    className="rounded-md p-1.5 hover:bg-surface-2 transition-colors"
                    title="Remover duelo"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="border-t border-border px-5 pb-4 pt-3">
                {d.accepted ? (
                  <>
                    <DuelProgress
                      currentEquity={currentEquity}
                      startEquity={d.startEquity}
                      targetEquity={d.targetEquity}
                    />
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-surface-1 px-2 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Capital</p>
                        <p className={`mt-0.5 font-mono text-sm font-bold ${isWinning ? "text-bull" : "text-bear"}`}>
                          {fmtUSD(currentEquity)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-1 px-2 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trades</p>
                        <p className="mt-0.5 font-mono text-sm font-bold">{tradeCount}/{d.maxTrades}</p>
                      </div>
                      <div className="rounded-lg bg-surface-1 px-2 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Max DD</p>
                        <p className="mt-0.5 font-mono text-sm font-bold">{d.maxDrawdownPct}%</p>
                      </div>
                    </div>
                    {currentEquity >= d.targetEquity && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-bull/10 px-4 py-2.5">
                        <Trophy className="h-4 w-4 text-bull" />
                        <p className="text-sm font-semibold text-bull">
                          Objectivo atingido! Parabéns 🎉
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Duelo criado por ti — aguarda que um amigo entre com o código.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => copyCode(d.code, d.id)}
                    >
                      {copiedId === d.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === d.id ? "Copiado!" : "Código"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {/* Expired */}
        {expired.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expirados</p>
            {expired.map((d) => (
              <Card key={d.id} className="mb-2 flex items-center justify-between px-5 py-3 opacity-50">
                <div className="flex items-center gap-3">
                  <Swords className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{d.title}</span>
                </div>
                <button onClick={() => removeDuelo(d.id)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
