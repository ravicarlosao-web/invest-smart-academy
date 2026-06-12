// @ts-nocheck
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttpModule from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pinoHttp = pinoHttpModule as any;

const app = express();

/* ── Trust proxy (Replit runs behind a proxy) ───────────────────────────── */
app.set("trust proxy", 1);

/* ── Security headers (Helmet) ───────────────────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // API server only returns JSON — strict policy, no HTML resources needed
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'none'"],
        frameAncestors: ["'none'"],   // prevent clickjacking of API endpoints
        objectSrc:      ["'none'"],
        baseUri:        ["'self'"],
      },
    },
  }),
);

/* ── CORS ────────────────────────────────────────────────────────────────── */
function buildAllowedOrigins(): string[] {
  const origins: string[] = [];

  const custom = process.env["ALLOWED_ORIGIN"];
  if (custom) {
    origins.push(...custom.split(",").map((s: any) => s.trim()).filter(Boolean));
  }

  const replitDomains = process.env["REPLIT_DOMAINS"];
  if (replitDomains) {
    for (const d of replitDomains.split(",").map((s: any) => s.trim())) {
      origins.push(`https://${d}`);
    }
  }

  // Vercel system env vars (available at runtime in serverless functions)
  const vercelUrl = process.env["VERCEL_URL"];
  if (vercelUrl) origins.push(`https://${vercelUrl}`);

  const vercelProdUrl = process.env["VERCEL_PROJECT_PRODUCTION_URL"];
  if (vercelProdUrl) origins.push(`https://${vercelProdUrl}`);

  // Hardcoded Vercel production domain as reliable fallback
  origins.push("https://aluka.vercel.app");

  if (process.env["NODE_ENV"] !== "production") {
    origins.push("http://localhost:3000", "http://localhost:5173");
  }

  return origins;
}

const allowedOrigins = buildAllowedOrigins();
logger.info({ allowedOrigins }, "CORS allowed origins");

app.use(
  cors({
    origin(origin, cb) {
      // No origin header = same-origin, server-to-server, or curl
      if (!origin) return cb(null, true);
      // Check explicit allow-list
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // Allow Vercel preview deployments for this project (startsWith avoids ReDoS)
      // Production: aluka.vercel.app (already in allowedOrigins above)
      // Previews:   aluka-<hash>.vercel.app
      if (origin.startsWith("https://aluka") && origin.endsWith(".vercel.app")) return cb(null, true);
      // Allow all Replit dev/preview domains (frontend and API run on different subdomains)
      // Parse hostname to strip any explicit port (e.g. origin may be https://foo.replit.dev:3001)
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith(".replit.dev") || hostname.endsWith(".repl.co")) return cb(null, true);
      } catch { /* invalid URL — fall through to deny */ }
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }),
);

/* ── Rate limiters ───────────────────────────────────────────────────────── */
const rateLimitMessage = { error: "too_many_requests", message: "Demasiadas tentativas. Tenta novamente mais tarde." };

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 15,
  standardHeaders: true, legacyHeaders: false, message: rateLimitMessage,
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false, message: rateLimitMessage,
  skipSuccessfulRequests: true,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false, message: rateLimitMessage,
});

/* ── Logging ─────────────────────────────────────────────────────────────── */
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res: any) { return { statusCode: res.statusCode }; },
    },
  }),
);

/* ── Body parsing — per-route limits ─────────────────────────────────────── */
/* Auth & admin-login: small body only, no file uploads here */
app.use("/api/auth",        express.json({ limit: "50kb" }));
app.use("/api/admin/login", express.json({ limit: "50kb" }));

/* Subscription: base64 receipt can be up to 5 MB → ~7 MB base64 */
app.use("/api/subscription", express.json({ limit: "8mb" }));
app.use("/api/admin/subscriptions", express.json({ limit: "8mb" }));

/* Everything else: generous but not unlimited */
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

/* ── Rate limiters ───────────────────────────────────────────────────────── */
app.use("/api/auth",         authLimiter);
app.use("/api/admin/login",  adminLoginLimiter);
app.use("/api",              generalLimiter);

/* ── Routes ──────────────────────────────────────────────────────────────── */
app.use("/api", router);

/* ── 404 for unmatched API routes ────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use("/api", (_req: any, res: any) => {
  res.status(404).json({ error: "not_found" });
});

/* ── Global error handler ────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: Error & { type?: string }, _req: any, res: any, _next: any) => {
  if (err.message.startsWith("CORS:")) {
    res.status(403).json({ error: "cors_forbidden", message: "Origem não permitida." });
    return;
  }
  if (err.type === "entity.too.large") {
    res.status(413).json({ error: "payload_too_large", message: "Pedido demasiado grande." });
    return;
  }
  if (err.type === "entity.parse.failed") {
    res.status(400).json({ error: "invalid_json", message: "JSON inválido." });
    return;
  }
  logger.error(err);
  res.status(500).json({ error: "internal" });
});

export default app;
