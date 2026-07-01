import { useState, useEffect } from "react";
import { api } from "@/lib/apiClient";

type PlanConfig = { priceAoa: number; planName: string; durationDays: number };

const DEFAULT: PlanConfig = { priceAoa: 15000, planName: "Plano Mensal", durationDays: 30 };

export function usePlanConfig(): PlanConfig {
  const [config, setConfig] = useState<PlanConfig>(DEFAULT);

  useEffect(() => {
    api.public.getPlanConfig()
      .then((cfg) => setConfig(cfg))
      .catch(() => { /* mantém DEFAULT */ });
  }, []);

  return config;
}
