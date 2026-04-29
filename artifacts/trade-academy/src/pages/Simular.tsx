import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PriceChart } from "@/components/PriceChart";
import {
  useAppStore,
  calcUnrealizedPnL,
  positionMargin,
  calcEquity,
  calcProfitFactor,
  calcMaxDrawdown,
  calcSharpe,
  CHALLENGES,
} from "@/store/useAppStore";
import {
  SYMBOLS, SYMBOL_MAP, TIMEFRAMES, CATEGORIES, seedCandles, nextCandle, fmtPrice, fmtUSD,
  type Candle,
} from "@/lib/market";
import { ArrowDown, ArrowUp, RotateCcw, X, Settings2, Target, Trophy, BookOpen, TrendingUp, Clock, CheckCircle2, XCircle, AlertTriangle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { TradeShareModal } from "@/components/TradeShareModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

/* ============================================================
   PÁGINA PRINCIPAL
============================================================ */

export default function Simular() {
  const [symbol, setSymbol] = useState<string>("BTC/USD");
  const [tfIdx, setTfIdx] = useState(0);
  const meta = SYMBOL_MAP[symbol];
  const tf = TIMEFRAMES[tfIdx];

  const [showRsi, setShowRsi] = useState(false);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [showMacd, setShowMacd] = useState(false);
  const [macdFast, setMacdFast] = useState(12);
  const [macdSlow, setMacdSlow] = useState(26);
  const [macdSignal, setMacdSignal] = useState(9);

  const [candlesBySymbol, setCandlesBySymbol] = useState<Record<string, Candle[]>>(() => {
    const out: Record<string, Candle[]> = {};
    for (const s of SYMBOLS) out[s.symbol] = seedCandles(s, 200, 60);
    return out;
  });

  useEffect(() => {
    setCandlesBySymbol((prev) => ({
      ...prev,
      [symbol]: seedCandles(meta, 200, tf.seconds),
    }));
  }, [symbol, tf.seconds, meta]);

  const evaluateStops = useAppStore((s) => s.evaluateStops);
  const evaluatePendingOrders = useAppStore((s) => s.evaluatePendingOrders);
  const recordEquity = useAppStore((s) => s.recordEquity);

  const tickRef = useRef<number | null>(null);
  useEffect(() => {
    tickRef.current = window.setInterval(() => {
      setCandlesBySymbol((prev) => {
        const out = { ...prev };
        const newPrices: Record<string, number> = {};
        for (const s of SYMBOLS) {
          const arr = out[s.symbol];
          if (!arr || arr.length === 0) continue;
          const next = nextCandle(s, arr[arr.length - 1], tf.seconds);
          out[s.symbol] = [...arr.slice(-499), next];
          newPrices[s.symbol] = next.close;
          evaluateStops(s.symbol, next.close);
          evaluatePendingOrders(s.symbol, next.close);
        }
        recordEquity(newPrices);
        return out;
      });
    }, 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [tf.seconds, evaluateStops, evaluatePendingOrders, recordEquity]);

  const candles = candlesBySymbol[symbol] ?? [];
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const lastPrice = last?.close ?? meta.basePrice;
  const change = last && prev ? last.close - prev.close : 0;
  const changePct = last && prev ? (change / prev.close) * 100 : 0;

  const priceMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of SYMBOLS) {
      const arr = candlesBySymbol[s.symbol];
      m[s.symbol] = arr?.[arr.length - 1]?.close ?? s.basePrice;
    }
    return m;
  }, [candlesBySymbol]);

  const cash = useAppStore((s) => s.sim.cashBalance);
  const positions = useAppStore((s) => s.sim.positions);
  const pendingOrders = useAppStore((s) => s.sim.pendingOrders);
  const history = useAppStore((s) => s.sim.history);
  const equityHistory = useAppStore((s) => s.sim.equityHistory);
  const challenges = useAppStore((s) => s.sim.challenges);
  const openPosition = useAppStore((s) => s.openPosition);
  const closePosition = useAppStore((s) => s.closePosition);
  const placePendingOrder = useAppStore((s) => s.placePendingOrder);
  const cancelPendingOrder = useAppStore((s) => s.cancelPendingOrder);
  const startChallenge = useAppStore((s) => s.startChallenge);
  const resetSim = useAppStore((s) => s.resetSim);

  const upnl = calcUnrealizedPnL(positions, priceMap);
  const usedMargin = positions.reduce((sum, p) => sum + positionMargin(p), 0);
  const exposure = positions.reduce((sum, p) => sum + p.entryPrice * p.size, 0);
  const equityVal = cash + usedMargin + upnl;

  return (
    <div className="container max-w-[1400px] py-4 lg:py-6 space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="rounded-md border border-border bg-surface-1 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {CATEGORIES.map((cat) => (
              <optgroup key={cat} label={cat}>
                {SYMBOLS.filter((s) => s.category === cat).map((s) => (
                  <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold">{fmtPrice(lastPrice, meta.precision)}</span>
            <span className={`stat-pill ${change >= 0 ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>
              {change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
            </span>
            <span className="hidden sm:inline pulse-dot ml-1 h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-right">
          <Stat label="Saldo" value={fmtUSD(cash)} />
          <Stat label="Margem usada" value={fmtUSD(usedMargin)} />
          <Stat label="P&L aberto" value={fmtUSD(upnl)} accent={upnl >= 0 ? "bull" : "bear"} />
          <Stat label="Patrimônio" value={fmtUSD(equityVal)} highlight />
        </div>
      </div>

      {/* Desafios ativos */}
      <ActiveChallengeBanner challenges={challenges} equityVal={equityVal} historyCount={history.length} />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Coluna principal */}
        <div className="space-y-4">
          {/* Gráfico */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-1 px-3 py-2">
              <div className="flex gap-1">
                {TIMEFRAMES.map((t, i) => (
                  <button
                    key={t.label}
                    onClick={() => setTfIdx(i)}
                    className={`rounded px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors ${
                      i === tfIdx ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-2"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">MM 20</Badge>
                <button
                  onClick={() => setShowRsi((v) => !v)}
                  className={`rounded px-2 py-1 font-mono text-[10px] font-semibold transition-colors ${showRsi ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2"}`}
                >RSI</button>
                <button
                  onClick={() => setShowMacd((v) => !v)}
                  className={`rounded px-2 py-1 font-mono text-[10px] font-semibold transition-colors ${showMacd ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2"}`}
                >MACD</button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                      <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase tracking-wider">RSI</Label>
                        <Switch checked={showRsi} onCheckedChange={setShowRsi} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-[11px] text-muted-foreground">Período</Label>
                        <Input type="number" min={2} max={100} value={rsiPeriod}
                          onChange={(e) => setRsiPeriod(Math.max(2, Math.min(100, parseInt(e.target.value) || 14)))}
                          className="h-8 w-20 font-mono" />
                      </div>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="mb-2 flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase tracking-wider">MACD</Label>
                        <Switch checked={showMacd} onCheckedChange={setShowMacd} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-[11px] text-muted-foreground">Rápida</Label>
                          <Input type="number" min={2} max={100} value={macdFast}
                            onChange={(e) => setMacdFast(Math.max(2, Math.min(100, parseInt(e.target.value) || 12)))}
                            className="h-8 w-20 font-mono" />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-[11px] text-muted-foreground">Lenta</Label>
                          <Input type="number" min={3} max={200} value={macdSlow}
                            onChange={(e) => setMacdSlow(Math.max(3, Math.min(200, parseInt(e.target.value) || 26)))}
                            className="h-8 w-20 font-mono" />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-[11px] text-muted-foreground">Sinal</Label>
                          <Input type="number" min={2} max={50} value={macdSignal}
                            onChange={(e) => setMacdSignal(Math.max(2, Math.min(50, parseInt(e.target.value) || 9)))}
                            className="h-8 w-20 font-mono" />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="w-full" style={{ height: showRsi && showMacd ? 720 : showRsi || showMacd ? 620 : 500 }}>
              <PriceChart
                candles={candles}
                precision={meta.precision}
                movingAverage={20}
                showRsi={showRsi}
                rsiPeriod={rsiPeriod}
                showMacd={showMacd}
                macdFast={macdFast}
                macdSlow={macdSlow}
                macdSignal={macdSignal}
                className="h-full w-full"
              />
            </div>
          </Card>

          {/* Tabelas de posições / analytics */}
          <Card>
            <Tabs defaultValue="open">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 overflow-x-auto">
                {[
                  ["open", `Abertas (${positions.length})`],
                  ["pending", `Pendentes (${pendingOrders.length})`],
                  ["history", `Histórico (${history.length})`],
                  ["analytics", "Analytics"],
                  ["challenges", "Desafios"],
                ].map(([val, label]) => (
                  <TabsTrigger
                    key={val}
                    value={val}
                    className="whitespace-nowrap rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="open" className="mt-0 p-0">
                <PositionsTable positions={positions} priceMap={priceMap}
                  onClose={(id) => {
                    const pos = positions.find((p) => p.id === id);
                    if (!pos) return;
                    closePosition(id, priceMap[pos.symbol] ?? pos.entryPrice, "manual");
                    toast.success("Posição fechada");
                  }}
                />
              </TabsContent>

              <TabsContent value="pending" className="mt-0 p-0">
                <PendingOrdersTable
                  orders={pendingOrders}
                  onCancel={(id) => { cancelPendingOrder(id); toast.info("Ordem cancelada"); }}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-0 p-0">
                <HistoryTable history={history} />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0 p-4">
                <AnalyticsPanel history={history} equityHistory={equityHistory} startBalance={10_000} />
              </TabsContent>

              <TabsContent value="challenges" className="mt-0 p-4">
                <ChallengesPanel
                  challenges={challenges}
                  equityVal={equityVal}
                  historyCount={history.length}
                  onStart={(id) => {
                    startChallenge(id);
                    toast.success("Desafio iniciado! Conta resetada para $10.000");
                  }}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Painel de ordem */}
        <OrderPanel
          symbol={symbol}
          lastPrice={lastPrice}
          precision={meta.precision}
          cash={cash}
          onSubmitMarket={(order) => {
            const id = openPosition({
              symbol,
              side: order.side,
              size: order.size,
              entryPrice: lastPrice,
              leverage: order.leverage,
              stopLoss: order.stopLoss,
              takeProfit: order.takeProfit,
              note: order.note,
            });
            if (!id) {
              toast.error("Margem insuficiente para abrir essa posição.");
            } else {
              toast.success(`${order.side === "buy" ? "Compra" : "Venda"} executada`, {
                description: `${order.size} ${symbol} @ ${fmtPrice(lastPrice, meta.precision)}`,
              });
            }
          }}
          onSubmitPending={(order) => {
            placePendingOrder({
              symbol,
              side: order.side,
              orderType: order.orderType as "limit" | "stop",
              size: order.size,
              triggerPrice: order.triggerPrice!,
              leverage: order.leverage,
              stopLoss: order.stopLoss,
              takeProfit: order.takeProfit,
              note: order.note,
            });
            toast.success(`Ordem ${order.orderType === "limit" ? "limitada" : "stop"} colocada`, {
              description: `${order.side === "buy" ? "Compra" : "Venda"} ${order.size} ${symbol} @ ${fmtPrice(order.triggerPrice!, meta.precision)}`,
            });
          }}
          onReset={() => { resetSim(); toast.info("Conta demo reiniciada para $10.000."); }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTE: Banner de desafio ativo
============================================================ */

function ActiveChallengeBanner({
  challenges, equityVal, historyCount,
}: { challenges: ReturnType<typeof useAppStore.getState>["sim"]["challenges"]; equityVal: number; historyCount: number }) {
  const active = challenges.find((c) => c.active && !c.completed && !c.failed);
  if (!active) return null;
  const progress = Math.min(100, ((equityVal - active.startBalance) / (active.targetEquity - active.startBalance)) * 100);
  const progressClamped = Math.max(0, progress);
  const def = CHALLENGES.find((c) => c.id === active.id);

  return (
    <Card className="border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{def?.emoji ?? "🎯"}</span>
          <div>
            <p className="font-semibold text-sm">{active.title}</p>
            <p className="text-xs text-muted-foreground">{active.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Objetivo: </span>
            <span className="font-mono font-semibold">{fmtUSD(active.targetEquity)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Trades: </span>
            <span className="font-mono font-semibold">{historyCount}/{active.minTrades}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Drawdown máx: </span>
            <span className="font-mono font-semibold">{active.maxDrawdownPct}%</span>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px]">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-mono font-semibold text-primary">{progressClamped.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${progressClamped}%` }} />
        </div>
      </div>
    </Card>
  );
}

/* ============================================================
   COMPONENTE: Analytics
============================================================ */

function AnalyticsPanel({
  history, equityHistory, startBalance,
}: {
  history: ReturnType<typeof useAppStore.getState>["sim"]["history"];
  equityHistory: ReturnType<typeof useAppStore.getState>["sim"]["equityHistory"];
  startBalance: number;
}) {
  const trades = history.length;
  const wins = history.filter((t) => t.pnl > 0).length;
  const losses = history.filter((t) => t.pnl <= 0).length;
  const winRate = trades ? (wins / trades) * 100 : 0;
  const totalPnl = history.reduce((s, t) => s + t.pnl, 0);
  const avgWin = wins ? history.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / wins : 0;
  const avgLoss = losses ? Math.abs(history.filter((t) => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0) / losses) : 0;
  const pf = calcProfitFactor(history);
  const maxDD = calcMaxDrawdown(equityHistory);
  const sharpe = calcSharpe(equityHistory);
  const rr = avgLoss > 0 ? avgWin / avgLoss : 0;

  // Format equity history for recharts
  const chartData = equityHistory.map((pt, i) => ({
    i,
    equity: parseFloat(pt.equity.toFixed(2)),
    time: new Date(pt.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  }));

  if (trades === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        <TrendingUp className="mx-auto mb-3 h-8 w-8 opacity-30" />
        Faça alguns trades para ver suas métricas de desempenho.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Métricas grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Trades totais" value={trades.toString()} />
        <MetricCard
          label="Taxa de acerto"
          value={`${winRate.toFixed(1)}%`}
          color={winRate >= 50 ? "bull" : "bear"}
        />
        <MetricCard
          label="Profit Factor"
          value={isFinite(pf) ? pf.toFixed(2) : "∞"}
          color={pf >= 1.5 ? "bull" : pf >= 1 ? "warning" : "bear"}
          hint={pf >= 2 ? "Excelente" : pf >= 1.5 ? "Bom" : pf >= 1 ? "Aceitável" : "Melhorar"}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={sharpe.toFixed(2)}
          color={sharpe >= 1 ? "bull" : sharpe >= 0 ? "warning" : "bear"}
          hint={sharpe >= 2 ? "Excelente" : sharpe >= 1 ? "Bom" : sharpe >= 0 ? "Fraco" : "Negativo"}
        />
        <MetricCard
          label="Max Drawdown"
          value={`${(maxDD * 100).toFixed(2)}%`}
          color={maxDD < 0.1 ? "bull" : maxDD < 0.2 ? "warning" : "bear"}
          hint={maxDD < 0.1 ? "Ótimo" : maxDD < 0.2 ? "Atenção" : "Alto"}
        />
        <MetricCard
          label="Relação G/P"
          value={rr.toFixed(2)}
          color={rr >= 2 ? "bull" : rr >= 1.5 ? "warning" : "bear"}
          hint="Ganho médio ÷ Perda média"
        />
        <MetricCard
          label="P&L Total"
          value={fmtUSD(totalPnl)}
          color={totalPnl >= 0 ? "bull" : "bear"}
        />
        <MetricCard
          label="Retorno total"
          value={`${startBalance > 0 ? ((totalPnl / startBalance) * 100).toFixed(2) : "0.00"}%`}
          color={totalPnl >= 0 ? "bull" : "bear"}
        />
      </div>

      {/* Curva de patrimônio */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Curva de patrimônio</h4>
        <div className="h-52 w-full rounded-lg border border-border bg-surface-1 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                width={52}
                domain={["auto", "auto"]}
              />
              <Tooltip
                formatter={(v: number) => [fmtUSD(v), "Patrimônio"]}
                contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <ReferenceLine y={startBalance} stroke="#6b7280" strokeDasharray="4 2" label={{ value: "Inicial", fill: "#6b7280", fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribuição trades */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface-1 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Ganhos</p>
          <p className="font-mono text-lg font-bold text-bull">{wins} trades</p>
          <p className="font-mono text-sm text-bull">{fmtUSD(avgWin)} média</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Perdas</p>
          <p className="font-mono text-lg font-bold text-bear">{losses} trades</p>
          <p className="font-mono text-sm text-bear">{fmtUSD(-avgLoss)} média</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, color = "default", hint,
}: { label: string; value: string; color?: "bull" | "bear" | "warning" | "default"; hint?: string }) {
  const colorClass = color === "bull" ? "text-bull" : color === "bear" ? "text-bear" : color === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-lg font-bold ${colorClass}`}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ============================================================
   COMPONENTE: Desafios
============================================================ */

function ChallengesPanel({
  challenges, equityVal, historyCount, onStart,
}: {
  challenges: ReturnType<typeof useAppStore.getState>["sim"]["challenges"];
  equityVal: number;
  historyCount: number;
  onStart: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Iniciar um desafio reseta sua conta demo. Complete o objetivo sem ultrapassar o drawdown máximo.
      </p>
      {challenges.map((ch) => {
        const def = CHALLENGES.find((c) => c.id === ch.id);
        const isActive = ch.active && !ch.completed && !ch.failed;
        const progress = isActive
          ? Math.max(0, Math.min(100, ((equityVal - ch.startBalance) / (ch.targetEquity - ch.startBalance)) * 100))
          : ch.completed ? 100 : 0;

        return (
          <div
            key={ch.id}
            className={`rounded-lg border p-4 transition-all ${
              ch.completed ? "border-bull/40 bg-bull/5" :
              ch.failed ? "border-bear/40 bg-bear/5" :
              isActive ? "border-primary/40 bg-primary/5" :
              "border-border bg-surface-1"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{def?.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{ch.title}</p>
                    {ch.completed && <CheckCircle2 className="h-4 w-4 text-bull" />}
                    {ch.failed && <XCircle className="h-4 w-4 text-bear" />}
                    {isActive && <Badge className="bg-primary/15 text-primary text-[10px]">ATIVO</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{ch.description}</p>
                </div>
              </div>
              {!isActive && !ch.completed && (
                <Button size="sm" variant="outline" onClick={() => onStart(ch.id)} className="shrink-0">
                  <Target className="mr-1.5 h-3.5 w-3.5" />
                  {ch.failed ? "Tentar novamente" : "Iniciar"}
                </Button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div className="rounded bg-surface-2 px-2 py-1.5">
                <span className="text-muted-foreground">Objetivo</span>
                <p className="font-mono font-semibold">{fmtUSD(ch.targetEquity)}</p>
              </div>
              <div className="rounded bg-surface-2 px-2 py-1.5">
                <span className="text-muted-foreground">Min. trades</span>
                <p className="font-mono font-semibold">{isActive ? `${historyCount}/${ch.minTrades}` : ch.minTrades}</p>
              </div>
              <div className="rounded bg-surface-2 px-2 py-1.5">
                <span className="text-muted-foreground">Max drawdown</span>
                <p className="font-mono font-semibold">{ch.maxDrawdownPct}%</p>
              </div>
            </div>

            {(isActive || ch.completed) && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-mono">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full transition-all ${ch.completed ? "bg-bull" : "bg-gradient-primary"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {ch.failed && (
              <p className="mt-2 text-[11px] text-bear flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Desafio falhado — drawdown máximo ultrapassado.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   COMPONENTE: Tabela de ordens pendentes
============================================================ */

function PendingOrdersTable({
  orders, onCancel,
}: {
  orders: ReturnType<typeof useAppStore.getState>["sim"]["pendingOrders"];
  onCancel: (id: string) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-muted-foreground">
        <Clock className="mx-auto mb-2 h-6 w-6 opacity-40" />
        Nenhuma ordem pendente.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>Símbolo</Th><Th>Tipo</Th><Th>Lado</Th>
            <Th right>Tamanho</Th><Th right>Preço gatilho</Th>
            <Th right>SL / TP</Th><Th>Nota</Th><Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((o) => {
            const meta = SYMBOL_MAP[o.symbol];
            return (
              <tr key={o.id} className="hover:bg-surface-1">
                <Td className="font-semibold">{o.symbol}</Td>
                <Td>
                  <Badge variant="outline" className="text-[10px]">
                    {o.orderType === "limit" ? "Limit" : "Stop"}
                  </Badge>
                </Td>
                <Td>
                  <Badge className={o.side === "buy" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}>
                    {o.side === "buy" ? "BUY" : "SELL"}
                  </Badge>
                </Td>
                <Td right mono>{o.size}</Td>
                <Td right mono>{fmtPrice(o.triggerPrice, meta.precision)}</Td>
                <Td right mono className="text-xs text-muted-foreground">
                  {o.stopLoss ? fmtPrice(o.stopLoss, meta.precision) : "—"} / {o.takeProfit ? fmtPrice(o.takeProfit, meta.precision) : "—"}
                </Td>
                <Td className="max-w-[120px] truncate text-xs text-muted-foreground">{o.note || "—"}</Td>
                <Td right>
                  <Button size="sm" variant="ghost" className="h-7 text-muted-foreground hover:text-bear" onClick={() => onCancel(o.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   COMPONENTE: Tabela de posições abertas
============================================================ */

function PositionsTable({
  positions, priceMap, onClose,
}: {
  positions: ReturnType<typeof useAppStore.getState>["sim"]["positions"];
  priceMap: Record<string, number>;
  onClose: (id: string) => void;
}) {
  if (positions.length === 0) {
    return <div className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma posição aberta.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>Símbolo</Th><Th>Lado</Th><Th right>Tam.</Th><Th right>Alav.</Th>
            <Th right>Entrada</Th><Th right>Atual</Th><Th right>Margem</Th>
            <Th right>Liq.</Th><Th right>SL / TP</Th><Th>Nota</Th><Th right>P&L</Th><Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {positions.map((p) => {
            const last = priceMap[p.symbol] ?? p.entryPrice;
            const dir = p.side === "buy" ? 1 : -1;
            const pnl = (last - p.entryPrice) * p.size * dir;
            const meta = SYMBOL_MAP[p.symbol];
            const lev = p.leverage ?? 1;
            const margin = (p.entryPrice * p.size) / lev;
            return (
              <tr key={p.id} className="hover:bg-surface-1">
                <Td className="font-semibold">{p.symbol}</Td>
                <Td>
                  <Badge className={p.side === "buy" ? "bg-bull/15 text-bull hover:bg-bull/20" : "bg-bear/15 text-bear hover:bg-bear/20"}>
                    {p.side === "buy" ? "BUY" : "SELL"}
                  </Badge>
                </Td>
                <Td right mono>{p.size}</Td>
                <Td right mono>
                  {lev > 1 ? <Badge variant="outline" className="font-mono text-[10px]">{lev}×</Badge> : <span className="text-muted-foreground">1×</span>}
                </Td>
                <Td right mono>{fmtPrice(p.entryPrice, meta.precision)}</Td>
                <Td right mono>{fmtPrice(last, meta.precision)}</Td>
                <Td right mono className="text-xs">{fmtUSD(margin)}</Td>
                <Td right mono className="text-xs text-warning">
                  {p.liquidationPrice ? fmtPrice(p.liquidationPrice, meta.precision) : "—"}
                </Td>
                <Td right mono className="text-xs text-muted-foreground">
                  {p.stopLoss ? fmtPrice(p.stopLoss, meta.precision) : "—"} / {p.takeProfit ? fmtPrice(p.takeProfit, meta.precision) : "—"}
                </Td>
                <Td className="max-w-[100px] truncate text-xs text-muted-foreground">{p.note || "—"}</Td>
                <Td right mono className={pnl >= 0 ? "text-bull font-semibold" : "text-bear font-semibold"}>{fmtUSD(pnl)}</Td>
                <Td right>
                  <Button size="sm" variant="ghost" className="h-7 text-muted-foreground hover:text-bear" onClick={() => onClose(p.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   COMPONENTE: Tabela de histórico
============================================================ */

function HistoryTable({ history }: { history: ReturnType<typeof useAppStore.getState>["sim"]["history"] }) {
  const [shareTarget, setShareTarget] = useState<typeof history[0] | null>(null);

  if (history.length === 0) {
    return <div className="px-5 py-10 text-center text-sm text-muted-foreground">Sem trades fechados ainda.</div>;
  }
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th>Data</Th><Th>Símbolo</Th><Th>Lado</Th>
              <Th right>Tam.</Th><Th right>Entrada</Th><Th right>Saída</Th>
              <Th>Motivo</Th><Th>Nota</Th><Th right>P&L</Th><Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {history.map((t) => {
              const meta = SYMBOL_MAP[t.symbol];
              return (
                <tr key={t.id} className="group hover:bg-surface-1">
                  <Td className="text-xs text-muted-foreground">
                    {new Date(t.closedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </Td>
                  <Td className="font-semibold">{t.symbol}</Td>
                  <Td>
                    <Badge className={t.side === "buy" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}>
                      {t.side === "buy" ? "BUY" : "SELL"}
                    </Badge>
                  </Td>
                  <Td right mono>{t.size}</Td>
                  <Td right mono>{fmtPrice(t.entryPrice, meta.precision)}</Td>
                  <Td right mono>{fmtPrice(t.exitPrice, meta.precision)}</Td>
                  <Td className="text-xs text-muted-foreground capitalize">
                    {t.reason === "stop" ? "Stop loss" : t.reason === "target" ? "Take profit" : t.reason === "liquidation" ? "Liquidação" : "Manual"}
                  </Td>
                  <Td className="max-w-[120px] truncate text-xs text-muted-foreground">{t.note || "—"}</Td>
                  <Td right mono className={t.pnl >= 0 ? "text-bull font-semibold" : "text-bear font-semibold"}>{fmtUSD(t.pnl)}</Td>
                  <Td>
                    <button
                      onClick={() => setShareTarget(t)}
                      className="rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-2"
                      title="Partilhar trade"
                    >
                      <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TradeShareModal
        trade={shareTarget}
        open={shareTarget !== null}
        onClose={() => setShareTarget(null)}
      />
    </>
  );
}

/* ============================================================
   CÉLULAS DE TABELA
============================================================ */

const Th = ({ children, right }: { children?: React.ReactNode; right?: boolean }) => (
  <th className={`px-3 py-2.5 ${right ? "text-right" : "text-left"}`}>{children}</th>
);
const Td = ({ children, right, mono, className = "" }: { children?: React.ReactNode; right?: boolean; mono?: boolean; className?: string }) => (
  <td className={`px-3 py-2.5 ${right ? "text-right" : "text-left"} ${mono ? "font-mono" : ""} ${className}`}>{children}</td>
);

/* ============================================================
   COMPONENTE: Stat no cabeçalho
============================================================ */

function Stat({ label, value, accent, highlight }: { label: string; value: string; accent?: "bull" | "bear"; highlight?: boolean }) {
  const color = accent === "bull" ? "text-bull" : accent === "bear" ? "text-bear" : highlight ? "text-primary" : "text-foreground";
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-mono text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

/* ============================================================
   COMPONENTE: Painel de ordem
============================================================ */

type OrderTypeUI = "market" | "limit" | "stop";

interface OrderInput {
  side: "buy" | "sell";
  size: number;
  leverage: number;
  orderType: OrderTypeUI;
  triggerPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  note?: string;
}

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 25, 50, 100] as const;

function OrderPanel({
  symbol, lastPrice, precision, cash, onSubmitMarket, onSubmitPending, onReset,
}: {
  symbol: string;
  lastPrice: number;
  precision: number;
  cash: number;
  onSubmitMarket: (o: OrderInput) => void;
  onSubmitPending: (o: OrderInput) => void;
  onReset: () => void;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [leverage, setLeverage] = useState<number>(1);
  const [orderType, setOrderType] = useState<OrderTypeUI>("market");
  const [triggerPrice, setTriggerPrice] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const defaultSize = useMemo(() => {
    const target = cash * 0.02;
    const raw = target / lastPrice;
    if (raw > 100) return Math.round(raw);
    if (raw > 1) return parseFloat(raw.toFixed(2));
    return parseFloat(raw.toFixed(4));
  }, [cash, lastPrice]);

  const [size, setSize] = useState<string>(String(defaultSize));
  const [sl, setSl] = useState<string>("");
  const [tp, setTp] = useState<string>("");

  useEffect(() => {
    setSize(String(defaultSize));
    setSl("");
    setTp("");
    setTriggerPrice("");
    setNote("");
  }, [symbol, defaultSize]);

  const sizeNum = parseFloat(size) || 0;
  const slNum = sl ? parseFloat(sl) : NaN;
  const tpNum = tp ? parseFloat(tp) : NaN;
  const triggerNum = triggerPrice ? parseFloat(triggerPrice) : NaN;

  const effectivePrice = orderType === "market" ? lastPrice : (!isNaN(triggerNum) ? triggerNum : lastPrice);
  const notional = sizeNum * effectivePrice;
  const margin = notional / leverage;
  const exceeds = margin > cash;
  const dir = side === "buy" ? 1 : -1;

  const liqPrice =
    leverage > 1
      ? side === "buy"
        ? effectivePrice * (1 - 1 / leverage)
        : effectivePrice * (1 + 1 / leverage)
      : null;
  const liqDistPct = liqPrice ? Math.abs((liqPrice - effectivePrice) / effectivePrice) * 100 : null;

  const slRiskUsd = !isNaN(slNum) && slNum > 0 ? Math.max(0, (effectivePrice - slNum) * dir) * sizeNum : null;
  const slRiskPct = slRiskUsd != null && cash > 0 ? (slRiskUsd / cash) * 100 : null;

  const slInvalid = !isNaN(slNum) && slNum > 0 &&
    ((side === "buy" && slNum >= effectivePrice) || (side === "sell" && slNum <= effectivePrice));
  const tpInvalid = !isNaN(tpNum) && tpNum > 0 &&
    ((side === "buy" && tpNum <= effectivePrice) || (side === "sell" && tpNum >= effectivePrice));
  const slBeyondLiq = liqPrice != null && !isNaN(slNum) && slNum > 0 &&
    ((side === "buy" && slNum < liqPrice) || (side === "sell" && slNum > liqPrice));

  const triggerInvalid = orderType !== "market" && (!triggerNum || triggerNum <= 0);

  const handleSubmit = () => {
    if (sizeNum <= 0) { toast.error("Informe um tamanho válido."); return; }
    if (slInvalid || tpInvalid) { toast.error("Stop loss ou take profit inconsistentes."); return; }
    if (orderType !== "market" && triggerInvalid) { toast.error("Informe um preço de gatilho válido."); return; }

    const order: OrderInput = {
      side, size: sizeNum, leverage, orderType,
      triggerPrice: triggerNum || undefined,
      stopLoss: !isNaN(slNum) ? slNum : undefined,
      takeProfit: !isNaN(tpNum) ? tpNum : undefined,
      note: note.trim() || undefined,
    };

    if (orderType === "market") {
      onSubmitMarket(order);
    } else {
      onSubmitPending(order);
    }
    setNote("");
  };

  return (
    <Card className="h-fit p-4 space-y-3">
      {/* Comprar / Vender */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={side === "buy" ? "default" : "outline"}
          className={side === "buy" ? "bg-bull text-bull-foreground hover:bg-bull/90" : ""}
          onClick={() => setSide("buy")}
        ><ArrowUp className="mr-1 h-4 w-4" />Comprar</Button>
        <Button
          variant={side === "sell" ? "default" : "outline"}
          className={side === "sell" ? "bg-bear text-bear-foreground hover:bg-bear/90" : ""}
          onClick={() => setSide("sell")}
        ><ArrowDown className="mr-1 h-4 w-4" />Vender</Button>
      </div>

      {/* Tipo de ordem */}
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Tipo de ordem</Label>
        <div className="mt-1.5 grid grid-cols-3 gap-1">
          {(["market", "limit", "stop"] as OrderTypeUI[]).map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={`rounded px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                orderType === t ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-1"
              }`}
            >
              {t === "market" ? "Mercado" : t === "limit" ? "Limit" : "Stop"}
            </button>
          ))}
        </div>
        {orderType === "limit" && (
          <p className="mt-1 text-[10px] text-muted-foreground">Compra abaixo / Venda acima do preço atual.</p>
        )}
        {orderType === "stop" && (
          <p className="mt-1 text-[10px] text-muted-foreground">Compra acima / Venda abaixo do preço atual (breakout).</p>
        )}
      </div>

      {/* Preço atual ou gatilho */}
      {orderType === "market" ? (
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Preço (mercado)</Label>
          <div className="mt-1 rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm">
            {fmtPrice(lastPrice, precision)}
          </div>
        </div>
      ) : (
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Preço {orderType === "limit" ? "limitado" : "de ativação"}
          </Label>
          <Input
            type="number"
            inputMode="decimal"
            placeholder={fmtPrice(lastPrice, precision)}
            value={triggerPrice}
            onChange={(e) => setTriggerPrice(e.target.value)}
            className={`mt-1 font-mono ${triggerInvalid && triggerPrice !== "" ? "border-bear" : ""}`}
          />
        </div>
      )}

      {/* Alavancagem */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Alavancagem</Label>
          <span className={`font-mono text-xs font-bold ${leverage >= 25 ? "text-bear" : leverage >= 10 ? "text-warning" : "text-foreground"}`}>
            {leverage}×
          </span>
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1">
          {LEVERAGE_OPTIONS.map((lv) => (
            <button
              key={lv}
              onClick={() => setLeverage(lv)}
              className={`rounded px-1 py-1 font-mono text-[11px] font-semibold transition-colors ${
                leverage === lv ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-1"
              }`}
            >{lv}×</button>
          ))}
        </div>
        {leverage >= 25 && (
          <p className="mt-1.5 text-[10px] text-bear">
            ⚠ Liquidação a {liqDistPct?.toFixed(2)}% de distância.
          </p>
        )}
      </div>

      {/* Tamanho */}
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Tamanho ({symbol.split("/")[0] || symbol})
        </Label>
        <Input
          type="number"
          inputMode="decimal"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="mt-1 font-mono"
        />
      </div>

      {/* SL / TP */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-bear">Stop loss</Label>
          <Input type="number" inputMode="decimal" placeholder="Opcional"
            value={sl} onChange={(e) => setSl(e.target.value)}
            className={`mt-1 font-mono ${slInvalid ? "border-bear" : ""}`} />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-bull">Take profit</Label>
          <Input type="number" inputMode="decimal" placeholder="Opcional"
            value={tp} onChange={(e) => setTp(e.target.value)}
            className={`mt-1 font-mono ${tpInvalid ? "border-bear" : ""}`} />
        </div>
      </div>

      {/* Nota (diário) */}
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <BookOpen className="h-3 w-3" />Nota do trade (diário)
        </Label>
        <Textarea
          placeholder="Por que estou abrindo este trade?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 min-h-[64px] resize-none text-xs"
          maxLength={200}
        />
      </div>

      {/* Métricas em tempo real */}
      <div className="rounded-md border border-border bg-surface-2 p-3 text-[11px]">
        <MetricRow label="Exposição" value={fmtUSD(notional)} mono />
        <MetricRow label="Margem" value={fmtUSD(margin)} mono valueClass={exceeds ? "text-bear" : ""} />
        <MetricRow label="Saldo disponível" value={fmtUSD(cash)} mono />
        {liqPrice != null && (
          <MetricRow label="Liquidação" value={`${fmtPrice(liqPrice, precision)} (${liqDistPct!.toFixed(2)}%)`} mono valueClass="text-warning" />
        )}
        {slRiskUsd != null && !slInvalid && (
          <MetricRow
            label="Risco no stop"
            value={`${fmtUSD(slRiskUsd)} (${slRiskPct!.toFixed(2)}%)`}
            mono
            valueClass={slRiskPct! > 5 ? "text-bear" : slRiskPct! > 2 ? "text-warning" : "text-bull"}
          />
        )}
      </div>

      {slBeyondLiq && <p className="text-[11px] text-warning">⚠ Stop além do preço de liquidação.</p>}
      {slInvalid && <p className="text-[11px] text-bear">Stop loss deve ficar {side === "buy" ? "abaixo" : "acima"} do preço.</p>}
      {tpInvalid && <p className="text-[11px] text-bear">Take profit deve ficar {side === "buy" ? "acima" : "abaixo"} do preço.</p>}

      <Button
        size="lg"
        className={`w-full ${side === "buy" ? "bg-bull text-bull-foreground hover:bg-bull/90" : "bg-bear text-bear-foreground hover:bg-bear/90"}`}
        disabled={exceeds || sizeNum <= 0 || slInvalid || tpInvalid}
        onClick={handleSubmit}
      >
        {orderType === "market"
          ? (side === "buy" ? "Confirmar compra" : "Confirmar venda")
          : `Colocar ordem ${orderType === "limit" ? "limitada" : "stop"}`}
        {leverage > 1 && <span className="ml-2 font-mono opacity-90">{leverage}×</span>}
      </Button>

      {exceeds && <p className="text-center text-[11px] text-bear">Margem insuficiente. Reduza tamanho ou aumente alavancagem.</p>}

      <div className="border-t border-border pt-2">
        <Button variant="ghost" size="sm" onClick={onReset} className="w-full text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reiniciar conta demo
        </Button>
      </div>
    </Card>
  );
}

function MetricRow({ label, value, mono, valueClass = "" }: { label: string; value: string; mono?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${mono ? "font-mono" : ""} font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}
