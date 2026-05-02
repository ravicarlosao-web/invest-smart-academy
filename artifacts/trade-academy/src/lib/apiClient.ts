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
    // Token expirado ou inválido → logout automático para limpar sessão
    if (res.status === 401 && extraHeaders?.["Authorization"]) {
      try {
        const { useAuthStore } = await import("@/store/useAuthStore");
        useAuthStore.getState().logout();
      } catch { /* ignorar */ }
    }
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/** Helper for authenticated user endpoints — injects the JWT Bearer token */
function authRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  let token = "";
  try {
    const raw = localStorage.getItem("trade-academy-auth");
    if (raw) token = (JSON.parse(raw)?.state?.token as string) ?? "";
  } catch {
    /* ignore */
  }
  return request<T>(method, path, body, token ? { Authorization: `Bearer ${token}` } : undefined);
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
  /* ---------- Public (no auth) ---------- */
  public: {
    getPlanConfig: () =>
      request<{ priceAoa: number; planName: string }>("GET", "/plan-config"),
  },

  /* ---------- Auth ---------- */
  auth: {
    register: (data: { id: string; name: string; email: string; password: string }) =>
      request<{ ok: boolean; token: string; user: { id: string; name: string; email: string } }>(
        "POST", "/auth/register", data,
      ),
    login: (data: { email: string; password: string }) =>
      request<{ ok: boolean; token: string; user: { id: string; name: string; email: string } }>(
        "POST", "/auth/login", data,
      ),
    logout: () =>
      authRequest<{ ok: boolean }>("POST", "/auth/logout"),
    forgotPassword: (email: string) =>
      request<{ ok: boolean }>("POST", "/auth/forgot-password", { email }),
    resetPassword: (token: string, newPassword: string) =>
      request<{ ok: boolean }>("POST", "/auth/reset-password", { token, newPassword }),
    googleStatus: () =>
      request<{ enabled: boolean; configured: boolean; callbackUrl: string }>("GET", "/auth/google/status"),
  },

  /* ---------- Progress ---------- */
  progress: {
    get:  (userId: string) =>
      authRequest<Record<string, unknown>>("GET", `/progress/${userId}`),
    save: (userId: string, data: Record<string, unknown>) =>
      authRequest<{ ok: boolean }>("PUT", `/progress/${userId}`, data),
  },

  /* ---------- Trades ---------- */
  trades: {
    list:  (userId: string, limit = 500) =>
      authRequest<unknown[]>("GET", `/trades/${userId}?limit=${limit}`),
    sync:  (userId: string, trades: unknown[]) =>
      authRequest<{ ok: boolean; inserted: number }>("POST", `/trades/${userId}`, trades),
    clear: (userId: string) =>
      authRequest<{ ok: boolean }>("DELETE", `/trades/${userId}`),
  },

  /* ---------- Notifications ---------- */
  notifications: {
    list:    (userId: string) =>
      authRequest<unknown[]>("GET", `/notifications/${userId}`),
    create:  (userId: string, n: Record<string, unknown>) =>
      authRequest<{ ok: boolean; id: string }>("POST", `/notifications/${userId}`, n),
    readAll: (userId: string) =>
      authRequest<{ ok: boolean }>("PATCH", `/notifications/${userId}/read-all`, {}),
    dismiss: (userId: string, id: string) =>
      authRequest<{ ok: boolean }>("DELETE", `/notifications/${userId}/${id}`),
  },

  /* ---------- Duelos ---------- */
  duelos: {
    list:   (userId: string) =>
      authRequest<unknown[]>("GET", `/duelos/${userId}`),
    byCode: (code: string) =>
      request<unknown>("GET", `/duelos/code/${code}`),
    create: (userId: string, d: Record<string, unknown>) =>
      authRequest<{ ok: boolean; id: string; code: string }>("POST", `/duelos/${userId}`, d),
    update: (userId: string, id: string, patch: Record<string, unknown>) =>
      authRequest<{ ok: boolean }>("PATCH", `/duelos/${userId}/${id}`, patch),
    remove: (userId: string, id: string) =>
      authRequest<{ ok: boolean }>("DELETE", `/duelos/${userId}/${id}`),
    /** Join a duelo as the opponent — sets opponent_user_id on the creator's DB row */
    joinByCode: (code: string) =>
      authRequest<{ ok: boolean; duelo: Record<string, unknown> }>("POST", `/duelos/join`, { code }),
    /** Returns duelos where the current user is the opponent (joined duelos) */
    joined: () =>
      authRequest<unknown[]>("GET", `/duelos/joined`),
    /** Returns live equity for both participants (for polling) */
    live: (code: string) =>
      authRequest<{
        accepted: boolean;
        creator:  { name: string; equity: number } | null;
        opponent: { name: string; equity: number } | null;
      }>("GET", `/duelos/live/${code}`),
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

    getPlanConfig: () =>
      adminRequest<{ priceAoa: number; planName: string }>("GET", "/admin/plan-config"),
    savePlanConfig: (cfg: { priceAoa: number; planName: string }) =>
      adminRequest<{ ok: boolean }>("PUT", "/admin/plan-config", cfg),

    getAiConfig: () =>
      adminRequest<{ configured: boolean; keyPreview: string; model: string }>("GET", "/admin/ai-config"),
    saveAiConfig: (cfg: { openaiKey?: string; model?: string }) =>
      adminRequest<{ ok: boolean }>("PUT", "/admin/ai-config", cfg),
    testAiConfig: () =>
      adminRequest<{ ok: boolean; model: string }>("POST", "/admin/ai-config/test"),

    getEmailConfig: () =>
      adminRequest<{ configured: boolean; keySource: string; fromEmail: string; fromName: string; adminEmail: string }>("GET", "/admin/email-config"),
    saveEmailConfig: (cfg: { apiKey?: string; fromEmail?: string; fromName?: string; adminEmail?: string }) =>
      adminRequest<{ ok: boolean; configured: boolean }>("PUT", "/admin/email-config", cfg),
    testEmailConfig: (to: string) =>
      adminRequest<{ ok: boolean }>("POST", "/admin/email-config/test", { to }),

    getSeoConfig: () =>
      adminRequest<SeoConfig>("GET", "/admin/seo-config"),
    saveSeoConfig: (cfg: Partial<SeoConfig>) =>
      adminRequest<{ ok: boolean; config: SeoConfig }>("PUT", "/admin/seo-config", cfg),

    getSocialConfig: () =>
      adminRequest<SocialConfig>("GET", "/admin/social-config"),
    saveSocialConfig: (cfg: Partial<SocialConfig>) =>
      adminRequest<{ ok: boolean; config: SocialConfig }>("PUT", "/admin/social-config", cfg),

    getGoogleOAuth: () =>
      adminRequest<{ clientId: string; clientSecretPreview: string; enabled: boolean; configured: boolean; callbackUrl: string }>("GET", "/admin/google-oauth"),
    saveGoogleOAuth: (cfg: { clientId?: string; clientSecret?: string; enabled?: boolean }) =>
      adminRequest<{ ok: boolean; configured: boolean; enabled: boolean }>("PUT", "/admin/google-oauth", cfg),

    getCurriculumDb: () =>
      adminRequest<unknown[]>("GET", "/admin/curriculum-db"),
    createCurriculumLevel: (body: { title: string; subtitle: string; difficulty: string }) =>
      adminRequest<{ ok: boolean }>("POST", "/admin/curriculum-db/levels", body),
    updateCurriculumLevel: (id: number, body: { title?: string; subtitle?: string; difficulty?: string; sortOrder?: number }) =>
      adminRequest<{ ok: boolean }>("PUT", `/admin/curriculum-db/levels/${id}`, body),
    deleteCurriculumLevel: (id: number) =>
      adminRequest<{ ok: boolean }>("DELETE", `/admin/curriculum-db/levels/${id}`),
    createCurriculumLesson: (body: { levelId: number; title: string; summary: string; xp: number; content: unknown[]; questions: unknown[] }) =>
      adminRequest<{ ok: boolean; id: string }>("POST", "/admin/curriculum-db/lessons", body),
    updateCurriculumLesson: (id: string, body: { title?: string; summary?: string; xp?: number; content?: unknown[]; questions?: unknown[]; sortOrder?: number }) =>
      adminRequest<{ ok: boolean }>("PUT", `/admin/curriculum-db/lessons/${id}`, body),
    deleteCurriculumLesson: (id: string) =>
      adminRequest<{ ok: boolean }>("DELETE", `/admin/curriculum-db/lessons/${id}`),

    finance: () =>
      adminRequest<{
        plan:    { priceAoa: number; planName: string };
        counts:  { total: number; active: number; pending: number; expired: number; rejected: number };
        revenue: { mrr: number; totalReceived: number; pendingRevenue: number; newLast30: number; newActiveLast30: number };
      }>("GET", "/admin/finance"),
  },

  /* ---------- Public content (students) ---------- */
  videos: {
    list: () => request<unknown[]>("GET", "/videos"),
  },
  leaderboard: () =>
    request<{ rank: number; userId: string; name: string; xp: number }[]>("GET", "/leaderboard"),
  content: {
    glossary:   () => request<unknown[]>("GET", "/glossary"),
    strategies: () => request<unknown[]>("GET", "/strategies"),
    books:      () => request<unknown[]>("GET", "/books"),
    resources:  () => request<unknown[]>("GET", "/resources"),
    curriculum: () => request<unknown[]>("GET", "/curriculum"),
  },

  /* ---------- Subscrições (aluno) ---------- */
  subscription: {
    get: (userId: string) =>
      authRequest<{ subscription: SubscriptionData | null }>("GET", `/subscription/${userId}`),
    history: (userId: string) =>
      authRequest<{ subscriptions: SubscriptionData[] }>("GET", `/subscription/${userId}/history`),
    request: (userId: string, body: { paymentReference?: string; receiptData?: string; receiptMimeType?: string; receiptFilename?: string }) =>
      authRequest<{ ok: boolean; id: string }>("POST", `/subscription/${userId}/request`, body),
    updateReference: (userId: string, body: { paymentReference?: string; receiptData?: string; receiptMimeType?: string; receiptFilename?: string }) =>
      authRequest<{ ok: boolean }>("PATCH", `/subscription/${userId}/reference`, body),
    getReceipt: (userId: string, subId: string) =>
      authRequest<{ receiptData: string; receiptMimeType: string; receiptFilename: string }>("GET", `/subscription/${userId}/receipt/${subId}`),
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

export type SeoConfig = {
  siteName:      string;
  shortName:     string;
  domain:        string;
  description:   string;
  twitterHandle: string;
  themeColor:    string;
  priceAoa:      number;
  geo:           string;
  geoCity:       string;
};

export type SocialConfig = {
  youtube:   string;
  instagram: string;
  tiktok:    string;
  x:         string;
  facebook:  string;
};

/** Public — no auth needed */
export function getSiteConfig(): Promise<SeoConfig> {
  return request<SeoConfig>("GET", "/site-config");
}

/** Public — returns social media links configured in the admin panel */
export function getSocialConfig(): Promise<SocialConfig> {
  return request<SocialConfig>("GET", "/social-config");
}
