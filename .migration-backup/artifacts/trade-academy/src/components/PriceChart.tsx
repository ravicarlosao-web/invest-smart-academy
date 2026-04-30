import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/market";
import { rsi as calcRsi, macd as calcMacd } from "@/lib/indicators";

interface Props {
  candles: Candle[];
  precision: number;
  movingAverage?: number;
  showRsi?: boolean;
  rsiPeriod?: number;
  showMacd?: boolean;
  macdFast?: number;
  macdSlow?: number;
  macdSignal?: number;
  className?: string;
}

const COLORS = {
  up: "hsl(152 78% 42%)",
  down: "hsl(350 89% 60%)",
  ma: "hsl(192 95% 55%)",
  rsi: "hsl(38 92% 60%)",
  rsiGuide: "rgba(220, 226, 235, 0.25)",
  macd: "hsl(192 95% 55%)",
  signal: "hsl(38 92% 60%)",
  text: "rgba(220, 226, 235, 0.7)",
  border: "rgba(255,255,255,0.06)",
  grid: "rgba(255,255,255,0.04)",
};

function baseLayout() {
  return {
    layout: {
      background: { color: "transparent" as const },
      textColor: COLORS.text,
      fontFamily: "Inter, sans-serif",
    },
    grid: {
      vertLines: { color: COLORS.grid },
      horzLines: { color: COLORS.grid },
    },
    rightPriceScale: { borderColor: COLORS.border },
    timeScale: { borderColor: COLORS.border, timeVisible: true, secondsVisible: false },
    crosshair: { mode: 1 as const },
    autoSize: true,
  };
}

export function PriceChart({
  candles,
  precision,
  movingAverage = 20,
  showRsi = false,
  rsiPeriod = 14,
  showMacd = false,
  macdFast = 12,
  macdSlow = 26,
  macdSignal = 9,
  className,
}: Props) {
  const mainRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  const mainChart = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const maSeries = useRef<ISeriesApi<"Line"> | null>(null);

  const rsiChart = useRef<IChartApi | null>(null);
  const rsiSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const rsi70 = useRef<ISeriesApi<"Line"> | null>(null);
  const rsi30 = useRef<ISeriesApi<"Line"> | null>(null);

  const macdChart = useRef<IChartApi | null>(null);
  const macdLine = useRef<ISeriesApi<"Line"> | null>(null);
  const signalLine = useRef<ISeriesApi<"Line"> | null>(null);
  const histSeries = useRef<ISeriesApi<"Histogram"> | null>(null);

  // ---- init / re-init main chart when precision changes ----
  useEffect(() => {
    if (!mainRef.current) return;
    const chart = createChart(mainRef.current, baseLayout());
    mainChart.current = chart;

    candleSeries.current = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.up,
      downColor: COLORS.down,
      borderUpColor: COLORS.up,
      borderDownColor: COLORS.down,
      wickUpColor: COLORS.up,
      wickDownColor: COLORS.down,
      priceFormat: { type: "price", precision, minMove: 1 / Math.pow(10, precision) },
    });

    maSeries.current = chart.addSeries(LineSeries, {
      color: COLORS.ma,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    return () => {
      chart.remove();
      mainChart.current = null;
      candleSeries.current = null;
      maSeries.current = null;
    };
  }, [precision]);

  // ---- RSI chart lifecycle ----
  useEffect(() => {
    if (!showRsi || !rsiContainerRef.current) return;
    const chart = createChart(rsiContainerRef.current, {
      ...baseLayout(),
      rightPriceScale: { borderColor: COLORS.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
    });
    rsiChart.current = chart;

    rsiSeries.current = chart.addSeries(LineSeries, {
      color: COLORS.rsi,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });
    rsi70.current = chart.addSeries(LineSeries, {
      color: COLORS.rsiGuide,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    rsi30.current = chart.addSeries(LineSeries, {
      color: COLORS.rsiGuide,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    return () => {
      chart.remove();
      rsiChart.current = null;
      rsiSeries.current = null;
      rsi70.current = null;
      rsi30.current = null;
    };
  }, [showRsi]);

  // ---- MACD chart lifecycle ----
  useEffect(() => {
    if (!showMacd || !macdContainerRef.current) return;
    const chart = createChart(macdContainerRef.current, baseLayout());
    macdChart.current = chart;

    histSeries.current = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
      priceLineVisible: false,
      lastValueVisible: false,
    });
    macdLine.current = chart.addSeries(LineSeries, {
      color: COLORS.macd,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
    });
    signalLine.current = chart.addSeries(LineSeries, {
      color: COLORS.signal,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
    });

    return () => {
      chart.remove();
      macdChart.current = null;
      macdLine.current = null;
      signalLine.current = null;
      histSeries.current = null;
    };
  }, [showMacd]);

  // ---- Sync time scales between charts ----
  useEffect(() => {
    const charts = [mainChart.current, rsiChart.current, macdChart.current].filter(
      (c): c is IChartApi => !!c,
    );
    if (charts.length < 2) return;

    const handlers: Array<() => void> = [];
    for (const src of charts) {
      const handler = (range: { from: Time; to: Time } | null) => {
        if (!range) return;
        for (const tgt of charts) {
          if (tgt === src) continue;
          tgt.timeScale().setVisibleRange(range);
        }
      };
      src.timeScale().subscribeVisibleTimeRangeChange(handler);
      handlers.push(() => src.timeScale().unsubscribeVisibleTimeRangeChange(handler));
    }
    return () => handlers.forEach((fn) => fn());
  }, [showRsi, showMacd]);

  // ---- Push data ----
  useEffect(() => {
    if (!candleSeries.current) return;
    const data: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.current.setData(data);

    if (maSeries.current && movingAverage > 0) {
      const ma: { time: Time; value: number }[] = [];
      for (let i = movingAverage - 1; i < candles.length; i++) {
        let sum = 0;
        for (let k = 0; k < movingAverage; k++) sum += candles[i - k].close;
        ma.push({ time: candles[i].time as UTCTimestamp, value: sum / movingAverage });
      }
      maSeries.current.setData(ma);
    }
  }, [candles, movingAverage]);

  // RSI data
  useEffect(() => {
    if (!showRsi || !rsiSeries.current) return;
    const values = calcRsi(candles, rsiPeriod);
    const data = values
      .filter((v): v is { time: number; value: number } => v != null)
      .map((v) => ({ time: v.time as UTCTimestamp, value: v.value }));
    rsiSeries.current.setData(data);

    if (rsi70.current && rsi30.current && data.length > 0) {
      const first = data[0].time;
      const last = data[data.length - 1].time;
      rsi70.current.setData([
        { time: first, value: 70 },
        { time: last, value: 70 },
      ]);
      rsi30.current.setData([
        { time: first, value: 30 },
        { time: last, value: 30 },
      ]);
    }
  }, [candles, showRsi, rsiPeriod]);

  // MACD data
  useEffect(() => {
    if (!showMacd || !macdLine.current || !signalLine.current || !histSeries.current) return;
    const values = calcMacd(candles, macdFast, macdSlow, macdSignal);
    const defined = values.filter(
      (v): v is { time: number; macd: number; signal: number; hist: number } => v != null,
    );
    macdLine.current.setData(
      defined.map((v) => ({ time: v.time as UTCTimestamp, value: v.macd })),
    );
    signalLine.current.setData(
      defined.map((v) => ({ time: v.time as UTCTimestamp, value: v.signal })),
    );
    histSeries.current.setData(
      defined.map((v) => ({
        time: v.time as UTCTimestamp,
        value: v.hist,
        color: v.hist >= 0 ? "hsl(152 78% 42% / 0.6)" : "hsl(350 89% 60% / 0.6)",
      })),
    );
  }, [candles, showMacd, macdFast, macdSlow, macdSignal]);

  // Layout: main chart shrinks when sub-panes are visible
  const subPanes = (showRsi ? 1 : 0) + (showMacd ? 1 : 0);
  const mainBasis =
    subPanes === 0 ? "100%" : subPanes === 1 ? "70%" : "55%";
  const subBasis = subPanes === 1 ? "30%" : "22.5%";

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column" }}>
      <div ref={mainRef} style={{ flexBasis: mainBasis, minHeight: 0 }} />
      {showRsi && (
        <div style={{ flexBasis: subBasis, minHeight: 0, borderTop: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              RSI ({rsiPeriod})
            </span>
          </div>
          <div ref={rsiContainerRef} style={{ height: "calc(100% - 18px)" }} />
        </div>
      )}
      {showMacd && (
        <div style={{ flexBasis: subBasis, minHeight: 0, borderTop: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              MACD ({macdFast}, {macdSlow}, {macdSignal})
            </span>
          </div>
          <div ref={macdContainerRef} style={{ height: "calc(100% - 18px)" }} />
        </div>
      )}
    </div>
  );
}
