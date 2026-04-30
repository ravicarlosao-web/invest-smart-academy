import { ExternalLink, BookOpen, Globe, Youtube, Building2, Star, TrendingUp } from "lucide-react";

interface Resource {
  name: string;
  description: string;
  url?: string;
  badge?: string;
  stars?: number;
  tags?: string[];
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  items: Resource[];
}

const SECTIONS: Section[] = [
  {
    id: "brokers",
    title: "Corretoras Recomendadas",
    icon: Building2,
    color: "text-primary",
    items: [
      {
        name: "XP Investimentos",
        description: "Maior corretora do Brasil. Ampla gama de ativos: ações, FIIs, Tesouro Direto, opções e fundos.",
        badge: "Brasil",
        stars: 5,
        tags: ["Ações", "Renda fixa", "Fundos"],
      },
      {
        name: "Clear Corretora",
        description: "Corretora do grupo XP focada em day traders. Zero comissão em ações e mini-contratos na B3.",
        badge: "Brasil",
        stars: 5,
        tags: ["Day trade", "Mini-contratos", "Zero corretagem"],
      },
      {
        name: "Rico Investimentos",
        description: "Interface intuitiva, ideal para iniciantes. Acesso a renda fixa, ações e fundos com boa UX.",
        badge: "Brasil",
        stars: 4,
        tags: ["Iniciantes", "Renda fixa", "Fácil uso"],
      },
      {
        name: "Interactive Brokers",
        description: "Melhor corretora internacional. Acesso a NYSE, Nasdaq, Forex, opções e futuros globais.",
        badge: "Global",
        stars: 5,
        tags: ["Internacional", "Forex", "Opções", "Futuros"],
      },
      {
        name: "Binance",
        description: "Maior exchange de criptomoedas do mundo por volume. Spot, futuros, opções e staking em cripto.",
        badge: "Cripto",
        stars: 4,
        tags: ["Cripto", "Futuros", "Spot"],
      },
      {
        name: "Pepperstone",
        description: "Corretora forex e CFD de destaque. Spreads muito baixos, execução rápida, plataforma MT4/MT5.",
        badge: "Forex/CFD",
        stars: 4,
        tags: ["Forex", "CFD", "MT4/MT5"],
      },
    ],
  },
  {
    id: "books",
    title: "Livros Essenciais",
    icon: BookOpen,
    color: "text-warning",
    items: [
      {
        name: "A Arte e a Ciência da Análise Técnica",
        description: "Adam Grimes. O guia mais completo e rigoroso sobre price action e análise técnica com dados estatísticos.",
        stars: 5,
        tags: ["Price Action", "Avançado"],
      },
      {
        name: "Reminiscências de um Operador de Ações",
        description: "Edwin Lefèvre. A história de Jesse Livermore, um dos maiores traders da história. Leitura obrigatória.",
        stars: 5,
        tags: ["Psicologia", "Clássico"],
      },
      {
        name: "Trading no Mercado Forex",
        description: "Kathy Lien. Guia completo sobre Forex: análise fundamental, técnica e estratégias específicas para câmbio.",
        stars: 4,
        tags: ["Forex", "Fundamentos"],
      },
      {
        name: "O Novo Operador de Mercado",
        description: "Alexander Elder. Aborda psicologia, sistemas de trading e gestão de risco com profundidade.",
        stars: 5,
        tags: ["Psicologia", "Sistemas"],
      },
      {
        name: "Market Wizards",
        description: "Jack D. Schwager. Entrevistas com os maiores traders do mundo. Insights únicos sobre mentalidade vencedora.",
        stars: 5,
        tags: ["Mentalidade", "Clássico"],
      },
      {
        name: "Análise Técnica dos Mercados Financeiros",
        description: "John J. Murphy. A bíblia da análise técnica. Cobertura completa de padrões gráficos e indicadores.",
        stars: 5,
        tags: ["Análise Técnica", "Referência"],
      },
    ],
  },
  {
    id: "tools",
    title: "Ferramentas e Plataformas",
    icon: Globe,
    color: "text-bull",
    items: [
      {
        name: "TradingView",
        url: "https://tradingview.com",
        description: "A melhor plataforma de gráficos do mundo. Scripts personalizados, backtesting, alertas e comunidade ativa.",
        stars: 5,
        tags: ["Gráficos", "Alertas", "Community"],
      },
      {
        name: "Investing.com",
        url: "https://investing.com",
        description: "Notícias, calendário econômico, dados de mercado e cotações em tempo real para todos os mercados.",
        stars: 4,
        tags: ["Notícias", "Calendário"],
      },
      {
        name: "Myfxbook",
        url: "https://myfxbook.com",
        description: "Conecta à conta de Forex e gera estatísticas detalhadas: drawdown, profit factor, equity curve.",
        stars: 4,
        tags: ["Forex", "Analytics"],
      },
      {
        name: "Finviz",
        url: "https://finviz.com",
        description: "Screener de ações americanas com mapas de calor, filtros avançados e gráficos rápidos.",
        stars: 4,
        tags: ["Ações", "Screener"],
      },
      {
        name: "Fundamentus",
        url: "https://fundamentus.com.br",
        description: "Dados fundamentalistas de ações brasileiras: P/L, P/VP, DY, ROE, margens e balanços históricos.",
        stars: 4,
        tags: ["Brasil", "Fundamentalista"],
      },
      {
        name: "CoinMarketCap",
        url: "https://coinmarketcap.com",
        description: "Referência global em dados de criptomoedas: preços, capitalização, volume, exchanges e projetos.",
        stars: 4,
        tags: ["Cripto", "Dados"],
      },
    ],
  },
  {
    id: "youtube",
    title: "Canais no YouTube",
    icon: Youtube,
    color: "text-bear",
    items: [
      {
        name: "André Moraes — Trader",
        description: "Price action e análise técnica aplicada à B3 e Forex. Conteúdo prático e didático para todos os níveis.",
        stars: 5,
        tags: ["Price Action", "Português"],
      },
      {
        name: "Gustavo Cerbasi",
        description: "Educação financeira e investimentos no Brasil. Foco em construção de patrimônio a longo prazo.",
        stars: 4,
        tags: ["Finanças", "Longo prazo"],
      },
      {
        name: "Anton Kreil",
        description: "Ex-Goldman Sachs. Conteúdo sobre profissionalização e mentalidade de trader institucional. Em inglês.",
        stars: 5,
        tags: ["Profissional", "Inglês"],
      },
      {
        name: "Trade Com Dinheiro Real",
        description: "Day trade na B3, mini-contratos WIN e WDO. Acompanhamento ao vivo de operações reais.",
        stars: 4,
        tags: ["Day Trade", "B3", "Ao vivo"],
      },
      {
        name: "Rayner Teo",
        description: "Price action e gestão de risco. Um dos maiores canais de trading do mundo com didática excelente. Inglês.",
        stars: 5,
        tags: ["Price Action", "Inglês", "Gestão"],
      },
      {
        name: "Nathalia Arcuri (Me Poupe!)",
        description: "Educação financeira descomplicada para brasileiros. Ideal para quem está começando a organizar as finanças.",
        stars: 4,
        tags: ["Iniciante", "Finanças pessoais"],
      },
    ],
  },
];

const BADGE_COLOR: Record<string, string> = {
  Brasil: "bg-bull/15 text-bull",
  Global: "bg-primary/15 text-primary",
  Cripto: "bg-warning/15 text-warning",
  "Forex/CFD": "bg-info/15 text-info",
};

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < count ? "fill-warning text-warning" : "text-surface-3"}`}
        />
      ))}
    </div>
  );
}

export default function Recursos() {
  return (
    <div className="min-h-full p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Recursos Recomendados</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Curadoria de ferramentas, livros e canais selecionados para a sua evolução como trader
        </p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2 mb-8">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-surface-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
            {s.title}
          </a>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <div className="flex items-center gap-2.5 mb-4">
              <section.icon className={`h-5 w-5 ${section.color}`} />
              <h3 className="text-base font-semibold">{section.title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {section.items.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col rounded-xl border border-border bg-surface-1 p-4 hover:border-primary/30 hover:bg-surface-2 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{item.name}</span>
                        {item.badge && (
                          <span
                            className={`inline-block rounded-full px-1.5 py-0 text-[9px] font-bold ${
                              BADGE_COLOR[item.badge] ?? "bg-surface-3 text-muted-foreground"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.stars && <Stars count={item.stars} />}
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-md bg-surface-2 p-1.5 text-muted-foreground hover:text-primary transition-colors"
                        title="Abrir site"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{item.description}</p>

                  {item.tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
