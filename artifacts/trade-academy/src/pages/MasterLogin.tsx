import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import AuthLayout from "@/components/AuthLayout";

export default function MasterLogin() {
  useSEO({
    title: "Acesso Master — ALUKA",
    description: "Acesso restrito à conta Master da plataforma ALUKA.",
    canonical: "/master/entrar",
  });

  const navigate     = useNavigate();
  const { masterLogin } = useAuthStore();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const result = await masterLogin(email, password);
    setLoading(false);
    if (result.ok) {
      navigate("/master/painel");
    } else {
      toast.error(result.error ?? "Credenciais inválidas.");
    }
  };

  return (
    <AuthLayout
      panelTitle={<><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Acesso Master</span><br />à plataforma</>}
      panelBody="Área restrita. Apenas o utilizador Master tem acesso a este painel de controlo total da plataforma."
    >
      {/* Badge */}
      <div className="flex justify-center mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Acesso Restrito
        </span>
      </div>

      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Conta Master</h1>
        <p className="text-gray-400 text-sm mt-1.5">Insere as credenciais Master para aceder ao painel de controlo.</p>
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
              placeholder="master@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="pl-10 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:border-amber-500/50 rounded-xl transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-gray-300 text-sm font-medium">Password</Label>
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
              className="pl-10 pr-11 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:border-amber-500/50 rounded-xl transition-colors"
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
          className="h-11 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-0 text-white shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-1 transition-all"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> A verificar…</>
            : <><ShieldCheck className="w-4 h-4" /><span>Entrar como Master</span></>
          }
        </Button>
      </form>

      <p className="text-center text-[11px] text-gray-600 mt-8">
        Esta área é exclusiva para administração total da plataforma.<br />
        Se não és o Master, <a href="/entrar" className="underline hover:text-gray-400 transition-colors">entra aqui</a>.
      </p>
    </AuthLayout>
  );
}
