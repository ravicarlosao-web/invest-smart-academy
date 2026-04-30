export type NotifType = "achievement" | "mission" | "market" | "system" | "duelo";

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
  link?: string;
}

export const MARKET_ALERTS = [
  { symbol: "BTC/USD",  verb: "subiu",  pct: () => (Math.random() * 4 + 2).toFixed(1), hint: "Ver no Simulador" },
  { symbol: "BTC/USD",  verb: "caiu",   pct: () => (Math.random() * 3 + 1).toFixed(1), hint: "Oportunidade de short?" },
  { symbol: "ETH/USD",  verb: "subiu",  pct: () => (Math.random() * 5 + 1).toFixed(1), hint: "Momentum de alta!" },
  { symbol: "ETH/USD",  verb: "caiu",   pct: () => (Math.random() * 4 + 2).toFixed(1), hint: "Possível suporte em vista" },
  { symbol: "AAPL",     verb: "subiu",  pct: () => (Math.random() * 2 + 0.5).toFixed(1), hint: "Resultados trimestrais" },
  { symbol: "TSLA",     verb: "caiu",   pct: () => (Math.random() * 6 + 2).toFixed(1), hint: "Volatilidade elevada" },
  { symbol: "EUR/USD",  verb: "subiu",  pct: () => (Math.random() * 0.8 + 0.1).toFixed(2), hint: "Forex em movimento" },
  { symbol: "GOLD",     verb: "subiu",  pct: () => (Math.random() * 1.5 + 0.3).toFixed(1), hint: "Ativo de refúgio ativo" },
];

export function randomMarketAlert(): Omit<AppNotification, "id" | "read" | "createdAt"> {
  const a = MARKET_ALERTS[Math.floor(Math.random() * MARKET_ALERTS.length)];
  const pct = a.pct();
  return {
    type: "market",
    title: `Alerta de mercado — ${a.symbol}`,
    message: `${a.symbol} ${a.verb} ${pct}% — ${a.hint}`,
    link: "/simular",
  };
}
