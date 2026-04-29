import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ChevronRight, Check, Rocket } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const LEVELS = [
  {
    id: "iniciante",
    label: "Iniciante",
    emoji: "🌱",
    description: "Nunca operei ou estou aprendendo o básico",
  },
  {
    id: "intermediario",
    label: "Intermediário",
    emoji: "📈",
    description: "Já conheço análise técnica e tenho alguma experiência",
  },
  {
    id: "avancado",
    label: "Avançado",
    emoji: "🏆",
    description: "Opero há mais de 1 ano e quero aperfeiçoar a estratégia",
  },
];

const INTERESTS = [
  { id: "cripto", label: "Criptomoedas", emoji: "₿" },
  { id: "forex", label: "Forex", emoji: "💱" },
  { id: "acoes", label: "Ações & B3", emoji: "📊" },
  { id: "risco", label: "Gestão de Risco", emoji: "🛡️" },
  { id: "psicologia", label: "Psicologia", emoji: "🧠" },
  { id: "algoritmos", label: "Trading Algorítmico", emoji: "🤖" },
  { id: "price-action", label: "Price Action", emoji: "🕯️" },
  { id: "fundamentos", label: "Análise Fundamentalista", emoji: "📑" },
];

export default function OnboardingOverlay() {
  const [step, setStep] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const navigate = useNavigate();

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleFinish() {
    completeOnboarding(selectedLevel ?? "iniciante", selectedInterests);
    navigate("/aprender");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-1 shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="flex gap-1 p-4 pb-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-primary" : "bg-surface-3"
              }`}
            />
          ))}
        </div>

        <div className="p-6">
          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary mx-auto mb-4 shadow-glow">
                <TrendingUp className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold mb-2">Bem-vindo ao TradeAcademy</h2>
              <p className="text-sm text-muted-foreground mb-1">
                A plataforma de educação em trading mais completa em português.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Vamos personalizar a sua experiência em 2 perguntas rápidas.
              </p>

              <div className="grid gap-3 text-left mb-6">
                {[
                  { emoji: "📚", text: "40 aulas estruturadas do básico ao avançado" },
                  { emoji: "📊", text: "Simulador com ordens reais e análise de performance" },
                  { emoji: "🎯", text: "Desafios e conquistas para manter o progresso" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-2.5">
                    <span className="text-lg">{item.emoji}</span>
                    <p className="text-sm">{item.text}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
              >
                Começar agora
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 1 — Level */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold mb-1">Qual é o seu nível de trading?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Isso ajuda a adaptar o conteúdo ao seu perfil.
              </p>

              <div className="grid gap-3 mb-6">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLevel(l.id)}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      selectedLevel === l.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface-2 hover:border-muted-foreground"
                    }`}
                  >
                    <span className="text-2xl">{l.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{l.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{l.description}</p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedLevel === l.id ? "border-primary bg-primary" : "border-border"
                      }`}
                    >
                      {selectedLevel === l.id && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface-2 transition-colors"
                >
                  Voltar
                </button>
                <button
                  disabled={!selectedLevel}
                  onClick={() => setStep(2)}
                  className="flex-2 flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 transition-opacity hover:opacity-90"
                >
                  Continuar
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Interests */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold mb-1">O que quer aprender?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Selecione todos os temas que te interessam.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {INTERESTS.map((i) => {
                  const active = selectedInterests.includes(i.id);
                  return (
                    <button
                      key={i.id}
                      onClick={() => toggleInterest(i.id)}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border bg-surface-2 hover:border-muted-foreground"
                      }`}
                    >
                      <span className="text-base">{i.emoji}</span>
                      <span className={`text-xs font-medium ${active ? "text-primary" : ""}`}>
                        {i.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface-2 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-2 flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Rocket className="h-4 w-4" />
                  Começar a aprender
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
