// @ts-nocheck
/**
 * Email service — Gmail SMTP via Nodemailer
 *
 * Credential resolution order:
 *   1. GMAIL_USER + GMAIL_APP_PASSWORD environment variables
 *   2. admin_settings DB row key = "email.config" → { gmailUser, gmailAppPassword, fromName }
 *
 * All functions return { ok: true } on success or { ok: false, reason } on
 * failure and NEVER throw — callers can fire-and-forget safely.
 */

import nodemailer from "nodemailer";
import { db, adminSettingsTable, eq } from "@workspace/db";

const APP_URL = process.env["APP_URL"] ?? "https://aluka.ao";

const GMAIL_USER    = "aluka.co.ao@gmail.com";
const SENDER_NAME   = "ALUKA";

/* ── HTML escape ──────────────────────────────────────────────────────────── */
function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/* ── Config loader ────────────────────────────────────────────────────────── */
async function loadGmailConfig(): Promise<{ user: string; pass: string; fromName: string } | null> {
  const envPass = process.env["GMAIL_APP_PASSWORD"];
  if (envPass) {
    return { user: GMAIL_USER, pass: envPass.replace(/\s/g, ""), fromName: SENDER_NAME };
  }

  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "email.config")).get();
    if (row?.value) {
      const cfg = JSON.parse(row.value);
      if (cfg.gmailAppPassword) {
        return {
          user:     cfg.gmailUser     ?? GMAIL_USER,
          pass:     cfg.gmailAppPassword.replace(/\s/g, ""),
          fromName: cfg.fromName      ?? SENDER_NAME,
        };
      }
    }
  } catch { /* ignore */ }

  return null;
}

/* ── Transporter factory ──────────────────────────────────────────────────── */
function makeTransporter(cfg: { user: string; pass: string }) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: { rejectUnauthorized: false },
  });
}

/* ── Low-level send ───────────────────────────────────────────────────────── */
async function sendMail(msg: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const cfg = await loadGmailConfig();
  if (!cfg) return { ok: false, reason: "gmail_not_configured" };

  try {
    const transporter = makeTransporter(cfg);
    await transporter.sendMail({
      from:    `"${cfg.fromName}" <${cfg.user}>`,
      to:      msg.to,
      subject: msg.subject,
      html:    msg.html,
      text:    msg.text ?? msg.html.replace(/<[^>]+>/g, ""),
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message ?? "smtp_error" };
  }
}

/* ── Email base template ──────────────────────────────────────────────────── */
function baseTemplate(body: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#080b12;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#0f1520;border-radius:12px;overflow:hidden;border:1px solid #1e2a3a;">
    <div style="background:linear-gradient(135deg,#00c7e6,#0077b6);padding:28px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">ALUKA</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Angola · Educação em Trading</p>
    </div>
    <div style="padding:32px 40px;">
      ${body}
    </div>
    <div style="padding:18px 40px;border-top:1px solid #1e2a3a;text-align:center;">
      <p style="color:#4a5568;font-size:11px;margin:0;">© ${new Date().getFullYear()} ALUKA Angola. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════════════════════
 * PUBLIC FUNCTIONS
 * ══════════════════════════════════════════════════════════════════════════ */

/** Verificação de email — envia código de 6 dígitos */
export async function sendEmailVerificationCode(opts: {
  to: string;
  name: string;
  code: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const html = baseTemplate(`
    <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:20px;">Confirma o teu email</h2>
    <p style="color:#94a3b8;margin:0 0 24px;line-height:1.6;">
      Olá <strong style="color:#e2e8f0;">${escHtml(opts.name)}</strong>,<br><br>
      Usa o código abaixo para confirmar o teu endereço de email. O código expira em <strong style="color:#e2e8f0;">15 minutos</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:#0f2235;border:2px solid #00c7e6;border-radius:12px;padding:18px 40px;">
        <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#00c7e6;font-family:monospace;">${escHtml(opts.code)}</span>
      </div>
    </div>
    <p style="color:#64748b;font-size:12px;margin:20px 0 0;line-height:1.6;">
      Se não criaste uma conta na ALUKA, podes ignorar este email.
    </p>
  `);

  return sendMail({ to: opts.to, subject: "Confirma o teu email — ALUKA", html });
}

/** Recuperação de password */
export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  token: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const link = `${APP_URL}/redefinir-senha?token=${opts.token}`;

  const html = baseTemplate(`
    <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:20px;">Recuperação de password</h2>
    <p style="color:#94a3b8;margin:0 0 24px;line-height:1.6;">
      Olá <strong style="color:#e2e8f0;">${escHtml(opts.name)}</strong>,<br><br>
      Recebemos um pedido para redefinires a tua password. Clica no botão abaixo para criar uma nova.
      O link expira em <strong style="color:#e2e8f0;">1 hora</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#00c7e6,#0077b6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">
        Redefinir password
      </a>
    </div>
    <p style="color:#64748b;font-size:12px;margin:20px 0 0;line-height:1.6;">
      Se não pediste a recuperação de password, podes ignorar este email — a tua conta está em segurança.<br><br>
      Ou copia este link: <a href="${link}" style="color:#00c7e6;word-break:break-all;">${escHtml(link)}</a>
    </p>
  `);

  return sendMail({ to: opts.to, subject: "Recuperação de password — ALUKA", html });
}

/** Aprovação de subscrição */
export async function sendSubscriptionApprovalEmail(opts: {
  to: string;
  name: string;
  expiresAt: number;
}): Promise<{ ok: boolean; reason?: string }> {
  const expireDate = new Date(opts.expiresAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });

  const html = baseTemplate(`
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;background:#00c7e615;border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;">🎉</div>
    </div>
    <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:20px;text-align:center;">Subscrição aprovada!</h2>
    <p style="color:#94a3b8;margin:0 0 20px;line-height:1.6;">
      Olá <strong style="color:#e2e8f0;">${escHtml(opts.name)}</strong>,<br><br>
      A tua subscrição foi <strong style="color:#00c7e6;">aprovada</strong>! Tens agora acesso completo até <strong style="color:#e2e8f0;">${escHtml(expireDate)}</strong>.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}/aprender" style="display:inline-block;background:linear-gradient(135deg,#00c7e6,#0077b6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">
        Começar a aprender
      </a>
    </div>
  `);

  return sendMail({ to: opts.to, subject: "A tua subscrição foi aprovada! 🎉 — ALUKA", html });
}

/** Rejeição de subscrição */
export async function sendSubscriptionRejectionEmail(opts: {
  to: string;
  name: string;
  notes?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const noteSection = opts.notes
    ? `<div style="background:#ff444412;border-left:3px solid #ff4444;padding:12px 16px;border-radius:4px;margin:16px 0;">
        <p style="color:#ff8888;margin:0;font-size:13px;"><strong>Motivo:</strong> ${escHtml(opts.notes)}</p>
       </div>`
    : "";

  const html = baseTemplate(`
    <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:20px;">Subscrição não aprovada</h2>
    <p style="color:#94a3b8;margin:0 0 12px;line-height:1.6;">
      Olá <strong style="color:#e2e8f0;">${escHtml(opts.name)}</strong>,<br><br>
      O teu pedido de subscrição não pôde ser aprovado desta vez.
    </p>
    ${noteSection}
    <p style="color:#94a3b8;margin:12px 0 20px;line-height:1.6;">
      Podes submeter um novo comprovativo de pagamento no teu perfil.
    </p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${APP_URL}/perfil" style="display:inline-block;background:linear-gradient(135deg,#00c7e6,#0077b6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">
        Ir para o perfil
      </a>
    </div>
  `);

  return sendMail({ to: opts.to, subject: "Subscrição não aprovada — ALUKA", html });
}

/** Email de teste */
export async function sendTestEmail(opts: {
  to: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const html = baseTemplate(`
    <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:20px;">✅ Gmail SMTP configurado!</h2>
    <p style="color:#94a3b8;margin:0;line-height:1.6;">
      Este é um email de teste enviado a partir do painel de administração da ALUKA Angola.<br><br>
      <strong style="color:#e2e8f0;">Remetente:</strong> aluka.co.ao@gmail.com<br>
      <strong style="color:#e2e8f0;">Enviado em:</strong> ${new Date().toLocaleString("pt-PT")}
    </p>
  `);

  return sendMail({ to: opts.to, subject: "Email de teste — ALUKA ✅", html });
}
