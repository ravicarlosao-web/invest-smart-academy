import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, XCircle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";

function GoogleLogo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
      <path d="M43.611 20.083H42V20H24v8h11.303a11.96 11.96 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
    </svg>
  );
}

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? "/api";
const GOOGLE_AUTH_URL = `${API_BASE}/auth/google`;

type State = "loading" | "redirecting" | "disabled" | "error";

export default function GoogleAuth() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initGoogleAuth() {
      try {
        const status = await api.auth.googleStatus();

        if (cancelled) return;

        if (!status.enabled) {
          setState("disabled");
          setErrorMsg("O acesso com Google não está disponível neste momento. Por favor utiliza o e-mail e a password.");
          return;
        }

        setState("redirecting");
        setTimeout(() => {
          if (!cancelled) {
            window.location.href = GOOGLE_AUTH_URL;
          }
        }, 800);
      } catch {
        if (!cancelled) {
          setState("error");
          setErrorMsg("Não foi possível verificar o estado do Google OAuth. Tenta novamente.");
        }
      }
    }

    initGoogleAuth();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        {/* Logo Google */}
        <div className="flex items-center justify-center mb-6">
          <div className="h-20 w-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shadow-xl">
            <GoogleLogo size={44} />
          </div>
        </div>

        {state === "loading" && (
          <>
            <Loader2 className="h-6 w-6 text-cyan-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">A verificar…</h2>
            <p className="text-gray-400 text-sm">A confirmar disponibilidade do Google OAuth.</p>
          </>
        )}

        {state === "redirecting" && (
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
              <span className="text-cyan-400 font-medium text-sm">A redirecionar…</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Continuar com Google</h2>
            <p className="text-gray-400 text-sm">
              Estás a ser redirecionado para o Google.<br />
              Aguarda um momento.
            </p>
            {/* Progress bar */}
            <div className="mt-6 h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-[progress_0.8s_ease-in-out_forwards]" />
            </div>
          </>
        )}

        {(state === "disabled" || state === "error") && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 mx-auto mb-4">
              <XCircle className="h-8 w-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {state === "disabled" ? "Google OAuth desativado" : "Erro de ligação"}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">{errorMsg}</p>

            <div className="flex flex-col gap-3 mt-6">
              <Button
                onClick={() => navigate("/entrar")}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl h-11"
              >
                Entrar com e-mail
              </Button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
