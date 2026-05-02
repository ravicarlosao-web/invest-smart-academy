// @ts-nocheck
/**
 * Email service — SendGrid
 *
 * API key resolution order:
 *   1. admin_settings DB row  key = "email.config"  → { apiKey, fromEmail, fromName }
 *   2. SENDGRID_API_KEY environment variable
 *
 * All functions return { ok: true } on success or { ok: false, reason } on
 * failure and NEVER throw — callers can fire-and-forget safely.
 */

import { db, adminSettingsTable, eq } from "@workspace/db";

const APP_URL = process.env["APP_URL"] ?? `https://${process.env["REPLIT_DEV_DOMAIN"] ?? "localhost"}`;

/* ── HTML escape — prevents XSS in email templates ──────────────────────── */
function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/* ── Config loader ───────────────────────────────────────────────────────── */
async function loadEmailConfig(): Promise<{ apiKey: string; fromEmail: string; fromName: string } | null> {
  try {
    const row = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "email.config")).get();
    if (row?.value) {
      const cfg = JSON.parse(row.value);
      if (cfg.apiKey) return { apiKey: cfg.apiKey, fromEmail: cfg.fromEmail ?? "noreply@tradeacademy.ao", fromName: cfg.fromName ?? "TradeAcademy" };
    }
  } catch { /* ignore */ }

  const envKey = process.env["SENDGRID_API_KEY"];
  if (envKey) return { apiKey: envKey, fromEmail: "noreply@tradeacademy.ao", fromName: "TradeAcademy" };

  return null;
}

/* ── Low-level send via SendGrid HTTP API ────────────────────────────────── */
async function sendViaSendGrid(cfg: { apiKey: string; fromEmail: string; fromName: string }, msg: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  try {
    const body = {
      personalizations: [{ to: [{ email: msg.to }] }],
      from: { email: cfg.fromEmail, name: cfg.fromName },
      subject: msg.subject,
      content: [
        { type: "text/plain", value: msg.text ?? msg.html.replace(/<[^>]+>/g, "") },
        { type: "text/html",  value: msg.html },
      ],
    };

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 202) return { ok: true };
    const text = await res.text();
    return { ok: false, reason: `SendGrid ${res.status}: ${text.slice(0, 200)}` };
  } catch (err: any) {
    return { ok: false, reason: err?.message ?? "network_error" };
  }
}

/* ── Public helpers ──────────────────────────────────────────────────────── */

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  token: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const cfg = await loadEmailConfig();
  if (!cfg) return { ok: false, reason: "sendgrid_not_configured" };

  const link = `${APP_URL}/redefinir-senha?token=${opts.token}`;

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#1a1d2e;border-radius:12px;overflow:hidden;border:1px solid #2d3148;">
    <div style="background:linear-gradient(135deg,#00c7e6,#0077b6);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">TradeAcademy</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Angola · Educação em Trading</p>
    </div>
    <div style="padding:32px 40px;">
      <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:20px;">Recuperação de password</h2>
      <p style="color:#94a3b8;margin:0 0 24px;line-height:1.6;">
        Olá <strong style="color:#e2e8f0;">${escHtml(opts.name)}</strong>,<br><br>
        Recebemos um pedido para redefinires a tua password. Clica no botão abaixo para criar uma nova password.
        O link expira em <strong style="color:#e2e8f0;">1 hora</strong>.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#00c7e6,#0077b6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
          Redefinir password
        </a>
      </div>
      <p style="color:#64748b;font-size:12px;margin:24px 0 0;line-height:1.6;">
        Se não pediste a recuperação de password, podes ignorar este email — a tua conta está em segurança.<br><br>
        Ou copia e cola este link no browser:<br>
        <a href="${link}" style="color:#00c7e6;word-break:break-all;">${escHtml(link)}</a>
      </p>
    </div>
    <div style="padding:20px 40px;border-top:1px solid #2d3148;text-align:center;">
      <p style="color:#64748b;font-size:11px;margin:0;">© ${new Date().getFullYear()} TradeAcademy Angola. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;

  return sendViaSendGrid(cfg, {
    to: opts.to,
    subject: "Recuperação de password — TradeAcademy",
    html,
  });
}

export async function sendSubscriptionApprovalEmail(opts: {
  to: string;
  name: string;
  expiresAt: number;
}): Promise<{ ok: boolean; reason?: string }> {
  const cfg = await loadEmailConfig();
  if (!cfg) return { ok: false, reason: "sendgrid_not_configured" };

  const expireDate = new Date(opts.expiresAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#1a1d2e;border-radius:12px;overflow:hidden;border:1px solid #2d3148;">
    <div style="background:linear-gradient(135deg,#00c7e6,#0077b6);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">TradeAcademy</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Angola · Educação em Trading</p>
    </div>
    <div style="padding:32px 40px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#00c7e615;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;">🎉</div>
      </div>
      <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:20px;text-align:center;">Subscrição aprovada!</h2>
      <p style="color:#94a3b8;margin:0 0 24px;line-height:1.6;">
        Olá <strong style="color:#e2e8f0;">${escHtml(opts.name)}</strong>,<br><br>
        A tua subscrição foi <strong style="color:#00c7e6;">aprovada</strong>! Tens agora acesso completo a todo o conteúdo Intermédio e Avançado até <strong style="color:#e2e8f0;">${escHtml(expireDate)}</strong>.
      </p>
      <ul style="color:#94a3b8;padding-left:20px;margin:0 0 24px;line-height:2;">
        <li>📚 Todas as lições Intermédias e Avançadas desbloqueadas</li>
        <li>🤖 Coach IA personalizado para cada trade</li>
        <li>🏆 Duelos premium com outros traders</li>
        <li>📹 Acesso completo às vídeo-aulas</li>
      </ul>
      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}/aprender" style="display:inline-block;background:linear-gradient(135deg,#00c7e6,#0077b6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
          Começar a aprender
        </a>
      </div>
    </div>
    <div style="padding:20px 40px;border-top:1px solid #2d3148;text-align:center;">
      <p style="color:#64748b;font-size:11px;margin:0;">© ${new Date().getFullYear()} TradeAcademy Angola. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;

  return sendViaSendGrid(cfg, {
    to: opts.to,
    subject: "A tua subscrição foi aprovada! 🎉 — TradeAcademy",
    html,
  });
}

export async function sendSubscriptionRejectionEmail(opts: {
  to: string;
  name: string;
  notes?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const cfg = await loadEmailConfig();
  if (!cfg) return { ok: false, reason: "sendgrid_not_configured" };

  const noteSection = opts.notes
    ? `<div style="background:#ff444415;border-left:3px solid #ff4444;padding:12px 16px;border-radius:4px;margin:16px 0;">
        <p style="color:#ff8888;margin:0;font-size:13px;"><strong>Motivo:</strong> ${escHtml(opts.notes)}</p>
       </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#1a1d2e;border-radius:12px;overflow:hidden;border:1px solid #2d3148;">
    <div style="background:linear-gradient(135deg,#00c7e6,#0077b6);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">TradeAcademy</h1>
    </div>
    <div style="padding:32px 40px;">
      <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:20px;">Subscrição não aprovada</h2>
      <p style="color:#94a3b8;margin:0 0 16px;line-height:1.6;">
        Olá <strong style="color:#e2e8f0;">${escHtml(opts.name)}</strong>,<br><br>
        O teu pedido de subscrição não pôde ser aprovado desta vez.
      </p>
      ${noteSection}
      <p style="color:#94a3b8;margin:16px 0 24px;line-height:1.6;">
        Podes submeter um novo comprovativo de pagamento no teu perfil ou contactar o suporte para esclarecimentos.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${APP_URL}/perfil" style="display:inline-block;background:linear-gradient(135deg,#00c7e6,#0077b6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
          Ir para o perfil
        </a>
      </div>
    </div>
    <div style="padding:20px 40px;border-top:1px solid #2d3148;text-align:center;">
      <p style="color:#64748b;font-size:11px;margin:0;">© ${new Date().getFullYear()} TradeAcademy Angola. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;

  return sendViaSendGrid(cfg, {
    to: opts.to,
    subject: "Subscrição não aprovada — TradeAcademy",
    html,
  });
}

export async function sendTestEmail(opts: {
  to: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const cfg = await loadEmailConfig();
  if (!cfg) return { ok: false, reason: "sendgrid_not_configured" };

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#1a1d2e;border-radius:12px;overflow:hidden;border:1px solid #2d3148;">
    <div style="background:linear-gradient(135deg,#00c7e6,#0077b6);padding:24px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:20px;">TradeAcademy — Teste de Email</h1>
    </div>
    <div style="padding:24px 32px;">
      <p style="color:#94a3b8;margin:0;line-height:1.6;">
        ✅ <strong style="color:#e2e8f0;">SendGrid configurado com sucesso!</strong><br><br>
        Este é um email de teste enviado a partir do painel de administração da TradeAcademy Angola.<br>
        Enviado em: ${new Date().toLocaleString("pt-PT")}
      </p>
    </div>
  </div>
</body>
</html>`;

  return sendViaSendGrid(cfg, {
    to: opts.to,
    subject: "Email de teste — TradeAcademy ✅",
    html,
  });
}
