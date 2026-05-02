import { useState, useEffect } from "react";
import { api } from "@/lib/apiClient";

let _cache: { priceAoa: number; planName: string } | null = null;
let _promise: Promise<{ priceAoa: number; planName: string }> | null = null;

const DEFAULT = { priceAoa: 15000, planName: "Plano Mensal" };

export function usePlanConfig() {
  const [config, setConfig] = useState<{ priceAoa: number; planName: string }>(
    _cache ?? DEFAULT,
  );

  useEffect(() => {
    if (_cache) { setConfig(_cache); return; }
    if (!_promise) {
      _promise = api.planConfig().catch(() => DEFAULT);
    }
    _promise.then((cfg) => { _cache = cfg; setConfig(cfg); });
  }, []);

  return config;
}
