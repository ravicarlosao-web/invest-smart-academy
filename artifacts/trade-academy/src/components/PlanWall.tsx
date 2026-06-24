import { useState, useEffect } from "react";
import { Loader2, Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/apiClient";
import { PaymentWall } from "./PaymentWall";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  priceAoa: number;
  durationDays: number;
  isActive: number;
  isDefault: number;
}

interface Props {
  onClose?: () => void;
}

export function PlanWall({ onClose }: Props) {
  const subscription    = useSubscriptionStore((s) => s.subscription);
  const [plans, setPlans]                   = useState<Plan[]>([]);
  const [loading, setLoading]               = useState(true);
  const [selectedPlan, setSelectedPlan]     = useState<Plan | null>(null);

  useEffect(() => {
    api.plans.list()
      .then((data) => {
        const paid = (data as Plan[]).filter(
          (p) => p.isActive === 1 && p.isDefault === 0,
        );
        setPlans(paid);
        if (paid.length === 1) setSelectedPlan(paid[0]);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  if (subscription?.status === "pending" || subscription?.status === "active") {
    return <PaymentWall onClose={onClose} />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">A carregar planos...</p>
      </div>
    );
  }

  if (selectedPlan) {
    return (
      <PaymentWall
        planId={selectedPlan.id}
        planName={selectedPlan.name}
        planPriceAoa={selectedPlan.priceAoa}
        planDurationDays={selectedPlan.durationDays}
        onClose={onClose}
        onBack={plans.length > 1 ? () => setSelectedPlan(null) : undefined}
      />
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Sem planos disponíveis</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Não existem planos disponíveis de momento. Contacta o administrador.
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <div>
        <h3 className="font-semibold text-lg">Escolhe o teu plano</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona o plano que melhor se adequa às tuas necessidades.
        </p>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className="w-full rounded-xl border border-border bg-surface-1 p-4 text-left hover:border-primary/40 hover:bg-surface-2 transition-all"
            onClick={() => setSelectedPlan(plan)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm">{plan.name}</span>
                </div>
                {plan.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {plan.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-primary font-bold text-sm">
                    {plan.priceAoa.toLocaleString("pt-AO")} AOA
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{plan.durationDays} dias</span>
                </div>
              </div>
              <div className="shrink-0 mt-1 rounded-full border border-border h-5 w-5 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-muted" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {onClose && (
        <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
          Agora não
        </Button>
      )}
    </div>
  );
}
