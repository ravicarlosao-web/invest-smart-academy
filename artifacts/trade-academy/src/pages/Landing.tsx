import { useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, BookOpen, Trophy, BarChart2, Shield,
  Zap, GraduationCap, Brain, ChevronRight, Twitter,
  MessageSquare, Send,
} from "lucide-react";
import heroImage from "@assets/ChatGPT_Image_29_04_2026,_16_25_06_1777476333705.png";

/* ─── Data ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: BookOpen,
    title: "Totalmente gratuito",
    desc: "Sem subscrições, sem cartão de crédito. Todo o conteúdo acessível para sempre.",
  },
  {
    icon: BarChart2,
    title: "40+ aulas estruturadas",
    desc: "Do básico ao avançado, com quizzes e revisão espaçada para fixares o conhecimento.",
  },
  {
    icon: Shield,
    title: "Simulador com dados reais",
    desc: "Pratica com preços reais, abre posições e analisa o teu desempenho sem risco.",
  },
  {
    icon: Brain,
    title: "Aprende sem arriscar",
    desc: "Domina a gestão de risco, stop-loss e dimensionamento antes de usar dinheiro real.",
  },
];

const STATS = [
  { value: "40+",    label: "Aulas" },
  { value: "8",      label: "Módulos" },
  { value: "100%",   label: "Gratuito" },
  { value: "PT",     label: "Em Português" },
];

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
        <a href="#aulas" className="hover:text-white transition-colors">Aulas</a>
        <a href="#simulador" className="hover:text-white transition-colors">Simulador</a>
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

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(""); }
  }

  return (
    <div className="min-h-screen bg-[#060709] text-white overflow-x-hidden">
      <Nav />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden">
        {/* hero background image — spheres */}
        <img
          src={heroImage}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80 pointer-events-none select-none"
        />
        {/* dark vignette so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060709]/60 via-transparent to-[#060709]" />

        {/* content */}
        <div className="relative z-10 flex flex-col items-center gap-5 max-w-4xl mx-auto">
          {/* badge */}
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
            40 aulas estruturadas do básico ao avançado, simulador com dados
            reais e desafios de gestão de risco. Tudo gratuito, tudo em português.
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

        {/* bottom fade handled by gradient above */}
      </section>

      {/* ── APP MOCKUP strip ─────────────────────────────── */}
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
          {/* fake dashboard content */}
          <div className="p-6 grid grid-cols-3 gap-4">
            {/* chart placeholder */}
            <div className="col-span-2 bg-[#13161e] rounded-xl p-4 h-36 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">BTC/USD — Simulador</span>
                <span className="text-xs text-green-400 font-semibold">+2.4%</span>
              </div>
              {/* fake chart bars */}
              <div className="flex items-end gap-1 h-16">
                {[55,40,65,48,72,60,85,50,78,90,68,95,72,80,65,88,75].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      background: i >= 14 ? "#22d3ee" : "rgba(255,255,255,0.08)",
                    }}
                  />
                ))}
              </div>
            </div>
            {/* stats cards */}
            <div className="flex flex-col gap-3">
              <div className="bg-[#13161e] rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">Saldo virtual</span>
                <span className="text-lg font-bold text-white">$12 450</span>
                <span className="text-xs text-green-400">+$450 hoje</span>
              </div>
              <div className="bg-[#13161e] rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">Win rate</span>
                <span className="text-lg font-bold text-cyan-400">64%</span>
                <span className="text-xs text-gray-500">32 trades</span>
              </div>
            </div>
            {/* lessons row */}
            <div className="col-span-3 grid grid-cols-3 gap-3">
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

      {/* ── SECTION: Líder em Educação ───────────────────── */}
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
            com conteúdo estruturado, prática real e sem riscos financeiros.
          </p>
        </div>
      </section>

      {/* ── FEATURES grid ────────────────────────────────── */}
      <section id="funcionalidades" className="py-4 px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-b border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                {s.value}
              </div>
              <div className="text-sm text-gray-500 mt-2 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── JOURNEY section ──────────────────────────────── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="border border-white/5 rounded-3xl px-8 py-14 bg-[#0d0f18] relative overflow-hidden">
            {/* faint glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
            <h2 className="relative text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
              Qualquer pessoa pode aprender<br />
              e dominar o trading.
            </h2>
            <p className="relative text-gray-400 mb-8 max-w-xl mx-auto">
              Começa do zero hoje e percorre o caminho até à confiança real nos mercados —
              sem gastar um cêntimo.
            </p>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/cadastrar"
                className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-[#060709] font-bold px-8 py-4 rounded-full text-base transition-colors"
              >
                Começar gratuitamente
                <ChevronRight className="w-4 h-4" />
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

      {/* ── COMMUNITY + NEWSLETTER ───────────────────────── */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold mb-3 leading-tight">
              Educação Primeiro.
            </h3>
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
            {/* social icons */}
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
            © {new Date().getFullYear()} TradeAcademy · Termos de Serviço · Política de Privacidade
          </p>
        </div>
      </footer>
    </div>
  );
}
