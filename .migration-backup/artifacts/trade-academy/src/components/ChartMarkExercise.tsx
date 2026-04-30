import { useEffect, useMemo, useRef, useState } from "react";
import type { MarkChartCandle } from "@/data/curriculum";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";

export type LineKind = "support" | "resistance";

export interface MarkLine {
  id: string;
  kind: LineKind;
  price: number;
}

export interface MarkResult {
  correct: boolean;
  matchedSupports: number;
  matchedResistances: number;
  totalSupports: number;
  totalResistances: number;
  extras: number;
}

interface Props {
  candles: MarkChartCandle[];
  supports: number[];
  resistances: number[];
  /** Tolerância em % do range total de preço. */
  tolerancePct: number;
  revealed: boolean;
  onChange: (lines: MarkLine[]) => void;
}

const PADDING = { top: 20, right: 56, bottom: 24, left: 12 };
const HEIGHT = 360;

export function ChartMarkExercise({
  candles, supports, resistances, tolerancePct, revealed, onChange,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(720);
  const [lines, setLines] = useState<MarkLine[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Range de preço com leve folga
  const { minP, maxP } = useMemo(() => {
    let lo = Infinity, hi = -Infinity;
    for (const c of candles) {
      if (c.l < lo) lo = c.l;
      if (c.h > hi) hi = c.h;
    }
    const pad = (hi - lo) * 0.08;
    return { minP: lo - pad, maxP: hi + pad };
  }, [candles]);

  const priceRange = maxP - minP;
  const tolerance = (tolerancePct / 100) * priceRange;

  // Resize observer
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.max(320, e.contentRect.width));
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // Notifica parent
  useEffect(() => {
    onChange(lines);
  }, [lines, onChange]);

  const innerW = width - PADDING.left - PADDING.right;
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;
  const candleW = innerW / candles.length;
  const bodyW = Math.max(2, candleW * 0.65);

  const yFromPrice = (p: number) =>
    PADDING.top + ((maxP - p) / (maxP - minP)) * innerH;
  const priceFromY = (y: number) => {
    const clamped = Math.max(PADDING.top, Math.min(PADDING.top + innerH, y));
    return maxP - ((clamped - PADDING.top) / innerH) * (maxP - minP);
  };

  // Drag handlers (suporta mouse + touch via pointer events)
  const handlePointerDown = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingId(id);
  };
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
    const newPrice = priceFromY(y);
    setLines((ls) => ls.map((l) => (l.id === draggingId ? { ...l, price: +newPrice.toFixed(2) } : l)));
  };
  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingId) {
      try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
      setDraggingId(null);
    }
  };

  // Adicionar linha no centro do gráfico
  const addLine = (kind: LineKind) => {
    const startPrice = kind === "support"
      ? minP + priceRange * 0.25
      : minP + priceRange * 0.75;
    setLines((ls) => [
      ...ls,
      { id: `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, kind, price: +startPrice.toFixed(2) },
    ]);
  };

  const removeLine = (id: string) => setLines((ls) => ls.filter((l) => l.id !== id));
  const reset = () => setLines([]);

  // Linhas de eixo Y (referência)
  const ticks = useMemo(() => {
    const out: number[] = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) out.push(minP + ((maxP - minP) * i) / steps);
    return out;
  }, [minP, maxP]);

  // Avaliação por linha (quando revelado)
  const evalLine = (l: MarkLine): "ok" | "bad" => {
    const targets = l.kind === "support" ? supports : resistances;
    return targets.some((t) => Math.abs(t - l.price) <= tolerance) ? "ok" : "bad";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => addLine("support")} disabled={revealed}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          <ArrowDown className="mr-1 h-3.5 w-3.5 text-bull" />
          Suporte
        </Button>
        <Button size="sm" variant="outline" onClick={() => addLine("resistance")} disabled={revealed}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          <ArrowUp className="mr-1 h-3.5 w-3.5 text-bear" />
          Resistência
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={reset} disabled={revealed || lines.length === 0}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Limpar
        </Button>
      </div>

      <div ref={wrapperRef} className="rounded-lg border border-border bg-surface-1 overflow-hidden">
        <svg
          ref={svgRef}
          width={width}
          height={HEIGHT}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: "none", display: "block" }}
        >
          {/* grid horizontal + labels */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={yFromPrice(t)}
                y2={yFromPrice(t)}
                stroke="hsl(var(--border))"
                strokeOpacity={0.4}
                strokeDasharray="2 4"
              />
              <text
                x={width - PADDING.right + 4}
                y={yFromPrice(t) + 3}
                fontSize="10"
                fill="hsl(var(--muted-foreground))"
                fontFamily="ui-monospace, monospace"
              >
                {t.toFixed(2)}
              </text>
            </g>
          ))}

          {/* candles */}
          {candles.map((c, i) => {
            const x = PADDING.left + i * candleW + candleW / 2;
            const isUp = c.c >= c.o;
            const color = isUp ? "hsl(152 78% 42%)" : "hsl(350 89% 60%)";
            const yHigh = yFromPrice(c.h);
            const yLow = yFromPrice(c.l);
            const yOpen = yFromPrice(c.o);
            const yClose = yFromPrice(c.c);
            const top = Math.min(yOpen, yClose);
            const bodyH = Math.max(1, Math.abs(yClose - yOpen));
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1} />
                <rect x={x - bodyW / 2} y={top} width={bodyW} height={bodyH} fill={color} />
              </g>
            );
          })}

          {/* níveis verdadeiros (somente quando revelado) */}
          {revealed && (
            <g>
              {supports.map((s, i) => (
                <line
                  key={`tg-s-${i}`}
                  x1={PADDING.left}
                  x2={width - PADDING.right}
                  y1={yFromPrice(s)}
                  y2={yFromPrice(s)}
                  stroke="hsl(152 78% 42%)"
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                />
              ))}
              {resistances.map((r, i) => (
                <line
                  key={`tg-r-${i}`}
                  x1={PADDING.left}
                  x2={width - PADDING.right}
                  y1={yFromPrice(r)}
                  y2={yFromPrice(r)}
                  stroke="hsl(350 89% 60%)"
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                />
              ))}
            </g>
          )}

          {/* linhas marcadas pelo usuário */}
          {lines.map((l) => {
            const y = yFromPrice(l.price);
            const isSupport = l.kind === "support";
            const baseColor = isSupport ? "hsl(152 78% 42%)" : "hsl(350 89% 60%)";
            let color = baseColor;
            if (revealed) {
              color = evalLine(l) === "ok" ? "hsl(152 78% 50%)" : "hsl(38 92% 60%)";
            }
            return (
              <g key={l.id} style={{ cursor: revealed ? "default" : "ns-resize" }}>
                <line
                  x1={PADDING.left}
                  x2={width - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke={color}
                  strokeWidth={2}
                />
                {/* hit area mais larga para drag fácil */}
                {!revealed && (
                  <rect
                    x={PADDING.left}
                    y={y - 10}
                    width={width - PADDING.right - PADDING.left}
                    height={20}
                    fill="transparent"
                    onPointerDown={handlePointerDown(l.id)}
                  />
                )}
                {/* label à esquerda */}
                <rect
                  x={PADDING.left}
                  y={y - 9}
                  width={isSupport ? 56 : 70}
                  height={18}
                  rx={3}
                  fill={color}
                  fillOpacity={0.9}
                  onPointerDown={!revealed ? handlePointerDown(l.id) : undefined}
                />
                <text
                  x={PADDING.left + 6}
                  y={y + 4}
                  fontSize="10"
                  fontWeight={700}
                  fill="white"
                  fontFamily="ui-monospace, monospace"
                  pointerEvents="none"
                >
                  {isSupport ? "SUP" : "RES"} {l.price.toFixed(2)}
                </text>
                {/* botão remover */}
                {!revealed && (
                  <g
                    onPointerDown={(e) => { e.stopPropagation(); removeLine(l.id); }}
                    style={{ cursor: "pointer" }}
                  >
                    <circle cx={width - PADDING.right - 10} cy={y} r={8} fill="hsl(var(--surface-2))" stroke={color} />
                    <text
                      x={width - PADDING.right - 10}
                      y={y + 3}
                      fontSize="10"
                      textAnchor="middle"
                      fill="hsl(var(--foreground))"
                      pointerEvents="none"
                    >
                      ×
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Dica: clique em <span className="font-semibold text-bull">+ Suporte</span> ou{" "}
        <span className="font-semibold text-bear">+ Resistência</span> e arraste a linha até o nível
        desejado. Tolerância de acerto: ±{tolerancePct}% do range.
      </p>
    </div>
  );
}

/** Avalia se as linhas marcadas batem com os níveis-alvo. */
export function evaluateMarks(
  lines: MarkLine[],
  supports: number[],
  resistances: number[],
  tolerance: number,
): MarkResult {
  const usedS = new Set<number>();
  const usedR = new Set<number>();
  let extras = 0;
  for (const l of lines) {
    const targets = l.kind === "support" ? supports : resistances;
    const used = l.kind === "support" ? usedS : usedR;
    let matched = false;
    for (let i = 0; i < targets.length; i++) {
      if (used.has(i)) continue;
      if (Math.abs(targets[i] - l.price) <= tolerance) {
        used.add(i);
        matched = true;
        break;
      }
    }
    if (!matched) extras += 1;
  }
  const matchedSupports = usedS.size;
  const matchedResistances = usedR.size;
  // Aceita: todos os níveis cobertos e no máximo 1 extra
  const correct =
    matchedSupports === supports.length &&
    matchedResistances === resistances.length &&
    extras <= 1;
  return {
    correct,
    matchedSupports,
    matchedResistances,
    totalSupports: supports.length,
    totalResistances: resistances.length,
    extras,
  };
}
