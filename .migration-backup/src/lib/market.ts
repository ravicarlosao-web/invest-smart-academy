/**
 * Mercado simulado — gera candles com geometric brownian motion + ruído.
 * Cada símbolo tem volatilidade e drift próprios. Os candles avançam em tempo real
 * com um intervalo configurável (1s para demo).
 */

export interface Candle {
  time: number; // unix segundos
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SymbolMeta {
  symbol: string;
  name: string;
  category: "Forex" | "Cripto" | "Ações";
  basePrice: number;
  volatility: number; // 0..1 — desvio padrão por step
  drift: number;      // tendência leve por step
  precision: number;  // casas decimais
}

export const SYMBOLS: SymbolMeta[] = [
  { symbol: "BTC/USD", name: "Bitcoin",  category: "Cripto", basePrice: 67_500, volatility: 0.0035, drift: 0.00005, precision: 2 },
  { symbol: "ETH/USD", name: "Ethereum", category: "Cripto", basePrice: 3_450,  volatility: 0.0042, drift: 0.00003, precision: 2 },
  { symbol: "EUR/USD", name: "Euro / Dólar", category: "Forex", basePrice: 1.0825, volatility: 0.0008, drift: 0.000005, precision: 5 },
  { symbol: "GBP/USD", name: "Libra / Dólar", category: "Forex", basePrice: 1.2640, volatility: 0.0010, drift: -0.000003, precision: 5 },
  { symbol: "AAPL",    name: "Apple Inc.", category: "Ações", basePrice: 215.40, volatility: 0.0018, drift: 0.00002, precision: 2 },
  { symbol: "TSLA",    name: "Tesla Inc.", category: "Ações", basePrice: 248.90, volatility: 0.0035, drift: 0.0,     precision: 2 },
];

export const SYMBOL_MAP: Record<string, SymbolMeta> = Object.fromEntries(
  SYMBOLS.map((s) => [s.symbol, s]),
);

function randn() {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Gera N candles históricos para inicializar o gráfico. */
export function seedCandles(meta: SymbolMeta, count: number, intervalSec: number, endTime = Math.floor(Date.now() / 1000)): Candle[] {
  const candles: Candle[] = [];
  let price = meta.basePrice * (1 + (Math.random() - 0.5) * 0.05);
  let t = endTime - count * intervalSec;
  // alinha em múltiplo do intervalo
  t = t - (t % intervalSec);
  for (let i = 0; i < count; i++) {
    const open = price;
    let high = open, low = open, close = open;
    const ticks = 5;
    for (let k = 0; k < ticks; k++) {
      const change = close * (meta.drift + meta.volatility * randn() * 0.4);
      close += change;
      if (close > high) high = close;
      if (close < low) low = close;
    }
    candles.push({ time: t, open, high, low, close });
    price = close;
    t += intervalSec;
  }
  return candles;
}

/** Gera o próximo candle a partir do último. */
export function nextCandle(meta: SymbolMeta, prev: Candle, intervalSec: number): Candle {
  const open = prev.close;
  let close = open;
  let high = open, low = open;
  const ticks = 5;
  for (let i = 0; i < ticks; i++) {
    const change = close * (meta.drift + meta.volatility * randn());
    close += change;
    if (close > high) high = close;
    if (close < low) low = close;
  }
  return {
    time: prev.time + intervalSec,
    open,
    high,
    low,
    close,
  };
}

export const TIMEFRAMES = [
  { label: "1m", seconds: 60 },
  { label: "5m", seconds: 300 },
  { label: "1h", seconds: 3600 },
  { label: "1D", seconds: 86_400 },
] as const;

export function fmtPrice(value: number, precision = 2) {
  return value.toLocaleString("en-US", { minimumFractionDigits: precision, maximumFractionDigits: precision });
}

export function fmtUSD(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
