import { useState, useEffect } from "react";
import {
  CheckCircle2, Clock, Crown, Layers, Lock, Star,
  RefreshCw, Zap, Shield,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { PaymentWall } from "@/components/PaymentWall";
import { api } from "@/lib/apiClient";
import type { AdminPlan } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

type MyPlan = {
  plan: AdminPlan | null;
  isDefault: boolean;
  subscription: { id: string; status: string; expiresAt: number | null } | null;
  permissions: string[];
};

function fmtPrice(v: number) {
  return v === 0 ? "Gratuito" : `${v.toLocaleString("pt-AO")} AOA`;
}
function fmtDuration(d: number) {
  if (d >= 36500) return "Ilimitado";
  if (d === 365)  return "1 ano";
  if (d === 180)  return "6 meses";
  if (d === 90)   return "3 meses";
  if (d === 30)   return "30 dias";
  if (d === 7)    return "7 dias";
  return `${d} dias`;
}
function daysLeft(expiresAt: number | null) {
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 86_400_000));
}

export default function Planos() {
  const user = useAuthStore((s) => s.user);
  const { subscription, fetch: fetchSub } = useSubscriptionStore();

  const [plans,       setPlans]       = useState<AdminPlan[]>([]);
  const [myPlan,      setMyPlan]      = useState<MyPlan | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<AdminPlan | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const [list, mine] = await Promise.all([
        api.plans.list(),
        api.plans.myPlan(),
      ]);
      setPlans(list);
      setMyPlan(mine);
    } catch {
      // silent — os cards mostrarão estado vazio
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    if (user?.id) fetchSub(user.id);
  }, [user?.id]);

  function handlePaywallClose() {
    setSelectedPlan(null);
    if (user?.id) fetchSub(user.id);
    reload();
  }

  const currentPlanId = myPlan?.plan?.id ?? null;
  const subStatus     = myPlan?.subscription?.status ?? null;
  const expires       = myPlan?.subscription?.expiresAt ?? null;
  const remaining     = daysLeft(expires);

  const paidPlans    = plans.filter((p) => p.isDefault !== 1);
  const defaultPlan  = plans.find((p) => p.isDefault === 1);

  return (
    <div className="container py-6 lg:py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Planos</h1>
          <p className="text-sm text-muted-foreground">Escolhe o plano certo para o teu percurso</p>
        </div>
      </div>

      {/* ── Plano actual ── */}
      {!loading && myPlan?.plan && (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-surface-1 px-5 py-3">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">O teu plano actual</span>
            {subStatus === "active" && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-bull/15 px-2.5 py-1 text-xs font-semibold text-bull">
                <CheckCircle2 className="h-3.5 w-3.5" /> Activo
              </span>
            )}
            {subStatus === "pending" && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning">
                <Clock className="h-3.5 w-3.5" /> Aguarda confirmação
              </span>
            )}
            {myPlan.isDefault && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-zinc-500/15 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                Gratuito
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-semibold">{myPlan.plan.name}</p>
              {myPlan.plan.description && (
                <p className="text-sm text-muted-foreground">{myPlan.plan.description}</p>
              )}
              {expires && subStatus === "active" && (
                <p className={cn("mt-1 text-xs", remaining !== null && remaining <= 7 ? "text-warning" : "text-muted-foreground")}>
                  Expira em {new Date(expires).toLocaleDateString("pt-AO", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  {remaining !== null && ` (${remaining} dias)`}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-primary">
                {myPlan.plan.priceAoa === 0 ? "Gratuito" : `${myPlan.plan.priceAoa.toLocaleString("pt-AO")} AOA`}
              </p>
              {!myPlan.isDefault && (
                <p className="text-xs text-muted-foreground">/{fmtDuration(myPlan.plan.durationDays)}</p>
              )}
            </div>
          </div>
          {remaining !== null && remaining <= 7 && subStatus === "active" && (
            <div className="mx-5 mb-4 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
              <p className="text-xs text-warning">
                A tua subscrição expira em <strong>{remaining} dias</strong>. Renova para não perder o acesso.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ── Plano Gratuito ── */}
      {!loading && defaultPlan && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Plano Gratuito</h2>
          <Card className={cn(
            "overflow-hidden border-2 transition-colors",
            currentPlanId === defaultPlan.id && myPlan?.isDefault
              ? "border-primary/40"
              : "border-border",
          )}>
            <div className="flex items-start justify-between gap-4 p-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{defaultPlan.name}</p>
                  {currentPlanId === defaultPlan.id && myPlan?.isDefault && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-primary/30">
                      Actual
                    </Badge>
                  )}
                </div>
                {defaultPlan.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{defaultPlan.description}</p>
                )}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-bull" />
                    <span>Acesso ao nível Iniciante completo</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-bull" />
                    <span>Simulador de trading</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-bull" />
                    <span>Glossário e recursos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    <span>Níveis Intermediário e Avançado bloqueados</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-foreground">Grátis</p>
                <p className="text-xs text-muted-foreground">para sempre</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Planos Pagos ── */}
      {!loading && paidPlans.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Planos Premium</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paidPlans.map((plan) => {
              const isCurrent  = currentPlanId === plan.id && !myPlan?.isDefault;
              const isPending  = subscription?.status === "pending";
              const isExpiring = isCurrent && remaining !== null && remaining <= 7;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "overflow-hidden border-2 transition-colors flex flex-col",
                    isCurrent ? "border-primary/50" : "border-border",
                  )}
                >
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Star className={cn("h-4 w-4 shrink-0", isCurrent ? "text-amber-400" : "text-muted-foreground")} />
                        <p className="font-semibold">{plan.name}</p>
                      </div>
                      {isCurrent && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-primary/30 shrink-0">
                          Actual
                        </Badge>
                      )}
                    </div>

                    {plan.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                    )}

                    <div className="mt-4">
                      <p className="text-2xl font-bold text-primary">
                        {fmtPrice(plan.priceAoa)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        /{fmtDuration(plan.durationDays)} · acesso premium
                      </p>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>Todos os níveis desbloqueados</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>Conteúdo exclusivo incluído</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    {isCurrent && subStatus === "active" && !isExpiring ? (
                      <Button variant="outline" className="w-full text-sm" onClick={() => setSelectedPlan(plan)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Renovar
                      </Button>
                    ) : isCurrent && subStatus === "active" && isExpiring ? (
                      <Button className="w-full text-sm" onClick={() => setSelectedPlan(plan)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Renovar agora
                      </Button>
                    ) : isPending ? (
                      <Button variant="outline" className="w-full text-sm" disabled>
                        <Clock className="h-3.5 w-3.5 mr-1.5" /> Pedido pendente…
                      </Button>
                    ) : (
                      <Button className="w-full text-sm" onClick={() => setSelectedPlan(plan)}>
                        Subscrever
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* ── Sem planos pagos ── */}
      {!loading && paidPlans.length === 0 && (
        <Card className="p-8 text-center">
          <Layers className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Não existem planos premium disponíveis de momento.</p>
        </Card>
      )}

      {/* ── Como funciona ── */}
      {!loading && paidPlans.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Como funciona a subscrição</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">1</span>
              Escolhe um plano e clica em <strong className="text-foreground">Subscrever</strong>.
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">2</span>
              Faz a transferência bancária para a conta indicada.
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">3</span>
              Envia o comprovativo — o admin confirma e activa o acesso.
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">4</span>
              Renova antes de expirar para manter o acesso contínuo.
            </li>
          </ol>
        </Card>
      )}

      {/* ── PaymentWall Dialog ── */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => { if (!open) handlePaywallClose(); }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="p-5">
            <PaymentWall
              planId={selectedPlan?.id}
              planName={selectedPlan?.name}
              planPriceAoa={selectedPlan?.priceAoa}
              planDurationDays={selectedPlan?.durationDays}
              onBack={() => setSelectedPlan(null)}
              onClose={handlePaywallClose}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
