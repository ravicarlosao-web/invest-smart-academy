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

export default function Login() {
  useSEO({
    title: "Entrar — ALUKA",
    description: "Inicia sessão no ALUKA e continua a aprender trading em português.",
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
    const result = await login(email, password) as any;
    setLoading(false);
    if (result.ok) {
      // If email not yet verified, send user to the verification step
      if (result.emailVerified === false) {
        navigate("/cadastrar?verificar=1");
      } else {
        navigate("/dashboard");
      }
    } else {
      toast.error(result.error ?? "Erro ao iniciar sessão.");
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <AuthLayout
      panelTitle={<>Bem-vindo de volta<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">ao teu espaço</span></>}
      panelBody="Continua de onde paraste. O teu progresso, simulador e recursos estão à tua espera."
    >
      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Entrar na conta</h1>
        <p className="text-gray-400 text-sm mt-1.5">Bem-vindo de volta. Insere os teus dados abaixo.</p>
      </div>

      {/* Google button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-sm text-gray-300 hover:text-white transition-all font-medium mb-5"
      >
        <GoogleIcon />
        Continuar com Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-white/[0.07]" />
        <span className="text-xs text-gray-600">ou com e-mail</span>
        <div className="flex-1 h-px bg-white/[0.07]" />
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
