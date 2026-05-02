import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, Loader2, ChevronRight,
  Check, Rocket, ArrowLeft, User, Mail, Lock,
  BarChart2, Zap, Shield, Lightbulb, ArrowRight,
} from "lucide-react";
import { IconByName } from "@/components/IconByName";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { useAuthStore }  from "@/store/useAuthStore";
import { useAppStore }   from "@/store/useAppStore";
import { api }           from "@/lib/apiClient";
import { toast }         from "sonner";
import AuthLayout from "@/components/AuthLayout";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const LEVELS = [
  {
    id:          "iniciante",
    label:       "Iniciante",
    icon:        "Sprout",
    description: "Nunca operei ou estou a aprender o básico",
    badge:       "Começa aqui",
    accentClass: "border-emerald-500/60 bg-emerald-500/8",
    dotClass:    "border-emerald-500 bg-emerald-500",
  },
  {
    id:          "intermediario",
    label:       "Intermediário",
    icon:        "TrendingUp",
    description: "Já conheço análise técnica e tenho alguma experiência",
    badge:       "Bom ponto",
    accentClass: "border-cyan-500/60 bg-cyan-500/8",
    dotClass:    "border-cyan-500 bg-cyan-500",
  },
  {
    id:          "avancado",
    label:       "Avançado",
    icon:        "Trophy",
    description: "Opero há mais de 1 ano e quero aperfeiçoar a estratégia",
    badge:       "Excelente",
    accentClass: "border-violet-500/60 bg-violet-500/8",
    dotClass:    "border-violet-500 bg-violet-500",
  },
];

const INTERESTS = [
  { id: "cripto",       label: "Criptomoedas",         icon: "Bitcoin",        color: "text-orange-400" },
  { id: "forex",        label: "Forex",                 icon: "ArrowLeftRight", color: "text-blue-400"   },
  { id: "acoes",        label: "Ações & B3",            icon: "BarChart2",      color: "text-green-400"  },
  { id: "risco",        label: "Gestão de Risco",       icon: "Shield",         color: "text-red-400"    },
  { id: "psicologia",   label: "Psicologia",            icon: "Brain",          color: "text-pink-400"   },
  { id: "algoritmos",   label: "Algorítmico",           icon: "Bot",            color: "text-purple-400" },
  { id: "price-action", label: "Price Action",          icon: "Activity",       color: "text-yellow-400" },
  { id: "fundamentos",  label: "Fundamental",           icon: "FileText",       color: "text-teal-400"   },
];

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
                  ? "bg-cyan-500 text-white ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-[#080b12]"
                  : "bg-white/[0.04] text-gray-500 border border-white/10"
              }`}
            >
              {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${i <= current ? "text-cyan-400" : "text-gray-600"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px flex-1 mb-4 transition-colors duration-500 ${i < current ? "bg-cyan-500/60" : "bg-white/[0.07]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Cadastrar() {
  useSEO({
    title: "Criar Conta Grátis — TradeAcademy Angola",
    description: "Regista-te gratuitamente no TradeAcademy e começa a aprender trading em Angola. Nível Iniciante 100% gratuito, sem cartão de crédito.",
    canonical: "/cadastrar",
  });
  const navigate           = useNavigate();
  const { register }       = useAuthStore();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step,      setStep]      = useState(0);
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [level,     setLevel]     = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const status = await api.auth.googleStatus();
      if (!status.enabled) {
        toast.info("De momento o registo com Google não está disponível. Por favor cria a tua conta com e-mail e password.");
        setGoogleLoading(false);
        return;
      }
      window.location.href = "/api-server/api/auth/google";
    } catch {
      toast.info("De momento o registo com Google não está disponível. Por favor cria a tua conta com e-mail e password.");
      setGoogleLoading(false);
    }
  };

  function toggleInterest(id: string) {
    setInterests((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }

  const pwStrength = password.length === 0 ? 0 :
    password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1;
  const strengthColor = ["bg-white/10","bg-red-500","bg-yellow-500","bg-emerald-400","bg-emerald-500"][pwStrength];
  const strengthLabel = ["","Fraca","Média","Boa","Forte"][pwStrength];

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("As passwords não coincidem."); return; }
    if (password.length < 6)  { toast.error("A password deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);
    if (result.ok) { setStep(1); } else { toast.error(result.error ?? "Erro ao criar conta."); }
  }

  function handleFinish() {
    completeOnboarding(level ?? "iniciante", interests);
    toast.success(`Bem-vindo, ${name.split(" ")[0]}!`);
    navigate("/aprender");
  }

  const selectedLevelData = LEVELS.find((l) => l.id === level);

  const panelsByStep = [
    { title: undefined, body: undefined },
    {
      title: <>"Qual é o<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">teu nível?</span></>,
      body: "Personalizamos o percurso de aprendizagem ao teu perfil — do básico ao avançado.",
    },
    {
      title: <>"O que queres<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">aprender?</span></>,
      body: "Selecciona os temas que mais te interessam. Podes alterar as preferências a qualquer momento.",
    },
    {
      title: <>"Pronto para<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">começar!</span></>,
      body: "O teu perfil está configurado. Clica em 'Começar' para aceder ao teu dashboard.",
    },
  ];

  return (
    <AuthLayout>
      <StepBar current={step} />

      {/* ── STEP 0: Dados da conta ── */}
      {step === 0 && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Criar conta gratuita</h1>
            <p className="text-gray-400 text-sm mt-1.5">
              Grátis para sempre · Sem cartão de crédito
            </p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-sm text-gray-300 hover:text-white transition-all font-medium mb-5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Registar com Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-xs text-gray-600">ou com e-mail e password</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
            {/* Nome */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-gray-300 text-sm font-medium">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="O teu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/50 rounded-xl"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-gray-300 text-sm font-medium">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="teu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/50 rounded-xl"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-gray-300 text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pl-10 pr-11 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/50 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4].map((n) => (
                      <div key={n} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${n <= pwStrength ? strengthColor : "bg-white/10"}`} />
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-500 w-8">{strengthLabel}</span>
                </div>
              )}
            </div>

            {/* Confirmar */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-gray-300 text-sm font-medium">Confirmar password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Repete a password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`pl-10 h-11 bg-white/[0.04] text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-xl border transition-colors ${
                    confirm && confirm !== password ? "border-red-500/60" : "border-white/10 focus-visible:border-cyan-500/50"
                  }`}
                />
                {confirm && confirm === password && (
                  <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {confirm && confirm !== password && (
                <p className="text-xs text-red-400">As passwords não coincidem</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !name || !email || !password || !confirm || password !== confirm}
              className="h-11 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 mt-1"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> A criar conta…</>
                : <><span>Continuar</span><ChevronRight className="w-4 h-4" /></>
              }
            </Button>
          </form>

          {/* Benefits */}
          <div className="mt-5 flex flex-col gap-2">
            {[
              { icon: BarChart2, text: "40+ aulas do básico ao avançado" },
              { icon: Zap,       text: "Simulador com dados reais" },
              { icon: Shield,    text: "Aprende sem arriscar dinheiro real" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-gray-600">
                <Icon className="w-3.5 h-3.5 text-cyan-500/60 shrink-0" />
                {text}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-600 mt-5">
            Já tens conta?{" "}
            <Link to="/entrar" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      )}

      {/* ── STEP 1: Nível ── */}
      {step === 1 && (
        <div>
          <button
            onClick={() => setStep(0)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h2 className="text-2xl font-extrabold mb-1">Qual é o teu nível?</h2>
          <p className="text-gray-400 text-sm mb-5">Personalizamos o conteúdo ao teu perfil.</p>

          <div className="flex flex-col gap-3 mb-6">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                  level === l.id ? l.accentClass : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                }`}
              >
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/[0.05] shrink-0 border border-white/[0.07]">
                  <IconByName name={l.icon} className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{l.label}</p>
                    {level === l.id && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">{l.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{l.description}</p>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${level === l.id ? l.dotClass : "border-white/20"}`}>
                  {level === l.id && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
            ))}
          </div>

          <Button
            disabled={!level}
            onClick={() => setStep(2)}
            className="h-11 rounded-xl w-full font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            Continuar <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ── STEP 2: Interesses ── */}
      {step === 2 && (
        <div>
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h2 className="text-2xl font-extrabold mb-1">O que queres aprender?</h2>
          <p className="text-gray-400 text-sm mb-5">Escolhe todos os temas que te interessam.</p>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {INTERESTS.map((item) => {
              const active = interests.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleInterest(item.id)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-all duration-150 ${
                    active ? "border-cyan-500/50 bg-cyan-500/8" : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                  }`}
                >
                  <IconByName name={item.icon} className={`h-4 w-4 shrink-0 ${active ? "text-cyan-400" : "text-gray-500"}`} />
                  <span className={`text-xs font-medium ${active ? "text-cyan-300" : "text-gray-300"}`}>{item.label}</span>
                  {active && <Check className="w-3 h-3 text-cyan-400 ml-auto shrink-0" />}
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
            className="h-11 rounded-xl w-full font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            Continuar <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ── STEP 3: Tudo pronto ── */}
      {step === 3 && (
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-4 shadow-lg shadow-cyan-500/25">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold mb-1">Pronto, {name.split(" ")[0]}!</h2>
          <p className="text-gray-400 text-sm mb-6">O teu perfil está configurado. Aqui está o teu resumo:</p>

          <div className="flex flex-col gap-3 text-left mb-6">
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.07]">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/[0.05] shrink-0">
                {selectedLevelData && <IconByName name={selectedLevelData.icon} className="h-4 w-4 text-cyan-400" />}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Nível</p>
                <p className="text-sm font-semibold">{selectedLevelData?.label}</p>
              </div>
              <Check className="w-4 h-4 text-cyan-500 ml-auto shrink-0" />
            </div>

            <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.07]">
              <p className="text-xs text-gray-500 font-medium mb-2">Interesses</p>
              {interests.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((id) => {
                    const item = INTERESTS.find((i) => i.id === id);
                    return item ? (
                      <span key={id} className="inline-flex items-center gap-1 text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-lg px-2 py-0.5">
                        <IconByName name={item.icon} className="h-3 w-3" />{item.label}
                      </span>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Nenhum seleccionado (podes configurar depois)</p>
              )}
            </div>

            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.07]">
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
            className="h-11 rounded-xl w-full font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4" /> Começar a aprender
          </Button>
          <p className="text-xs text-gray-600 mt-3">Podes alterar as tuas preferências nas Definições</p>
        </div>
      )}
    </AuthLayout>
  );
}
