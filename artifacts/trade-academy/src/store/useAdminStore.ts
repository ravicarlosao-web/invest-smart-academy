/**
 * Local admin session.
 * The password is verified server-side via /api/admin/login. On success we
 * persist the SHA-256 hash so subsequent admin requests can include the
 * `x-admin-token` header.
 *
 * NOTE: This is intentionally a local/lightweight gate per the user's choice.
 * For production-grade access control, migrate to a proper roles system.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/apiClient";

interface AdminState {
  token: string | null;          // sha256(password) — also acts as the bearer
  loggedInAt: number | null;
  login:  (password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      token: null,
      loggedInAt: null,

      login: async (password) => {
        if (!password) return { ok: false, error: "Informe a senha." };
        const hash = await sha256(password);
        try {
          await api.admin.login(hash);
          set({ token: hash, loggedInAt: Date.now() });
          return { ok: true };
        } catch (err) {
          const msg =
            err instanceof Error && err.message.includes("401")
              ? "Senha incorreta."
              : "Não foi possível verificar a senha.";
          return { ok: false, error: msg };
        }
      },

      logout: () => set({ token: null, loggedInAt: null }),
      isAuthenticated: () => Boolean(get().token),
    }),
    { name: "trade-academy-admin" },
  ),
);
