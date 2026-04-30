import { useState } from "react";
import { CreditCard, Clock, CheckCircle2, XCircle, AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { useAuthStore } from "@/store/useAuthStore";

const BANK_DETAILS = {
  banco:       "Banco BFA",
  conta:       "1234 5678 9012 3456",
  titular:     "TradeAcademy Angola, Lda.",
  iban:        "AO06 0040 0000 0123 4567 8901 2",
  descricao:   "Mensalidade TradeAcademy",
  valor:       "5.000,00 AOA",
};

interface Props {
  onClose?: () => void;
}

export function PaymentWall({ onClose }: Props) {
  const user         = useAuthStore((s) => s.user);
  const { subscription, requestPayment, updateReference, loading } = useSubscriptionStore();

  const [step, setStep]       = useState<"info" | "form" | "done">("info");
  const [reference, setReference] = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [copied, setCopied]   = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError(null);

    const hasPending = subscription?.status === "pending";
    let result;

    if (hasPending && reference) {
      result = await updateReference(user.id, reference);
    } else {
      result = await requestPayment(user.id, reference || undefined);
    }

    if (!result.ok) {
      setError(result.error ?? "Erro ao submeter pedido.");
      return;
    }
    setStep("done");
  };

  // ─── Status: pending ──────────────────────────────────────────────────────
  if (subscription?.status === "pending") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/15">
          <Clock className="h-7 w-7 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Aguardando confirmação</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            O teu pedido de subscrição está a ser verificado pelo administrador.
            Receberás acesso assim que o pagamento for confirmado.
          </p>
        </div>
        {subscription.paymentReference ? (
          <div className="rounded-lg border border-border bg-surface-1 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Referência submetida: </span>
            <span className="font-mono font-semibold">{subscription.paymentReference}</span>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-2">
            <p className="text-xs text-muted-foreground">
              Ainda não submeteste a referência do pagamento. Podes adicioná-la abaixo:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-md border border-border bg-surface-1 px-3 py-2 text-sm"
                placeholder="Ex: TRF-20240501-12345"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
              <Button size="sm" disabled={!reference || loading} onClick={handleSubmit}>
                Guardar
              </Button>
            </div>
            {error && <p className="text-xs text-bear">{error}</p>}
          </div>
        )}
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>
    );
  }

  // ─── Status: rejected ─────────────────────────────────────────────────────
  if (subscription?.status === "rejected") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bear/15">
          <XCircle className="h-7 w-7 text-bear" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Pedido rejeitado</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {subscription.notes
              ? `Motivo: ${subscription.notes}`
              : "O teu pedido foi rejeitado. Contacta o suporte para mais informações."}
          </p>
        </div>
        <Button onClick={() => setStep("info")}>Fazer novo pedido</Button>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>
    );
  }

  // ─── Confirmação de pedido enviado ────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bull/15">
          <CheckCircle2 className="h-7 w-7 text-bull" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Pedido enviado!</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            O administrador irá verificar o teu pagamento e ativar o acesso em breve.
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose}>Fechar</Button>
        )}
      </div>
    );
  }

  // ─── Formulário de referência ─────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
          <p className="text-xs text-muted-foreground">
            Após efetuar o pagamento no banco, adiciona a referência da transferência abaixo
            para que o administrador possa confirmar o teu pagamento mais rapidamente.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Referência do pagamento <span className="text-muted-foreground">(opcional)</span></label>
          <input
            type="text"
            className="w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm"
            placeholder="Ex: TRF-20240501-12345"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Podes enviar o pedido agora e adicionar a referência depois no teu perfil.
          </p>
        </div>

        {error && <p className="text-sm text-bear">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
            Voltar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? "A enviar…" : "Enviar pedido"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Info: dados bancários ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
          <CreditCard className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Subscrição Premium</h3>
          <p className="text-xs text-muted-foreground">Acesso a Intermediário e Avançado</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-lg font-bold text-primary">5.000 AOA</p>
          <p className="text-xs text-muted-foreground">/mês</p>
        </div>
      </div>

      {/* O que inclui */}
      <div className="rounded-lg border border-border bg-surface-1 p-3 space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Inclui</p>
        {[
          "Todos os níveis Intermediário e Avançado",
          "Análise técnica avançada",
          "Estratégias de trading profissional",
          "Acesso completo ao simulador",
          "Suporte prioritário",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-bull" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {/* Dados bancários */}
      <div className="rounded-lg border border-border bg-surface-1 p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Como pagar</p>
        <p className="text-xs text-muted-foreground">
          Faz uma transferência bancária com os dados abaixo e depois clica em <strong>"Confirmar pagamento"</strong>.
        </p>
        <div className="space-y-1.5 mt-2">
          {Object.entries(BANK_DETAILS).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-2 text-sm">
              <span className="capitalize text-muted-foreground">{key}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs">{value}</span>
                {(key === "conta" || key === "iban") && (
                  <button
                    onClick={() => copy(value, key)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Copiar"
                  >
                    {copied === key ? <Check className="h-3 w-3 text-bull" /> : <Copy className="h-3 w-3" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={() => setStep("form")} className="w-full">
        Confirmar pagamento
      </Button>

      {onClose && (
        <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
          Agora não
        </Button>
      )}
    </div>
  );
}
