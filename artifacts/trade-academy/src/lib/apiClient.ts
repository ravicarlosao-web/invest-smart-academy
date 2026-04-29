/**
 * Thin API client for the Turso-backed API server.
 *
 * Base URL resolves automatically:
 *   - Replit dev/prod → uses VITE_API_BASE_URL (set to /api-server/api)
 *   - Vercel          → falls back to /api (matched by vercel.json rewrite)
 *
 * Usage:
 *   import { api } from "@/lib/apiClient";
 *   await api.progress.save(userId, progressState);
 *   const trades = await api.trades.list(userId);
 */

const API_PREFIX: string =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

const BASE = `${window.location.origin}${API_PREFIX}`;

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body:    body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  /* ---------- Progress ---------- */
  progress: {
    get: (userId: string) =>
      request("GET", `/progress/${userId}`),
    save: (userId: string, data: Record<string, unknown>) =>
      request("PUT", `/progress/${userId}`, data),
  },

  /* ---------- Trades ---------- */
  trades: {
    list: (userId: string, limit = 500) =>
      request("GET", `/trades/${userId}?limit=${limit}`),
    sync: (userId: string, trades: unknown[]) =>
      request("POST", `/trades/${userId}`, trades),
    clear: (userId: string) =>
      request("DELETE", `/trades/${userId}`),
  },

  /* ---------- Notifications ---------- */
  notifications: {
    list: (userId: string) =>
      request("GET", `/notifications/${userId}`),
    create: (userId: string, n: Record<string, unknown>) =>
      request("POST", `/notifications/${userId}`, n),
    readAll: (userId: string) =>
      request("PATCH", `/notifications/${userId}/read-all`, {}),
    dismiss: (userId: string, id: string) =>
      request("DELETE", `/notifications/${userId}/${id}`),
  },

  /* ---------- Duelos ---------- */
  duelos: {
    list: (userId: string) =>
      request("GET", `/duelos/${userId}`),
    byCode: (code: string) =>
      request("GET", `/duelos/code/${code}`),
    create: (userId: string, d: Record<string, unknown>) =>
      request("POST", `/duelos/${userId}`, d),
    update: (userId: string, id: string, patch: Record<string, unknown>) =>
      request("PATCH", `/duelos/${userId}/${id}`, patch),
    remove: (userId: string, id: string) =>
      request("DELETE", `/duelos/${userId}/${id}`),
  },
} as const;
