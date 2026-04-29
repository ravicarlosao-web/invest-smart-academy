import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/market";

interface Props {
  candles: Candle[];
  precision: number;
  movingAverage?: number; // ex: 20 para MM20
  className?: string;
}

export function PriceChart({ candles, precision, movingAverage = 20, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const maRef = useRef<ISeriesApi<"Line"> | null>(null);

  // init
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(220, 226, 235, 0.7)",
        fontFamily: "Inter, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
      autoSize: true,
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "hsl(152 78% 42%)",
      downColor: "hsl(350 89% 60%)",
      borderUpColor: "hsl(152 78% 42%)",
      borderDownColor: "hsl(350 89% 60%)",
      wickUpColor: "hsl(152 78% 42%)",
      wickDownColor: "hsl(350 89% 60%)",
      priceFormat: { type: "price", precision, minMove: 1 / Math.pow(10, precision) },
    });
    seriesRef.current = series;

    const ma = chart.addSeries(LineSeries, {
      color: "hsl(192 95% 55%)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    maRef.current = ma;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      maRef.current = null;
    };
  }, [precision]);

  // dados
  useEffect(() => {
    if (!seriesRef.current) return;
    const data: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    seriesRef.current.setData(data);

    // Calcula MM
    if (maRef.current && movingAverage > 0) {
      const ma: { time: Time; value: number }[] = [];
      for (let i = movingAverage - 1; i < candles.length; i++) {
        let sum = 0;
        for (let k = 0; k < movingAverage; k++) sum += candles[i - k].close;
        ma.push({ time: candles[i].time as UTCTimestamp, value: sum / movingAverage });
      }
      maRef.current.setData(ma);
    }
  }, [candles, movingAverage]);

  return <div ref={containerRef} className={className} />;
}
