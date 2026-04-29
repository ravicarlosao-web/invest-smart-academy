import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, Share2, Check, TrendingUp, TrendingDown } from "lucide-react";
import { toPng } from "html-to-image";
import type { ClosedTrade } from "@/store/useAppStore";
import { fmtPrice, fmtUSD, SYMBOL_MAP } from "@/lib/market";

interface Props {
  trade: ClosedTrade | null;
  open: boolean;
  onClose: () => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function pctChange(entry: number, exit: number, side: "buy" | "sell") {
  const dir = side === "buy" ? 1 : -1;
  return ((exit - entry) / entry) * 100 * dir;
}

export function TradeShareModal({ trade, open, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!trade) return null;

  const meta = SYMBOL_MAP[trade.symbol];
  const prec = meta?.precision ?? 2;
  const pct = pctChange(trade.entryPrice, trade.exitPrice, trade.side);
  const isWin = trade.pnl > 0;
  const reasonLabel = {
    manual: "Manual",
    stop: "Stop Loss",
    target: "Take Profit",
    liquidation: "Liquidação",
  }[trade.reason];

  async function downloadPng() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#0f1117" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `trade-${trade.symbol.replace("/", "")}-${trade.id.slice(-6)}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  }

  function copyText() {
    const dir = trade.side === "buy" ? "📈 BUY" : "📉 SELL";
    const emoji = isWin ? "✅" : "❌";
    const text = [
      `${emoji} Trade no TradeAcademy`,
      `${dir} ${trade.symbol}`,
      `Entrada: ${fmtPrice(trade.entryPrice, prec)} → Saída: ${fmtPrice(trade.exitPrice, prec)}`,
      `P&L: ${fmtUSD(trade.pnl)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`,
      `Saída: ${reasonLabel}`,
      `📊 tradeacademy.app`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    const text = `${isWin ? "✅" : "❌"} ${trade.side === "buy" ? "📈 BUY" : "📉 SELL"} ${trade.symbol} — P&L: ${fmtUSD(trade.pnl)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%) · TradeAcademy`;
    if (navigator.share) {
      await navigator.share({ title: "Meu trade no TradeAcademy", text });
    } else {
      copyText();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-background">
        <DialogTitle className="sr-only">Partilhar trade</DialogTitle>

        {/* Card a exportar */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-t-lg"
          style={{ background: "linear-gradient(135deg, #0f1117 0%, #1a1d2e 100%)" }}
        >
          {/* decoração */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 80% 20%, ${isWin ? "#22c55e" : "#ef4444"} 0%, transparent 60%)`,
            }}
          />

          <div className="relative px-6 py-8 space-y-5">
            {/* header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                  TradeAcademy
                </span>
              </div>
              <Badge
                className={`text-xs font-bold ${
                  trade.side === "buy"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {trade.side === "buy" ? "BUY" : "SELL"}
              </Badge>
            </div>

            {/* symbol */}
            <div>
              <p className="text-3xl font-black tracking-tight text-white">{trade.symbol}</p>
              <p className="mt-0.5 text-xs text-white/40">
                {formatDate(trade.openedAt)} → {formatDate(trade.closedAt)}
              </p>
            </div>

            {/* prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Entrada</p>
                <p className="mt-1 font-mono text-base font-bold text-white">
                  {fmtPrice(trade.entryPrice, prec)}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Saída</p>
                <p className="mt-1 font-mono text-base font-bold text-white">
                  {fmtPrice(trade.exitPrice, prec)}
                </p>
              </div>
            </div>

            {/* P&L */}
            <div className="rounded-2xl border border-white/10 px-6 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Resultado
              </p>
              <p
                className={`mt-1 font-mono text-4xl font-black ${
                  isWin ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isWin ? "+" : ""}{fmtUSD(trade.pnl)}
              </p>
              <div className="mt-1 flex items-center justify-center gap-1">
                {isWin ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                )}
                <span className={`font-mono text-sm font-semibold ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                  {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-between text-[10px] text-white/30">
              <span>Saída: {reasonLabel}</span>
              <span>Tamanho: {trade.size}</span>
            </div>
          </div>
        </div>

        {/* Botões de acção */}
        <div className="flex gap-2 p-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={downloadPng}
            disabled={downloading}
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? "A gerar…" : "Guardar PNG"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={copyText}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-bull" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado!" : "Copiar texto"}
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-2"
            onClick={nativeShare}
          >
            <Share2 className="h-3.5 w-3.5" />
            Partilhar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
