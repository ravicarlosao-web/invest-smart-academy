import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, XCircle, Lock, Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AuthLayout from "@/components/AuthLayout";

type PageState = "idle" | "loading" | "success" | "invalid_token" | "token_expired" | "token_used";

function StatusCard({
  icon, iconBg, title, body, action,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <AuthLayout>
      <div className="text-center">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border mx-auto mb-5 ${iconBg}`}>
          {icon}
        </div>
        <h1 className="text-2xl font-extrabold mb-2">{title}</h1>
        <p className="text-sm text-gray-400 mb-7 leading-relaxed">{body}</p>
        {action}
        <div className="mt-4">
          <Link to="/entrar" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Voltar ao login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function RedefinirSenha() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [state,    setState]    = useState<PageState>("idle");

  useEffect(() => { if (!token) setState("invalid_token"); }, [token]);

  const pwMatch   = password === confirm;
  const pwMinLen  = password.length >= 8;
  const canSubmit = pwMinLen && pwMatch && password.length > 0 && confirm.length > 0;

  const pwStrength = password.length === 0 ? 0 :
    password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1;
  const strengthColor = ["bg-white/10","bg-red-500","bg-yellow-500","bg-emerald-400","bg-emerald-500"][pwStrength];
  const strengthLabel = ["","Fraca","Média","Boa","Forte"][pwStrength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setState("loading");
    try {
      await api.auth.resetPassword(token, password);
      setState("success");
      toast.success("Password redefinida com sucesso!");
      setTimeout(() => navigate("/entrar"), 2500);
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.includes("token_expired")) { setState("token_expired"); return; }
      if (msg.includes("token_used"))    { setState("token_used");    return; }
      if (msg.includes("invalid_token")) { setState("invalid_token"); return; }
      toast.error("Erro ao redefinir a password. Tenta novamente.");
      setState("idle");
    }
  }

  if (state === "invalid_token" || state === "token_used") {
    return (
      <StatusCard
        icon={<XCircle className="h-8 w-8 text-red-400" />}
        iconBg="bg-red-500/15 border-red-500/20"
        title="Link inválido"
        body="Este link de recuperação é inválido ou já foi utilizado. Solicita um novo para continuar."
        action={
          <Button asChild className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold border-0 shadow-lg shadow-cyan-500/20">
            <Link to="/esqueci-senha">Pedir novo link</Link>
          </Button>
        }
      />
    );
  }

  if (state === "token_expired") {
    return (
      <StatusCard
        icon={<XCircle className="h-8 w-8 text-amber-400" />}
        iconBg="bg-amber-500/15 border-amber-500/20"
        title="Link expirado"
        body="Este link de recuperação expirou (válido por 1 hora). Solicita um novo link para redefinir a password."
        action={
          <Button asChild className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold border-0 shadow-lg shadow-cyan-500/20">
            <Link to="/esqueci-senha">Pedir novo link</Link>
          </Button>
        }
      />
    );
  }

  if (state === "success") {
    return (
      <StatusCard
        icon={<CheckCircle2 className="h-8 w-8 text-emerald-400" />}
        iconBg="bg-emerald-500/15 border-emerald-500/20"
        title="Password redefinida!"
        body="A tua password foi alterada com sucesso. Vais ser redirecionado para o login em instantes…"
        action={
          <Button asChild className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold border-0 shadow-lg shadow-cyan-500/20">
            <Link to="/entrar">Ir para o login</Link>
          </Button>
        }
      />
    );
  }

  return (
    <AuthLayout
      panelTitle={<>Define uma<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">nova password segura</span></>}
      panelBody="Escolhe uma password forte com pelo menos 8 caracteres. Podes usar letras, números e símbolos."
    >
      <div className="mb-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/20 mb-5">
          <ShieldCheck className="h-6 w-6 text-cyan-400" />
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Nova password</h1>
        <p className="text-gray-400 text-sm mt-1.5">
          Escolhe uma password segura para a tua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Nova password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-gray-300 text-sm font-medium">Nova password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-11 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/50 rounded-xl transition-colors"
              required
            />
            <button
              type="button"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              onClick={() => setShowPw((p) => !p)}
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Strength bar */}
          {password.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-1 flex-1">
                {[1,2,3,4].map((n) => (
                  <div key={n} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${n <= pwStrength ? strengthColor : "bg-white/10"}`} />
                ))}
              </div>
              <span className="text-[11px] text-gray-500 w-8">{strengthLabel}</span>
            </div>
          )}
          {password.length > 0 && !pwMinLen && (
            <p className="text-xs text-red-400">A password deve ter pelo menos 8 caracteres.</p>
          )}
        </div>

        {/* Confirmar */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm" className="text-gray-300 text-sm font-medium">Confirmar password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <Input
              id="confirm"
              type={showPw ? "text" : "password"}
              placeholder="Repete a nova password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`pl-10 h-11 bg-white/[0.04] text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-xl transition-colors border ${
                confirm.length > 0 && !pwMatch ? "border-red-500/60 focus-visible:border-red-500/60" : "border-white/10 focus-visible:border-cyan-500/50"
              }`}
              required
            />
          </div>
          {confirm.length > 0 && !pwMatch && (
            <p className="text-xs text-red-400">As passwords não coincidem.</p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2 mt-1"
          disabled={!canSubmit || state === "loading"}
        >
          {state === "loading"
            ? <><Loader2 className="w-4 h-4 animate-spin" /> A guardar…</>
            : <><ShieldCheck className="w-4 h-4" /> Redefinir password</>
          }
        </Button>
      </form>
    </AuthLayout>
  );
}
