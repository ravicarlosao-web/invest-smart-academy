import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function EsqueciSenha() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <span className="text-white font-black text-xs">TA</span>
          </div>
          <span className="font-bold text-lg">TradeAcademy</span>
        </Link>

        {sent ? (
          /* ── Success state ── */
          <div className="rounded-2xl border border-border bg-surface-1 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold mb-2">Email enviado!</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Se o endereço <strong className="text-foreground">{email}</strong> está registado,
              receberás um email com um link para redefinir a password.
              O link expira em <strong className="text-foreground">1 hora</strong>.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Não recebeste o email? Verifica a pasta de spam ou{" "}
              <button
                className="text-primary underline underline-offset-2"
                onClick={() => setSent(false)}
              >
                tenta novamente
              </button>.
            </p>
            <Button asChild className="w-full">
              <Link to="/entrar">Voltar ao login</Link>
            </Button>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="rounded-2xl border border-border bg-surface-1 p-8">
            <Link
              to="/entrar"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>

            <h1 className="text-2xl font-bold mb-1">Esqueceste a password?</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Introduz o teu e-mail e enviaremos um link para criares uma nova password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">E-mail</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="o.teu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-surface-2 border-border text-white placeholder:text-gray-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                disabled={loading || !email.trim()}
              >
                {loading ? "A enviar..." : "Enviar link de recuperação"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
