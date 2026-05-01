import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, XCircle, Lock } from "lucide-react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type PageState = "idle" | "loading" | "success" | "invalid_token" | "token_expired" | "token_used";

export default function RedefinirSenha() {
  const [params]           = useSearchParams();
  const navigate           = useNavigate();
  const token              = params.get("token") ?? "";

  const [password, setPassword]     = useState("");
  const [confirm,  setConfirm]      = useState("");
  const [showPw,   setShowPw]       = useState(false);
  const [state,    setState]        = useState<PageState>("idle");

  useEffect(() => {
    if (!token) setState("invalid_token");
  }, [token]);

  const pwMatch   = password === confirm;
  const pwMinLen  = password.length >= 8;
  const canSubmit = pwMinLen && pwMatch && password.length > 0 && confirm.length > 0;

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
      if (msg.includes("token_expired"))   { setState("token_expired"); return; }
      if (msg.includes("token_used"))      { setState("token_used");    return; }
      if (msg.includes("invalid_token"))   { setState("invalid_token"); return; }
      toast.error("Erro ao redefinir a password. Tenta novamente.");
      setState("idle");
    }
  }

  /* ── Error / success states ── */
  if (state === "invalid_token" || state === "token_used") {
    return (
      <StatusScreen
        icon={<XCircle className="h-8 w-8 text-red-500" />}
        bg="bg-red-500/15"
        title="Link inválido"
        body="Este link de recuperação é inválido ou já foi utilizado."
        action={<Button asChild className="w-full"><Link to="/esqueci-senha">Pedir novo link</Link></Button>}
      />
    );
  }

  if (state === "token_expired") {
    return (
      <StatusScreen
        icon={<XCircle className="h-8 w-8 text-amber-500" />}
        bg="bg-amber-500/15"
        title="Link expirado"
        body="Este link de recuperação expirou (válido por 1 hora). Solicita um novo link."
        action={<Button asChild className="w-full"><Link to="/esqueci-senha">Pedir novo link</Link></Button>}
      />
    );
  }

  if (state === "success") {
    return (
      <StatusScreen
        icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
        bg="bg-emerald-500/15"
        title="Password redefinida!"
        body="A tua password foi alterada com sucesso. Vais ser redirecionado para o login..."
        action={<Button asChild className="w-full"><Link to="/entrar">Ir para o login</Link></Button>}
      />
    );
  }

  /* ── Form ── */
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <span className="text-white font-black text-xs">TA</span>
          </div>
          <span className="font-bold text-lg">TradeAcademy</span>
        </Link>

        <div className="rounded-2xl border border-border bg-surface-1 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Nova password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Escolhe uma nova password segura para a tua conta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-gray-300">Nova password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 bg-surface-2 border-border text-white placeholder:text-gray-500"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw((p) => !p)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && !pwMinLen && (
                <p className="text-xs text-red-400 mt-1">A password deve ter pelo menos 8 caracteres.</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirm" className="text-gray-300">Confirmar password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm"
                  type={showPw ? "text" : "password"}
                  placeholder="Repete a nova password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-surface-2 border-border text-white placeholder:text-gray-500"
                  required
                />
              </div>
              {confirm.length > 0 && !pwMatch && (
                <p className="text-xs text-red-400 mt-1">As passwords não coincidem.</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
              disabled={!canSubmit || state === "loading"}
            >
              {state === "loading" ? "A guardar..." : "Redefinir password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatusScreen({
  icon, bg, title, body, action,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <span className="text-white font-black text-xs">TA</span>
          </div>
          <span className="font-bold text-lg">TradeAcademy</span>
        </Link>
        <div className="rounded-2xl border border-border bg-surface-1 p-8 text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${bg} mx-auto mb-4`}>
            {icon}
          </div>
          <h1 className="text-xl font-bold mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{body}</p>
          {action}
          <div className="mt-3">
            <Link to="/entrar" className="text-xs text-muted-foreground hover:text-foreground">
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
