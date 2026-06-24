import { useState, useEffect } from "react";
import { ExternalLink, BookOpen, Globe, Youtube, Building2, Star, TrendingUp, Lock, Crown } from "lucide-react";
import { api } from "@/lib/apiClient";
import { PlanWall } from "@/components/PlanWall";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

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
  icon: string;
  color: string;
  items: Resource[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  BookOpen,
  Globe,
  Youtube,
  TrendingUp,
  Star,
};

const STATIC_SECTIONS: Section[] = [
  {
    id: "brokers", title: "Corretoras Recomendadas", icon: "Building2", color: "text-primary",
    items: [
      { name: "XP Investimentos", description: "Maior corretora do Brasil. Ampla gama de ativos: ações, FIIs, Tesouro Direto, opções e fundos.", badge: "Brasil", stars: 5, tags: ["Ações", "Renda fixa", "Fundos"] },
      { name: "Clear Corretora", description: "Corretora do grupo XP focada em day traders. Zero comissão em ações e mini-contratos na B3.", badge: "Brasil", stars: 5, tags: ["Day trade", "Mini-contratos", "Zero corretagem"] },
      { name: "Interactive Brokers", description: "Melhor corretora internacional. Acesso a NYSE, Nasdaq, Forex, opções e futuros globais.", badge: "Global", stars: 5, tags: ["Internacional", "Forex", "Opções", "Futuros"] },
    ],
  },
  {
    id: "tools", title: "Ferramentas e Plataformas", icon: "Globe", color: "text-bull",
    items: [
      { name: "TradingView", url: "https://tradingview.com", description: "A melhor plataforma de gráficos do mundo.", stars: 5, tags: ["Gráficos", "Alertas"] },
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
  const [sections, setSections]     = useState<Section[]>(STATIC_SECTIONS);
  const [showPlanWall, setShowPlanWall] = useState(false);
  const { hasActiveSubscription } = useSubscriptionStore();
  const isSubscribed = hasActiveSubscription();

  useEffect(() => {
    api.content.resources()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setSections(data as Section[]); })
      .catch(() => {/* keep static fallback */});
  }, []);

  return (
    <div className="min-h-full p-4 sm:p-6">
      {/* PlanWall modal */}
      {showPlanWall && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl">
            <PlanWall onClose={() => setShowPlanWall(false)} />
          </div>
        </div>
      )}

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
        {sections.map((s) => {
          const Icon = ICON_MAP[s.icon] ?? TrendingUp;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-1.5 rounded-lg bg-surface-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <Icon className={`h-3.5 w-3.5 ${s.color}`} />
              {s.title}
            </a>
          );
        })}
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {sections.map((section) => {
          const SectionIcon = ICON_MAP[section.icon] ?? TrendingUp;
          const sectionPlanLocked = (section as any).accessible === false;
          return (
            <section key={section.id} id={section.id}>
              <div className="flex items-center gap-2.5 mb-4">
                <SectionIcon className={`h-5 w-5 ${sectionPlanLocked ? "text-amber-500/70" : section.color}`} />
                <h3 className="text-base font-semibold">{section.title}</h3>
                {sectionPlanLocked && (
                  <span className="ml-1 flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500/80">
                    <Crown className="h-3 w-3" />
                    {isSubscribed ? "Não incluído no plano" : "Requer subscrição"}
                  </span>
                )}
              </div>

              {sectionPlanLocked ? (
                <div
                  className="relative rounded-xl border border-amber-500/20 bg-surface-1/50 p-8 text-center cursor-pointer hover:border-amber-500/40 transition-colors"
                  onClick={() => setShowPlanWall(true)}
                >
                  <Lock className="mx-auto h-8 w-8 text-amber-500/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {isSubscribed
                      ? "Esta secção não está incluída no teu plano."
                      : "Esta secção requer uma subscrição ativa."}
                  </p>
                  {!isSubscribed && (
                    <button
                      type="button"
                      className="mt-3 rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-500 hover:bg-amber-500/25 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setShowPlanWall(true); }}
                    >
                      Ver Planos
                    </button>
                  )}
                </div>
              ) : (
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
                        {item.stars !== undefined && <Stars count={item.stars} />}
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
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
