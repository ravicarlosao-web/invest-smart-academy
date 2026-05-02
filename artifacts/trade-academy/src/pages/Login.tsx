import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import AuthLayout from "@/components/AuthLayout";

export default function Login() {
  useSEO({
    title: "Entrar — TradeAcademy Angola",
    description: "Inicia sessão no TradeAcademy Angola e continua a aprender trading em português.",
    canonical: "/entrar",
  });
  const navigate  = useNavigate();
  const { login } = useAuthStore();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      navigate("/dashboard");
    } else {
      toast.error(result.error ?? "Erro ao iniciar sessão.");
    }
  };

  return (
    <AuthLayout
      panelTitle={<>Bem-vindo de volta<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">ao teu espaço</span></>}
      panelBody="Continua de onde paraste. O teu progresso, simulador e recursos estão à tua espera."
    >
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Entrar na conta</h1>
        <p className="text-gray-400 text-sm mt-1.5">Bem-vindo de volta. Insere os teus dados abaixo.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-gray-300 text-sm font-medium">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="teu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="pl-10 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/50 rounded-xl transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-gray-300 text-sm font-medium">Password</Label>
            <Link
              to="/esqueci-senha"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Esqueceste a password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pl-10 pr-11 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/50 rounded-xl transition-colors"
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
        </div>

        {/* CTA */}
        <Button
          type="submit"
          disabled={loading || !email || !password}
          className="h-11 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 mt-1 transition-all"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> A entrar…</>
            : <><span>Entrar</span><ArrowRight className="w-4 h-4" /></>
          }
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-white/[0.07]" />
        <span className="text-xs text-gray-600">Novo por aqui?</span>
        <div className="flex-1 h-px bg-white/[0.07]" />
      </div>

      {/* Register link */}
      <Link
        to="/cadastrar"
        className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-sm text-gray-300 hover:text-white transition-all font-medium"
      >
        Criar conta gratuita
      </Link>

      <p className="text-center text-[11px] text-gray-600 mt-6">
        Ao entrar, aceitas os nossos{" "}
        <Link to="/termos" className="underline hover:text-gray-400 transition-colors">Termos</Link>
        {" "}e{" "}
        <Link to="/privacidade" className="underline hover:text-gray-400 transition-colors">Privacidade</Link>
      </p>
    </AuthLayout>
  );
}
