import { useState, useEffect } from "react";
import { api } from "@/lib/apiClient";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";
import {
  TrendingUp, BookOpen, Trophy, BarChart2, Shield,
  Zap, GraduationCap, Brain, ChevronRight, Twitter,
  MessageSquare, Send, Play, Video, Clock, LineChart,
  CheckCircle, Lock, ArrowRight, Star, Crown, Users,
  Flame, Activity, Sparkles, Target, Award,
} from "lucide-react";
import heroImage from "@assets/ChatGPT_Image_29_04_2026,_16_25_06_1777476333705.png";

/* ─── Data ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: BookOpen,
    title: "Nível Iniciante grátis",
    desc: "Regista-te e começa já: as aulas do nível Iniciante são 100% gratuitas, sem cartão de crédito.",
  },
  {
    icon: BarChart2,
    title: "40+ aulas estruturadas",
    desc: "Do básico ao avançado, com quizzes e revisão espaçada para fixares o conhecimento.",
  },
  {
    icon: Activity,
    title: "5 tipos de gráfico",
    desc: "Velas japonesas, Heikin-Ashi, Barras OHLC, Linha e Área — muda o tipo com um clique, como no TradingView.",
  },
  {
    icon: Brain,
    title: "Coach IA por trade",
    desc: "Análise inteligente de cada operação: entrada, saída, risco e lições concretas para melhorares.",
  },
  {
    icon: Video,
    title: "Vídeo Aulas curadas",
    desc: "Os melhores vídeos de trading em português, com player personalizado e desbloqueio sequencial por XP.",
  },
  {
    icon: Award,
    title: "XP, conquistas e missões",
    desc: "Sistema de gamificação completo: XP por cada acção, conquistas desbloqueáveis e missões diárias.",
  },
];

const STATS = [
  { value: "40+", label: "Aulas" },
  { value: "5",   label: "Tipos de gráfico" },
  { value: "6",   label: "Timeframes" },
  { value: "PT",  label: "Em Português" },
];

function buildPlans(priceAoa: number, planName: string) {
  return [
    {
      name: "Iniciante",
      price: "Grátis",
      sub: "para sempre",
      highlight: false,
      features: [
        "Nível 1 completo (Conceitos Básicos)",
        "Simulador de trading ilimitado",
        "Glossário e Recursos",
        "Perfil com ranking real",
        "Missões diárias e conquistas",
      ],
      cta: "Começar grátis",
      to: "/cadastrar",
    },
    {
      name: planName,
      price: `${priceAoa.toLocaleString("pt-PT")} AOA`,
      sub: "/ mês",
      highlight: true,
      features: [
        "Tudo do plano Iniciante",
        "Níveis Intermediário e Avançado",
        "Vídeo Aulas curadas (desbloqueio sequencial)",
        "Duelos contra outros traders",
        "Biblioteca de livros e estratégias",
        "Suporte prioritário",
      ],
      cta: "Subscrever agora",
      to: "/cadastrar",
    },
  ];
}

const VIDEO_FEATURES = [
  { icon: Video,        text: "Vídeos curados dos melhores criadores portugueses de trading" },
  { icon: Lock,         text: "Desbloqueio sequencial — cada vídeo abre ao concluíres o anterior" },
  { icon: CheckCircle,  text: "Marca como assistido e acumula XP automaticamente" },
  { icon: Play,         text: "Player sem anúncios ou branding do YouTube" },
];

const TF_ITEMS = ["1S", "1m", "5m", "1h", "4h", "1D"];

/* ─── Components ────────────────────────────────────────── */
function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-[#060709]/80 backdrop-blur-md border-b border-white/5">
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white tracking-tight">TradeAcademy</span>
      </Link>

      <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
        <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
        <a href="#planos"          className="hover:text-white transition-colors">Planos</a>
        <a href="#video-aulas"     className="hover:text-white transition-colors">Vídeo Aulas</a>
        <a href="#simulador"       className="hover:text-white transition-colors">Simulador</a>
      </nav>

      <div className="flex items-center gap-3">
        <Link to="/entrar" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors px-3 py-2">
          Entrar
        </Link>
        <Link
          to="/cadastrar"
          className="text-sm font-semibold bg-cyan-400 hover:bg-cyan-300 text-[#060709] px-5 py-2 rounded-full transition-colors"
        >
          Começar grátis
        </Link>
      </div>
    </header>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function Landing() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [priceAoa, setPriceAoa] = useState(5000);
  const [planName, setPlanName] = useState("Plano Mensal");

  useSEO({
    title: "TradeAcademy Angola — Curso de Trading em Português | Grátis",
    description: "Aprende trading em Angola: 40+ aulas gratuitas, simulador com 5 tipos de gráfico, Coach IA por trade e vídeo aulas curadas. Nível Iniciante 100% gratuito, tudo em português.",
    canonical: "/",
  });

  useEffect(() => {
    api.public.getPlanConfig()
      .then((cfg) => { setPriceAoa(cfg.priceAoa); setPlanName(cfg.planName); })
      .catch(() => { /* usa valores por defeito */ });
  }, []);

  const PLANS = buildPlans(priceAoa, planName);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(""); }
  }

  return (
    <div className="min-h-screen bg-[#060709] text-white overflow-x-hidden">
      <Nav />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden">
        <img
          src={heroImage}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80 pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060709]/60 via-transparent to-[#060709]" />

        <div className="relative z-10 flex flex-col items-center gap-5 max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-sm">
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            Educação em Trading em Português
          </span>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-white">
            Aprende a investir
            <br />
            <span className="text-cyan-400">sem arriscar dinheiro</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
            40 aulas estruturadas, simulador com 5 tipos de gráfico, Coach IA por trade
            e vídeo aulas curadas. Nível Iniciante totalmente grátis — tudo em português.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Link
              to="/cadastrar"
              className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-[#060709] font-bold px-8 py-4 rounded-full text-base transition-colors shadow-lg shadow-cyan-500/20"
            >
              Começar gratuitamente
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/entrar"
              className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-full text-base transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ── APP MOCKUP ───────────────────────────────────── */}
      <section id="simulador" className="px-6 pt-0 pb-24 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-[#0d0f18] overflow-hidden shadow-2xl shadow-black/60">
          {/* fake browser bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0f1117]">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <div className="flex-1 mx-4 bg-white/5 rounded px-3 py-0.5 text-xs text-gray-600">
              tradeacademy.app/simulador
            </div>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* chart with timeframe buttons */}
            <div className="sm:col-span-2 bg-[#13161e] rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">BTC/USD</span>
                <span className="text-xs text-green-400 font-semibold">+2.4%</span>
              </div>
              {/* chart type + timeframe buttons */}
              <div className="flex gap-1 flex-wrap items-center">
                {["Velas","H.Ashi","Barras","Linha","Área"].map((ct, i) => (
                  <span key={ct} className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${i === 0 ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-gray-700"}`}>{ct}</span>
                ))}
                <span className="mx-1 text-gray-700">·</span>
                {TF_ITEMS.map((tf, i) => (
                  <span
                    key={tf}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      i === 1 ? "bg-cyan-500 text-[#060709]" : "text-gray-600"
                    }`}
                  >
                    {tf}
                  </span>
                ))}
                <span className="ml-auto text-[10px] text-gray-700 font-mono tabular-nums">⏱ 00:43</span>
              </div>
              {/* fake candles */}
              <div className="flex items-end gap-0.5 h-16 mt-1">
                {[
                  [55,65],[40,55],[62,75],[48,60],[70,82],[58,72],[80,92],
                  [50,62],[75,88],[88,95],[65,80],[90,98],[70,85],[78,90],[63,78],[85,95],[72,84],
                ].map(([low, high], i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center gap-0">
                    <div
                      className="w-full rounded-sm"
                      style={{
                        height: `${high - low}%`,
                        background: i % 3 === 2 ? "#ef4444" : i >= 14 ? "#22d3ee" : "rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* stats */}
            <div className="flex sm:flex-col gap-3">
              <div className="flex-1 bg-[#13161e] rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">Saldo virtual</span>
                <span className="text-lg font-bold text-white">$12 450</span>
                <span className="text-xs text-green-400">+$450 hoje</span>
              </div>
              <div className="flex-1 bg-[#13161e] rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">Win rate</span>
                <span className="text-lg font-bold text-cyan-400">64%</span>
                <span className="text-xs text-gray-500">32 trades</span>
              </div>
            </div>

            {/* bottom row */}
            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {["Gestão de Risco", "Price Action", "Psicologia do Trader"].map((title, i) => (
                <div key={i} className="bg-[#13161e] rounded-xl p-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span className="text-xs text-gray-400 leading-tight">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-b border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{s.value}</div>
              <div className="text-sm text-gray-500 mt-2 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LÍDER ─────────────────────────────────────────── */}
      <section id="aulas" className="py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-medium text-gray-400 mb-6">
            Líder em Educação
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            A plataforma líder em educação<br />
            <span className="text-cyan-400">de trading em português.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            A TradeAcademy transforma a forma como os traders aprendem —
            com conteúdo estruturado, vídeos curados e prática real sem riscos financeiros.
          </p>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section id="funcionalidades" className="py-4 px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-[#0d0f18] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 hover:border-cyan-500/20 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <f.icon className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLANOS / PRICING ──────────────────────────────── */}
      <section id="planos" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-medium text-gray-400 mb-5">
            <Crown className="w-3.5 h-3.5 text-cyan-400" />
            Planos simples e transparentes
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Começa grátis.<br />
            <span className="text-cyan-400">Cresce quando estiveres pronto.</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Nível Iniciante sem custos. Quando quiseres avançar para Intermediário ou Avançado,
            subscreveres por 5.000 AOA/mês — pagamento manual via transferência bancária.
          </p>
        </div>

        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-7 flex flex-col gap-5 relative overflow-hidden ${
                plan.highlight
                  ? "border-cyan-500/40 bg-gradient-to-b from-cyan-500/10 to-[#0d0f18]"
                  : "border-white/10 bg-[#0d0f18]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-cyan-500/15 blur-2xl rounded-full pointer-events-none" />
              )}
              {plan.highlight && (
                <span className="absolute top-4 right-4 text-[10px] font-bold bg-cyan-400 text-[#060709] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Mais popular
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-400 mb-1">{plan.name}</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500 mb-1">{plan.sub}</span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400">
                    <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-cyan-400" : "text-gray-600"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={plan.to}
                className={`flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-full text-sm transition-colors ${
                  plan.highlight
                    ? "bg-cyan-400 hover:bg-cyan-300 text-[#060709]"
                    : "border border-white/20 hover:border-white/40 text-white"
                }`}
              >
                {plan.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Pagamento via transferência bancária · Confirmação manual pelo admin · Acesso imediato após aprovação
        </p>
      </section>

      {/* ── VIDEO AULAS SECTION ───────────────────────────── */}
      <section id="video-aulas" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Text side */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-cyan-400 mb-5">
              <Video className="w-3.5 h-3.5" />
              Novo · Vídeo Aulas
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
              Os melhores vídeos de trading<br />
              <span className="text-cyan-400">num só lugar.</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Curámos os melhores criadores de conteúdo de trading em português.
              Vê as aulas em vídeo com o nosso player personalizado — sem anúncios,
              sem distrações, sem branding externo.
            </p>

            <ul className="space-y-3 mb-8">
              {VIDEO_FEATURES.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/15 flex items-center justify-center shrink-0">
                    <item.icon className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-sm text-gray-400">{item.text}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/cadastrar"
              className="inline-flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-[#060709] font-bold px-6 py-3 rounded-full text-sm transition-colors"
            >
              Ver Vídeo Aulas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mockup video player */}
          <div className="rounded-2xl border border-white/10 bg-[#0d0f18] overflow-hidden shadow-2xl shadow-black/40">
            {/* player area */}
            <div className="relative aspect-video bg-black">
              {/* fake thumbnail */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-white/10 uppercase tracking-widest">CANDLESTICK</div>
                  <div className="mt-2 text-2xl font-bold text-white/20">Aula Zero</div>
                </div>
              </div>

              {/* custom player controls overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-3">
                {/* top — volume */}
                <div className="flex justify-end">
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                    <div className="w-3 h-3 rounded-full bg-cyan-400/70" />
                    <div className="w-12 h-0.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-white/60 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* center — controls */}
                <div className="flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center text-white/60">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 rotate-180" />
                    </div>
                    <span className="text-[8px] mt-0.5">10</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                  <div className="flex flex-col items-center text-white/60">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <ChevronRight className="w-3 h-3" />
                    </div>
                    <span className="text-[8px] mt-0.5">10</span>
                  </div>
                </div>

                {/* bottom — progress */}
                <div className="space-y-1.5">
                  <div className="w-full h-0.5 bg-white/15 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-cyan-400 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[9px] text-white/40 font-mono">
                    <span>1:42</span>
                    <span>4:08</span>
                  </div>
                </div>
              </div>
            </div>

            {/* playlist item */}
            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-7 rounded bg-[#13161e] flex items-center justify-center shrink-0">
                  <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">Candlestick para iniciantes</p>
                  <p className="text-[10px] text-gray-500">O Cara do Mercado · <span className="text-cyan-500/70">Iniciante</span></p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SIMULADOR REAL-TIME section ───────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Mockup — timeframe selector */}
          <div className="order-last md:order-first rounded-2xl border border-white/10 bg-[#0d0f18] overflow-hidden shadow-2xl shadow-black/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-semibold">BTC/USD</span>
              <span className="text-sm font-bold text-green-400">$67 842</span>
            </div>

            {/* TF buttons with countdown */}
            <div className="flex gap-1 items-center mb-4">
              {TF_ITEMS.map((tf, i) => (
                <span
                  key={tf}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                    i === 1 ? "bg-cyan-500 text-[#060709]" : "text-gray-600 bg-white/5"
                  }`}
                >
                  {tf}
                </span>
              ))}
              <span className="ml-auto text-[10px] text-cyan-400/60 font-mono tabular-nums">⏱ 00:17</span>
            </div>

            {/* Candles */}
            <div className="flex items-end gap-0.5 h-24">
              {[
                {h:40,bull:true},{h:55,bull:false},{h:48,bull:true},{h:65,bull:true},
                {h:52,bull:false},{h:70,bull:true},{h:62,bull:false},{h:80,bull:true},
                {h:72,bull:false},{h:88,bull:true},{h:76,bull:true},{h:92,bull:false},
                {h:84,bull:true},{h:95,bull:true},{h:88,bull:false},{h:100,bull:true},
              ].map((c, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm min-h-[4px]"
                  style={{
                    height: `${c.h}%`,
                    background: c.bull
                      ? i === 15 ? "#22d3ee" : "rgba(34,197,94,0.5)"
                      : "rgba(239,68,68,0.5)",
                  }}
                />
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              {["RSI", "MACD", "MM 20"].map((ind) => (
                <span key={ind} className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 text-gray-600">
                  {ind}
                </span>
              ))}
            </div>
          </div>

          {/* Text */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-cyan-400 mb-5">
              <LineChart className="w-3.5 h-3.5" />
              Simulador · Gráficos profissionais
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
              Pratica com gráficos<br />
              <span className="text-cyan-400">como um profissional.</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              Escolhe entre 5 tipos de gráfico, 6 timeframes com velas que fecham
              no segundo exacto — exactamente como o TradingView e o MetaTrader.
              O Coach IA analisa cada trade e dá-te feedback imediato.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                "5 tipos: Velas · Heikin-Ashi · Barras · Linha · Área",
                "6 timeframes: 1S · 1m · 5m · 1h · 4h · 1D",
                "Countdown ao fecho de cada vela, em tempo real",
                "Coach IA com análise de risco por operação",
                "Indicadores: RSI, MACD, Média Móvel 20",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/cadastrar"
              className="inline-flex items-center gap-2 border border-white/20 hover:border-cyan-500/40 text-white hover:text-cyan-400 font-semibold px-6 py-3 rounded-full text-sm transition-colors"
            >
              Experimentar o Simulador <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── COACH IA ──────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-cyan-400 mb-5">
              <Brain className="w-3.5 h-3.5" />
              Coach IA · Novo
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
              Feedback inteligente<br />
              <span className="text-cyan-400">em cada operação.</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              Após cada trade no simulador, o Coach IA analisa automaticamente
              a tua entrada, saída, gestão de risco e disciplina — e dá-te
              lições concretas para evoluíres mais rápido.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                { icon: Target, text: "Avaliação de entrada e saída de posição" },
                { icon: Shield, text: "Análise de gestão de risco e rácio R:R" },
                { icon: Sparkles, text: "Sugestões personalizadas de melhoria" },
                { icon: Flame, text: "Streak de consistência e progresso ao longo do tempo" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/15 flex items-center justify-center shrink-0">
                    <item.icon className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-sm text-gray-400">{item.text}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/cadastrar"
              className="inline-flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-[#060709] font-bold px-6 py-3 rounded-full text-sm transition-colors"
            >
              Activar Coach IA <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Coach IA mockup card */}
          <div className="rounded-2xl border border-white/10 bg-[#0d0f18] p-5 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-sm font-semibold text-white">Coach IA</span>
              <span className="ml-auto text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">Novo trade</span>
            </div>

            {/* trade summary */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Resultado", value: "+$340", color: "text-green-400" },
                { label: "R:R", value: "1:2.8", color: "text-cyan-400" },
                { label: "Duração", value: "14 min", color: "text-gray-300" },
              ].map((s) => (
                <div key={s.label} className="bg-[#13161e] rounded-xl p-3 text-center">
                  <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* analysis lines */}
            <div className="space-y-2.5">
              {[
                { label: "Entrada", text: "Boa entrada no suporte — aguardaste confirmação da vela.", ok: true },
                { label: "Risco", text: "Stop-loss correcto a 1.5%. Mantiveste a disciplina.", ok: true },
                { label: "Saída", text: "Saíste cedo. Poderias ter esperado a resistência seguinte.", ok: false },
              ].map((row) => (
                <div key={row.label} className="flex gap-2.5 items-start">
                  <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${row.ok ? "bg-green-500/15" : "bg-amber-500/15"}`}>
                    {row.ok
                      ? <CheckCircle className="w-2.5 h-2.5 text-green-400" />
                      : <Zap className="w-2.5 h-2.5 text-amber-400" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{row.label} </span>
                    <span className="text-xs text-gray-400">{row.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs text-gray-500">Streak de <span className="text-orange-400 font-semibold">5 dias</span> consecutivos · +50 XP ganhos</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="border border-white/5 rounded-3xl px-8 py-14 bg-[#0d0f18] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
            <h2 className="relative text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
              Qualquer pessoa pode aprender<br />e dominar o trading.
            </h2>
            <p className="relative text-gray-400 mb-8 max-w-xl mx-auto">
              Começa do zero hoje: aulas escritas, vídeo aulas curadas e um simulador
              profissional. Nível Iniciante totalmente grátis — sem cartão de crédito.
            </p>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/cadastrar"
                className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-[#060709] font-bold px-8 py-4 rounded-full text-base transition-colors"
              >
                Começar gratuitamente <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/entrar"
                className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-full text-base transition-colors"
              >
                Ver aulas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER + COMMUNITY ────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold mb-3 leading-tight">Educação Primeiro.</h3>
            <p className="text-gray-400 leading-relaxed">
              Sem custos ocultos. Sem promessas de enriquecimento.<br />
              Sem atalhos. Só conhecimento real.
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium mb-3">Mantém-te actualizado</p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-cyan-400 font-medium">
                <Zap className="w-4 h-4" /> Subscrito! Obrigado.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="O teu e-mail"
                  required
                  className="flex-1 bg-[#0d0f18] border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-cyan-400 hover:bg-cyan-300 text-[#060709] font-bold px-6 py-3 rounded-full text-sm transition-colors shrink-0"
                >
                  Subscrever
                </button>
              </form>
            )}
            <p className="text-xs text-gray-600 mt-2">
              Ao subscrever concordas com a nossa{" "}
              <span className="underline cursor-pointer hover:text-gray-400">Política de Privacidade</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight text-sm">TradeAcademy</span>
          </div>

          <div className="flex items-center gap-2">
            {[Twitter, MessageSquare, Send].map((Icon, i) => (
              <button
                key={i}
                className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-600 text-center md:text-right">
            © {new Date().getFullYear()} TradeAcademy ·{" "}
            <Link to="/termos" className="hover:text-gray-400 transition-colors">Termos de Serviço</Link>
            {" · "}
            <Link to="/privacidade" className="hover:text-gray-400 transition-colors">Política de Privacidade</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
