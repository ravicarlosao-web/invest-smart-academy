/**
 * Mercado simulado — gera candles com geometric brownian motion + ruído.
 * Cada símbolo tem volatilidade e drift próprios.
 *
 * Modo "tempo real":
 *  - Price ticks chegam a 1 Hz para todos os timeframes.
 *  - A vela LIVE acumula high/low/close a cada tick.
 *  - Quando o relógio cruza o boundary do intervalo, a vela live é finalizada
 *    e uma nova começa — idêntico ao comportamento de plataformas reais.
 */

export interface Candle {
  time: number; // unix segundos (início da vela)
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SymbolMeta {
  symbol:     string;
  name:       string;
  category:   "Forex" | "Cripto" | "Ações" | "Commodities" | "Índices";
  basePrice:  number;
  volatility: number; // desvio padrão POR VELA (candle-level)
  drift:      number; // tendência leve por vela
  precision:  number; // casas decimais
}

export const SYMBOLS: SymbolMeta[] = [

  /* ════════ CRIPTO ════════════════════════════════════════════════ */
  { symbol: "BTC/USD",  name: "Bitcoin",             category: "Cripto",      basePrice: 67_500,  volatility: 0.0035, drift:  0.00005,   precision: 2 },
  { symbol: "ETH/USD",  name: "Ethereum",            category: "Cripto",      basePrice: 3_450,   volatility: 0.0042, drift:  0.00003,   precision: 2 },
  { symbol: "BNB/USD",  name: "BNB",                 category: "Cripto",      basePrice: 420,     volatility: 0.0038, drift:  0.00002,   precision: 2 },
  { symbol: "SOL/USD",  name: "Solana",              category: "Cripto",      basePrice: 185,     volatility: 0.0050, drift:  0.00004,   precision: 2 },
  { symbol: "XRP/USD",  name: "XRP (Ripple)",        category: "Cripto",      basePrice: 0.55,    volatility: 0.0045, drift:  0.00001,   precision: 4 },
  { symbol: "ADA/USD",  name: "Cardano",             category: "Cripto",      basePrice: 0.55,    volatility: 0.0048, drift:  0.000005,  precision: 4 },
  { symbol: "DOGE/USD", name: "Dogecoin",            category: "Cripto",      basePrice: 0.18,    volatility: 0.0060, drift:  0.0,       precision: 5 },
  { symbol: "DOT/USD",  name: "Polkadot",            category: "Cripto",      basePrice: 10.50,   volatility: 0.0046, drift:  0.00001,   precision: 3 },
  { symbol: "AVAX/USD", name: "Avalanche",           category: "Cripto",      basePrice: 42.00,   volatility: 0.0052, drift:  0.00003,   precision: 2 },
  { symbol: "LINK/USD", name: "Chainlink",           category: "Cripto",      basePrice: 18.00,   volatility: 0.0049, drift:  0.00002,   precision: 3 },
  { symbol: "LTC/USD",  name: "Litecoin",            category: "Cripto",      basePrice: 92.00,   volatility: 0.0036, drift:  0.0,       precision: 2 },
  { symbol: "UNI/USD",  name: "Uniswap",             category: "Cripto",      basePrice: 12.50,   volatility: 0.0055, drift:  0.00001,   precision: 3 },
  { symbol: "ATOM/USD", name: "Cosmos",              category: "Cripto",      basePrice: 10.50,   volatility: 0.0046, drift:  0.00001,   precision: 3 },
  { symbol: "MATIC/USD",name: "Polygon (POL)",       category: "Cripto",      basePrice: 0.92,    volatility: 0.0050, drift:  0.00001,   precision: 4 },

  /* ════════ FOREX ═════════════════════════════════════════════════ */
  { symbol: "EUR/USD",  name: "Euro / Dólar",        category: "Forex",       basePrice: 1.0825,  volatility: 0.0008, drift:  0.000005,  precision: 5 },
  { symbol: "GBP/USD",  name: "Libra / Dólar",       category: "Forex",       basePrice: 1.2640,  volatility: 0.0010, drift: -0.000003,  precision: 5 },
  { symbol: "USD/JPY",  name: "Dólar / Iene",        category: "Forex",       basePrice: 151.50,  volatility: 0.0007, drift:  0.000003,  precision: 3 },
  { symbol: "USD/CHF",  name: "Dólar / Franco Suíço",category: "Forex",       basePrice: 0.9045,  volatility: 0.0007, drift: -0.000002,  precision: 5 },
  { symbol: "AUD/USD",  name: "Dólar Aus. / Dólar",  category: "Forex",       basePrice: 0.6530,  volatility: 0.0009, drift:  0.000002,  precision: 5 },
  { symbol: "NZD/USD",  name: "Dólar NZ / Dólar",    category: "Forex",       basePrice: 0.6120,  volatility: 0.0009, drift:  0.000001,  precision: 5 },
  { symbol: "USD/CAD",  name: "Dólar / Dólar Can.",  category: "Forex",       basePrice: 1.3540,  volatility: 0.0008, drift: -0.000002,  precision: 5 },
  { symbol: "EUR/GBP",  name: "Euro / Libra",        category: "Forex",       basePrice: 0.8570,  volatility: 0.0007, drift:  0.000001,  precision: 5 },
  { symbol: "EUR/JPY",  name: "Euro / Iene",         category: "Forex",       basePrice: 163.90,  volatility: 0.0008, drift:  0.000004,  precision: 3 },
  { symbol: "GBP/JPY",  name: "Libra / Iene",        category: "Forex",       basePrice: 191.40,  volatility: 0.0011, drift:  0.000003,  precision: 3 },
  { symbol: "USD/BRL",  name: "Dólar / Real",        category: "Forex",       basePrice: 5.05,    volatility: 0.0012, drift:  0.000005,  precision: 4 },
  { symbol: "EUR/BRL",  name: "Euro / Real",         category: "Forex",       basePrice: 5.47,    volatility: 0.0013, drift:  0.000006,  precision: 4 },

  /* ════════ ACÇÕES ════════════════════════════════════════════════ */
  { symbol: "AAPL",     name: "Apple Inc.",          category: "Ações",       basePrice: 215.40,  volatility: 0.0018, drift:  0.00002,   precision: 2 },
  { symbol: "TSLA",     name: "Tesla Inc.",          category: "Ações",       basePrice: 248.90,  volatility: 0.0035, drift:  0.0,       precision: 2 },
  { symbol: "MSFT",     name: "Microsoft",           category: "Ações",       basePrice: 425.50,  volatility: 0.0015, drift:  0.00003,   precision: 2 },
  { symbol: "GOOGL",    name: "Alphabet (Google)",   category: "Ações",       basePrice: 175.30,  volatility: 0.0016, drift:  0.00002,   precision: 2 },
  { symbol: "AMZN",     name: "Amazon",              category: "Ações",       basePrice: 195.80,  volatility: 0.0017, drift:  0.00003,   precision: 2 },
  { symbol: "NVDA",     name: "NVIDIA",              category: "Ações",       basePrice: 875.00,  volatility: 0.0032, drift:  0.00008,   precision: 2 },
  { symbol: "META",     name: "Meta Platforms",      category: "Ações",       basePrice: 520.00,  volatility: 0.0022, drift:  0.00004,   precision: 2 },
  { symbol: "NFLX",     name: "Netflix",             category: "Ações",       basePrice: 680.00,  volatility: 0.0025, drift:  0.00003,   precision: 2 },
  { symbol: "AMD",      name: "AMD",                 category: "Ações",       basePrice: 175.00,  volatility: 0.0030, drift:  0.00004,   precision: 2 },
  { symbol: "JPM",      name: "JPMorgan Chase",      category: "Ações",       basePrice: 215.00,  volatility: 0.0016, drift:  0.00002,   precision: 2 },
  { symbol: "V",        name: "Visa",                category: "Ações",       basePrice: 285.00,  volatility: 0.0014, drift:  0.00002,   precision: 2 },
  { symbol: "MA",       name: "Mastercard",          category: "Ações",       basePrice: 475.00,  volatility: 0.0015, drift:  0.00002,   precision: 2 },
  { symbol: "DIS",      name: "Disney",              category: "Ações",       basePrice: 110.00,  volatility: 0.0020, drift: -0.000005,  precision: 2 },
  { symbol: "COIN",     name: "Coinbase",            category: "Ações",       basePrice: 220.00,  volatility: 0.0038, drift:  0.00003,   precision: 2 },
  { symbol: "SHOP",     name: "Shopify",             category: "Ações",       basePrice: 90.00,   volatility: 0.0026, drift:  0.00002,   precision: 2 },

  /* ════════ COMMODITIES ════════════════════════════════════════════ */
  { symbol: "XAU/USD",  name: "Ouro (Gold)",         category: "Commodities", basePrice: 2_340,   volatility: 0.0012, drift:  0.00002,   precision: 2 },
  { symbol: "XAG/USD",  name: "Prata (Silver)",      category: "Commodities", basePrice: 29.50,   volatility: 0.0020, drift:  0.00001,   precision: 3 },
  { symbol: "OIL/USD",  name: "Petróleo WTI",        category: "Commodities", basePrice: 82.50,   volatility: 0.0022, drift: -0.000005,  precision: 2 },
  { symbol: "BRENT",    name: "Petróleo Brent",      category: "Commodities", basePrice: 86.00,   volatility: 0.0021, drift: -0.000005,  precision: 2 },
  { symbol: "GAS/USD",  name: "Gás Natural",         category: "Commodities", basePrice: 2.30,    volatility: 0.0040, drift:  0.000005,  precision: 3 },
  { symbol: "COPPER",   name: "Cobre",               category: "Commodities", basePrice: 4.25,    volatility: 0.0018, drift:  0.000005,  precision: 3 },
  { symbol: "WHEAT",    name: "Trigo",               category: "Commodities", basePrice: 5.85,    volatility: 0.0018, drift: -0.000002,  precision: 3 },
  { symbol: "CORN",     name: "Milho",               category: "Commodities", basePrice: 4.50,    volatility: 0.0016, drift: -0.000001,  precision: 3 },

  /* ════════ ÍNDICES ════════════════════════════════════════════════ */
  { symbol: "SPX500",   name: "S&P 500",             category: "Índices",     basePrice: 5_280,   volatility: 0.0010, drift:  0.000015,  precision: 2 },
  { symbol: "NAS100",   name: "NASDAQ 100",          category: "Índices",     basePrice: 18_400,  volatility: 0.0013, drift:  0.000018,  precision: 2 },
  { symbol: "DJ30",     name: "Dow Jones 30",        category: "Índices",     basePrice: 38_900,  volatility: 0.0009, drift:  0.000012,  precision: 2 },
  { symbol: "DAX40",    name: "DAX 40 (Alemanha)",   category: "Índices",     basePrice: 18_200,  volatility: 0.0011, drift:  0.000013,  precision: 2 },
  { symbol: "FTSE100",  name: "FTSE 100 (Londres)",  category: "Índices",     basePrice: 8_200,   volatility: 0.0009, drift:  0.000010,  precision: 2 },
  { symbol: "N225",     name: "Nikkei 225",          category: "Índices",     basePrice: 38_800,  volatility: 0.0012, drift:  0.000010,  precision: 2 },
  { symbol: "CAC40",    name: "CAC 40 (França)",     category: "Índices",     basePrice: 8_050,   volatility: 0.0010, drift:  0.000011,  precision: 2 },
  { symbol: "IBOV",     name: "IBOVESPA",            category: "Índices",     basePrice: 128_500, volatility: 0.0014, drift:  0.000008,  precision: 0 },
];

export const SYMBOL_MAP: Record<string, SymbolMeta> = Object.fromEntries(
  SYMBOLS.map((s) => [s.symbol, s]),
);

/* ──────────────────────────────────────────────────────────
   Gerador de ruído gaussiano (Box-Muller)
────────────────────────────────────────────────────────── */
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ──────────────────────────────────────────────────────────
   Tempo real: início da vela actual alinhado ao intervalo
────────────────────────────────────────────────────────── */
export function currentCandleStart(intervalSec: number): number {
  const nowSec = Math.floor(Date.now() / 1000);
  return Math.floor(nowSec / intervalSec) * intervalSec;
}

/* ──────────────────────────────────────────────────────────
   Price tick — volatilidade escalada por sqrt(interval)
   para que o corpo da vela seja consistente entre TFs.
────────────────────────────────────────────────────────── */
export function priceTick(meta: SymbolMeta, currentPrice: number, intervalSec: number): number {
  // tickVol escala para que N ticks (=intervalSec) produzam ~meta.volatility de movimento
  const tickVol   = meta.volatility / Math.sqrt(Math.max(1, intervalSec));
  const tickDrift = meta.drift       / Math.max(1, intervalSec);
  const change    = currentPrice * (tickDrift + tickVol * randn());
  // Garante que o preço não cai para zero/negativo
  return Math.max(currentPrice * 0.0001, currentPrice + change);
}

/* ──────────────────────────────────────────────────────────
   Seed de candles históricos (geração acelerada)
   Termina em endTime — liveStart (a vela live começa aí)
────────────────────────────────────────────────────────── */
export function seedCandles(
  meta: SymbolMeta,
  count: number,
  intervalSec: number,
  endTime = Math.floor(Date.now() / 1000),
): Candle[] {
  const candles: Candle[] = [];
  let price = meta.basePrice * (1 + (Math.random() - 0.5) * 0.05);
  let t = endTime - count * intervalSec;
  t = t - (t % intervalSec); // alinha ao boundary
  for (let i = 0; i < count; i++) {
    const open = price;
    let high = open, low = open, close = open;
    // Simula N ticks acelerados por vela (usa volatilidade já por-vela)
    const ticks = 8;
    for (let k = 0; k < ticks; k++) {
      const change = close * (meta.drift + meta.volatility * randn() * 0.35);
      close += change;
      if (close > high) high = close;
      if (close < low)  low  = close;
    }
    close = Math.max(close, open * 0.0001);
    high  = Math.max(high, open, close);
    low   = Math.min(low, open, close);
    candles.push({ time: t, open, high, low, close });
    price = close;
    t    += intervalSec;
  }
  return candles;
}

/** @deprecated — mantido para compatibilidade. Usa priceTick + live candle em vez disto. */
export function nextCandle(meta: SymbolMeta, prev: Candle, intervalSec: number): Candle {
  const open = prev.close;
  let close = open;
  let high = open, low = open;
  for (let i = 0; i < 5; i++) {
    const change = close * (meta.drift + meta.volatility * randn());
    close += change;
    if (close > high) high = close;
    if (close < low)  low  = close;
  }
  return { time: prev.time + intervalSec, open, high, low, close };
}

/* ──────────────────────────────────────────────────────────
   Timeframes disponíveis
   1S  → nova vela a cada 1 segundo  (chart muito activo)
   1m  → nova vela a cada 1 minuto
   5m  → nova vela a cada 5 minutos
   1h  → nova vela a cada 1 hora
   4h  → nova vela a cada 4 horas
   1D  → nova vela a cada 1 dia
────────────────────────────────────────────────────────── */
export const TIMEFRAMES = [
  { label: "1S",  seconds: 1       },
  { label: "1m",  seconds: 60      },
  { label: "5m",  seconds: 300     },
  { label: "1h",  seconds: 3_600   },
  { label: "4h",  seconds: 14_400  },
  { label: "1D",  seconds: 86_400  },
] as const;

export const CATEGORIES = ["Cripto", "Forex", "Ações", "Commodities", "Índices"] as const;
export type Category = typeof CATEGORIES[number];

export function fmtPrice(value: number, precision = 2) {
  return value.toLocaleString("en-US", { minimumFractionDigits: precision, maximumFractionDigits: precision });
}

export function fmtUSD(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
