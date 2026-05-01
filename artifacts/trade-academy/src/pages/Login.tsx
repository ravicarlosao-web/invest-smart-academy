import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function Login() {
  useSEO({
    title: "Entrar — TradeAcademy Angola",
    description: "Inicia sessão no TradeAcademy Angola e continua a aprender trading em português.",
    canonical: "/entrar",
  });
  const navigate   = useNavigate();
  const { login }  = useAuthStore();

  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);

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
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8">
        <img src="/logo-transparent.png" alt="TradeAcademy" className="w-10 h-10 object-contain" />
        <span className="font-bold text-xl tracking-tight">TradeAcademy</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#1a1d27] border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-1">Bem-vindo de volta</h1>
        <p className="text-gray-400 text-sm mb-6">Entra na tua conta para continuar.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-gray-300">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="teu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#0f1117] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#0f1117] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500 pr-10"
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
          </div>

          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-5 rounded-xl w-full mt-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Ainda não tens conta?{" "}
          <Link to="/cadastrar" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
