import type { Candle } from "@/lib/market";

export interface IndicatorPoint {
  time: number;
  value: number;
}

export interface MacdPoint {
  time: number;
  macd: number;
  signal: number;
  hist: number;
}

/** Simple moving average. */
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** Exponential moving average. Seeds with SMA of first `period` values. */
export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return out;
  const k = 2 / (period + 1);
  // seed
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let prev = sum / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/**
 * Wilder's RSI (classical) — uses smoothed averages of gains/losses.
 * Returns array aligned with input candles. Values outside warm-up are null.
 */
export function rsi(candles: Candle[], period = 14): (IndicatorPoint | null)[] {
  const out: (IndicatorPoint | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period + 1) return out;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gainSum += diff;
    else lossSum -= diff;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  const firstRsi =
    avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  out[period] = { time: candles[period].time, value: firstRsi };

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const value =
      avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    out[i] = { time: candles[i].time, value };
  }
  return out;
}

/**
 * MACD — line = EMA(fast) - EMA(slow), signal = EMA(macd, signalPeriod), hist = macd - signal.
 */
export function macd(
  candles: Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): (MacdPoint | null)[] {
  const closes = candles.map((c) => c.close);
  const fast = ema(closes, fastPeriod);
  const slow = ema(closes, slowPeriod);

  const macdLine: (number | null)[] = closes.map((_, i) => {
    const f = fast[i];
    const s = slow[i];
    return f != null && s != null ? f - s : null;
  });

  // Calcula signal somente sobre a parte definida
  const firstDefined = macdLine.findIndex((v) => v != null);
  const out: (MacdPoint | null)[] = new Array(candles.length).fill(null);
  if (firstDefined === -1) return out;

  const valid = macdLine.slice(firstDefined).map((v) => v as number);
  const signalArr = ema(valid, signalPeriod);

  for (let i = 0; i < valid.length; i++) {
    const sig = signalArr[i];
    if (sig == null) continue;
    const idx = firstDefined + i;
    const m = valid[i];
    out[idx] = {
      time: candles[idx].time,
      macd: m,
      signal: sig,
      hist: m - sig,
    };
  }
  return out;
}
