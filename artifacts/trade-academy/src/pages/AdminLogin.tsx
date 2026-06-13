import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Mail, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import AuthLayout from "@/components/AuthLayout";
import { useSEO } from "@/hooks/useSEO";

export default function AdminLogin() {
  useSEO({
    title: "Acesso Administrativo — ALUKA",
    description: "Área restrita para administradores e professores da plataforma ALUKA.",
    canonical: "/admin/entrar",
  });

  const navigate = useNavigate();
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

    if (!result.ok) {
      toast.error(result.error ?? "Credenciais inválidas.");
      return;
    }

    const user = useAuthStore.getState().user;
    const role = user?.role ?? "";

    if (!["administrador", "professor", "master"].includes(role)) {
      useAuthStore.getState().logout();
      toast.error("Esta conta não tem permissões administrativas.");
      return;
    }

    toast.success("Acesso autorizado");
    navigate("/ta-painel-gestao");
  };

  return (
    <AuthLayout
      panelTitle={<><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-500">Acesso Administrativo</span><br />à plataforma</>}
      panelBody="Área restrita para administradores e professores. Insere as tuas credenciais para aceder ao painel de gestão."
    >
      <div className="flex justify-center mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-violet-400 bg-violet-400/10 border border-violet-400/20 rounded-full px-4 py-1.5">
          <Shield className="w-3.5 h-3.5" />
          Área Restrita
        </span>
      </div>

      <div className="mb-7">
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Conta Administrativa</h1>
        <p className="text-gray-400 text-sm mt-1.5">Insere o teu e-mail e password para aceder ao painel de gestão.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-gray-300 text-sm font-medium">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="admin@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="pl-10 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500/50 rounded-xl transition-colors"
            />
          </div>
        </div>

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
              className="pl-10 pr-11 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500/50 rounded-xl transition-colors"
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

        <Button
          type="submit"
          disabled={loading || !email || !password}
          className="h-11 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 text-white shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 mt-1 transition-all"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> A verificar…</>
            : <><Shield className="w-4 h-4" /><span>Entrar como Admin</span></>
          }
        </Button>
      </form>

      <p className="text-center text-[11px] text-gray-600 mt-8">
        Esta área é exclusiva para administradores e professores.<br />
        Não és administrador? <a href="/entrar" className="underline hover:text-gray-400 transition-colors">Entra aqui</a>.
      </p>
    </AuthLayout>
  );
}
