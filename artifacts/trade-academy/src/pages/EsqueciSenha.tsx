import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2, Loader2, Send } from "lucide-react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AuthLayout from "@/components/AuthLayout";

export default function EsqueciSenha() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.auth.forgotPassword(email.trim());
      setSent(true);
    } catch {
      toast.error("Erro ao processar o pedido. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      panelTitle={<>Recupera o<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">acesso à conta</span></>}
      panelBody="Enviamos um link seguro para o teu e-mail. O processo é rápido e o link expira em 1 hora."
    >
      {/* Back link */}
      <Link
        to="/entrar"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-7"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao login
      </Link>

      {sent ? (
        /* ── Success state ── */
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20 mx-auto mb-5">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Email enviado!</h1>
          <p className="text-sm text-gray-400 mb-2 leading-relaxed">
            Se <span className="text-white font-medium">{email}</span> está registado, receberás
            um link para redefinir a password. O link expira em{" "}
            <span className="text-white font-medium">1 hora</span>.
          </p>
          <p className="text-xs text-gray-600 mb-7">
            Não recebeste?{" "}
            <button
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              onClick={() => setSent(false)}
            >
              Tenta novamente
            </button>
            {" "}ou verifica o spam.
          </p>
          <Button asChild className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold border-0 shadow-lg shadow-cyan-500/20">
            <Link to="/entrar">Ir para o login</Link>
          </Button>
        </div>
      ) : (
        /* ── Form state ── */
        <>
          <div className="mb-7">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Esqueceste a password?</h1>
            <p className="text-gray-400 text-sm mt-1.5">
              Introduz o teu e-mail e enviamos um link de recuperação.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="o.teu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/50 rounded-xl transition-colors"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              disabled={loading || !email.trim()}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> A enviar…</>
                : <><Send className="w-4 h-4" /> Enviar link de recuperação</>
              }
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-7">
            Lembraste da password?{" "}
            <Link to="/entrar" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
