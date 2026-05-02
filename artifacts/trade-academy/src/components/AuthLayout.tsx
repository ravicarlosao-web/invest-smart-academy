import { Link } from "react-router-dom";
import { TrendingUp, Users, BookOpen, Zap } from "lucide-react";

const STATS = [
  { icon: Users,    value: "2 400+", label: "Alunos em Angola" },
  { icon: BookOpen, value: "40+",    label: "Lições estruturadas" },
  { icon: TrendingUp, value: "100%", label: "Grátis para iniciar" },
];

function TradingChart() {
  const w = 420;
  const h = 220;
  const points = [
    [0,170],[40,155],[70,160],[100,130],[130,145],[160,110],[190,120],
    [220,85],[250,95],[280,60],[310,75],[340,40],[380,30],[420,15],
  ];
  const polyline = points.map(([x,y]) => `${x},${y}`).join(" ");

  const areaPoints = [
    `0,${h}`,
    ...points.map(([x,y]) => `${x},${y}`),
    `${w},${h}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#06b6d4" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"    />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGradient)" />
      <polyline
        points={polyline}
        fill="none"
        stroke="#06b6d4"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />
      {points.filter((_,i) => i % 3 === 0).map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#06b6d4" opacity="0.7" filter="url(#glow)" />
      ))}
      {[180,140,100,60,20].map((y,i) => (
        <line key={i} x1="0" y1={y} x2={w} y2={y}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 6" />
      ))}
    </svg>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  panelTitle?: string;
  panelBody?: string;
}

export default function AuthLayout({ children, panelTitle, panelBody }: AuthLayoutProps) {
  return (
    <div className="h-screen overflow-hidden bg-[#080b12] text-white flex flex-col lg:flex-row">

      {/* ── LEFT PANEL (desktop only) ──────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden bg-[#080b12]">

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Radial glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[60%] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-auto">
            <img src="/logo-transparent.png" alt="ALUKA" className="w-9 h-9 object-contain" />
            <span className="font-bold text-lg tracking-tight">ALUKA</span>
          </Link>

          {/* Center block */}
          <div className="flex-1 flex flex-col justify-center py-10">
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-3 py-1">
                <Zap className="w-3 h-3" /> Plataforma #1 em Angola
              </span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold leading-snug mt-4 mb-3">
              {panelTitle ?? (
                <>Aprende a investir<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">sem arriscar dinheiro</span></>
              )}
            </h2>
            <p className="text-gray-400 text-sm xl:text-base leading-relaxed max-w-sm">
              {panelBody ?? "40 aulas estruturadas, simulador com dados reais e Coach IA por trade — tudo em português, grátis para iniciar."}
            </p>

            {/* Chart */}
            <div className="mt-8 mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest">Simulador de Portfolio</p>
                  <p className="text-2xl font-bold text-white mt-0.5">+<span className="text-cyan-400">24,7%</span></p>
                </div>
                <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-1 font-medium">
                  ↑ Este mês
                </span>
              </div>
              <TradingChart />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center">
                  <Icon className="w-4 h-4 text-cyan-400 mx-auto mb-1.5" />
                  <p className="text-base font-bold">{value}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-gray-600 mt-auto">
            © {new Date().getFullYear()} ALUKA · Educação financeira acessível
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ─────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-5 py-8 lg:py-6 lg:px-12 xl:px-16 relative">

        {/* Mobile: subtle top gradient */}
        <div className="lg:hidden absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-transparent.png" alt="ALUKA" className="w-10 h-10 object-contain" />
            <span className="font-bold text-xl tracking-tight">ALUKA</span>
          </Link>
        </div>

        {/* Form slot */}
        <div className="w-full max-w-sm lg:max-w-md relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
