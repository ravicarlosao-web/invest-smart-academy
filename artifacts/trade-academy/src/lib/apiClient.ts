/**
 * Thin API client for the Turso-backed API server.
 *
 * Base URL resolves automatically:
 *   - Replit dev/prod → uses VITE_API_BASE_URL (set to /api-server/api)
 *   - Vercel          → falls back to /api (matched by vercel.json rewrite)
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
  /* ---------- Auth ---------- */
  auth: {
    register: (data: { id: string; name: string; email: string; passwordHash: string }) =>
      request<{ ok: boolean; user: { id: string; name: string; email: string } }>(
        "POST", "/auth/register", data,
      ),
    login: (data: { email: string; passwordHash: string }) =>
      request<{ ok: boolean; user: { id: string; name: string; email: string } }>(
        "POST", "/auth/login", data,
      ),
  },

  /* ---------- Progress ---------- */
  progress: {
    get:  (userId: string) =>
      request<Record<string, unknown>>("GET", `/progress/${userId}`),
    save: (userId: string, data: Record<string, unknown>) =>
      request<{ ok: boolean }>("PUT", `/progress/${userId}`, data),
  },

  /* ---------- Trades ---------- */
  trades: {
    list:  (userId: string, limit = 500) =>
      request<unknown[]>("GET", `/trades/${userId}?limit=${limit}`),
    sync:  (userId: string, trades: unknown[]) =>
      request<{ ok: boolean; inserted: number }>("POST", `/trades/${userId}`, trades),
    clear: (userId: string) =>
      request<{ ok: boolean }>("DELETE", `/trades/${userId}`),
  },

  /* ---------- Notifications ---------- */
  notifications: {
    list:    (userId: string) =>
      request<unknown[]>("GET", `/notifications/${userId}`),
    create:  (userId: string, n: Record<string, unknown>) =>
      request<{ ok: boolean; id: string }>("POST", `/notifications/${userId}`, n),
    readAll: (userId: string) =>
      request<{ ok: boolean }>("PATCH", `/notifications/${userId}/read-all`, {}),
    dismiss: (userId: string, id: string) =>
      request<{ ok: boolean }>("DELETE", `/notifications/${userId}/${id}`),
  },

  /* ---------- Duelos ---------- */
  duelos: {
    list:   (userId: string) =>
      request<unknown[]>("GET", `/duelos/${userId}`),
    byCode: (code: string) =>
      request<unknown>("GET", `/duelos/code/${code}`),
    create: (userId: string, d: Record<string, unknown>) =>
      request<{ ok: boolean; id: string; code: string }>("POST", `/duelos/${userId}`, d),
    update: (userId: string, id: string, patch: Record<string, unknown>) =>
      request<{ ok: boolean }>("PATCH", `/duelos/${userId}/${id}`, patch),
    remove: (userId: string, id: string) =>
      request<{ ok: boolean }>("DELETE", `/duelos/${userId}/${id}`),
  },
} as const;
