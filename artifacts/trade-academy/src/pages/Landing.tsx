import { Link } from "react-router-dom";
import { TrendingUp, BookOpen, Trophy, BarChart2, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: <BookOpen className="w-6 h-6 text-cyan-400" />,
    title: "40 Aulas Estruturadas",
    desc: "Do básico ao avançado, com quizzes e revisão espaçada para fixares o conhecimento.",
  },
  {
    icon: <BarChart2 className="w-6 h-6 text-cyan-400" />,
    title: "Simulador Realista",
    desc: "Treina com dados reais, abre posições, gere risco e analisa o teu desempenho.",
  },
  {
    icon: <Trophy className="w-6 h-6 text-cyan-400" />,
    title: "Conquistas & Desafios",
    desc: "Ganha XP, desbloqueia badges e compete em duelos com outros traders.",
  },
  {
    icon: <Shield className="w-6 h-6 text-cyan-400" />,
    title: "Gestão de Risco",
    desc: "Aprende a calcular posições, stop-loss e risco por trade antes de arriscar dinheiro real.",
  },
  {
    icon: <Zap className="w-6 h-6 text-cyan-400" />,
    title: "Missões Diárias",
    desc: "Mantém o ritmo com missões diárias que te motivam a aprender todos os dias.",
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-cyan-400" />,
    title: "Biblioteca de Estratégias",
    desc: "Acesso a livros e estratégias de trading para aprofundares o teu conhecimento.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">TradeAcademy</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/entrar">
            <Button variant="ghost" className="text-white hover:text-cyan-400 hover:bg-white/5">
              Entrar
            </Button>
          </Link>
          <Link to="/cadastrar">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-5">
              Criar conta
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 gap-6 max-w-4xl mx-auto w-full flex-1">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 text-cyan-400 text-sm font-medium mb-2">
          <Zap className="w-4 h-4" /> A plataforma de trading mais completa em português
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
          Aprende a investir{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            sem arriscar dinheiro real
          </span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl">
          40 aulas estruturadas, simulador com dados reais, desafios de gestão de risco e muito mais.
          Tudo em português, gratuito e pensado para te tornar um trader disciplinado.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <Link to="/cadastrar">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/20"
            >
              Começar gratuitamente →
            </Button>
          </Link>
          <Link to="/entrar">
            <Button
              size="lg"
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-white/5 px-8 py-6 text-lg rounded-xl"
            >
              Já tenho conta
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-10 text-center">
          {[
            { value: "40+", label: "Aulas" },
            { value: "100%", label: "Gratuito" },
            { value: "Em PT", label: "Português" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-cyan-400">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#13161e] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Tudo o que precisas para aprender</h2>
          <p className="text-gray-400 text-center mb-12">
            Uma plataforma completa, sem distrações, focada em resultados reais.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[#1a1d27] border border-white/5 rounded-2xl p-6 flex flex-col gap-3 hover:border-cyan-500/30 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-gray-400 mb-8">
            Cria a tua conta gratuitamente e começa a aprender hoje.
          </p>
          <Link to="/cadastrar">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-10 py-6 text-lg rounded-xl"
            >
              Criar conta grátis →
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} TradeAcademy — Educação financeira em português
      </footer>
    </div>
  );
}
