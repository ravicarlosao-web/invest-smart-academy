/**
 * Autenticação via API (Turso).
 * Passwords são tratadas com SHA-256 no cliente antes de serem enviadas.
 * A sessão activa é guardada em localStorage (apenas id/name/email, sem password).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/apiClient";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;

  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  login:    (email: string, password: string)              => Promise<{ ok: boolean; error?: string }>;
  logout:   () => void;
  isAuthenticated: () => boolean;
}

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function genId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      register: async (name, email, password) => {
        if (password.length < 6)
          return { ok: false, error: "A password deve ter pelo menos 6 caracteres." };

        const passwordHash = await sha256(password);
        const id           = genId();

        try {
          const result = await api.auth.register({ id, name, email, passwordHash });
          set({ user: result.user });
          return { ok: true };
        } catch (err: unknown) {
          const msg =
            err instanceof Error && err.message.includes("409")
              ? "Este e-mail já está em uso."
              : "Erro ao criar conta. Tenta novamente.";
          return { ok: false, error: msg };
        }
      },

      login: async (email, password) => {
        const passwordHash = await sha256(password);

        try {
          const result = await api.auth.login({ email, passwordHash });
          set({ user: result.user });
          return { ok: true };
        } catch (err: unknown) {
          const msg =
            err instanceof Error && err.message.includes("401")
              ? "E-mail ou password incorrectos."
              : "Erro ao iniciar sessão. Tenta novamente.";
          return { ok: false, error: msg };
        }
      },

      logout: () => set({ user: null }),

      isAuthenticated: () => get().user !== null,
    }),
    { name: "trade-academy-auth" },
  ),
);
