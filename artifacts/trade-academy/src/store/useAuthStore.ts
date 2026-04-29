/**
 * Autenticação local simples com zustand + persist.
 * Passwords são guardadas em hash SHA-256 (sem salt — só para MVP local).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface StoredUser extends AuthUser {
  passwordHash: string;
}

interface AuthState {
  user: AuthUser | null;
  _users: StoredUser[];

  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      _users: [],

      register: async (name, email, password) => {
        const existing = get()._users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) return { ok: false, error: "Este e-mail já está em uso." };
        if (password.length < 6) return { ok: false, error: "A password deve ter pelo menos 6 caracteres." };

        const passwordHash = await sha256(password);
        const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newUser: StoredUser = { id, name: name.trim(), email: email.toLowerCase(), passwordHash };
        set((s) => ({
          _users: [...s._users, newUser],
          user: { id, name: name.trim(), email: email.toLowerCase() },
        }));
        return { ok: true };
      },

      login: async (email, password) => {
        const found = get()._users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!found) return { ok: false, error: "E-mail ou password incorrectos." };

        const passwordHash = await sha256(password);
        if (found.passwordHash !== passwordHash) return { ok: false, error: "E-mail ou password incorrectos." };

        set({ user: { id: found.id, name: found.name, email: found.email } });
        return { ok: true };
      },

      logout: () => set({ user: null }),

      isAuthenticated: () => get().user !== null,
    }),
    { name: "trade-academy-auth" },
  ),
);
