import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp, Eye, EyeOff, Loader2, ChevronRight,
  Check, Rocket, ArrowLeft, User, Mail, Lock,
  BarChart2, Zap, Shield, Lightbulb,
} from "lucide-react";
import { IconByName } from "@/components/IconByName";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { useAuthStore }  from "@/store/useAuthStore";
import { useAppStore }   from "@/store/useAppStore";
import { toast }         from "sonner";

/* ─── Dados do questionário ─────────────────────────────── */
const LEVELS = [
  {
    id:          "iniciante",
    label:       "Iniciante",
    icon:        "Sprout",
    description: "Nunca operei ou estou a aprender o básico",
    badge:       "Começa aqui",
    color:       "from-emerald-500/20 to-emerald-600/5",
    border:      "border-emerald-500",
  },
  {
    id:          "intermediario",
    label:       "Intermediário",
    icon:        "TrendingUp",
    description: "Já conheço análise técnica e tenho alguma experiência",
    badge:       "Bom ponto",
    color:       "from-cyan-500/20 to-cyan-600/5",
    border:      "border-cyan-500",
  },
  {
    id:          "avancado",
    label:       "Avançado",
    icon:        "Trophy",
    description: "Opero há mais de 1 ano e quero aperfeiçoar a estratégia",
    badge:       "Excelente",
    color:       "from-violet-500/20 to-violet-600/5",
    border:      "border-violet-500",
  },
];

const INTERESTS = [
  { id: "cripto",      label: "Criptomoedas",          icon: "Bitcoin",        color: "text-orange-400" },
  { id: "forex",       label: "Forex",                 icon: "ArrowLeftRight", color: "text-blue-400"   },
  { id: "acoes",       label: "Ações & B3",            icon: "BarChart2",      color: "text-green-400"  },
  { id: "risco",       label: "Gestão de Risco",       icon: "Shield",         color: "text-red-400"    },
  { id: "psicologia",  label: "Psicologia",            icon: "Brain",          color: "text-pink-400"   },
  { id: "algoritmos",  label: "Trading Algorítmico",   icon: "Bot",            color: "text-purple-400" },
  { id: "price-action",label: "Price Action",          icon: "Activity",       color: "text-yellow-400" },
  { id: "fundamentos", label: "Análise Fundamental",   icon: "FileText",       color: "text-teal-400"   },
];

const BENEFITS = [
  { icon: BarChart2, text: "40+ aulas do básico ao avançado" },
  { icon: Zap,       text: "Simulador com dados reais" },
  { icon: Shield,    text: "Aprende sem arriscar dinheiro real" },
];

/* ─── Step indicator ────────────────────────────────────── */
const STEPS = ["Conta", "Nível", "Interesses", "Pronto"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center relative flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < current
                  ? "bg-cyan-500 text-white"
                  : i === current
                  ? "bg-cyan-500 text-white ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-[#1a1d27]"
                  : "bg-[#0f1117] text-gray-500 border border-white/10"
              }`}
            >
              {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span
              className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${
                i <= current ? "text-cyan-400" : "text-gray-600"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px flex-1 mb-4 transition-colors duration-500 ${
                i < current ? "bg-cyan-500/60" : "bg-white/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Página principal ──────────────────────────────────── */
export default function Cadastrar() {
  useSEO({
    title: "Criar Conta Grátis — TradeAcademy Angola",
    description: "Regista-te gratuitamente no TradeAcademy e começa a aprender trading em Angola. Nível Iniciante 100% gratuito, sem cartão de crédito.",
    canonical: "/cadastrar",
  });
  const navigate           = useNavigate();
  const { register }       = useAuthStore();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  /* state */
  const [step,      setStep]      = useState(0);
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [level,     setLevel]     = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  /* ── Step 0: criar conta ── */
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("As passwords não coincidem."); return; }
    if (password.length < 6)  { toast.error("A password deve ter pelo menos 6 caracteres."); return; }

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (result.ok) {
      setStep(1);
    } else {
      toast.error(result.error ?? "Erro ao criar conta.");
    }
  }

  /* ── Step final: guardar onboarding ── */
  function handleFinish() {
    completeOnboarding(level ?? "iniciante", interests);
    toast.success(`Bem-vindo, ${name.split(" ")[0]}!`);
    navigate("/aprender");
  }

  const selectedLevelData = LEVELS.find((l) => l.id === level);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col items-center justify-center px-4 py-8">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-6">
        <img src="/logo-transparent.png" alt="TradeAcademy" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
        <span className="font-bold text-xl tracking-tight">TradeAcademy</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-[#1a1d27] border border-white/10 rounded-2xl p-8 shadow-2xl">

        <StepBar current={step} />

        {/* ───────── STEP 0: Dados da conta ───────── */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold mb-1">Criar conta</h1>
            <p className="text-gray-400 text-sm mb-6">
              Gratuito para sempre · Sem cartão de crédito
            </p>

            <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-gray-300 text-sm">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="O teu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-[#0f1117] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500 pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-gray-300 text-sm">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="teu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#0f1117] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500 pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-gray-300 text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[#0f1117] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* strength indicator */}
                {password.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4].map((n) => (
                      <div
                        key={n}
                        className={`h-0.5 flex-1 rounded-full transition-colors ${
                          password.length >= n * 3
                            ? password.length >= 12 ? "bg-green-500"
                              : password.length >= 8  ? "bg-yellow-500"
                              : "bg-red-500"
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-gray-500 ml-1">
                      {password.length >= 12 ? "Forte" : password.length >= 8 ? "Média" : "Fraca"}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirmar */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-gray-300 text-sm">Confirmar password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder="Repete a password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className={`bg-[#0f1117] border text-white placeholder:text-gray-600 focus-visible:ring-cyan-500 pl-10 transition-colors ${
                      confirm && confirm !== password
                        ? "border-red-500/60"
                        : "border-white/10"
                    }`}
                  />
                  {confirm && confirm === password && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {confirm && confirm !== password && (
                  <p className="text-xs text-red-400">As passwords não coincidem</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !name || !email || !password || !confirm || password !== confirm}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-5 rounded-xl w-full mt-1 flex items-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> A criar conta…</>
                ) : (
                  <>Continuar <ChevronRight className="w-4 h-4" /></>
                )}
              </Button>
            </form>

            {/* Benefícios */}
            <div className="mt-6 flex flex-col gap-2">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                  <Icon className="w-3.5 h-3.5 text-cyan-500/70 shrink-0" />
                  {text}
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Já tens conta?{" "}
              <Link to="/entrar" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Entrar
              </Link>
            </p>
          </div>
        )}

        {/* ───────── STEP 1: Nível ───────── */}
        {step === 1 && (
          <div>
            <button
              onClick={() => setStep(0)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <h2 className="text-xl font-bold mb-1">Qual é o teu nível?</h2>
            <p className="text-gray-400 text-sm mb-5">
              Vamos personalizar o conteúdo ao teu perfil.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                    level === l.id
                      ? `border-${l.border.replace("border-","")} bg-gradient-to-r ${l.color}`
                      : "border-white/10 bg-[#0f1117] hover:border-white/20"
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-surface-3 shrink-0">
                    <IconByName name={l.icon} className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{l.label}</p>
                      {level === l.id && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">
                          {l.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{l.description}</p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      level === l.id
                        ? "border-cyan-500 bg-cyan-500"
                        : "border-white/20"
                    }`}
                  >
                    {level === l.id && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <Button
              disabled={!level}
              onClick={() => setStep(2)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-5 rounded-xl w-full flex items-center gap-2"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ───────── STEP 2: Interesses ───────── */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <h2 className="text-xl font-bold mb-1">O que queres aprender?</h2>
            <p className="text-gray-400 text-sm mb-5">
              Escolhe todos os temas que te interessam (podes mudar depois).
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {INTERESTS.map((item) => {
                const active = interests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-all duration-150 ${
                      active
                        ? "border-cyan-500/60 bg-cyan-500/10"
                        : "border-white/10 bg-[#0f1117] hover:border-white/20"
                    }`}
                  >
                    <IconByName name={item.icon} className={`h-4 w-4 shrink-0 ${active ? "text-cyan-400" : "text-gray-500"}`} />
                    <span className={`text-xs font-medium ${active ? "text-cyan-300" : "text-gray-300"}`}>
                      {item.label}
                    </span>
                    {active && (
                      <Check className="w-3 h-3 text-cyan-400 ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {interests.length === 0 && (
              <p className="text-xs text-amber-400/80 mb-4 text-center">
                <Lightbulb className="inline h-3.5 w-3.5 mr-1" />Selecciona pelo menos um tema para uma melhor experiência
              </p>
            )}

            <Button
              onClick={() => setStep(3)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-5 rounded-xl w-full flex items-center gap-2"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ───────── STEP 3: Tudo pronto ───────── */}
        {step === 3 && (
          <div className="text-center">
            {/* Avatar / Welcome */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-4 shadow-lg shadow-cyan-500/20">
              <Rocket className="h-8 w-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold mb-1">
              Pronto, {name.split(" ")[0]}!
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              O teu perfil está configurado. Aqui está o teu resumo:
            </p>

            {/* Resumo */}
            <div className="flex flex-col gap-3 text-left mb-6">
              {/* Nível */}
              <div className="flex items-center gap-3 bg-[#0f1117] rounded-xl px-4 py-3 border border-white/10">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-surface-3 shrink-0">
                  {selectedLevelData && <IconByName name={selectedLevelData.icon} className="h-4 w-4 text-cyan-400" />}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Nível</p>
                  <p className="text-sm font-semibold">{selectedLevelData?.label}</p>
                </div>
                <Check className="w-4 h-4 text-cyan-500 ml-auto shrink-0" />
              </div>

              {/* Interesses */}
              <div className="bg-[#0f1117] rounded-xl px-4 py-3 border border-white/10">
                <p className="text-xs text-gray-500 font-medium mb-2">Interesses</p>
                {interests.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((id) => {
                      const item = INTERESTS.find((i) => i.id === id);
                      return item ? (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-lg px-2 py-0.5"
                        >
                          <IconByName name={item.icon} className="h-3 w-3" />{item.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Nenhum seleccionado (podes configurar depois)</p>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 bg-[#0f1117] rounded-xl px-4 py-3 border border-white/10">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Conta</p>
                  <p className="text-sm font-medium truncate">{email}</p>
                </div>
                <Check className="w-4 h-4 text-cyan-500 ml-auto shrink-0" />
              </div>
            </div>

            <Button
              onClick={handleFinish}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-5 rounded-xl w-full flex items-center justify-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Começar a aprender
            </Button>

            <p className="text-xs text-gray-600 mt-3">
              Podes alterar as tuas preferências a qualquer momento nas Definições
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
