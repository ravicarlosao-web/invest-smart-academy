import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PriceChart } from "@/components/PriceChart";
import { useAppStore, calcUnrealizedPnL, positionMargin } from "@/store/useAppStore";
import {
  SYMBOLS, SYMBOL_MAP, TIMEFRAMES, seedCandles, nextCandle, fmtPrice, fmtUSD,
  type Candle,
} from "@/lib/market";
import { ArrowDown, ArrowUp, RotateCcw, X, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

export default function Simular() {
  const [symbol, setSymbol] = useState<string>("BTC/USD");
  const [tfIdx, setTfIdx] = useState(0); // 1m por padrão
  const meta = SYMBOL_MAP[symbol];
  const tf = TIMEFRAMES[tfIdx];

  // Indicadores
  const [showRsi, setShowRsi] = useState(false);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [showMacd, setShowMacd] = useState(false);
  const [macdFast, setMacdFast] = useState(12);
  const [macdSlow, setMacdSlow] = useState(26);
  const [macdSignal, setMacdSignal] = useState(9);

  // candles por símbolo (mantemos estado por símbolo para preservar ao trocar TF)
  const [candlesBySymbol, setCandlesBySymbol] = useState<Record<string, Candle[]>>(() => {
    const out: Record<string, Candle[]> = {};
    for (const s of SYMBOLS) out[s.symbol] = seedCandles(s, 200, 60);
    return out;
  });

  // ao trocar timeframe, regera o histórico do símbolo atual
  useEffect(() => {
    setCandlesBySymbol((prev) => ({
      ...prev,
      [symbol]: seedCandles(meta, 200, tf.seconds),
    }));
  }, [symbol, tf.seconds, meta]);

  // tick: avança 1 candle por segundo (visual). O tempo do candle usa o intervalo do TF.
  const evaluateStops = useAppStore((s) => s.evaluateStops);
  const tickRef = useRef<number | null>(null);
  useEffect(() => {
    tickRef.current = window.setInterval(() => {
      setCandlesBySymbol((prev) => {
        const out = { ...prev };
        for (const s of SYMBOLS) {
          const arr = out[s.symbol];
          if (!arr || arr.length === 0) continue;
          const next = nextCandle(s, arr[arr.length - 1], tf.seconds);
          const newArr = [...arr.slice(-499), next];
          out[s.symbol] = newArr;
          // avalia stops com o close atual
          evaluateStops(s.symbol, next.close);
        }
        return out;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [tf.seconds, evaluateStops]);

  const candles = candlesBySymbol[symbol] ?? [];
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const lastPrice = last?.close ?? meta.basePrice;
  const change = last && prev ? last.close - prev.close : 0;
  const changePct = last && prev ? (change / prev.close) * 100 : 0;

  // Mapa de preços para PnL
  const priceMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of SYMBOLS) {
      const arr = candlesBySymbol[s.symbol];
      m[s.symbol] = arr?.[arr.length - 1]?.close ?? s.basePrice;
    }
    return m;
  }, [candlesBySymbol]);

  // Store de simulação
  const cash = useAppStore((s) => s.sim.cashBalance);
  const positions = useAppStore((s) => s.sim.positions);
  const history = useAppStore((s) => s.sim.history);
  const openPosition = useAppStore((s) => s.openPosition);
  const closePosition = useAppStore((s) => s.closePosition);
  const resetSim = useAppStore((s) => s.resetSim);

  const upnl = calcUnrealizedPnL(positions, priceMap);
  const usedMargin = positions.reduce((sum, p) => sum + positionMargin(p), 0);
  const exposure = positions.reduce((sum, p) => sum + p.entryPrice * p.size, 0);
  const equityVal = cash + usedMargin + upnl;

  return (
    <div className="container max-w-[1400px] py-4 lg:py-6">
      {/* topo: ativo + métricas conta */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="rounded-md border border-border bg-surface-1 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {(["Cripto","Forex","Ações"] as const).map((cat) => (
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
          <Stat label="Exposição" value={fmtUSD(exposure)} />
          <Stat label="P&L aberto" value={fmtUSD(upnl)} accent={upnl >= 0 ? "bull" : "bear"} />
          <Stat label="Patrimônio" value={fmtUSD(equityVal)} highlight />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Gráfico + tabs */}
        <div className="space-y-4">
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
                  className={`rounded px-2 py-1 font-mono text-[10px] font-semibold transition-colors ${
                    showRsi ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2"
                  }`}
                >
                  RSI
                </button>
                <button
                  onClick={() => setShowMacd((v) => !v)}
                  className={`rounded px-2 py-1 font-mono text-[10px] font-semibold transition-colors ${
                    showMacd ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2"
                  }`}
                >
                  MACD
                </button>
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
                        <Label htmlFor="rsi-p" className="text-[11px] text-muted-foreground">Período</Label>
                        <Input
                          id="rsi-p"
                          type="number"
                          min={2}
                          max={100}
                          value={rsiPeriod}
                          onChange={(e) => setRsiPeriod(Math.max(2, Math.min(100, parseInt(e.target.value) || 14)))}
                          className="h-8 w-20 font-mono"
                        />
                      </div>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="mb-2 flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase tracking-wider">MACD</Label>
                        <Switch checked={showMacd} onCheckedChange={setShowMacd} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="macd-f" className="text-[11px] text-muted-foreground">Rápida (EMA)</Label>
                          <Input id="macd-f" type="number" min={2} max={100} value={macdFast}
                            onChange={(e) => setMacdFast(Math.max(2, Math.min(100, parseInt(e.target.value) || 12)))}
                            className="h-8 w-20 font-mono" />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="macd-s" className="text-[11px] text-muted-foreground">Lenta (EMA)</Label>
                          <Input id="macd-s" type="number" min={3} max={200} value={macdSlow}
                            onChange={(e) => setMacdSlow(Math.max(3, Math.min(200, parseInt(e.target.value) || 26)))}
                            className="h-8 w-20 font-mono" />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="macd-sig" className="text-[11px] text-muted-foreground">Sinal (EMA)</Label>
                          <Input id="macd-sig" type="number" min={2} max={50} value={macdSignal}
                            onChange={(e) => setMacdSignal(Math.max(2, Math.min(50, parseInt(e.target.value) || 9)))}
                            className="h-8 w-20 font-mono" />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div
              className="w-full"
              style={{ height: showRsi && showMacd ? 720 : showRsi || showMacd ? 620 : 500 }}
            >
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

          <Card>
            <Tabs defaultValue="open">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger value="open" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Posições abertas ({positions.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Histórico ({history.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="open" className="mt-0 p-0">
                <PositionsTable
                  positions={positions}
                  priceMap={priceMap}
                  onClose={(id) => {
                    const pos = positions.find((p) => p.id === id);
                    if (!pos) return;
                    closePosition(id, priceMap[pos.symbol] ?? pos.entryPrice, "manual");
                    toast.success("Posição fechada");
                  }}
                />
              </TabsContent>
              <TabsContent value="history" className="mt-0 p-0">
                <HistoryTable history={history} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Order panel */}
        <OrderPanel
          symbol={symbol}
          lastPrice={lastPrice}
          precision={meta.precision}
          cash={cash}
          onSubmit={(order) => {
            const id = openPosition({
              symbol,
              side: order.side,
              size: order.size,
              entryPrice: lastPrice,
              stopLoss: order.stopLoss,
              takeProfit: order.takeProfit,
            });
            if (!id) {
              toast.error("Saldo insuficiente para abrir essa posição.");
            } else {
              toast.success(`${order.side === "buy" ? "Compra" : "Venda"} executada`, {
                description: `${order.size} ${symbol} @ ${fmtPrice(lastPrice, meta.precision)}`,
              });
            }
          }}
          onReset={() => {
            resetSim();
            toast.info("Conta demo reiniciada para $10.000.");
          }}
        />
      </div>
    </div>
  );
}

/* ============== Sub-componentes ============== */

function Stat({ label, value, accent, highlight }: { label: string; value: string; accent?: "bull" | "bear"; highlight?: boolean }) {
  const color = accent === "bull" ? "text-bull" : accent === "bear" ? "text-bear" : highlight ? "text-primary" : "text-foreground";
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-mono text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

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
            <Th>Símbolo</Th><Th>Lado</Th><Th right>Tamanho</Th><Th right>Alav.</Th><Th right>Entrada</Th>
            <Th right>Atual</Th><Th right>Margem</Th><Th right>Liq.</Th><Th right>SL / TP</Th><Th right>P&L</Th><Th />
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
                  {lev > 1 ? (
                    <Badge variant="outline" className="font-mono text-[10px]">{lev}×</Badge>
                  ) : (
                    <span className="text-muted-foreground">1×</span>
                  )}
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
                <Td right mono className={pnl >= 0 ? "text-bull font-semibold" : "text-bear font-semibold"}>
                  {fmtUSD(pnl)}
                </Td>
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

function HistoryTable({ history }: { history: ReturnType<typeof useAppStore.getState>["sim"]["history"] }) {
  if (history.length === 0) {
    return <div className="px-5 py-10 text-center text-sm text-muted-foreground">Sem trades fechados ainda.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>Data</Th><Th>Símbolo</Th><Th>Lado</Th>
            <Th right>Tamanho</Th><Th right>Entrada</Th><Th right>Saída</Th>
            <Th>Motivo</Th><Th right>P&L</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {history.map((t) => {
            const meta = SYMBOL_MAP[t.symbol];
            return (
              <tr key={t.id} className="hover:bg-surface-1">
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
                <Td right mono className={t.pnl >= 0 ? "text-bull font-semibold" : "text-bear font-semibold"}>
                  {fmtUSD(t.pnl)}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const Th = ({ children, right }: { children?: React.ReactNode; right?: boolean }) => (
  <th className={`px-4 py-2.5 ${right ? "text-right" : "text-left"}`}>{children}</th>
);
const Td = ({ children, right, mono, className = "" }: { children?: React.ReactNode; right?: boolean; mono?: boolean; className?: string }) => (
  <td className={`px-4 py-2.5 ${right ? "text-right" : "text-left"} ${mono ? "font-mono" : ""} ${className}`}>{children}</td>
);

/* ============== Painel de ordem ============== */

interface OrderInput {
  side: "buy" | "sell";
  size: number;
  stopLoss?: number;
  takeProfit?: number;
}

function OrderPanel({
  symbol, lastPrice, precision, cash, onSubmit, onReset,
}: {
  symbol: string;
  lastPrice: number;
  precision: number;
  cash: number;
  onSubmit: (o: OrderInput) => void;
  onReset: () => void;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  // tamanho inicial razoável: ~2% do saldo
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

  // recomputa tamanho default quando muda símbolo ou preço significativamente
  useEffect(() => {
    setSize(String(defaultSize));
    setSl("");
    setTp("");
  }, [symbol, defaultSize]);

  const sizeNum = parseFloat(size) || 0;
  const cost = sizeNum * lastPrice;
  const exceeds = cost > cash;

  const handleSubmit = () => {
    if (sizeNum <= 0) {
      toast.error("Informe um tamanho válido.");
      return;
    }
    onSubmit({
      side,
      size: sizeNum,
      stopLoss: sl ? parseFloat(sl) : undefined,
      takeProfit: tp ? parseFloat(tp) : undefined,
    });
  };

  return (
    <Card className="h-fit p-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={side === "buy" ? "default" : "outline"}
          className={side === "buy" ? "bg-bull text-bull-foreground hover:bg-bull/90" : ""}
          onClick={() => setSide("buy")}
        >
          <ArrowUp className="mr-1 h-4 w-4" />Comprar
        </Button>
        <Button
          variant={side === "sell" ? "default" : "outline"}
          className={side === "sell" ? "bg-bear text-bear-foreground hover:bg-bear/90" : ""}
          onClick={() => setSide("sell")}
        >
          <ArrowDown className="mr-1 h-4 w-4" />Vender
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Preço (mercado)</Label>
          <div className="mt-1 rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm">
            {fmtPrice(lastPrice, precision)}
          </div>
        </div>

        <div>
          <Label htmlFor="size" className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Tamanho ({symbol.split("/")[0] || symbol})
          </Label>
          <Input
            id="size"
            type="number"
            inputMode="decimal"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="mt-1 font-mono"
          />
          <p className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Custo: <span className={`font-mono ${exceeds ? "text-bear" : ""}`}>{fmtUSD(cost)}</span></span>
            <span>Disponível: <span className="font-mono">{fmtUSD(cash)}</span></span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="sl" className="text-[11px] uppercase tracking-wider text-bear">Stop loss</Label>
            <Input id="sl" type="number" inputMode="decimal" placeholder="Opcional"
              value={sl} onChange={(e) => setSl(e.target.value)} className="mt-1 font-mono" />
          </div>
          <div>
            <Label htmlFor="tp" className="text-[11px] uppercase tracking-wider text-bull">Take profit</Label>
            <Input id="tp" type="number" inputMode="decimal" placeholder="Opcional"
              value={tp} onChange={(e) => setTp(e.target.value)} className="mt-1 font-mono" />
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className={`mt-4 w-full ${
          side === "buy" ? "bg-bull text-bull-foreground hover:bg-bull/90" : "bg-bear text-bear-foreground hover:bg-bear/90"
        }`}
        disabled={exceeds || sizeNum <= 0}
        onClick={handleSubmit}
      >
        {side === "buy" ? "Confirmar compra" : "Confirmar venda"}
      </Button>

      {exceeds && (
        <p className="mt-2 text-center text-[11px] text-bear">Saldo insuficiente para esta posição.</p>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <Button variant="ghost" size="sm" onClick={onReset} className="w-full text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reiniciar conta demo
        </Button>
      </div>
    </Card>
  );
}
