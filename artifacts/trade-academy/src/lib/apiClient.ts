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
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const headers: Record<string, string> = { ...(extraHeaders ?? {}) };
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body:    body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/** Helper used by admin endpoints — injects the x-admin-token header */
function adminRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  let token = "";
  try {
    const raw = localStorage.getItem("trade-academy-admin");
    if (raw) token = (JSON.parse(raw)?.state?.token as string) ?? "";
  } catch {
    /* ignore */
  }
  return request<T>(method, path, body, token ? { "x-admin-token": token } : undefined);
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

  /* ---------- Admin ---------- */
  admin: {
    login: (passwordHash: string) =>
      request<{ ok: boolean }>("POST", "/admin/login", { passwordHash }),

    overview: () =>
      adminRequest<{
        totals:    { users: number; trades: number; duelos: number; notifications: number };
        learning:  { totalXp: number; avgXp: number; totalLessonsCompleted: number; avgStreak: number };
        simulator: { wins: number; losses: number; liquidations: number; totalPnl: number; winRate: number };
      }>("GET", "/admin/overview"),

    users: () =>
      adminRequest<Array<{
        id: string; name: string | null; email: string | null; createdAt: number;
        xp: number; streakDays: number; lastActivityDay: string | null;
        completedLessons: number; simCashBalance: number; onboarded: boolean;
      }>>("GET", "/admin/users"),

    deleteUser:        (userId: string) => adminRequest<{ ok: boolean }>("DELETE", `/admin/users/${userId}`),
    resetUserProgress: (userId: string) => adminRequest<{ ok: boolean }>("POST",   `/admin/users/${userId}/reset-progress`),
    resetUserSim:      (userId: string) => adminRequest<{ ok: boolean }>("POST",   `/admin/users/${userId}/reset-sim`),
    adjustUserXp:      (userId: string, xp: number) => adminRequest<{ ok: boolean }>("PATCH", `/admin/users/${userId}/xp`, { xp }),

    simulator: () =>
      adminRequest<{
        recent: Array<Record<string, unknown>>;
        leaderboard: Array<{ userId: string; name: string; email: string; pnl: number; trades: number }>;
      }>("GET", "/admin/simulator"),

    getCurriculumOverride: () =>
      adminRequest<{ value: { lessons: Record<string, unknown> } }>("GET", "/admin/curriculum"),
    saveCurriculumOverride: (value: { lessons: Record<string, unknown> }) =>
      adminRequest<{ ok: boolean }>("PUT", "/admin/curriculum", value),

    getStrategies:  () => adminRequest<unknown[]>("GET", "/admin/strategies"),
    saveStrategies: (items: unknown[]) => adminRequest<{ ok: boolean }>("PUT", "/admin/strategies", items),

    getBooks:  () => adminRequest<unknown[]>("GET", "/admin/books"),
    saveBooks: (items: unknown[]) => adminRequest<{ ok: boolean }>("PUT", "/admin/books", items),

    getGlossary:  () => adminRequest<unknown[]>("GET", "/admin/glossary"),
    saveGlossary: (items: unknown[]) => adminRequest<{ ok: boolean }>("PUT", "/admin/glossary", items),

    getResources:  () => adminRequest<unknown[]>("GET", "/admin/resources"),
    saveResources: (items: unknown[]) => adminRequest<{ ok: boolean }>("PUT", "/admin/resources", items),

    getVideos:  () => adminRequest<unknown[]>("GET", "/admin/videos"),
    saveVideos: (items: unknown[]) => adminRequest<{ ok: boolean }>("PUT", "/admin/videos", items),
  },

  /* ---------- Public Videos (students) ---------- */
  videos: {
    list: () => request<unknown[]>("GET", "/videos"),
  },

  /* ---------- Subscrições (aluno) ---------- */
  subscription: {
    get: (userId: string) =>
      request<{ subscription: SubscriptionData | null }>("GET", `/subscription/${userId}`),
    history: (userId: string) =>
      request<{ subscriptions: SubscriptionData[] }>("GET", `/subscription/${userId}/history`),
    request: (userId: string, body: { paymentReference?: string; receiptData?: string; receiptMimeType?: string; receiptFilename?: string }) =>
      request<{ ok: boolean; id: string }>("POST", `/subscription/${userId}/request`, body),
    updateReference: (userId: string, body: { paymentReference?: string; receiptData?: string; receiptMimeType?: string; receiptFilename?: string }) =>
      request<{ ok: boolean }>("PATCH", `/subscription/${userId}/reference`, body),
    getReceipt: (userId: string, subId: string) =>
      request<{ receiptData: string; receiptMimeType: string; receiptFilename: string }>("GET", `/subscription/${userId}/receipt/${subId}`),
  },

  /* ---------- Subscrições (admin) ---------- */
  adminSubscriptions: {
    list: (status?: string) =>
      adminRequest<SubscriptionWithUser[]>(
        "GET",
        status ? `/admin/subscriptions?status=${status}` : "/admin/subscriptions",
      ),
    stats: () =>
      adminRequest<{ pending: number; active: number; expired: number; rejected: number; total: number }>(
        "GET", "/admin/subscriptions/stats",
      ),
    approve: (id: string) =>
      adminRequest<{ ok: boolean; expiresAt: number }>("PATCH", `/admin/subscriptions/${id}/approve`),
    reject: (id: string, notes?: string) =>
      adminRequest<{ ok: boolean }>("PATCH", `/admin/subscriptions/${id}/reject`, { notes }),
    getReceipt: (id: string) =>
      adminRequest<{ receiptData: string; receiptMimeType: string; receiptFilename: string }>("GET", `/admin/subscriptions/${id}/receipt`),
  },
} as const;

export type SubscriptionData = {
  id: string;
  userId: string;
  status: "pending" | "active" | "expired" | "rejected";
  amount: number;
  paymentReference: string | null;
  hasReceipt?: boolean;
  receiptMimeType?: string | null;
  receiptFilename?: string | null;
  notes: string | null;
  createdAt: number;
  expiresAt: number | null;
  approvedAt: number | null;
  updatedAt: number;
};

export type SubscriptionWithUser = SubscriptionData & {
  user: { id: string; name: string; email: string };
};
