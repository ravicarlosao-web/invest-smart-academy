import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, XCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function GoogleAuthResultado() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const setFromOAuth   = useAuthStore((s) => s.setFromOAuth);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const token  = searchParams.get("token");
    const userId = searchParams.get("userId");
    const name   = searchParams.get("name") ?? "";
    const email  = searchParams.get("email") ?? "";
    const isNew  = searchParams.get("isNew") === "true";
    const error  = searchParams.get("error");

    if (error) {
      const messages: Record<string, string> = {
        google_not_configured: "O Google OAuth não está configurado nesta plataforma.",
        google_denied:         "Acesso cancelado. Podes tentar novamente.",
        google_no_email:       "A tua conta Google não partilhou o e-mail. Cria conta com e-mail.",
        google_revoked:        "O acesso ao Google foi revogado. Inicia sessão com e-mail e password.",
        google_link_required:  "Este e-mail já está registado. Inicia sessão com a tua password.",
      };
      const msg = messages[error] ?? "Ocorreu um erro com a autenticação Google.";
      setErrorMsg(msg);
      toast.error(msg);
      setTimeout(() => navigate("/entrar"), 3000);
      return;
    }

    if (token && userId) {
      setFromOAuth({ id: userId, name, email }, token);
      toast.success(`Bem-vindo${name ? `, ${name.split(" ")[0]}` : ""}!`);
      navigate(isNew ? "/aprender" : "/dashboard", { replace: true });
    } else {
      navigate("/entrar", { replace: true });
    }
  }, []);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/20 mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Erro na autenticação</h2>
          <p className="text-gray-400 text-sm">{errorMsg}</p>
          <p className="text-gray-600 text-xs mt-3">A redirecionar para o login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      <p className="text-gray-400 text-sm">A processar autenticação Google…</p>
    </div>
  );
}
