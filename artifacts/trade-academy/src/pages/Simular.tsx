import { useEffect, useMemo, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PriceChart, type ChartType, type PriceChartHandle } from "@/components/PriceChart";
import { rsi as calcRsi, macd as calcMacd } from "@/lib/indicators";
import { api } from "@/lib/apiClient";
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
  SYMBOLS, SYMBOL_MAP, TIMEFRAMES, CATEGORIES,
  seedCandles, priceTick, currentCandleStart,
  fmtPrice, fmtUSD,
  type Candle,
} from "@/lib/market";
import { ArrowDown, ArrowUp, RotateCcw, X, Settings2, Target, Trophy, BookOpen, TrendingUp, Clock, CheckCircle2, XCircle, AlertTriangle, Share2, Brain, ThumbsUp, Lightbulb, Zap, ChevronDown, BarChart2, BarChart3, AreaChart, Activity, Minus, Camera, Download, Loader2 } from "lucide-react";
import { IconByName } from "@/components/IconByName";
import { toast } from "sonner";
import { TradeShareModal } from "@/components/TradeShareModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

/* ============================================================
   CUSTO REALISTA — spread + comissão por categoria
============================================================ */

const SPREAD_PCT: Record<string, number> = {
  Cripto:      0.0015,  // 0.15% — custo retail realista p/ cripto
  Forex:       0.0004,  // ~4 pips EUR/USD — spread retail realista
  Ações:       0.0008,  // 0.08% — custo realista de bolsa
  Commodities: 0.001,   // 0.10% — ouro/petróleo realista
  Índices:     0.0005,  // 0.05% — índice retail realista
};
const COMMISSION_RATE = 0.0015; // 0.15% por operação (corretagem realista)
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms

function slippagePct(): number {
  return Math.random() * 0.0008; // 0–0.08% de impacto de mercado aleatório
}

function calcEntryWithCost(
  marketPrice: number,
  side: "buy" | "sell",
  category: string,
  spreadOn: boolean,
  commOn: boolean,
): number {
  const sp   = spreadOn ? (SPREAD_PCT[category] ?? 0.0008) : 0;
  const com  = commOn   ? COMMISSION_RATE                  : 0;
  const slip = slippagePct(); // impacto de execução — sempre presente
  return side === "buy"
    ? marketPrice * (1 + sp + com + slip)
    : marketPrice * (1 - sp - com - slip);
}

function estimateTradeCost(
  marketPrice: number,
  size: number,
  category: string,
  spreadOn: boolean,
  commOn: boolean,
): number {
  const sp  = spreadOn ? (SPREAD_PCT[category] ?? 0.0008) : 0;
  const com = commOn   ? COMMISSION_RATE                  : 0;
  return marketPrice * size * (sp + com);
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "disponível agora";
  const days  = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins  = Math.floor((ms % 3_600_000)  / 60_000);
  const secs  = Math.floor((ms % 60_000)     / 1_000);
  if (days  > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins  > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

/* ============================================================
   MOTOR DE FEEDBACK INTELIGENTE
============================================================ */

interface TradeFeedback {
  type: "success" | "warning" | "error" | "info";
  message: string;
  hint?: string;
}

function calcMA(candles: Candle[], period: number): number | null {
  if (candles.length < period) return null;
  return candles.slice(-period).reduce((s, c) => s + c.close, 0) / period;
}

/** Analisa uma entrada de trade e devolve feedback educativo */
function analyzeEntry(
  candles: Candle[],
  side: "buy" | "sell",
  entryPrice: number,
  stopLoss: number | undefined,
  takeProfit: number | undefined,
  size: number,
  leverage: number,
  equity: number,
): TradeFeedback[] {
  const items: TradeFeedback[] = [];
  const dir = side === "buy" ? 1 : -1;

  /* ── 1. Alinhamento com a tendência (MM20 vs MM50) ─── */
  const ma20 = calcMA(candles, 20);
  const ma50 = calcMA(candles, 50);
  if (ma20 !== null && ma50 !== null) {
    const trendUp = ma20 > ma50;
    if ((side === "buy" && !trendUp) || (side === "sell" && trendUp)) {
      items.push({
        type: "warning",
        message: "Entraste contra a tendência",
        hint: trendUp
          ? "MM20 está acima da MM50 — tendência de alta. Vender contra ela é de alto risco."
          : "MM20 está abaixo da MM50 — tendência de baixa. Comprar contra ela é de alto risco.",
      });
    } else {
      items.push({
        type: "success",
        message: "Entrada alinhada com a tendência",
        hint: trendUp
          ? "MM20 acima de MM50 — tendência de alta confirmada. Bem entrado!"
          : "MM20 abaixo de MM50 — tendência de baixa confirmada. Bem entrado!",
      });
    }
  }

  /* ── 2. Stop loss check ─── */
  if (!stopLoss || stopLoss <= 0) {
    items.push({
      type: leverage > 5 ? "error" : "warning",
      message: leverage > 5 ? "Stop loss em falta — risco crítico" : "Sem stop loss definido",
      hint: leverage > 5
        ? `Com ${leverage}× de alavancagem, operar sem stop é uma receita para liquidação.`
        : "Sem stop loss, as tuas perdas são ilimitadas. Define sempre um stop.",
    });
  } else {
    const slDistPct = Math.abs((entryPrice - stopLoss) / entryPrice) * 100;
    if (slDistPct < 0.3) {
      items.push({
        type: "warning",
        message: "Stop loss demasiado apertado",
        hint: `Está apenas ${slDistPct.toFixed(2)}% do preço de entrada — o ruído normal pode activá-lo prematuramente.`,
      });
    } else {
      /* Risco por operação */
      const riskUsd = Math.abs((entryPrice - stopLoss) * dir) * size;
      const riskPct = equity > 0 ? (riskUsd / equity) * 100 : 0;
      if (riskPct > 5) {
        items.push({
          type: "error",
          message: "Risco por operação muito elevado",
          hint: `Estás a arriscar ${riskPct.toFixed(1)}% do capital. A regra profissional é máx. 1–2% por trade.`,
        });
      } else if (riskPct > 2) {
        items.push({
          type: "warning",
          message: `Risco de ${riskPct.toFixed(1)}% por operação`,
          hint: "Ligeiramente acima da regra dos 2% — pondera reduzir o tamanho da posição.",
        });
      } else {
        items.push({
          type: "success",
          message: `Risco bem calibrado: ${riskPct.toFixed(1)}%`,
          hint: "Dentro da regra dos 2% por operação. Excelente gestão de risco!",
        });
      }

      /* R:R check */
      if (takeProfit && takeProfit > 0) {
        const slDist = Math.abs(entryPrice - stopLoss);
        const tpDist = Math.abs(takeProfit - entryPrice);
        const rr = slDist > 0 ? tpDist / slDist : 0;
        if (rr < 1) {
          items.push({
            type: "warning",
            message: "Relação risco-retorno desfavorável",
            hint: `R:R de ${rr.toFixed(2)}:1 — o take profit está mais perto do que o stop loss.`,
          });
        } else if (rr >= 2) {
          items.push({
            type: "success",
            message: `Excelente R:R de ${rr.toFixed(1)}:1`,
            hint: "R:R acima de 2:1 é o padrão dos traders profissionais. Muito bem!",
          });
        }
      }
    }
  }

  return items.slice(0, 3);
}

/** Analisa a saída de um trade e devolve feedback educativo */
function analyzeExit(
  trade: { side: "buy" | "sell"; pnl: number; reason: string; entryPrice: number; exitPrice: number; size: number },
  equity: number,
): TradeFeedback[] {
  const items: TradeFeedback[] = [];
  const pnlPct = equity > 0 ? (Math.abs(trade.pnl) / equity) * 100 : 0;
  const priceMovePct = Math.abs((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;

  if (trade.reason === "liquidation") {
    items.push({
      type: "error",
      message: "Liquidação — capital perdido",
      hint: "Com alavancagem elevada, o stop loss é obrigatório. Nunca trades sem ele.",
    });
  } else if (trade.reason === "stop") {
    if (priceMovePct < 0.3) {
      items.push({
        type: "warning",
        message: "Stop loss mal posicionado",
        hint: "O stop estava demasiado apertado — o ruído normal do mercado activou-o. Dá mais espaço ao preço.",
      });
    } else {
      items.push({
        type: "info",
        message: "Stop loss activado — perda controlada",
        hint: "Limitar perdas é boa gestão de risco. Reavalia o ponto de entrada e o posicionamento do stop.",
      });
    }
  } else if (trade.reason === "target") {
    items.push({
      type: "success",
      message: "Take profit atingido! 🎯",
      hint: "Excelente disciplina — seguiste o plano e deixaste o trade correr até ao objectivo.",
    });
  } else {
    /* Manual */
    if (trade.pnl > 0) {
      items.push({
        type: "info",
        message: "Lucro realizado manualmente",
        hint: "Boa saída! Para mais consistência, define take profits automáticos e evita decisões emocionais.",
      });
    } else {
      items.push({
        type: "warning",
        message: "Saída manual em prejuízo",
        hint: "Tinhas um stop loss definido? Saídas manuais emocionais prejudicam a consistência.",
      });
    }
  }

  if (pnlPct > 8) {
    items.push({
      type: trade.pnl > 0 ? "success" : "error",
      message: trade.pnl > 0
        ? `Grande ganho: +${pnlPct.toFixed(1)}% do capital`
        : `Grande perda: −${pnlPct.toFixed(1)}% do capital`,
      hint: trade.pnl > 0
        ? "Regista este trade no diário — o que fizeste bem? Consegues repetir?"
        : "Regista este trade — o que falhaste? Como o evitar no futuro?",
    });
  }

  return items;
}

/* ============================================================
   PÁGINA PRINCIPAL
============================================================ */

/** Estado por símbolo: velas históricas + vela live a formar-se */
type SymData = { hist: Candle[]; live: Candle };

/** Countdown até ao fecho da vela actual — como nas plataformas reais */
function CandleCountdown({ intervalSec }: { intervalSec: number }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    function calc() {
      const nowSec  = Math.floor(Date.now() / 1000);
      const candleEnd = (Math.floor(nowSec / intervalSec) + 1) * intervalSec;
      setRemaining(candleEnd - nowSec);
    }
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [intervalSec]);

  function fmt(sec: number): string {
    if (sec <= 0)      return "00:00";
    if (intervalSec >= 86_400) {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    }
    if (intervalSec >= 3600) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    }
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }

  return (
    <span className="ml-1 font-mono text-[10px] text-muted-foreground/60 tabular-nums select-none" title="Tempo até ao fecho da vela">
      ⏱ {fmt(remaining)}
    </span>
  );
}

export default function Simular() {
  useSEO({ title: "Simulador de Trading — ALUKA", noindex: true });
  const [symbol, setSymbol] = useState<string>("BTC/USD");
  const [tfIdx, setTfIdx] = useState(1); // default: 1m
  const meta = SYMBOL_MAP[symbol];
  const tf = TIMEFRAMES[tfIdx];

  /* ── Auto-switch symbol via ?symbol= query param (deep-link from notifications) ── */
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const paramSymbol = searchParams.get("symbol");
    if (paramSymbol && SYMBOL_MAP[paramSymbol] && paramSymbol !== symbol) {
      setSymbol(paramSymbol);
      // Clean the param from the URL after applying it
      setSearchParams((p) => { p.delete("symbol"); return p; }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const chartRef = useRef<PriceChartHandle>(null);

  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [showRsi, setShowRsi] = useState(false);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [showMacd, setShowMacd] = useState(false);
  const [macdFast, setMacdFast] = useState(12);
  const [macdSlow, setMacdSlow] = useState(26);
  const [macdSignal, setMacdSignal] = useState(9);

  const [chartPreview, setChartPreview] = useState<string | null>(null);
  const [chartAnalysis, setChartAnalysis] = useState<string | null>(null);
  const [chartAnalyzing, setChartAnalyzing] = useState(false);

  const CHART_TYPES: { id: ChartType; label: string; short: string; Icon: React.ElementType }[] = [
    { id: "candlestick",  label: "Velas Japonesas", short: "Velas",  Icon: BarChart2  },
    { id: "heikin-ashi",  label: "Heikin-Ashi",     short: "H.Ashi", Icon: Activity   },
    { id: "bar",          label: "Barras OHLC",      short: "Barras", Icon: BarChart3  },
    { id: "line",         label: "Linha",            short: "Linha",  Icon: Minus      },
    { id: "area",         label: "Área",             short: "Área",   Icon: AreaChart  },
  ];

  /* responsive chart height */
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ─── Live-candle state ───────────────────────────────────────────────
     symData[symbol] = { hist: Candle[], live: Candle }
     - hist  → candles fechadas (não inclui a live)
     - live  → vela em formação (actualizada a cada segundo)
     O gráfico mostra [...hist, live].
     Quando o relógio cruza o boundary do intervalo, a live é finalizada
     e uma nova começa — exactamente como numa plataforma real.
  ────────────────────────────────────────────────────────────────────── */

  /** Ref com preços correntes (evita leituras de state stale no timer) */
  const pricesRef = useRef<Record<string, number>>({});

  function buildInitialSymData(intervalSec: number): Record<string, SymData> {
    const out: Record<string, SymData> = {};
    for (const s of SYMBOLS) {
      const liveStart = currentCandleStart(intervalSec);
      const hist      = seedCandles(s, 200, intervalSec, liveStart);
      const lastPrice = hist[hist.length - 1]?.close ?? s.basePrice;
      pricesRef.current[s.symbol] = lastPrice;
      out[s.symbol] = {
        hist,
        live: { time: liveStart, open: lastPrice, high: lastPrice, low: lastPrice, close: lastPrice },
      };
    }
    return out;
  }

  const [symData, setSymData] = useState<Record<string, SymData>>(() =>
    buildInitialSymData(TIMEFRAMES[0].seconds),
  );

  /* Re-initialise quando o timeframe muda */
  useEffect(() => {
    setSymData(buildInitialSymData(tf.seconds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tf.seconds]);

  const evaluateStops        = useAppStore((s) => s.evaluateStops);
  const evaluatePendingOrders = useAppStore((s) => s.evaluatePendingOrders);
  const recordEquity          = useAppStore((s) => s.recordEquity);

  /* ─── Timer 1 Hz — tick de preço para todos os símbolos ──────────── */
  const tickRef = useRef<number | null>(null);
  useEffect(() => {
    tickRef.current = window.setInterval(() => {
      const nowSec     = Math.floor(Date.now() / 1000);
      const newPrices: Record<string, number> = {};

      /* Gera novos preços fora do setState para chamar as funções da store */
      for (const s of SYMBOLS) {
        const cur = pricesRef.current[s.symbol] ?? s.basePrice;
        newPrices[s.symbol] = priceTick(s, cur, tf.seconds);
      }
      pricesRef.current = newPrices;

      /* Actualiza stops, ordens pendentes e equity com os novos preços */
      for (const [sym, price] of Object.entries(newPrices)) {
        evaluateStops(sym, price);
        evaluatePendingOrders(sym, price);
      }
      recordEquity(newPrices);

      /* Actualiza o estado visual (hist + live) */
      setSymData((prev) => {
        const next: Record<string, SymData> = {};
        for (const s of SYMBOLS) {
          const d         = prev[s.symbol];
          const newPrice  = newPrices[s.symbol] ?? (d?.live.close ?? s.basePrice);
          const expected  = Math.floor(nowSec / tf.seconds) * tf.seconds;

          if (!d) { next[s.symbol] = d; continue; }

          if (expected > d.live.time) {
            /* ── Boundary cruzado: fecha vela live, abre nova ── */
            next[s.symbol] = {
              hist: [...d.hist.slice(-499), d.live],
              live: { time: expected, open: newPrice, high: newPrice, low: newPrice, close: newPrice },
            };
          } else {
            /* ── Ainda na mesma vela: actualiza high/low/close ── */
            next[s.symbol] = {
              hist: d.hist,
              live: {
                ...d.live,
                close: newPrice,
                high:  Math.max(d.live.high, newPrice),
                low:   Math.min(d.live.low,  newPrice),
              },
            };
          }
        }
        return next;
      });
    }, 1000);

    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [tf.seconds, evaluateStops, evaluatePendingOrders, recordEquity]);

  /* ─── Candles para o gráfico (hist + live) ───────────────────────── */
  const candles = useMemo(() => {
    const d = symData[symbol];
    if (!d) return [] as Candle[];
    return [...d.hist, d.live];
  }, [symData, symbol]);

  const last      = candles[candles.length - 1];
  const prev      = candles[candles.length - 2];
  const lastPrice = last?.close ?? meta.basePrice;
  const change    = last && prev ? last.close - prev.close : 0;
  const changePct = last && prev ? (change / prev.close) * 100 : 0;

  const priceMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of SYMBOLS) {
      const d = symData[s.symbol];
      m[s.symbol] = d?.live.close ?? s.basePrice;
    }
    return m;
  }, [symData]);

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
  const resetSim      = useAppStore((s) => s.resetSim);
  const simZeroedAt   = useAppStore((s) => s.simZeroedAt);

  const upnl = calcUnrealizedPnL(positions, priceMap);

  /* ── Cooldown (Anti-Impulso) ─────────────────────────── */
  const [cooldownUntil, setCooldownUntil]   = useState<number | null>(null);
  const [cooldownReason, setCooldownReason] = useState("");
  const [tickNow, setTickNow]               = useState(Date.now());
  // Initialize to -1 so the first effect run (which may fire AFTER Zustand
  // rehydrates from localStorage, causing history.length to jump from 0→N)
  // is always treated as a "baseline snapshot" and never shows stale feedback.
  const prevHistLen = useRef(-1);

  // Ticking clock — updates every second for the countdown
  useEffect(() => {
    const iv = setInterval(() => setTickNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Detect new trade closures and trigger cooldown if needed
  useEffect(() => {
    // -1 means first run. Snapshot the current length (could be post-hydration)
    // without treating existing trades as new ones.
    if (prevHistLen.current === -1) {
      prevHistLen.current = history.length;
      return;
    }
    if (history.length <= prevHistLen.current) {
      prevHistLen.current = history.length;
      return;
    }
    prevHistLen.current = history.length;
    const latest = history[0];
    if (!latest) return;

    // Liquidation → 15 min
    if (latest.reason === "liquidation") {
      setCooldownUntil(Date.now() + 15 * 60_000);
      setCooldownReason("liquidação — respira 15 minutos antes de continuar");
      toast.error("Liquidação! Cooldown de 15 min activado.");
      return;
    }
    // Single loss > 10% of equity → 10 min
    const eq = cash + positions.reduce((s, p) => s + positionMargin(p), 0);
    if (latest.pnl < 0 && eq > 0 && Math.abs(latest.pnl) / eq > 0.1) {
      setCooldownUntil(Date.now() + 10 * 60_000);
      setCooldownReason("perda grave (>10% do patrimônio) — respira 10 minutos");
      toast.error("Perda grave! Cooldown de 10 min activado.");
      return;
    }
    // 2 consecutive losses → 5 min
    const last2 = history.slice(0, 2);
    if (last2.length === 2 && last2.every((t) => t.pnl <= 0)) {
      setCooldownUntil(Date.now() + 5 * 60_000);
      setCooldownReason("2 perdas seguidas — respira 5 minutos");
      toast.warning("Cooldown de 5 min activado — 2 perdas seguidas.");
    }

    // Feedback inteligente de saída
    if (feedbackEnabled) {
      const fb = analyzeExit(latest, cash + positions.reduce((s, p) => s + positionMargin(p), 0) + upnl);
      if (fb.length > 0) {
        setExitFeedback(fb);
        if (exitFeedbackTimer.current) window.clearTimeout(exitFeedbackTimer.current);
        exitFeedbackTimer.current = window.setTimeout(() => setExitFeedback(null), 14_000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length]);

  const cooldownActive   = cooldownUntil != null && tickNow < cooldownUntil;
  const cooldownSecsLeft = cooldownActive ? Math.ceil((cooldownUntil! - tickNow) / 1000) : 0;

  /* ── Quarentena de Conta Zerada (30 dias) ────────────── */
  const bustCooldownEnd  = simZeroedAt != null ? simZeroedAt + COOLDOWN_MS : null;
  const onResetCooldown  = bustCooldownEnd != null && tickNow < bustCooldownEnd;
  const isBusted         = cash === 0 && positions.length === 0 && pendingOrders.length === 0;

  /* ── Custo Realista (Spread + Comissão) ─────────────── */
  const [spreadEnabled,     setSpreadEnabled]     = useState(true);
  const [commissionEnabled, setCommissionEnabled] = useState(true);

  /* ── Feedback Inteligente ────────────────────────────── */
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [exitFeedback, setExitFeedback]       = useState<TradeFeedback[] | null>(null);
  const exitFeedbackTimer = useRef<number | null>(null);
  const usedMargin = positions.reduce((sum, p) => sum + positionMargin(p), 0);
  const exposure = positions.reduce((sum, p) => sum + p.entryPrice * p.size, 0);
  const equityVal = cash + usedMargin + upnl;

  async function handleChartAnalysis() {
    setChartAnalyzing(true);
    setChartAnalysis(null);
    try {
      let rsiValue: number | undefined;
      if (showRsi && candles.length > 0) {
        const rsiVals = calcRsi(candles, rsiPeriod).filter((v): v is { time: number; value: number } => v != null);
        if (rsiVals.length > 0) rsiValue = rsiVals[rsiVals.length - 1].value;
      }
      let macdValue: number | undefined;
      let signalValue: number | undefined;
      if (showMacd && candles.length > 0) {
        const macdVals = calcMacd(candles, macdFast, macdSlow, macdSignal)
          .filter((v): v is { time: number; macd: number; signal: number; hist: number } => v != null);
        if (macdVals.length > 0) {
          macdValue   = macdVals[macdVals.length - 1].macd;
          signalValue = macdVals[macdVals.length - 1].signal;
        }
      }
      const result = await api.ai.analyzeChart({
        symbol,
        timeframe:    tf.label,
        chartType,
        currentPrice: candles[candles.length - 1]?.close ?? 0,
        lastCandles:  candles.slice(-20),
        showRsi,  rsiValue,  rsiPeriod,
        showMacd, macdValue, signalValue,
      });
      setChartAnalysis(result.analysis);
    } catch {
      toast.error("Erro ao obter análise do Aluka IA");
    } finally {
      setChartAnalyzing(false);
    }
  }

  return (
    <>
    <div className="container max-w-[1400px] py-3 lg:py-6 space-y-3 sm:space-y-4">
      {/* Cabeçalho — row 1: símbolo + preço */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="max-w-[150px] sm:max-w-none rounded-md border border-border bg-surface-1 px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary sm:px-3 sm:py-2 sm:text-sm"
          >
            {CATEGORIES.map((cat) => (
              <optgroup key={cat} label={cat}>
                {SYMBOLS.filter((s) => s.category === cat).map((s) => (
                  <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-mono text-lg font-bold sm:text-2xl">{fmtPrice(lastPrice, meta.precision)}</span>
            <span className={`stat-pill ${change >= 0 ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>
              {change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
            </span>
          </div>
        </div>
        {/* Stat pills — wrap on mobile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:gap-4 text-right">
          <Stat label="Saldo" value={fmtUSD(cash)} />
          <Stat label="Margem" value={fmtUSD(usedMargin)} />
          <Stat label="P&L" value={fmtUSD(upnl)} accent={upnl >= 0 ? "bull" : "bear"} />
          <Stat label="Patrim." value={fmtUSD(equityVal)} highlight />
        </div>
      </div>

      {/* Desafios ativos */}
      <ActiveChallengeBanner challenges={challenges} equityVal={equityVal} historyCount={history.length} />

      {/* Feedback de saída de trade */}
      {exitFeedback && exitFeedback.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Análise do teu trade</p>
            </div>
            <button onClick={() => setExitFeedback(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {exitFeedback.map((fb, i) => (
            <FeedbackCard key={i} item={fb} />
          ))}
        </div>
      )}

      {/* Conta zerada — banner de quarentena */}
      {isBusted && (
        <div className={`rounded-lg border p-4 ${onResetCooldown ? "border-bear/40 bg-bear/10" : "border-warning/40 bg-warning/10"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {onResetCooldown ? (
                <>
                  <p className="text-sm font-bold text-bear">💸 Conta zerada — em quarentena de 30 dias</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Esta é a experiência real: não há dinheiro fácil no mercado.
                    Reset disponível em: <span className="font-mono font-semibold text-foreground">{fmtCountdown(bustCooldownEnd! - tickNow)}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-warning">⚠️ Conta zerada — reset disponível</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Os 30 dias de quarentena passaram. Clique em "Reiniciar conta demo" no painel ao lado.
                  </p>
                </>
              )}
            </div>
            {onResetCooldown && (
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Zerou em</p>
                <p className="font-mono text-xs">{simZeroedAt ? new Date(simZeroedAt).toLocaleDateString("pt-BR") : "—"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Coluna principal — chart + tables (appears below order panel on mobile) */}
        <div className="space-y-4 order-last lg:order-first">
          {/* Gráfico */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-1 px-3 py-2">
              <div className="flex flex-wrap items-center gap-1">
                {TIMEFRAMES.map((t, i) => (
                  <button
                    key={t.label}
                    onClick={() => setTfIdx(i)}
                    className={`rounded px-2 py-1 font-mono text-[11px] font-semibold transition-colors sm:px-2.5 ${
                      i === tfIdx ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-2"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <CandleCountdown intervalSec={tf.seconds} />
              </div>
              <div className="flex items-center gap-2">
                {/* ── Seletor de tipo de gráfico ── */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 rounded border border-border/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-surface-2">
                      {(() => { const ct = CHART_TYPES.find(t => t.id === chartType)!; return <><ct.Icon className="h-3 w-3" /><span>{ct.short}</span><ChevronDown className="h-2.5 w-2.5 opacity-60" /></>; })()}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-44 p-1">
                    {CHART_TYPES.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        onClick={() => setChartType(id)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] transition-colors ${
                          chartType === id
                            ? "bg-primary/15 text-primary font-semibold"
                            : "text-foreground/80 hover:bg-surface-2"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {label}
                        {chartType === id && <span className="ml-auto text-primary">✓</span>}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                <div className="h-4 w-px bg-border/40" />
                <Badge variant="outline" className="font-mono text-[10px]">MM 20</Badge>
                <button
                  onClick={() => setShowRsi((v) => !v)}
                  className={`rounded px-2 py-1 font-mono text-[10px] font-semibold transition-colors ${showRsi ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2"}`}
                >RSI</button>
                <button
                  onClick={() => setShowMacd((v) => !v)}
                  className={`rounded px-2 py-1 font-mono text-[10px] font-semibold transition-colors ${showMacd ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2"}`}
                >MACD</button>

                <div className="h-4 w-px bg-border/40" />
                <button
                  onClick={() => {
                    const url = chartRef.current?.takeScreenshot();
                    if (url) { setChartPreview(url); setChartAnalysis(null); }
                  }}
                  title="Capturar gráfico"
                  className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <Camera className="h-3 w-3" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                {/* ── Botão Aluka IA ── */}
                <button
                  onClick={() => setFeedbackEnabled((v) => !v)}
                  title={feedbackEnabled ? "Desactivar análise de trades" : "Activar análise de trades"}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-all ${
                    feedbackEnabled
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-surface-2"
                  }`}
                >
                  <Brain className="h-3 w-3" />
                  <span className="hidden sm:inline">Aluka IA</span>
                  {feedbackEnabled && (
                    <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse" />
                  )}
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
                    {/* ── Realismo ── */}
                    <div className="border-t border-border pt-3 space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider">Realismo</Label>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium">Spread</p>
                          <p className="text-[10px] text-muted-foreground">Diferença entre compra e venda</p>
                        </div>
                        <Switch checked={spreadEnabled} onCheckedChange={setSpreadEnabled} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium">Comissão (0,1%)</p>
                          <p className="text-[10px] text-muted-foreground">Taxa por operação aberta</p>
                        </div>
                        <Switch checked={commissionEnabled} onCheckedChange={setCommissionEnabled} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium">Cooldown anti-impulso</p>
                          <p className="text-[10px] text-muted-foreground">Activo automaticamente</p>
                        </div>
                        <span className="text-[10px] font-semibold text-primary">ON</span>
                      </div>
                    </div>
                    {/* ── Feedback Inteligente ── */}
                    <div className="border-t border-border pt-3 space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Brain className="h-3.5 w-3.5 text-primary" />Feedback Inteligente
                      </Label>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium">Análise de trades</p>
                          <p className="text-[10px] text-muted-foreground">Tendência, stop, risco, R:R</p>
                        </div>
                        <Switch checked={feedbackEnabled} onCheckedChange={setFeedbackEnabled} />
                      </div>
                      {feedbackEnabled && (
                        <p className="text-[10px] text-primary bg-primary/10 rounded px-2 py-1">
                          ✓ Feedback activo — cada trade será analisado
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="w-full" style={{ height:
              windowWidth < 640
                ? (showRsi && showMacd ? 420 : showRsi || showMacd ? 340 : 260)
                : windowWidth < 1024
                ? (showRsi && showMacd ? 560 : showRsi || showMacd ? 460 : 400)
                : (showRsi && showMacd ? 720 : showRsi || showMacd ? 620 : 500)
            }}>
              <PriceChart
                ref={chartRef}
                candles={candles}
                precision={meta.precision}
                chartType={chartType}
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

        {/* Painel de ordem — aparece primeiro em mobile */}
        <div className="order-first lg:order-last">
        <OrderPanel
          symbol={symbol}
          lastPrice={lastPrice}
          precision={meta.precision}
          cash={cash}
          category={meta.category}
          spreadEnabled={spreadEnabled}
          commissionEnabled={commissionEnabled}
          cooldownActive={cooldownActive || (isBusted && onResetCooldown)}
          cooldownSecsLeft={cooldownSecsLeft}
          cooldownReason={cooldownReason}
          bustCooldownEnd={bustCooldownEnd}
          now={tickNow}
          onClearCooldown={() => setCooldownUntil(null)}
          feedbackEnabled={feedbackEnabled}
          candles={candles}
          equity={equityVal}
          onSubmitMarket={(order) => {
            if (cooldownActive) {
              toast.error("Trading bloqueado — aguarda o fim do cooldown.");
              return;
            }
            if (isBusted && onResetCooldown) {
              toast.error("Conta zerada. Aguarda o fim da quarentena de 30 dias.");
              return;
            }
            const entryPrice = calcEntryWithCost(
              lastPrice, order.side, meta.category, spreadEnabled, commissionEnabled,
            );
            const cost = estimateTradeCost(
              lastPrice, order.size, meta.category, spreadEnabled, commissionEnabled,
            );
            const id = openPosition({
              symbol,
              side: order.side,
              size: order.size,
              entryPrice,
              leverage: order.leverage,
              stopLoss: order.stopLoss,
              takeProfit: order.takeProfit,
              note: order.note,
            });
            if (!id) {
              toast.error("Margem insuficiente para abrir essa posição.");
            } else {
              toast.success(`${order.side === "buy" ? "Compra" : "Venda"} executada`, {
                description: `${order.size} ${symbol} @ ${fmtPrice(entryPrice, meta.precision)}${cost > 0 ? ` · custo: ${fmtUSD(cost)}` : ""}`,
              });
            }
          }}
          onSubmitPending={(order) => {
            if (cooldownActive) {
              toast.error("Trading bloqueado — aguarda o fim do cooldown.");
              return;
            }
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
          onReset={() => {
            if (onResetCooldown) {
              toast.error(`Reset bloqueado — quarentena termina em ${fmtCountdown(bustCooldownEnd! - tickNow)}`);
              return;
            }
            resetSim();
            toast.info("Conta demo reiniciada para $10.000.");
          }}
        />
        </div>
      </div>
    </div>

    {/* ── Modal de pré-visualização do gráfico ── */}
    {chartPreview && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={() => setChartPreview(null)}
      >
        <div
          className="relative flex flex-col gap-3 rounded-xl border border-border/60 bg-[#0d0f12] p-4 shadow-2xl max-w-4xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Pré-visualização do gráfico</span>
            </div>
            <button
              onClick={() => setChartPreview(null)}
              className="rounded p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <img
            src={chartPreview}
            alt="Gráfico capturado"
            className="w-full rounded-lg border border-border/30 object-contain"
            style={{ maxHeight: "55vh" }}
          />

          {/* ── Análise Aluka IA ── */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            {chartAnalysis ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-primary">Análise Aluka IA</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{chartAnalysis}</p>
                <button
                  onClick={handleChartAnalysis}
                  disabled={chartAnalyzing}
                  className="text-[10px] text-primary hover:underline disabled:opacity-50"
                >
                  Analisar novamente
                </button>
              </div>
            ) : (
              <button
                onClick={handleChartAnalysis}
                disabled={chartAnalyzing}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
              >
                {chartAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A analisar o gráfico...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Analisar com Aluka IA
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setChartPreview(null)}
              className="rounded-lg border border-border/50 px-4 py-1.5 text-sm text-muted-foreground hover:bg-surface-2 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const pad = (n: number) => String(n).padStart(2, "0");
                const ts  = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
                const link = document.createElement("a");
                link.download = `aluka-grafico-${ts}.png`;
                link.href = chartPreview;
                link.click();
              }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar imagem
            </button>
          </div>
        </div>
      </div>
    )}
    </>
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
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-primary/10 shrink-0">
            <IconByName name={def?.icon ?? "Target"} className="h-5 w-5 text-primary" />
          </div>
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
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-surface-3 shrink-0">
                  {def && <IconByName name={def.icon} className="h-4 w-4 text-muted-foreground" />}
                </div>
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
  symbol, lastPrice, precision, cash, category,
  spreadEnabled, commissionEnabled,
  cooldownActive, cooldownSecsLeft, cooldownReason, onClearCooldown,
  bustCooldownEnd, now,
  onSubmitMarket, onSubmitPending, onReset,
  feedbackEnabled, candles, equity,
}: {
  symbol: string;
  lastPrice: number;
  precision: number;
  cash: number;
  category: string;
  spreadEnabled: boolean;
  commissionEnabled: boolean;
  cooldownActive: boolean;
  cooldownSecsLeft: number;
  cooldownReason: string;
  onClearCooldown: () => void;
  bustCooldownEnd: number | null;
  now: number;
  onSubmitMarket: (o: OrderInput) => void;
  onSubmitPending: (o: OrderInput) => void;
  onReset: () => void;
  feedbackEnabled: boolean;
  candles: Candle[];
  equity: number;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [leverage, setLeverage] = useState<number>(1);
  const [orderType, setOrderType] = useState<OrderTypeUI>("market");
  const [triggerPrice, setTriggerPrice] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [entryFeedback, setEntryFeedback] = useState<TradeFeedback[] | null>(null);
  const entryFeedbackTimer = useRef<number | null>(null);

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

  // Reset form only when the symbol changes, not on every price tick.
  // defaultSize changes every second because lastPrice is live — keeping it
  // in the dependency array would clear SL/TP on every candle update.
  const defaultSizeRef = useRef(defaultSize);
  useEffect(() => {
    defaultSizeRef.current = defaultSize;
    setSize(String(defaultSize));
    setSl("");
    setTp("");
    setTriggerPrice("");
    setNote("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]); // intentionally omit defaultSize — we only want to reset on symbol change

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
      /* Feedback de entrada apenas em ordens de mercado executadas imediatamente */
      if (feedbackEnabled) {
        const fb = analyzeEntry(
          candles, side, effectivePrice,
          !isNaN(slNum) && slNum > 0 ? slNum : undefined,
          !isNaN(tpNum) && tpNum > 0 ? tpNum : undefined,
          sizeNum, leverage, equity,
        );
        if (fb.length > 0) {
          setEntryFeedback(fb);
          if (entryFeedbackTimer.current) window.clearTimeout(entryFeedbackTimer.current);
          entryFeedbackTimer.current = window.setTimeout(() => setEntryFeedback(null), 18_000);
        }
      }
    } else {
      onSubmitPending(order);
    }
    setNote("");
  };

  /* Custo estimado para exibição no painel */
  const tradeCost = estimateTradeCost(lastPrice, sizeNum, category, spreadEnabled, commissionEnabled);
  const spreadPct = spreadEnabled ? (SPREAD_PCT[category] ?? 0.0003) : 0;
  const commPct   = commissionEnabled ? COMMISSION_RATE : 0;
  const effectiveEntryDisplay = calcEntryWithCost(lastPrice, side, category, spreadEnabled, commissionEnabled);

  return (
    <Card className="h-fit p-4 space-y-3">
      {/* ── Banner de Cooldown ── */}
      {cooldownActive && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2 text-warning">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-bold">Trading bloqueado</span>
          </div>
          <p className="text-[11px] text-muted-foreground capitalize">{cooldownReason}</p>
          <div className="font-mono text-2xl font-bold text-warning">
            {Math.floor(cooldownSecsLeft / 60).toString().padStart(2, "0")}
            :{(cooldownSecsLeft % 60).toString().padStart(2, "0")}
          </div>
          <p className="text-[10px] text-muted-foreground">Respira. Revê o teu plano de trading.</p>
          <button
            onClick={onClearCooldown}
            className="text-[10px] text-muted-foreground underline hover:text-foreground mt-1"
          >
            Ignorar cooldown (não recomendado)
          </button>
        </div>
      )}

      {/* Comprar / Vender */}
      <div className={`grid grid-cols-2 gap-2 ${cooldownActive ? "opacity-40 pointer-events-none" : ""}`}>
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
            <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />Liquidação a {liqDistPct?.toFixed(2)}% de distância.
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
        {/* ── Custo Realista ── */}
        {(spreadEnabled || commissionEnabled) && sizeNum > 0 && (
          <>
            <div className="my-1.5 border-t border-border/50" />
            {spreadEnabled && (
              <MetricRow label={`Spread (${(spreadPct * 100).toFixed(3)}%)`} value={fmtUSD(notional * spreadPct)} mono valueClass="text-muted-foreground" />
            )}
            {commissionEnabled && (
              <MetricRow label={`Comissão (${(commPct * 100).toFixed(2)}%)`} value={fmtUSD(notional * commPct)} mono valueClass="text-muted-foreground" />
            )}
            <MetricRow label="Custo total" value={fmtUSD(tradeCost)} mono valueClass="text-warning" />
            {orderType === "market" && (
              <MetricRow label="Preço efectivo entrada" value={fmtPrice(effectiveEntryDisplay, precision)} mono valueClass="text-muted-foreground" />
            )}
          </>
        )}
      </div>

      {slBeyondLiq && <p className="text-[11px] text-warning flex items-center gap-1"><AlertTriangle className="h-3 w-3 shrink-0" />Stop além do preço de liquidação.</p>}
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

      {/* ── Feedback de Entrada ── */}
      {entryFeedback && entryFeedback.length > 0 && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Análise da entrada</span>
            </div>
            <button onClick={() => setEntryFeedback(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
          {entryFeedback.map((fb, i) => (
            <FeedbackCard key={i} item={fb} compact />
          ))}
        </div>
      )}

      <div className="border-t border-border pt-2 space-y-1.5">
        {bustCooldownEnd != null && now < bustCooldownEnd ? (
          <div className="rounded-md border border-bear/30 bg-bear/10 px-3 py-2 text-center">
            <p className="text-[11px] font-semibold text-bear">🔒 Conta em quarentena</p>
            <p className="mt-0.5 font-mono text-xs font-bold text-foreground">{fmtCountdown(bustCooldownEnd - now)}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Sinta o peso de perder dinheiro real.</p>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={onReset} className="w-full text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reiniciar conta demo
          </Button>
        )}
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

/* ============================================================
   COMPONENTE: Cartão de feedback de trade
============================================================ */

function FeedbackCard({ item, compact = false }: { item: TradeFeedback; compact?: boolean }) {
  const cfg = {
    success: {
      bg: "bg-bull/10 border-bull/30",
      text: "text-bull",
      icon: <ThumbsUp className="h-3.5 w-3.5 shrink-0 text-bull" />,
    },
    warning: {
      bg: "bg-warning/10 border-warning/30",
      text: "text-warning",
      icon: <Lightbulb className="h-3.5 w-3.5 shrink-0 text-warning" />,
    },
    error: {
      bg: "bg-bear/10 border-bear/30",
      text: "text-bear",
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-bear" />,
    },
    info: {
      bg: "bg-primary/10 border-primary/30",
      text: "text-primary",
      icon: <Zap className="h-3.5 w-3.5 shrink-0 text-primary" />,
    },
  }[item.type];

  return (
    <div className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 ${cfg.bg}`}>
      <div className="mt-0.5">{cfg.icon}</div>
      <div>
        <p className={`text-[11px] font-semibold ${cfg.text}`}>{item.message}</p>
        {item.hint && !compact && (
          <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">{item.hint}</p>
        )}
        {item.hint && compact && (
          <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">{item.hint}</p>
        )}
      </div>
    </div>
  );
}
