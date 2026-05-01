/**
 * Autenticação via API (Turso).
 * Password enviada em plain-text via HTTPS — bcrypt feito no servidor.
 * JWT token guardado em localStorage junto com id/name/email.
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
  user:  AuthUser | null;
  token: string | null;

  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  login:    (email: string, password: string)               => Promise<{ ok: boolean; error?: string }>;
  logout:   () => void;
  isAuthenticated: () => boolean;
}

function genId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:  null,
      token: null,

      register: async (name, email, password) => {
        if (password.length < 6)
          return { ok: false, error: "A password deve ter pelo menos 6 caracteres." };

        const id = genId();

        try {
          const result = await api.auth.register({ id, name, email, password });
          set({ user: result.user, token: result.token });
          return { ok: true };
        } catch (err: unknown) {
          const text = err instanceof Error ? err.message : "";
          const msg = text.includes("409")
            ? "Este e-mail já está em uso."
            : text.includes("400")
            ? "Dados inválidos. Verifica o e-mail e a password."
            : "Erro ao criar conta. Tenta novamente.";
          return { ok: false, error: msg };
        }
      },

      login: async (email, password) => {
        try {
          const result = await api.auth.login({ email, password });
          set({ user: result.user, token: result.token });
          return { ok: true };
        } catch (err: unknown) {
          const text = err instanceof Error ? err.message : "";
          let msg = "Erro ao iniciar sessão. Tenta novamente.";
          if (text.includes("401")) msg = "E-mail ou password incorrectos.";
          else if (text.includes("422")) msg = "Dados inválidos. Verifica o e-mail e a password.";
          else if (text.includes("429")) msg = "Demasiadas tentativas. Aguarda alguns minutos.";
          else if (text.includes("Failed to fetch") || text.includes("NetworkError")) msg = "Sem ligação ao servidor. Verifica a tua internet.";
          return { ok: false, error: msg };
        }
      },

      logout: () => set({ user: null, token: null }),

      isAuthenticated: () => get().user !== null && get().token !== null,
    }),
    { name: "trade-academy-auth" },
  ),
);
