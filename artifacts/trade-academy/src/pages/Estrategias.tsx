import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  Clock,
  BarChart2,
  CheckCircle2,
  XCircle,
  BookOpen,
  Lightbulb,
  ShieldCheck,
  LogIn,
  LogOut,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { STRATEGIES as STRATEGIES_STATIC, type Strategy, type RiskLevel } from "@/data/strategies";
import { IconByName } from "@/components/IconByName";
import { api } from "@/lib/apiClient";

/* ── helpers ─────────────────────────────────────────── */
const RISK_COLOR: Record<RiskLevel, string> = {
  Baixo:  "bg-bull/15 text-bull border-bull/30",
  Médio:  "bg-warning/15 text-warning border-warning/30",
  Alto:   "bg-bear/15 text-bear border-bear/30",
};

const DIFF_COLOR: Record<string, string> = {
  Iniciante:     "bg-primary/15 text-primary border-primary/30",
  Intermediário: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Avançado:      "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const ALL_MARKETS  = ["Todos", "Cripto", "Forex", "Ações", "Índices", "Commodities"];
const ALL_RISKS: RiskLevel[]   = ["Baixo", "Médio", "Alto"];
const ALL_DIFFS    = ["Iniciante", "Intermediário", "Avançado"];

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface-1 text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items, variant = "neutral" }: { items: string[]; variant?: "bull" | "bear" | "neutral" }) {
  const dot =
    variant === "bull"
      ? "text-bull"
      : variant === "bear"
      ? "text-bear"
      : "text-primary";
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className={`mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-current ${dot}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function StrategyCard({ strategy, defaultOpen }: { strategy: Strategy; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        open ? "border-primary/40 bg-card shadow-glow/5" : "border-border bg-card hover:border-primary/30"
      }`}
    >
      {/* Header — always visible */}
      <button
        className="w-full text-left p-4 sm:p-5"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-primary/10 shrink-0">
              <IconByName name={strategy.icon} className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-base leading-tight">{strategy.name}</h3>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold border ${RISK_COLOR[strategy.riskLevel]}`}
                >
                  {strategy.riskLevel}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold border ${DIFF_COLOR[strategy.difficulty]}`}
                >
                  {strategy.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{strategy.subtitle}</p>
            </div>
          </div>
          <div className="shrink-0 mt-0.5 text-muted-foreground">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {/* Key metrics row */}
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-1">
            <Target className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Taxa de acerto</span>
            <span className="text-[11px] font-bold text-foreground">{strategy.winRate}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-1">
            <BarChart2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">R:R</span>
            <span className="text-[11px] font-bold text-foreground">{strategy.riskReward}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{strategy.timeframes.join(" · ")}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {strategy.markets.map((m) => (
              <span key={m} className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {m}
              </span>
            ))}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-border px-4 sm:px-5 py-5 space-y-6">
          {/* Description */}
          <Section icon={BookOpen} title="O que é esta estratégia?">
            <p className="text-sm text-muted-foreground leading-relaxed">{strategy.description}</p>
          </Section>

          {/* How it works */}
          <Section icon={Lightbulb} title="Como funciona?">
            <p className="text-sm text-muted-foreground leading-relaxed">{strategy.howItWorks}</p>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Setup */}
            <Section icon={TrendingUp} title="Configuração inicial">
              <BulletList items={strategy.setup} />
            </Section>

            {/* Risk management */}
            <Section icon={ShieldCheck} title="Gestão de risco">
              <BulletList items={strategy.riskManagement} />
            </Section>

            {/* Entry signals */}
            <Section icon={LogIn} title="Sinais de entrada">
              <BulletList items={strategy.entrySignals} variant="bull" />
            </Section>

            {/* Exit signals */}
            <Section icon={LogOut} title="Sinais de saída">
              <BulletList items={strategy.exitSignals} variant="bear" />
            </Section>

            {/* Pros */}
            <Section icon={CheckCircle2} title="Vantagens">
              <ul className="space-y-1.5">
                {strategy.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bull" />
                    {p}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Cons */}
            <Section icon={XCircle} title="Desvantagens">
              <ul className="space-y-1.5">
                {strategy.cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bear" />
                    {c}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* Example */}
          <Section icon={Zap} title="Exemplo real">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-foreground leading-relaxed">{strategy.example}</p>
            </div>
          </Section>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {strategy.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-surface-1 px-2.5 py-0.5 text-[11px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function Estrategias() {
  const [strategies, setStrategies] = useState<Strategy[]>(STRATEGIES_STATIC);
  const [marketFilter, setMarketFilter] = useState("Todos");
  const [riskFilter,   setRiskFilter]   = useState<RiskLevel | "Todos">("Todos");
  const [diffFilter,   setDiffFilter]   = useState("Todos");
  const [search,       setSearch]       = useState("");

  useEffect(() => {
    api.content.strategies()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setStrategies(data as Strategy[]); })
      .catch(() => {/* keep static fallback */});
  }, []);

  const filtered = useMemo(() => {
    return strategies.filter((s) => {
      if (marketFilter !== "Todos" && !s.markets.includes(marketFilter) && !s.markets.includes("Todos")) return false;
      if (riskFilter !== "Todos" && s.riskLevel !== riskFilter) return false;
      if (diffFilter !== "Todos" && s.difficulty !== diffFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q) && !s.tags.some((t) => t.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [marketFilter, riskFilter, diffFilter, search]);

  return (
    <div className="min-h-full p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Estratégias de Trading</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {strategies.length} estratégias reais, testadas e explicadas passo a passo. Filtra por mercado, risco ou nível e expande para ver todos os detalhes.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Estratégias",  value: strategies.length,                              color: "text-primary" },
          { label: "Baixo Risco",  value: strategies.filter((s) => s.riskLevel === "Baixo").length,  color: "text-bull" },
          { label: "Para Iniciantes", value: strategies.filter((s) => s.difficulty === "Iniciante").length, color: "text-warning" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
            <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-5 space-y-3">
        <input
          type="text"
          placeholder="Pesquisar estratégia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">Mercado:</span>
          {ALL_MARKETS.map((m) => (
            <Pill key={m} label={m} active={marketFilter === m} onClick={() => setMarketFilter(m)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">Risco:</span>
          {["Todos", ...ALL_RISKS].map((r) => (
            <Pill key={r} label={r} active={riskFilter === r} onClick={() => setRiskFilter(r as RiskLevel | "Todos")} />
          ))}
          <span className="text-xs text-muted-foreground self-center ml-2">Nível:</span>
          {["Todos", ...ALL_DIFFS].map((d) => (
            <Pill key={d} label={d} active={diffFilter === d} onClick={() => setDiffFilter(d)} />
          ))}
        </div>
      </div>

      {/* Results count */}
      {(marketFilter !== "Todos" || riskFilter !== "Todos" || diffFilter !== "Todos" || search) && (
        <p className="text-xs text-muted-foreground mb-4">
          {filtered.length} estratégia{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Strategy cards */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">Nenhuma estratégia encontrada com esses filtros.</p>
          <button
            className="mt-3 text-sm text-primary hover:underline"
            onClick={() => { setMarketFilter("Todos"); setRiskFilter("Todos"); setDiffFilter("Todos"); setSearch(""); }}
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s, i) => (
            <StrategyCard key={s.id} strategy={s} defaultOpen={i === 0 && filtered.length === 1} />
          ))}
        </div>
      )}

      {/* Footer note */}
      <div className="mt-8 rounded-lg border border-warning/20 bg-warning/5 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-warning flex items-center gap-1 mb-1"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />Aviso importante:</span> Todas as estratégias apresentadas são baseadas em análise técnica clássica e destinam-se exclusivamente a fins educativos. Os resultados passados não garantem resultados futuros. Pratica sempre no simulador antes de usar capital real. O trading envolve risco de perda total do capital investido.
        </p>
      </div>
    </div>
  );
}
