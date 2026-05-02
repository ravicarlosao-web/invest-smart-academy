import { create } from "zustand";
import { api, type SubscriptionData } from "@/lib/apiClient";

interface SubscriptionState {
  subscription:  SubscriptionData | null;
  history:       SubscriptionData[];
  loading:       boolean;
  error:         string | null;

  fetch:           (userId: string) => Promise<void>;
  fetchHistory:    (userId: string) => Promise<void>;
  requestPayment:  (userId: string, opts?: { reference?: string; receiptData?: string; receiptMimeType?: string; receiptFilename?: string }) => Promise<{ ok: boolean; error?: string }>;
  updateReference: (userId: string, opts: { reference?: string; receiptData?: string; receiptMimeType?: string; receiptFilename?: string }) => Promise<{ ok: boolean; error?: string }>;
  clear:           () => void;

  hasActiveSubscription: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  subscription: null,
  history:      [],
  loading:      false,
  error:        null,

  fetch: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { subscription } = await api.subscription.get(userId);
      set({ subscription, loading: false });
    } catch {
      set({ loading: false, error: "Erro ao carregar subscrição." });
    }
  },

  fetchHistory: async (userId: string) => {
    try {
      const { subscriptions } = await api.subscription.history(userId);
      set({ history: subscriptions });
    } catch {
      // silent
    }
  },

  requestPayment: async (userId, opts = {}) => {
    try {
      const result = await api.subscription.request(userId, {
        paymentReference: opts.reference,
        receiptData:      opts.receiptData,
        receiptMimeType:  opts.receiptMimeType,
        receiptFilename:  opts.receiptFilename,
      });
      await get().fetch(userId);
      return { ok: result.ok };
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("409")) {
        await get().fetch(userId);
        if (err.message.includes("already_active"))
          return { ok: false, error: "A tua subscrição já está ativa." };
        return { ok: false, error: "Já tens um pedido pendente. Aguarda a aprovação do admin." };
      }
      return { ok: false, error: "Erro ao submeter pedido. Tenta novamente." };
    }
  },

  updateReference: async (userId, opts) => {
    try {
      await api.subscription.updateReference(userId, {
        paymentReference: opts.reference,
        receiptData:      opts.receiptData,
        receiptMimeType:  opts.receiptMimeType,
        receiptFilename:  opts.receiptFilename,
      });
      await get().fetch(userId);
      return { ok: true };
    } catch {
      return { ok: false, error: "Erro ao atualizar." };
    }
  },

  clear: () => set({ subscription: null, history: [], loading: false, error: null }),

  hasActiveSubscription: () => {
    const sub = get().subscription;
    if (!sub) return false;
    if (sub.status !== "active") return false;
    if (sub.expiresAt && sub.expiresAt < Date.now()) return false;
    return true;
  },
}));
