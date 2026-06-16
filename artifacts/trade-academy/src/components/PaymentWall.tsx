import { useState, useRef, useEffect } from "react";
import {
  CreditCard, Clock, CheckCircle2, XCircle, AlertTriangle,
  Copy, Check, Upload, FileText, Image, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlanConfig } from "@/hooks/usePlanConfig";
import { api, type BankConfig } from "@/lib/apiClient";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_MB = 5;

const BANK_LABELS: Record<string, string> = {
  banco:     "Banco",
  conta:     "Nº de conta",
  titular:   "Titular",
  iban:      "IBAN",
  descricao: "Descrição",
};

interface ReceiptFile {
  data:     string;  // base64
  mimeType: string;
  filename: string;
}

interface Props {
  onClose?: () => void;
}

export function PaymentWall({ onClose }: Props) {
  const { priceAoa } = usePlanConfig();
  const user         = useAuthStore((s) => s.user);
  const { subscription, requestPayment, updateReference, loading } = useSubscriptionStore();

  const [step, setStep]           = useState<"info" | "form" | "done">("info");
  const [reference, setReference] = useState("");
  const [receipt, setReceipt]     = useState<ReceiptFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [copied, setCopied]       = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [bankLoading, setBankLoading] = useState(true);

  useEffect(() => {
    api.subscription.getBankConfig()
      .then((cfg) => { setBankConfig(cfg); setBankLoading(false); })
      .catch(() => setBankLoading(false));
  }, []);

  const copy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Formato não suportado. Use JPG, PNG, WebP ou PDF.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`Ficheiro muito grande. Máximo ${MAX_SIZE_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setReceipt({ data: base64, mimeType: file.type, filename: file.name });
    };
    reader.readAsDataURL(file);
  };

  const removeReceipt = () => {
    setReceipt(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError(null);

    const hasPending = subscription?.status === "pending";
    const opts = {
      reference:       reference || undefined,
      receiptData:     receipt?.data,
      receiptMimeType: receipt?.mimeType,
      receiptFilename: receipt?.filename,
    };

    let result;
    if (hasPending) {
      result = await updateReference(user.id, opts);
    } else {
      result = await requestPayment(user.id, opts);
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
            O teu pedido está a ser verificado pelo administrador.
            Receberás acesso assim que o pagamento for confirmado.
          </p>
        </div>

        {subscription.paymentReference && (
          <div className="rounded-lg border border-border bg-surface-1 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Referência: </span>
            <span className="font-mono font-semibold">{subscription.paymentReference}</span>
          </div>
        )}

        {subscription.hasReceipt && (
          <div className="flex items-center gap-2 rounded-lg border border-bull/30 bg-bull/5 px-4 py-2 text-sm text-bull">
            <CheckCircle2 className="h-4 w-4" />
            Comprovativo enviado
          </div>
        )}

        {(!subscription.paymentReference || !subscription.hasReceipt) && (
          <div className="w-full max-w-sm space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Podes ainda adicionar {!subscription.paymentReference ? "a referência" : ""}{!subscription.paymentReference && !subscription.hasReceipt ? " e " : ""}{!subscription.hasReceipt ? "o comprovativo" : ""}:
            </p>

            {!subscription.paymentReference && (
              <input
                type="text"
                className="w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm"
                placeholder="Ex: TRF-20240501-12345"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            )}

            {!subscription.hasReceipt && (
              <ReceiptUploader
                receipt={receipt}
                fileError={fileError}
                fileInputRef={fileInputRef}
                onChange={handleFileChange}
                onRemove={removeReceipt}
              />
            )}

            {error && <p className="text-xs text-bear">{error}</p>}

            <Button
              size="sm"
              className="w-full"
              disabled={(!reference && !receipt) || loading}
              onClick={handleSubmit}
            >
              {loading ? "A guardar…" : "Guardar"}
            </Button>
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
        {onClose && <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>}
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
        {onClose && <Button onClick={onClose}>Fechar</Button>}
      </div>
    );
  }

  // ─── Formulário ─────────────────────────────────────────────────────────
  if (step === "form") {
    const canSubmit = reference.trim().length > 0 || receipt !== null;
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
          <p className="text-xs text-muted-foreground">
            Após efetuar o pagamento, adiciona a referência da transferência e/ou envia o comprovativo
            para agilizar a confirmação.
          </p>
        </div>

        {/* Referência */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Referência do pagamento <span className="text-muted-foreground text-xs">(opcional)</span>
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm"
            placeholder="Ex: TRF-20240501-12345"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>

        {/* Upload comprovativo */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Comprovativo de pagamento <span className="text-muted-foreground text-xs">(opcional — JPG, PNG, PDF, máx. 5 MB)</span>
          </label>
          <ReceiptUploader
            receipt={receipt}
            fileError={fileError}
            fileInputRef={fileInputRef}
            onChange={handleFileChange}
            onRemove={removeReceipt}
          />
        </div>

        {!canSubmit && (
          <p className="text-xs text-muted-foreground text-center">
            Adiciona a referência bancária ou anexa o comprovativo para enviar o pedido.
          </p>
        )}

        {error && <p className="text-sm text-bear">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
            Voltar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !canSubmit} className="flex-1">
            {loading ? "A enviar…" : "Enviar pedido"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Info: dados bancários ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
          <CreditCard className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Subscrição Premium</h3>
          <p className="text-xs text-muted-foreground">Acesso a Intermediário e Avançado</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-lg font-bold text-primary">{priceAoa.toLocaleString("pt-AO")} AOA</p>
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

        {bankLoading ? (
          <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">A carregar dados bancários…</span>
          </div>
        ) : bankConfig && (bankConfig.conta || bankConfig.iban) ? (
          <div className="space-y-1.5 mt-2">
            {(Object.entries(bankConfig) as [string, string][]).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">{BANK_LABELS[key] ?? key}</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-xs truncate">{value || "—"}</span>
                  {(key === "conta" || key === "iban") && value && (
                    <button
                      onClick={() => copy(value, key)}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Copiar"
                    >
                      {copied === key ? <Check className="h-3 w-3 text-bull" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2 text-center">
            Dados bancários a ser configurados. Contacta o suporte para informações de pagamento.
          </p>
        )}
      </div>

      <Button onClick={() => setStep("form")} className="w-full" disabled={bankLoading}>
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

/* ── Upload de comprovativo ────────────────────────────────────────────────── */
function ReceiptUploader({
  receipt,
  fileError,
  fileInputRef,
  onChange,
  onRemove,
}: {
  receipt: ReceiptFile | null;
  fileError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  if (receipt) {
    const isPdf = receipt.mimeType === "application/pdf";
    return (
      <div className="flex items-center justify-between rounded-lg border border-bull/40 bg-bull/5 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {isPdf
            ? <FileText className="h-4 w-4 shrink-0 text-bull" />
            : <Image className="h-4 w-4 shrink-0 text-bull" />}
          <span className="text-sm truncate">{receipt.filename}</span>
        </div>
        <button onClick={onRemove} className="ml-2 shrink-0 text-muted-foreground hover:text-bear transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-1 px-4 py-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Clica para anexar o comprovativo
        </span>
        <span className="text-xs text-muted-foreground/70">JPG · PNG · PDF · máx. 5 MB</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="hidden"
          onChange={onChange}
        />
      </label>
      {fileError && <p className="mt-1 text-xs text-bear">{fileError}</p>}
    </div>
  );
}
