import { useState, useEffect } from "react";
import { usePlanConfig } from "@/hooks/usePlanConfig";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { PaymentWall } from "@/components/PaymentWall";
import { api, type SubscriptionData } from "@/lib/apiClient";
import {
  CreditCard,
  Crown,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileText,
  Image,
  Download,
  X,
} from "lucide-react";

const fmt = (ts: number) =>
  new Date(ts).toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const statusInfo = (status: string) => {
  switch (status) {
    case "active":
      return { label: "Ativo",                  color: "text-bull",             bg: "bg-bull/15",    icon: <CheckCircle2 className="h-3.5 w-3.5" /> };
    case "pending":
      return { label: "Aguardando confirmação",  color: "text-warning",          bg: "bg-warning/15", icon: <Clock className="h-3.5 w-3.5" /> };
    case "expired":
      return { label: "Expirada",                color: "text-bear",             bg: "bg-bear/15",    icon: <X className="h-3.5 w-3.5" /> };
    case "rejected":
      return { label: "Rejeitada",               color: "text-bear",             bg: "bg-bear/15",    icon: <X className="h-3.5 w-3.5" /> };
    default:
      return { label: status,                    color: "text-muted-foreground", bg: "bg-surface-2",  icon: null };
  }
};

export default function Financeiro() {
  const { priceAoa } = usePlanConfig();
  const user = useAuthStore((s) => s.user);
  const {
    subscription,
    history,
    fetch: fetchSub,
    fetchHistory,
    hasActiveSubscription,
  } = useSubscriptionStore();

  const [showPaywall, setShowPaywall] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchSub(user.id);
      fetchHistory(user.id);
    }
  }, [user?.id]);

  const isActive = hasActiveSubscription();

  const daysLeft =
    subscription?.expiresAt
      ? Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / 86_400_000))
      : null;

  const viewReceipt = async (sub: SubscriptionData) => {
    if (!user?.id) return;
    setReceiptLoading(sub.id);
    try {
      const data = await api.subscription.getReceipt(user.id, sub.id);
      const url = `data:${data.receiptMimeType};base64,${data.receiptData}`;
      if (data.receiptMimeType === "application/pdf") {
        const blob = await (await fetch(url)).blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = data.receiptFilename || "comprovativo.pdf";
        link.click();
      } else {
        window.open(url, "_blank");
      }
    } catch {
      // silent
    } finally {
      setReceiptLoading(null);
    }
  };

  return (
    <div className="container py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Subscrição e histórico de pagamentos</p>
        </div>
      </div>

      {/* ── Estado atual ── */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-surface-1 px-5 py-3">
          <Crown className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold">Estado da Subscrição</span>
          {subscription && (() => {
            const { label, color, bg, icon } = statusInfo(subscription.status);
            return (
              <span className={`ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${bg} ${color}`}>
                {icon} {label}
              </span>
            );
          })()}
        </div>

        <div className="p-5">
          {!subscription ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Crown className="h-10 w-10 text-amber-500/60" />
              <div>
                <p className="font-medium">Sem subscrição ativa</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Subscreve por <strong>{priceAoa.toLocaleString("pt-AO")} AOA/mês</strong> para aceder aos níveis Intermediário e Avançado.
                </p>
              </div>
              <Button onClick={() => setShowPaywall(true)}>Subscrever agora</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-semibold">{subscription.amount.toLocaleString("pt-AO")} AOA/mês</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pedido em</p>
                  <p className="font-medium">{fmt(subscription.createdAt)}</p>
                </div>
                {subscription.approvedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Aprovado em</p>
                    <p className="font-medium">{fmt(subscription.approvedAt)}</p>
                  </div>
                )}
                {subscription.expiresAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Expira em</p>
                    <p className={`font-medium ${daysLeft !== null && daysLeft <= 7 ? "text-warning" : ""}`}>
                      {fmt(subscription.expiresAt)}{daysLeft !== null && ` (${daysLeft} dias)`}
                    </p>
                  </div>
                )}
                {subscription.paymentReference && (
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-xs text-muted-foreground">Referência bancária</p>
                    <p className="font-mono text-xs">{subscription.paymentReference}</p>
                  </div>
                )}
              </div>

              {/* Alertas */}
              {subscription.status === "rejected" && subscription.notes && (
                <div className="rounded-lg border border-bear/20 bg-bear/5 px-3 py-2">
                  <p className="text-xs text-bear">
                    <span className="font-semibold">Motivo da rejeição:</span> {subscription.notes}
                  </p>
                </div>
              )}
              {daysLeft !== null && daysLeft <= 7 && subscription.status === "active" && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
                  <p className="text-xs text-warning">
                    A subscrição expira em <strong>{daysLeft} dias</strong>. Renova para não perder o acesso.
                  </p>
                </div>
              )}

              {/* Acções */}
              <div className="flex flex-wrap gap-2 pt-1">
                {subscription.hasReceipt && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    disabled={receiptLoading === subscription.id}
                    onClick={() => viewReceipt(subscription)}
                  >
                    {subscription.receiptMimeType === "application/pdf"
                      ? <FileText className="h-3.5 w-3.5" />
                      : <Image className="h-3.5 w-3.5" />}
                    {receiptLoading === subscription.id ? "A carregar…" : "Ver comprovativo"}
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                )}
                {(subscription.status === "expired" || subscription.status === "rejected" || isActive) && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowPaywall(true)}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    {isActive ? "Renovar" : "Novo pedido"}
                  </Button>
                )}
                {subscription.status === "pending" && !subscription.hasReceipt && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowPaywall(true)}>
                    Adicionar comprovativo
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Histórico ── */}
      {history.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-surface-1 px-5 py-3">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Histórico de pagamentos</span>
            <Badge variant="secondary" className="ml-auto text-xs">{history.length}</Badge>
          </div>
          <div className="divide-y divide-border">
            {history.map((sub, i) => {
              const { label, color, bg, icon } = statusInfo(sub.status);
              const isFirst = i === 0;
              return (
                <div
                  key={sub.id}
                  className={`flex items-center gap-4 px-5 py-4 text-sm ${isFirst ? "bg-primary/3" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{fmt(sub.createdAt)}</span>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${bg} ${color}`}>
                        {icon} {label}
                      </span>
                      {isFirst && <span className="text-[11px] text-muted-foreground">(atual)</span>}
                    </div>
                    {sub.paymentReference && (
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        Ref: {sub.paymentReference}
                      </p>
                    )}
                    {sub.expiresAt && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {sub.status === "expired" ? "Expirou" : "Expira"}: {fmt(sub.expiresAt)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold">{sub.amount.toLocaleString("pt-AO")} AOA</p>
                    {sub.hasReceipt && (
                      <button
                        className="mt-1 flex items-center gap-1 text-[11px] text-primary hover:underline disabled:opacity-50"
                        disabled={receiptLoading === sub.id}
                        onClick={() => viewReceipt(sub)}
                      >
                        <Download className="h-3 w-3" />
                        {receiptLoading === sub.id ? "…" : "comprovativo"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Como funciona ── */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Como funciona o pagamento</h3>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">1</span>
            Efetua uma transferência de <strong className="text-foreground">{priceAoa.toLocaleString("pt-AO")} AOA</strong> para a conta BFA indicada no modal de pagamento.
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">2</span>
            Envia o comprovativo (foto ou PDF) e a referência da transferência.
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">3</span>
            O admin confirma e activa o acesso por <strong className="text-foreground">30 dias</strong>.
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">4</span>
            Podes renovar antes ou depois de expirar fazendo uma nova transferência.
          </li>
        </ol>
      </Card>

      {/* PaymentWall — Dialog modal */}
      <Dialog
        open={showPaywall}
        onOpenChange={(open) => {
          if (!open) {
            setShowPaywall(false);
            if (user?.id) { fetchSub(user.id); fetchHistory(user.id); }
          }
        }}
      >
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="p-5">
            <PaymentWall
              onClose={() => {
                setShowPaywall(false);
                if (user?.id) { fetchSub(user.id); fetchHistory(user.id); }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
