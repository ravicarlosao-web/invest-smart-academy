import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app = express();

/* ── Trust proxy (Replit runs behind a proxy) ───────────────────────────── */
app.set("trust proxy", 1);

/* ── CORS ────────────────────────────────────────────────────────────────── */
function buildAllowedOrigins(): string[] {
  const origins: string[] = [];

  /* Env var for custom production domain, e.g. "https://tradeacademy.ao" */
  const custom = process.env["ALLOWED_ORIGIN"];
  if (custom) {
    origins.push(...custom.split(",").map((s) => s.trim()).filter(Boolean));
  }

  /* Replit dev domain(s) — comma-separated */
  const replitDomains = process.env["REPLIT_DOMAINS"];
  if (replitDomains) {
    for (const d of replitDomains.split(",").map((s) => s.trim())) {
      origins.push(`https://${d}`);
    }
  }

  /* Fallback: allow localhost in development */
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
      /* Same-origin requests (no Origin header) or allowed origins */
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }),
);

/* ── Rate limiters ───────────────────────────────────────────────────────── */
const rateLimitMessage = { error: "too_many_requests", message: "Demasiadas tentativas. Tenta novamente mais tarde." };

/** Auth routes: 15 requests / 15 min per IP */
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              15,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          rateLimitMessage,
  skipSuccessfulRequests: false,
});

/** Admin login: 5 requests / 15 min per IP (stricter) */
const adminLoginLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          rateLimitMessage,
  skipSuccessfulRequests: true,
});

/** General API: 200 requests / 15 min per IP */
const generalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              200,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          rateLimitMessage,
});

/* ── Logging ─────────────────────────────────────────────────────────────── */
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

/* ── Body parsing ────────────────────────────────────────────────────────── */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* ── Apply rate limiters to specific paths ───────────────────────────────── */
app.use("/api/auth",         authLimiter);
app.use("/api/admin/login",  adminLoginLimiter);
app.use("/api",              generalLimiter);

/* ── Routes ──────────────────────────────────────────────────────────────── */
app.use("/api", router);

/* ── Global error handler (CORS errors + uncaught route errors) ──────────── */
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message.startsWith("CORS:")) {
    res.status(403).json({ error: "cors_forbidden", message: "Origem não permitida." });
    return;
  }
  logger.error(err);
  res.status(500).json({ error: "internal" });
});

export default app;
