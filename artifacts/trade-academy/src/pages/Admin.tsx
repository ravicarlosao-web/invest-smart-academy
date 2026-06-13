import { useEffect, useMemo, useState, useCallback, useRef, type ChangeEvent } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";
import {
  Shield, LogOut, Users, LineChart as LineChartIcon, BookOpen, Activity,
  Trash2, RotateCcw, Search, Save, AlertTriangle, Trophy, Home,
  Compass, Library, BookMarked, BookText, Plus, Pencil, X, ChevronRight,
  BarChart3, GraduationCap, Star, ExternalLink, Tag, ChevronDown, ChevronUp,
  Coins, PlayCircle, Lock, CreditCard, CheckCircle2, Clock, XCircle,
  FileText, Image, Download, TrendingUp, TrendingDown, DollarSign,
  Banknote, Settings, RefreshCw, ArrowUpRight, UserCheck, UserX, Hourglass,
  Brain, Eye, EyeOff, Loader2, Wifi, WifiOff, Headphones, Upload, Volume2,
  Mail, Send, CheckCircle, Globe, Plug, Copy, ToggleLeft, ToggleRight,
  Building2, ArrowLeftRight, Video, Share2, AlertCircle,
} from "lucide-react";
import type { SubscriptionWithUser, SeoConfig, SocialConfig } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/apiClient";
import { LEVELS } from "@/data/curriculum";
import { STRATEGIES, type Strategy, type RiskLevel } from "@/data/strategies";
import { BOOKS_CATALOG, type BookMeta } from "@/data/books";
import { GLOSSARY, type GlossaryTerm, type GlossaryCategory, CATEGORY_COLORS } from "@/data/glossary";
import { type VideoLesson, extractYouTubeId, thumbnailUrl, LEVEL_COLORS, VIDEO_CATEGORIES } from "@/data/videos";


/* =========================================================================
 * Ecrã de login integrado — mostrado em /ta-painel-gestao quando não autenticado
 * ========================================================================= */
function AdminGateLogin() {
  const { login } = useAuthStore();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error ?? "Credenciais inválidas.");
      return;
    }
    const user = useAuthStore.getState().user;
    if (!["administrador", "professor", "master"].includes(user?.role ?? "")) {
      useAuthStore.getState().logout();
      toast.error("Esta conta não tem permissões administrativas.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="mt-3">Área Restrita</CardTitle>
          <CardDescription>Acesso exclusivo para administradores e professores.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="adm-email">E-mail</Label>
              <Input
                id="adm-email"
                type="email"
                autoFocus
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemplo.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adm-pw">Password</Label>
              <div className="relative">
                <Input
                  id="adm-pw"
                  type={showPw ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !email || !password}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />A verificar…</> : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================================================================
 * Helpers
 * ========================================================================= */
function fmtUsd(n: number) { return n.toLocaleString("pt-BR", { style: "currency", currency: "USD" }); }
function fmtPct(n: number) { return `${(n * 100).toFixed(1)}%`; }
function fmtDate(ms: number) { if (!ms) return "—"; return new Date(ms).toLocaleString("pt-BR"); }
function uid() { return Math.random().toString(36).slice(2, 10); }

/* =========================================================================
 * Overview tab — SaaS Business Dashboard
 * ========================================================================= */
type FinanceData = Awaited<ReturnType<typeof api.admin.finance>>;

function StatCard({
  label, value, sub, Icon, colorClass, trend,
}: {
  label: string; value: string; sub?: string;
  Icon: React.ElementType; colorClass: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="border-border/60 hover:border-border transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className={cn("mt-1.5 font-mono text-2xl font-bold tracking-tight", colorClass)}>{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", colorClass === "text-bull" ? "bg-bull/10" : colorClass === "text-bear" ? "bg-bear/10" : colorClass === "text-warning" ? "bg-warning/10" : colorClass === "text-primary" ? "bg-primary/10" : "bg-muted")}>
            <Icon className={cn("h-5 w-5", colorClass)} />
          </div>
        </div>
        {trend && (
          <div className={cn("mt-3 flex items-center gap-1 text-xs font-medium", trend === "up" ? "text-bull" : trend === "down" ? "text-bear" : "text-muted-foreground")}>
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OverviewTab() {
  const [fin, setFin]       = useState<FinanceData | null>(null);
  const [users, setUsers]   = useState<Awaited<ReturnType<typeof api.admin.users>> | null>(null);
  const [pendSubs, setPendSubs] = useState<SubscriptionWithUser[] | null>(null);
  const [busy, setBusy]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [f, u, subs] = await Promise.all([
        api.admin.finance(),
        api.admin.users(),
        api.adminSubscriptions.list("pending"),
      ]);
      setFin(f); setUsers(u); setPendSubs(subs);
    } catch (e) { toast.error("Erro ao carregar dados: " + String(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id: string) {
    setBusy(id);
    try { await api.adminSubscriptions.approve(id); toast.success("Subscrição aprovada"); await load(); }
    catch { toast.error("Erro ao aprovar"); }
    finally { setBusy(null); }
  }

  async function handleReject(id: string) {
    if (!window.confirm("Rejeitar este pedido?")) return;
    setBusy("r" + id);
    try { await api.adminSubscriptions.reject(id); toast.success("Pedido rejeitado"); await load(); }
    catch { toast.error("Erro ao rejeitar"); }
    finally { setBusy(null); }
  }

  const fmtAoa = (n: number) => n.toLocaleString("pt-AO") + " AOA";
  const fmt = (ts: number) => new Date(ts).toLocaleDateString("pt-PT");

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground text-sm gap-2">
      <RefreshCw className="h-4 w-4 animate-spin" /> A carregar dashboard…
    </div>
  );

  return (
    <div className="space-y-7">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Dashboard do Negócio</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão financeira e de crescimento do ALUKA · {fin?.plan.planName} · {fin ? fmtAoa(fin.plan.priceAoa) : "…"}/mês
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
        </Button>
      </div>

      {/* ── Receita ──────────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Receita</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Receita Recorrente (MRR)"
            value={fin ? fmtAoa(fin.revenue.mrr) : "—"}
            sub={fin ? `${fin.counts.active} assinante${fin.counts.active !== 1 ? "s" : ""} ativos` : undefined}
            Icon={Banknote}
            colorClass="text-bull"
            trend="up"
          />
          <StatCard
            label="Receita Total Recebida"
            value={fin ? fmtAoa(fin.revenue.totalReceived) : "—"}
            sub="Todos os pagamentos aprovados"
            Icon={DollarSign}
            colorClass="text-primary"
          />
          <StatCard
            label="A Receber (pendente)"
            value={fin ? fmtAoa(fin.revenue.pendingRevenue) : "—"}
            sub={fin ? `${fin.counts.pending} pedido${fin.counts.pending !== 1 ? "s" : ""} aguardando aprovação` : undefined}
            Icon={Hourglass}
            colorClass={fin && fin.counts.pending > 0 ? "text-warning" : "text-muted-foreground"}
          />
        </div>
      </section>

      {/* ── Alunos ───────────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Alunos</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Registados"
            value={users ? String(users.length) : "—"}
            sub="Contas criadas"
            Icon={Users}
            colorClass="text-primary"
          />
          <StatCard
            label="Assinantes Ativos"
            value={fin ? String(fin.counts.active) : "—"}
            sub="Acesso ativo pago"
            Icon={UserCheck}
            colorClass="text-bull"
          />
          <StatCard
            label="Pendentes"
            value={fin ? String(fin.counts.pending) : "—"}
            sub="Aguardando aprovação"
            Icon={Clock}
            colorClass={fin && fin.counts.pending > 0 ? "text-warning" : "text-muted-foreground"}
          />
          <StatCard
            label="Expirados / Rejeitados"
            value={fin ? String(fin.counts.expired + fin.counts.rejected) : "—"}
            sub="Sem acesso atual"
            Icon={UserX}
            colorClass="text-muted-foreground"
          />
        </div>
      </section>

      {/* ── Novos nos últimos 30 dias ─────────────────────────── */}
      {fin && (fin.revenue.newLast30 > 0 || fin.revenue.newActiveLast30 > 0) && (
        <section>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Últimos 30 dias</p>
                <p className="font-bold text-sm">{fin.revenue.newLast30} pedido{fin.revenue.newLast30 !== 1 ? "s" : ""} novos · {fin.revenue.newActiveLast30} aprovado{fin.revenue.newActiveLast30 !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {fin.revenue.newLast30 > 0 && (
              <div className="ml-auto text-sm text-muted-foreground">
                Taxa de conversão: <span className="font-bold text-foreground">{fin.revenue.newLast30 > 0 ? Math.round((fin.revenue.newActiveLast30 / fin.revenue.newLast30) * 100) : 0}%</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Pedidos pendentes ─────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Pedidos Pendentes de Aprovação
            {pendSubs && pendSubs.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-warning/20 text-warning text-[10px] font-bold px-1.5 py-0.5">
                {pendSubs.length}
              </span>
            )}
          </h3>
        </div>
        {(!pendSubs || pendSubs.length === 0) ? (
          <Card className="border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-bull/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Sem pedidos pendentes</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Todos os pagamentos estão tratados.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Ref. Pagamento</TableHead>
                  <TableHead>Comprovativo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pedido em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendSubs.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{sub.user.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{sub.paymentReference ?? <span className="italic text-muted-foreground">Não fornecida</span>}</span>
                    </TableCell>
                    <TableCell>
                      {(sub as SubscriptionWithUser & { hasReceipt?: boolean }).hasReceipt
                        ? <span className="text-xs text-bull flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Anexado</span>
                        : <span className="text-xs text-muted-foreground italic">Sem ficheiro</span>
                      }
                    </TableCell>
                    <TableCell className="font-mono text-sm">{sub.amount.toLocaleString("pt-AO")} AOA</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmt(sub.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" className="h-7 text-xs bg-bull hover:bg-bull/90"
                          disabled={!!busy} onClick={() => handleApprove(sub.id)}>
                          {busy === sub.id ? "…" : "Aprovar"}
                        </Button>
                        <Button size="sm" variant="outline"
                          className="h-7 text-xs text-bear border-bear/40 hover:bg-bear/10"
                          disabled={!!busy} onClick={() => handleReject(sub.id)}>
                          {busy === "r" + sub.id ? "…" : "Rejeitar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </div>
  );
}

/* =========================================================================
 * Settings tab — Plan Configuration
 * ========================================================================= */
function SettingsTab() {
  const [cfg, setCfg]       = useState<{ priceAoa: number; planName: string } | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editName, setEditName]   = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getPlanConfig()
      .then((c) => { setCfg(c); setEditPrice(String(c.priceAoa)); setEditName(c.planName); setLoading(false); })
      .catch(() => { toast.error("Erro ao carregar configurações"); setLoading(false); });
  }, []);

  async function save() {
    const price = Number(editPrice);
    if (isNaN(price) || price <= 0) { toast.error("Preço inválido"); return; }
    setSaving(true);
    try {
      await api.admin.savePlanConfig({ priceAoa: price, planName: editName.trim() || "Plano Mensal" });
      setCfg({ priceAoa: price, planName: editName.trim() || "Plano Mensal" });
      toast.success("Configurações do plano guardadas");
    } catch { toast.error("Falha ao guardar"); }
    finally { setSaving(false); }
  }

  const dirty = cfg ? (Number(editPrice) !== cfg.priceAoa || editName !== cfg.planName) : false;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Configurações do Plano</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Define o preço e o nome do plano de subscrição. Reflecte-se em todo o sistema.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4 text-primary" /> Plano de Subscrição Mensal
            </CardTitle>
            <CardDescription>
              O preço é apresentado nas páginas de pagamento e nas notificações enviadas aos alunos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="plan-name">Nome do Plano</Label>
              <Input
                id="plan-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Plano Mensal"
                className="max-w-sm"
              />
              <p className="text-[11px] text-muted-foreground">Aparece nos e-mails e notificações para os alunos.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-price">Preço Mensal (AOA)</Label>
              <div className="flex items-center gap-2 max-w-sm">
                <Input
                  id="plan-price"
                  type="number"
                  min={1}
                  step={100}
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="5000"
                  className="flex-1"
                />
                <span className="text-sm font-medium text-muted-foreground">AOA / mês</span>
              </div>
              {Number(editPrice) > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Equivalente a <span className="font-semibold text-foreground">{Number(editPrice).toLocaleString("pt-AO")} AOA</span> por mês.
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button onClick={save} disabled={saving || !dirty}>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saving ? "A guardar…" : "Guardar alterações"}
              </Button>
              {!dirty && cfg && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-bull" /> Guardado
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info about impact */}
      <Card className="border-border/40 bg-muted/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Onde este preço aparece</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {[
              "Página de pagamento — valor que os alunos vêem ao subscrever",
              "Notificação de aprovação enviada ao aluno",
              "Dashboard financeiro do administrador (cálculo de MRR e receita)",
              "Registo de cada pedido de subscrição aprovado",
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-bull shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

    </div>
  );
}

/* =========================================================================
 * Aluka IA tab — Google Gemini dual-model config
 * ========================================================================= */
function AlukaIaTab() {
  type GeminiCfg = {
    textConfigured: boolean; textEnabled: boolean; textKeyPreview: string;
    imageConfigured: boolean; imageEnabled: boolean; imageKeyPreview: string;
  };
  const [aiCfg, setAiCfg]                   = useState<GeminiCfg | null>(null);
  const [geminiTextKey, setGeminiTextKey]    = useState("");
  const [geminiImageKey, setGeminiImageKey]  = useState("");
  const [geminiTextEnabled,  setGeminiTextEnabled]  = useState(false);
  const [geminiImageEnabled, setGeminiImageEnabled] = useState(false);
  const [showTextKey,  setShowTextKey]  = useState(false);
  const [showImageKey, setShowImageKey] = useState(false);
  const [aiSaving,  setAiSaving]  = useState(false);
  const [aiTesting, setAiTesting] = useState<"text" | "image" | null>(null);
  const [aiTextStatus,  setAiTextStatus]  = useState<"idle" | "ok" | "error">("idle");
  const [aiImageStatus, setAiImageStatus] = useState<"idle" | "ok" | "error">("idle");
  const [aiTextMsg,  setAiTextMsg]  = useState("");
  const [aiImageMsg, setAiImageMsg] = useState("");

  useEffect(() => {
    api.admin.getAiConfig()
      .then((c) => { setAiCfg(c); setGeminiTextEnabled(c.textEnabled); setGeminiImageEnabled(c.imageEnabled); })
      .catch(() => {});
  }, []);

  async function saveAi() {
    setAiSaving(true);
    try {
      const newTextEnabled  = geminiTextEnabled  || !!geminiTextKey.trim();
      const newImageEnabled = geminiImageEnabled || !!geminiImageKey.trim();
      if (newTextEnabled  !== geminiTextEnabled)  setGeminiTextEnabled(newTextEnabled);
      if (newImageEnabled !== geminiImageEnabled) setGeminiImageEnabled(newImageEnabled);
      await api.admin.saveAiConfig({
        geminiTextKey:     geminiTextKey.trim()  || undefined,
        geminiTextEnabled: newTextEnabled,
        geminiImageKey:    geminiImageKey.trim() || undefined,
        geminiImageEnabled: newImageEnabled,
      });
      const updated = await api.admin.getAiConfig();
      setAiCfg(updated); setGeminiTextKey(""); setGeminiImageKey("");
      toast.success("Configurações do Aluka IA guardadas");
    } catch { toast.error("Falha ao guardar"); }
    finally { setAiSaving(false); }
  }

  async function testAiKey(type: "text" | "image") {
    const hasNewKey = type === "text" ? geminiTextKey.trim() : geminiImageKey.trim();
    if (hasNewKey) {
      setAiSaving(true);
      try {
        const newTextEnabled  = geminiTextEnabled  || (type === "text"  && !!geminiTextKey.trim());
        const newImageEnabled = geminiImageEnabled || (type === "image" && !!geminiImageKey.trim());
        if (newTextEnabled  !== geminiTextEnabled)  setGeminiTextEnabled(newTextEnabled);
        if (newImageEnabled !== geminiImageEnabled) setGeminiImageEnabled(newImageEnabled);
        await api.admin.saveAiConfig({
          geminiTextKey:     geminiTextKey.trim()  || undefined,
          geminiTextEnabled: newTextEnabled,
          geminiImageKey:    geminiImageKey.trim() || undefined,
          geminiImageEnabled: newImageEnabled,
        });
        const updated = await api.admin.getAiConfig();
        setAiCfg(updated); setGeminiTextKey(""); setGeminiImageKey("");
        toast.success("Chave guardada — a testar ligação…");
      } catch {
        toast.error("Falha ao guardar a chave");
        setAiSaving(false);
        return;
      } finally { setAiSaving(false); }
    }
    setAiTesting(type);
    if (type === "text") { setAiTextStatus("idle"); setAiTextMsg(""); }
    else { setAiImageStatus("idle"); setAiImageMsg(""); }
    try {
      await api.admin.testAiConfig(type);
      if (type === "text") {
        setAiTextStatus("ok");
        setAiTextMsg("Ligação bem-sucedida — chave válida.");
        if (!geminiTextEnabled) { setGeminiTextEnabled(true); await api.admin.saveAiConfig({ geminiTextEnabled: true }); }
      } else {
        setAiImageStatus("ok");
        setAiImageMsg("Ligação bem-sucedida — chave válida.");
        if (!geminiImageEnabled) { setGeminiImageEnabled(true); await api.admin.saveAiConfig({ geminiImageEnabled: true }); }
      }
    } catch (err: any) {
      let msg = err?.message ?? "Chave inválida ou sem permissões.";
      if (err?.status === 429 || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("429")) {
        msg = "Quota esgotada — a chave está válida mas sem créditos disponíveis. Aguarda o reset diário ou usa outra chave.";
      }
      if (type === "text") { setAiTextStatus("error"); setAiTextMsg(msg); }
      else                 { setAiImageStatus("error");setAiImageMsg(msg); }
    } finally { setAiTesting(null); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> Aluka IA
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configura os modelos Google Gemini para activar análise inteligente de trades e gráficos.
          Obtém a chave gratuitamente em{" "}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
            className="underline underline-offset-2 text-primary hover:opacity-80">
            aistudio.google.com
          </a>{" "}— 1 500 requests/dia grátis.
        </p>
      </div>

      {/* ── Modelo 1: Análise de Texto ── */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Gemini — Análise de Texto
            {aiCfg && (
              <Badge variant="outline" className={cn("ml-auto text-[10px] font-semibold",
                aiCfg.textConfigured ? "border-bull/40 text-bull bg-bull/5" : "border-border text-muted-foreground")}>
                {aiCfg.textConfigured ? "Chave configurada" : "Sem chave"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Analisa os dados de cada trade após ser fechado: entrada, saída, resultado e gestão de risco.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Activar análise de texto</p>
              <p className="text-[11px] text-muted-foreground">Feedback automático com IA após cada trade fechado</p>
            </div>
            <Switch checked={geminiTextEnabled} onCheckedChange={setGeminiTextEnabled} />
          </div>

          {aiCfg?.textConfigured && (
            <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2.5 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono text-xs text-muted-foreground tracking-widest flex-1 truncate">{aiCfg.textKeyPreview}</span>
              <span className="text-[10px] text-muted-foreground">chave actual</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="gemini-text-key">{aiCfg?.textConfigured ? "Substituir Gemini API Key (Texto)" : "Gemini API Key (Texto)"}</Label>
            <div className="relative max-w-sm">
              <Input id="gemini-text-key" type={showTextKey ? "text" : "password"}
                value={geminiTextKey} onChange={(e) => setGeminiTextKey(e.target.value)}
                placeholder="AIza..." className="pr-10 font-mono text-sm" autoComplete="off" spellCheck={false} />
              <button type="button" onClick={() => setShowTextKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                {showTextKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">Deixa em branco para manter a chave existente.</p>
          </div>

          {aiTextStatus !== "idle" && (
            <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
              aiTextStatus === "ok" ? "border-bull/40 bg-bull/5 text-bull" : "border-bear/40 bg-bear/5 text-bear")}>
              {aiTextStatus === "ok" ? <Wifi className="h-4 w-4 shrink-0" /> : <WifiOff className="h-4 w-4 shrink-0" />}
              <span>{aiTextMsg}</span>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={() => testAiKey("text")}
            disabled={aiTesting !== null || aiSaving || (!aiCfg?.textConfigured && !geminiTextKey.trim())}>
            {aiTesting === "text" || aiSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wifi className="mr-1.5 h-3.5 w-3.5" />}
            {aiTesting === "text" ? "A testar…" : aiSaving ? "A guardar…" : "Testar ligação"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Modelo 2: Análise de Imagem ── */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Image className="h-4 w-4 text-primary" />
            Gemini — Análise de Gráfico (Imagem)
            {aiCfg && (
              <Badge variant="outline" className={cn("ml-auto text-[10px] font-semibold",
                aiCfg.imageConfigured ? "border-bull/40 text-bull bg-bull/5" : "border-border text-muted-foreground")}>
                {aiCfg.imageConfigured ? "Chave configurada" : "Sem chave"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Analisa o screenshot do gráfico capturado pelo aluno. Identifica padrões, suportes e resistências.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Activar análise de imagem</p>
              <p className="text-[11px] text-muted-foreground">Análise visual do gráfico com um clique do aluno</p>
            </div>
            <Switch checked={geminiImageEnabled} onCheckedChange={setGeminiImageEnabled} />
          </div>

          {aiCfg?.imageConfigured && (
            <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2.5 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono text-xs text-muted-foreground tracking-widest flex-1 truncate">{aiCfg.imageKeyPreview}</span>
              <span className="text-[10px] text-muted-foreground">chave actual</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="gemini-image-key">{aiCfg?.imageConfigured ? "Substituir Gemini API Key (Imagem)" : "Gemini API Key (Imagem)"}</Label>
            <div className="relative max-w-sm">
              <Input id="gemini-image-key" type={showImageKey ? "text" : "password"}
                value={geminiImageKey} onChange={(e) => setGeminiImageKey(e.target.value)}
                placeholder="AIza..." className="pr-10 font-mono text-sm" autoComplete="off" spellCheck={false} />
              <button type="button" onClick={() => setShowImageKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                {showImageKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">Pode ser a mesma chave que a de texto. Deixa em branco para manter.</p>
          </div>

          {aiImageStatus !== "idle" && (
            <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
              aiImageStatus === "ok" ? "border-bull/40 bg-bull/5 text-bull" : "border-bear/40 bg-bear/5 text-bear")}>
              {aiImageStatus === "ok" ? <Wifi className="h-4 w-4 shrink-0" /> : <WifiOff className="h-4 w-4 shrink-0" />}
              <span>{aiImageMsg}</span>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={() => testAiKey("image")}
            disabled={aiTesting !== null || aiSaving || (!aiCfg?.imageConfigured && !geminiImageKey.trim())}>
            {aiTesting === "image" || aiSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wifi className="mr-1.5 h-3.5 w-3.5" />}
            {aiTesting === "image" ? "A testar…" : aiSaving ? "A guardar…" : "Testar ligação"}
          </Button>
        </CardContent>
      </Card>

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <Button onClick={saveAi} disabled={aiSaving}>
          {aiSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
          {aiSaving ? "A guardar…" : "Guardar configurações"}
        </Button>
      </div>

      {/* Info */}
      <Card className="border-border/40 bg-muted/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">O que o Aluka IA faz</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {[
              "Analisa cada trade após ser fechado — entrada, saída, risco e R:R (modelo de texto)",
              "Analisa o gráfico visualmente a partir do screenshot do aluno (modelo de imagem)",
              "Os dois modelos são independentes — podes activar um sem o outro",
              "Funciona 100% no servidor — as chaves nunca são enviadas ao browser",
              "Tier gratuito do Gemini: 1 500 requests/dia — suficiente para começar",
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <Brain className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================================================================
 * Users tab
 * ========================================================================= */
type AdminUser = Awaited<ReturnType<typeof api.admin.users>>[number];

const ROLE_META: Record<string, { label: string; color: string }> = {
  aluno:          { label: "Aluno",          color: "bg-muted text-muted-foreground" },
  professor:      { label: "Professor",      color: "bg-blue-500/15 text-blue-400" },
  administrador:  { label: "Administrador",  color: "bg-amber-500/15 text-amber-400" },
  master:         { label: "Master",         color: "bg-purple-500/15 text-purple-400" },
};

function RoleBadge({ role }: { role?: string }) {
  const meta = ROLE_META[role ?? "aluno"] ?? ROLE_META.aluno;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function UsersTab() {
  const [users, setUsers]     = useState<AdminUser[] | null>(null);
  const [filter, setFilter]   = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [editXp, setEditXp]   = useState<{ userId: string; current: number } | null>(null);
  const [newXp, setNewXp]     = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; email: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  async function reload() {
    setUsers(null);
    setUsers(await api.admin.users());
  }
  useEffect(() => { reload().catch(() => toast.error("Erro ao carregar usuários")); }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q),
    );
  }, [users, filter]);

  async function action(label: string, fn: () => Promise<unknown>, userId: string, confirmMsg: string): Promise<void> {
    if (!window.confirm(confirmMsg)) return;
    setBusy(userId + label);
    try { await fn(); toast.success(`${label} concluído`); await reload(); }
    catch (e) { toast.error(`Falha: ${String(e)}`); }
    finally { setBusy(null); }
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.admin.deleteUser(deleteConfirm.id);
      toast.success(`Aluno ${deleteConfirm.name || deleteConfirm.email} eliminado.`);
      setDeleteConfirm(null);
      await reload();
    } catch (e) { toast.error(`Falha ao eliminar: ${String(e)}`); }
    finally { setDeleting(false); }
  }

  async function saveXp() {
    if (!editXp) return;
    const val = Number(newXp);
    if (isNaN(val) || val < 0) { toast.error("XP inválido"); return; }
    setBusy("xp");
    try {
      await api.admin.adjustUserXp(editXp.userId, val);
      toast.success("XP actualizado");
      setEditXp(null);
      await reload();
    } catch (e) { toast.error(String(e)); }
    finally { setBusy(null); }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setChangingRole(userId);
    try {
      await api.admin.updateUserRole(userId, newRole);
      toast.success(`Role alterado para ${ROLE_META[newRole]?.label ?? newRole}`);
      await reload();
    } catch (e) { toast.error(`Falha ao alterar role: ${String(e)}`); }
    finally { setChangingRole(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Gestão de Alunos</h2>
          <p className="text-sm text-muted-foreground">{users?.length ?? 0} contas registadas</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Filtrar por nome ou e-mail…" value={filter}
            onChange={(e) => setFilter(e.target.value)} className="pl-7" />
        </div>
      </div>

      {editXp && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex items-end gap-3 p-4">
            <div className="flex-1">
              <Label className="text-xs">Novo XP para o aluno</Label>
              <Input type="number" value={newXp} onChange={(e) => setNewXp(e.target.value)}
                placeholder={String(editXp.current)} className="mt-1 w-40" />
            </div>
            <Button onClick={saveXp} disabled={busy === "xp"} size="sm">
              <Save className="mr-1.5 h-3.5 w-3.5" /> Salvar XP
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditXp(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizador</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">XP</TableHead>
                <TableHead className="text-right">Lições</TableHead>
                <TableHead className="text-right">Streak</TableHead>
                <TableHead className="text-right">Saldo sim.</TableHead>
                <TableHead>Última actividade</TableHead>
                <TableHead className="text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!users && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">A carregar...</TableCell></TableRow>
              )}
              {users && filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum utilizador encontrado.</TableCell></TableRow>
              )}
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <RoleBadge role={u.role} />
                      <select
                        value={u.role ?? "aluno"}
                        disabled={changingRole === u.id || u.role === "master"}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="h-6 rounded border border-border bg-background px-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
                        title={u.role === "master" ? "Role Master não pode ser alterado aqui" : "Mudar role"}
                      >
                        <option value="aluno">Aluno</option>
                        <option value="professor">Professor</option>
                        <option value="administrador">Administrador</option>
                      </select>
                      {changingRole === u.id && <span className="text-[10px] text-muted-foreground">…</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{u.xp}</TableCell>
                  <TableCell className="text-right font-mono">{u.completedLessons}</TableCell>
                  <TableCell className="text-right font-mono">{u.streakDays}d</TableCell>
                  <TableCell className="text-right font-mono">{fmtUsd(u.simCashBalance)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.lastActivityDay ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" title="Editar XP"
                        onClick={() => { setEditXp({ userId: u.id, current: u.xp }); setNewXp(String(u.xp)); }}>
                        <Coins className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Resetar progresso"
                        disabled={busy === u.id + "Reset progresso"}
                        onClick={() => action("Reset progresso", () => api.admin.resetUserProgress(u.id), u.id,
                          `Resetar todo o progresso de ${u.email}?`)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Resetar simulador"
                        disabled={busy === u.id + "Reset simulador"}
                        onClick={() => action("Reset simulador", () => api.admin.resetUserSim(u.id), u.id,
                          `Apagar todos os trades de ${u.email}?`)}>
                        <LineChartIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                        title="Excluir utilizador" disabled={deleting && deleteConfirm?.id === u.id}
                        onClick={() => setDeleteConfirm({ id: u.id, name: u.name ?? "", email: u.email ?? "" })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Modal de confirmação de eliminação ─────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-destructive/40 bg-background shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            {/* Fechar */}
            <button
              onClick={() => !deleting && setDeleteConfirm(null)}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors disabled:opacity-50"
              disabled={deleting}
              aria-label="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
              {/* Ícone de aviso */}
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/20">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold tracking-tight">Eliminar aluno definitivamente?</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Estás prestes a eliminar a conta de:
                </p>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2 mt-2">
                  <p className="font-semibold text-foreground">{deleteConfirm.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{deleteConfirm.email}</p>
                </div>
              </div>

              {/* Aviso */}
              <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-left">
                <p className="text-xs text-amber-400 font-semibold mb-1">⚠ Esta acção é irreversível</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Serão eliminados permanentemente: conta, progresso, trades, subscrição e todos os dados associados a este aluno.
                </p>
              </div>

              {/* Botões */}
              <div className="flex w-full gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />A eliminar...</>
                  ) : (
                    <><Trash2 className="mr-1.5 h-3.5 w-3.5" />Sim, eliminar</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * Curriculum tab
 * ========================================================================= */
type LessonOverride = { title?: string; summary?: string; xp?: number; hidden?: boolean; audioUrl?: string; audioEnabled?: boolean };

type DbLesson = {
  id: string; levelId: number; title: string; summary: string;
  xp: number; content: unknown[]; questions: unknown[]; sortOrder: number;
};
type DbLevel = {
  id: number; title: string; subtitle: string; difficulty: string; sortOrder: number;
  lessons: DbLesson[];
};
type LessonDraft = {
  id: string; levelId: number; title: string; summary: string; xp: number;
  contentJson: string; questionsJson: string;
  audioUrl: string; audioEnabled: boolean; hidden: boolean;
};
const DIFF_OPTIONS = [
  { value: "iniciante",     label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado",      label: "Avançado" },
] as const;

function CurriculumTab() {
  const [levels,    setLevels]   = useState<DbLevel[]>([]);
  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [loaded,    setLoaded]   = useState(false);
  const [expanded,  setExpanded] = useState<number | null>(null);

  const [levelDialog,  setLevelDialog]  = useState(false);
  const [levelIsNew,   setLevelIsNew]   = useState(true);
  const [levelDraft,   setLevelDraft]   = useState({ id: 0, title: "", subtitle: "", difficulty: "iniciante" });
  const [levelSaving,  setLevelSaving]  = useState(false);

  const [lessonDialog,  setLessonDialog]  = useState(false);
  const [lessonIsNew,   setLessonIsNew]   = useState(true);
  const [lessonDraft,   setLessonDraft]   = useState<LessonDraft>({ id: "", levelId: 0, title: "", summary: "", xp: 20, contentJson: "[]", questionsJson: "[]", audioUrl: "", audioEnabled: false, hidden: false });
  const [lessonSaving,  setLessonSaving]  = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);

  async function loadData() {
    try {
      const [data, ov] = await Promise.all([
        api.admin.getCurriculumDb(),
        api.admin.getCurriculumOverride(),
      ]);
      setOverrides((ov.value?.lessons as Record<string, any>) ?? {});
      setLevels(data as DbLevel[]);
      setLoaded(true);
    } catch { toast.error("Erro ao carregar trilha"); setLoaded(true); }
  }

  useEffect(() => { loadData(); }, []);

  function openNewLevel() {
    setLevelDraft({ id: 0, title: "", subtitle: "", difficulty: "iniciante" });
    setLevelIsNew(true);
    setLevelDialog(true);
  }
  function openEditLevel(lv: DbLevel) {
    setLevelDraft({ id: lv.id, title: lv.title, subtitle: lv.subtitle, difficulty: lv.difficulty });
    setLevelIsNew(false);
    setLevelDialog(true);
  }
  async function saveLevel() {
    if (!levelDraft.title.trim()) return;
    setLevelSaving(true);
    try {
      if (levelIsNew) {
        await api.admin.createCurriculumLevel({ title: levelDraft.title, subtitle: levelDraft.subtitle, difficulty: levelDraft.difficulty });
        toast.success("Nível criado");
      } else {
        await api.admin.updateCurriculumLevel(levelDraft.id, { title: levelDraft.title, subtitle: levelDraft.subtitle, difficulty: levelDraft.difficulty });
        toast.success("Nível actualizado");
      }
      await loadData();
      setLevelDialog(false);
    } catch { toast.error("Erro ao salvar nível"); }
    finally { setLevelSaving(false); }
  }
  async function deleteLevel(id: number) {
    if (!confirm("Apagar este nível e TODAS as suas lições? Esta acção é irreversível.")) return;
    try {
      await api.admin.deleteCurriculumLevel(id);
      await loadData();
      toast.success("Nível apagado");
    } catch { toast.error("Erro ao apagar nível"); }
  }

  function openNewLesson(levelId: number) {
    setLessonDraft({ id: "", levelId, title: "", summary: "", xp: 20, contentJson: "[]", questionsJson: "[]", audioUrl: "", audioEnabled: false, hidden: false });
    setLessonIsNew(true);
    setLessonDialog(true);
  }
  function openEditLesson(ls: DbLesson) {
    const ov = overrides[ls.id] ?? {};
    setLessonDraft({
      id: ls.id, levelId: ls.levelId,
      title: ls.title, summary: ls.summary, xp: ls.xp,
      contentJson:   JSON.stringify(ls.content,   null, 2),
      questionsJson: JSON.stringify(ls.questions, null, 2),
      audioUrl:     ov.audioUrl     ?? "",
      audioEnabled: ov.audioEnabled ?? false,
      hidden:       ov.hidden       ?? false,
    });
    setLessonIsNew(false);
    setLessonDialog(true);
  }
  async function saveLesson() {
    if (!lessonDraft.title.trim()) return;
    setLessonSaving(true);
    try {
      let content: unknown[] = [];
      let questions: unknown[] = [];
      try { content   = JSON.parse(lessonDraft.contentJson);   } catch { toast.error("Conteúdo JSON inválido"); setLessonSaving(false); return; }
      try { questions = JSON.parse(lessonDraft.questionsJson); } catch { toast.error("Perguntas JSON inválido"); setLessonSaving(false); return; }

      if (lessonIsNew) {
        const created = await api.admin.createCurriculumLesson({ levelId: lessonDraft.levelId, title: lessonDraft.title, summary: lessonDraft.summary, xp: lessonDraft.xp, content, questions });
        if (lessonDraft.audioUrl && created?.id) {
          const newOverrides = { ...overrides };
          newOverrides[created.id] = { audioUrl: lessonDraft.audioUrl, audioEnabled: lessonDraft.audioEnabled };
          await api.admin.saveCurriculumOverride({ lessons: newOverrides });
          setOverrides(newOverrides);
        }
      } else {
        await api.admin.updateCurriculumLesson(lessonDraft.id, { title: lessonDraft.title, summary: lessonDraft.summary, xp: lessonDraft.xp, content, questions });
        const newOverrides = { ...overrides };
        const patch: Record<string, unknown> = {};
        if (lessonDraft.audioUrl) { patch.audioUrl = lessonDraft.audioUrl; patch.audioEnabled = lessonDraft.audioEnabled; }
        if (lessonDraft.hidden) patch.hidden = true;
        if (Object.keys(patch).length > 0) newOverrides[lessonDraft.id] = patch;
        else delete newOverrides[lessonDraft.id];
        await api.admin.saveCurriculumOverride({ lessons: newOverrides });
        setOverrides(newOverrides);
      }

      await loadData();
      toast.success(lessonIsNew ? "Lição criada" : "Lição actualizada");
      setLessonDialog(false);
    } catch { toast.error("Erro ao salvar lição"); }
    finally { setLessonSaving(false); }
  }
  async function deleteLesson(id: string) {
    if (!confirm("Apagar esta lição?")) return;
    try {
      await api.admin.deleteCurriculumLesson(id);
      const newOverrides = { ...overrides };
      delete newOverrides[id];
      await api.admin.saveCurriculumOverride({ lessons: newOverrides });
      setOverrides(newOverrides);
      await loadData();
      toast.success("Lição apagada");
    } catch { toast.error("Erro ao apagar lição"); }
  }

  function handleAudioUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ficheiro demasiado grande. Máximo 5 MB."); return; }
    setAudioUploading(true);
    const reader = new FileReader();
    reader.onload  = () => { setLessonDraft((d) => ({ ...d, audioUrl: reader.result as string, audioEnabled: true })); setAudioUploading(false); };
    reader.onerror = () => setAudioUploading(false);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const diffLabel = (d: string) => DIFF_OPTIONS.find((x) => x.value === d)?.label ?? d;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Trilha de Aprendizado</h2>
          <p className="text-sm text-muted-foreground">Cria e edita níveis e lições directamente na base de dados.</p>
        </div>
        <Button onClick={openNewLevel}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo Nível
        </Button>
      </div>

      {!loaded && <p className="text-sm text-muted-foreground">A carregar...</p>}

      <div className="space-y-3">
        {loaded && levels.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-muted-foreground">
              <GraduationCap className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium">Nenhum nível criado ainda.</p>
              <p className="text-sm mt-1">Clica em "Novo Nível" para começar a construir a trilha.</p>
            </CardContent>
          </Card>
        )}

        {levels.map((lv) => (
          <Card key={lv.id} className="border-border/60">
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => setExpanded(expanded === lv.id ? null : lv.id)}
                className="flex flex-1 items-center gap-3 min-w-0 text-left"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                  {lv.id}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{lv.title}</span>
                    <Badge variant="outline" className="text-[10px]">{diffLabel(lv.difficulty)}</Badge>
                    <span className="text-xs text-muted-foreground">{lv.lessons.length} lição(ões)</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{lv.subtitle}</p>
                </div>
                {expanded === lv.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>
              <div className="flex shrink-0 items-center gap-1 ml-2">
                <Button size="sm" variant="outline" onClick={() => openNewLesson(lv.id)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Nova Lição
                </Button>
                <Button size="sm" variant="ghost" title="Editar nível" onClick={() => openEditLevel(lv)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" title="Apagar nível" onClick={() => deleteLevel(lv.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {expanded === lv.id && (
              <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-1.5">
                {lv.lessons.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 text-center">Nenhuma lição neste nível ainda. Clica em "Nova Lição".</p>
                )}
                {lv.lessons.map((ls) => {
                  const ov = overrides[ls.id] ?? {};
                  return (
                    <div key={ls.id} className="flex items-center gap-2 rounded-lg border border-border/40 bg-surface-1/50 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{ls.title}</span>
                          <Badge variant="outline" className="text-[10px]">{ls.xp} XP</Badge>
                          {ov.hidden    && <Badge variant="destructive" className="text-[10px]">Oculta</Badge>}
                          {ov.audioUrl  && <Badge className="text-[10px] bg-emerald-500/20 text-emerald-600"><Headphones className="mr-1 h-2.5 w-2.5" />Áudio</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{ls.summary}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" title="Editar lição" onClick={() => openEditLesson(ls)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" title="Apagar lição" onClick={() => deleteLesson(ls.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* ── Level dialog ──────────────────────────────────────────────────── */}
      {levelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{levelIsNew ? "Novo Nível" : "Editar Nível"}</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setLevelDialog(false)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={levelDraft.title} onChange={(e) => setLevelDraft((d) => ({ ...d, title: e.target.value }))} placeholder="ex: Conceitos Básicos" />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input value={levelDraft.subtitle} onChange={(e) => setLevelDraft((d) => ({ ...d, subtitle: e.target.value }))} placeholder="ex: Fundamentos do mercado financeiro" />
              </div>
              <div>
                <Label>Dificuldade</Label>
                <Select value={levelDraft.difficulty} onValueChange={(v) => setLevelDraft((d) => ({ ...d, difficulty: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFF_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 pt-0">
              <Button variant="ghost" onClick={() => setLevelDialog(false)}>Cancelar</Button>
              <Button onClick={saveLevel} disabled={levelSaving || !levelDraft.title.trim()}>
                {levelSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                Salvar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Lesson dialog ─────────────────────────────────────────────────── */}
      {lessonDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <CardHeader className="shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>{lessonIsNew ? "Nova Lição" : "Editar Lição"}</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setLessonDialog(false)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto flex-1 pb-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Título</Label>
                  <Input value={lessonDraft.title} onChange={(e) => setLessonDraft((d) => ({ ...d, title: e.target.value }))} placeholder="ex: O que é trading?" />
                </div>
                <div className="col-span-2">
                  <Label>Resumo</Label>
                  <Textarea rows={2} value={lessonDraft.summary} onChange={(e) => setLessonDraft((d) => ({ ...d, summary: e.target.value }))} placeholder="Breve descrição do que o aluno vai aprender" />
                </div>
                <div>
                  <Label>XP</Label>
                  <Input type="number" min={0} value={lessonDraft.xp} onChange={(e) => setLessonDraft((d) => ({ ...d, xp: Number(e.target.value) }))} />
                </div>
              </div>

              <div>
                <Label className="flex items-center justify-between mb-1">
                  <span>Conteúdo (JSON)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">tipos: text (title+body) · tip (body) · example (title+body)</span>
                </Label>
                <Textarea
                  rows={8} className="font-mono text-xs"
                  value={lessonDraft.contentJson}
                  onChange={(e) => setLessonDraft((d) => ({ ...d, contentJson: e.target.value }))}
                  placeholder={`[\n  { "type": "text", "title": "Título", "body": "Texto..." },\n  { "type": "tip", "body": "Dica..." },\n  { "type": "example", "title": "Exemplo", "body": "..." }\n]`}
                />
              </div>

              <div>
                <Label className="flex items-center justify-between mb-1">
                  <span>Perguntas (JSON)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">tipos: multiple · truefalse</span>
                </Label>
                <Textarea
                  rows={8} className="font-mono text-xs"
                  value={lessonDraft.questionsJson}
                  onChange={(e) => setLessonDraft((d) => ({ ...d, questionsJson: e.target.value }))}
                  placeholder={`[\n  {\n    "type": "multiple",\n    "prompt": "Pergunta?",\n    "options": ["A","B","C","D"],\n    "correctIndex": 0,\n    "explanation": "Porque..."\n  }\n]`}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Headphones className="h-3.5 w-3.5" /> Áudio (mp3/wav · máx. 5 MB)
                </Label>
                {lessonDraft.audioUrl ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface-1 p-2">
                    <Volume2 className="h-4 w-4 text-primary shrink-0" />
                    <audio src={lessonDraft.audioUrl} controls className="h-8 flex-1 min-w-0" />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setLessonDraft((d) => ({ ...d, audioUrl: "", audioEnabled: false }))}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label className={cn("flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/60 p-3 transition-colors", audioUploading ? "opacity-50 pointer-events-none" : "hover:border-primary/40 hover:bg-surface-2")}>
                    {audioUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-xs text-muted-foreground">{audioUploading ? "A processar..." : "Clica para fazer upload de áudio"}</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                  </label>
                )}
                {lessonDraft.audioUrl && (
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={lessonDraft.audioEnabled} onChange={(e) => setLessonDraft((d) => ({ ...d, audioEnabled: e.target.checked }))} />
                    Mostrar player de áudio aos alunos
                  </label>
                )}
              </div>

              {!lessonIsNew && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={lessonDraft.hidden} onChange={(e) => setLessonDraft((d) => ({ ...d, hidden: e.target.checked }))} />
                  Ocultar esta lição para os alunos
                </label>
              )}
            </CardContent>
            <div className="flex justify-end gap-2 p-4 pt-2 shrink-0 border-t border-border/40">
              <Button variant="ghost" onClick={() => setLessonDialog(false)}>Cancelar</Button>
              <Button onClick={saveLesson} disabled={lessonSaving || !lessonDraft.title.trim()}>
                {lessonSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                Salvar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * Strategies tab
 * ========================================================================= */
const DIFFICULTIES = ["Iniciante", "Intermediário", "Avançado"] as const;
const RISK_LEVELS: RiskLevel[] = ["Baixo", "Médio", "Alto"];

const BLANK_STRATEGY: Omit<Strategy, "id"> = {
  name: "", subtitle: "", icon: "TrendingUp",
  timeframes: [], markets: [], riskLevel: "Médio", winRate: "", riskReward: "",
  difficulty: "Iniciante", description: "", howItWorks: "",
  setup: [], entrySignals: [], exitSignals: [], riskManagement: [], pros: [], cons: [],
  example: "", tags: [],
};

function StrategiesTab() {
  const [extra, setExtra]     = useState<Strategy[]>([]);
  const [loaded, setLoaded]   = useState(false);
  const [editing, setEditing] = useState<Strategy | null>(null);
  const [isNew, setIsNew]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const allStatic             = STRATEGIES;

  useEffect(() => {
    api.admin.getStrategies()
      .then((r) => { setExtra(r as Strategy[]); setLoaded(true); })
      .catch(() => { toast.error("Erro ao carregar estratégias"); setLoaded(true); });
  }, []);

  async function save(updated: Strategy[]) {
    setSaving(true);
    try {
      await api.admin.saveStrategies(updated);
      setExtra(updated);
      toast.success("Estratégias salvas");
      setEditing(null);
    } catch { toast.error("Falha ao salvar"); }
    finally { setSaving(false); }
  }

  function openNew() {
    setEditing({ id: uid(), ...BLANK_STRATEGY } as Strategy);
    setIsNew(true);
  }

  function openEdit(s: Strategy) { setEditing({ ...s }); setIsNew(false); }

  function commitEdit() {
    if (!editing) return;
    const updated = isNew
      ? [...extra, editing]
      : extra.map((s) => s.id === editing.id ? editing : s);
    save(updated);
  }

  function deleteExtra(id: string) {
    if (!window.confirm("Excluir esta estratégia?")) return;
    save(extra.filter((s) => s.id !== id));
  }

  function listField(val: string[], onChange: (v: string[]) => void, label: string) {
    return (
      <div>
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Textarea rows={3}
          value={val.join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))}
          placeholder="Uma item por linha"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Estratégias</h2>
          <p className="text-sm text-muted-foreground">
            {allStatic.length} estratégias base · {extra.length} adicionadas pelo administrador
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Nova estratégia
        </Button>
      </div>

      {editing && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isNew ? "Nova estratégia" : `Editar: ${editing.name}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Subtítulo</Label>
                <Input value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Dificuldade</Label>
                <Select value={editing.difficulty} onValueChange={(v) => setEditing({ ...editing, difficulty: v as Strategy["difficulty"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nível de risco</Label>
                <Select value={editing.riskLevel} onValueChange={(v) => setEditing({ ...editing, riskLevel: v as RiskLevel })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_LEVELS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Win Rate</Label>
                <Input value={editing.winRate} placeholder="ex: 45-55%" onChange={(e) => setEditing({ ...editing, winRate: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Risco:Retorno</Label>
                <Input value={editing.riskReward} placeholder="ex: 1:2" onChange={(e) => setEditing({ ...editing, riskReward: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Mercados (separados por vírgula)</Label>
                <Input value={editing.markets.join(", ")} onChange={(e) =>
                  setEditing({ ...editing, markets: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Timeframes (separados por vírgula)</Label>
                <Input value={editing.timeframes.join(", ")} onChange={(e) =>
                  setEditing({ ...editing, timeframes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Como funciona</Label>
                <Textarea rows={3} value={editing.howItWorks} onChange={(e) => setEditing({ ...editing, howItWorks: e.target.value })} />
              </div>
              {listField(editing.setup, (v) => setEditing({ ...editing, setup: v }), "Configuração (uma linha por item)")}
              {listField(editing.entrySignals, (v) => setEditing({ ...editing, entrySignals: v }), "Sinais de entrada")}
              {listField(editing.exitSignals, (v) => setEditing({ ...editing, exitSignals: v }), "Sinais de saída")}
              {listField(editing.riskManagement, (v) => setEditing({ ...editing, riskManagement: v }), "Gestão de risco")}
              {listField(editing.pros, (v) => setEditing({ ...editing, pros: v }), "Vantagens (pros)")}
              {listField(editing.cons, (v) => setEditing({ ...editing, cons: v }), "Desvantagens (cons)")}
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Exemplo prático</Label>
                <Textarea rows={3} value={editing.example} onChange={(e) => setEditing({ ...editing, example: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Tags (separadas por vírgula)</Label>
                <Input value={editing.tags.join(", ")} onChange={(e) =>
                  setEditing({ ...editing, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={commitEdit} disabled={saving || !editing.name}>
                <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar estratégia"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {allStatic.map((s) => (
          <Card key={s.id} className="border-border/40 opacity-70">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{s.name}</span>
                  <Badge variant="outline" className="text-[10px]">Base</Badge>
                  <Badge variant="secondary" className="text-[10px]">{s.difficulty}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {loaded && extra.map((s) => (
          <Card key={s.id} className="border-primary/40">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{s.name}</span>
                  <Badge className="text-[10px] bg-primary/20 text-primary">Admin</Badge>
                  <Badge variant="secondary" className="text-[10px]">{s.difficulty}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.subtitle}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                  onClick={() => deleteExtra(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
 * Books tab
 * ========================================================================= */
const BLANK_BOOK: Omit<BookMeta, "id"> = {
  order: 99, title: "", author: "ALUKA", cover: "BookOpen",
  category: "Geral", description: "", pages: 50, content: "",
};

function BooksTab() {
  const [extra, setExtra]     = useState<BookMeta[]>([]);
  const [loaded, setLoaded]   = useState(false);
  const [editing, setEditing] = useState<BookMeta | null>(null);
  const [isNew, setIsNew]     = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    api.admin.getBooks()
      .then((r) => { setExtra(r as BookMeta[]); setLoaded(true); })
      .catch(() => { toast.error("Erro ao carregar livros"); setLoaded(true); });
  }, []);

  async function save(updated: BookMeta[]) {
    setSaving(true);
    try {
      await api.admin.saveBooks(updated);
      setExtra(updated);
      toast.success("Biblioteca actualizada");
      setEditing(null);
    } catch { toast.error("Falha ao salvar"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Biblioteca</h2>
          <p className="text-sm text-muted-foreground">
            {BOOKS_CATALOG.length} livros base · {extra.length} adicionados pelo administrador
          </p>
        </div>
        <Button onClick={() => { setEditing({ id: uid(), ...BLANK_BOOK } as BookMeta); setIsNew(true); }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo livro
        </Button>
      </div>

      {editing && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isNew ? "Novo livro" : `Editar: ${editing.title}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Título</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Autor</Label>
                <Input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Páginas estimadas</Label>
                <Input type="number" value={editing.pages} onChange={(e) => setEditing({ ...editing, pages: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Conteúdo HTML (corpo do livro)</Label>
                <Textarea rows={8} value={editing.content ?? ""} placeholder="<h1>Título</h1><p>Parágrafo...</p>"
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })} className="font-mono text-xs" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => {
                if (!editing) return;
                const updated = isNew ? [...extra, editing] : extra.map((b) => b.id === editing.id ? editing : b);
                save(updated);
              }} disabled={saving || !editing.title}>
                <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar livro"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {BOOKS_CATALOG.map((b) => (
          <Card key={b.id} className="border-border/40 opacity-70">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2"><BookMarked className="h-4 w-4 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm leading-tight">{b.title}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">Base</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.author} · {b.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {loaded && extra.map((b) => (
          <Card key={b.id} className="border-primary/40">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2"><BookMarked className="h-4 w-4 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm leading-tight">{b.title}</span>
                    <Badge className="text-[10px] bg-primary/20 text-primary shrink-0">Admin</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.author} · {b.category}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing({ ...b }); setIsNew(false); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                    onClick={() => { if (window.confirm("Excluir este livro?")) save(extra.filter((x) => x.id !== b.id)); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
 * Glossary tab
 * ========================================================================= */
const GLOSSARY_CATS: GlossaryCategory[] = [
  "Análise Técnica", "Gestão de Risco", "Tipos de Ordem", "Mercados",
  "Indicadores", "Psicologia", "Derivativos", "Geral",
];

const BLANK_TERM: GlossaryTerm = { term: "", definition: "", category: "Geral" };

function GlossaryTab() {
  const [extra, setExtra]     = useState<GlossaryTerm[]>([]);
  const [loaded, setLoaded]   = useState(false);
  const [editing, setEditing] = useState<(GlossaryTerm & { _idx?: number }) | null>(null);
  const [isNew, setIsNew]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [filter, setFilter]   = useState("");

  useEffect(() => {
    api.admin.getGlossary()
      .then((r) => { setExtra(r as GlossaryTerm[]); setLoaded(true); })
      .catch(() => { toast.error("Erro ao carregar glossário"); setLoaded(true); });
  }, []);

  async function save(updated: GlossaryTerm[]) {
    setSaving(true);
    try {
      await api.admin.saveGlossary(updated);
      setExtra(updated);
      toast.success("Glossário actualizado");
      setEditing(null);
    } catch { toast.error("Falha ao salvar"); }
    finally { setSaving(false); }
  }

  const filteredExtra = filter
    ? extra.filter((t) => t.term.toLowerCase().includes(filter.toLowerCase()) || t.definition.toLowerCase().includes(filter.toLowerCase()))
    : extra;

  const filteredStatic = filter
    ? GLOSSARY.filter((t) => t.term.toLowerCase().includes(filter.toLowerCase())).slice(0, 20)
    : GLOSSARY.slice(0, 30);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Glossário</h2>
          <p className="text-sm text-muted-foreground">
            {GLOSSARY.length} termos base · {extra.length} adicionados pelo administrador
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Pesquisar..." value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-7 w-44" />
          </div>
          <Button onClick={() => { setEditing({ ...BLANK_TERM }); setIsNew(true); }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo termo
          </Button>
        </div>
      </div>

      {editing && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2"><CardTitle className="text-base">{isNew ? "Novo termo" : `Editar: ${editing.term}`}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Termo</Label>
                <Input value={editing.term} onChange={(e) => setEditing({ ...editing, term: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as GlossaryCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GLOSSARY_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Definição</Label>
                <Textarea rows={3} value={editing.definition} onChange={(e) => setEditing({ ...editing, definition: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => {
                if (!editing) return;
                const { _idx, ...term } = editing;
                const updated = isNew
                  ? [...extra, term]
                  : extra.map((t, i) => i === _idx ? term : t);
                save(updated);
              }} disabled={saving || !editing.term}>
                <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loaded && filteredExtra.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-primary">Termos adicionados pelo administrador</h3>
          <Card className="border-primary/30">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Termo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Definição</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredExtra.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium whitespace-nowrap">{t.term}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px]", CATEGORY_COLORS[t.category])}>{t.category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{t.definition}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="ghost"
                            onClick={() => { setEditing({ ...t, _idx: extra.indexOf(t) }); setIsNew(false); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                            onClick={() => { if (window.confirm("Excluir este termo?")) save(extra.filter((_, idx) => idx !== extra.indexOf(t))); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
          Termos base {filter && `(${filteredStatic.length} resultados)`}
          {!filter && <span className="font-normal"> — exibindo {filteredStatic.length} de {GLOSSARY.length}</span>}
        </h3>
        <Card className="border-border/40 opacity-70">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Termo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Definição</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredStatic.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium whitespace-nowrap">{t.term}</TableCell>
                    <TableCell><Badge className={cn("text-[10px]", CATEGORY_COLORS[t.category])}>{t.category}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{t.definition}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* =========================================================================
 * Resources tab
 * ========================================================================= */
interface AdminResource {
  id: string;
  sectionId: string;
  name: string;
  description: string;
  url?: string;
  badge?: string;
  stars?: number;
  tags?: string[];
}

const RESOURCE_SECTIONS = [
  { id: "brokers",   label: "Corretoras" },
  { id: "platforms", label: "Plataformas" },
  { id: "education", label: "Educação" },
  { id: "tools",     label: "Ferramentas" },
  { id: "youtube",   label: "YouTube" },
  { id: "other",     label: "Outros" },
];

const BLANK_RESOURCE: Omit<AdminResource, "id"> = {
  sectionId: "other", name: "", description: "", url: "", badge: "", stars: 4, tags: [],
};

function ResourcesTab() {
  const [extra, setExtra]     = useState<AdminResource[]>([]);
  const [loaded, setLoaded]   = useState(false);
  const [editing, setEditing] = useState<AdminResource | null>(null);
  const [isNew, setIsNew]     = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    api.admin.getResources()
      .then((r) => { setExtra(r as AdminResource[]); setLoaded(true); })
      .catch(() => { toast.error("Erro ao carregar recursos"); setLoaded(true); });
  }, []);

  async function save(updated: AdminResource[]) {
    setSaving(true);
    try {
      await api.admin.saveResources(updated);
      setExtra(updated);
      toast.success("Recursos actualizados");
      setEditing(null);
    } catch { toast.error("Falha ao salvar"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Recursos</h2>
          <p className="text-sm text-muted-foreground">{extra.length} recursos adicionados pelo administrador</p>
        </div>
        <Button onClick={() => { setEditing({ id: uid(), ...BLANK_RESOURCE }); setIsNew(true); }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo recurso
        </Button>
      </div>

      {editing && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isNew ? "Novo recurso" : `Editar: ${editing.name}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Secção</Label>
                <Select value={editing.sectionId} onValueChange={(v) => setEditing({ ...editing, sectionId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RESOURCE_SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">URL (opcional)</Label>
                <Input value={editing.url ?? ""} placeholder="https://..." onChange={(e) => setEditing({ ...editing, url: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Badge (ex: Brasil, Global, Cripto)</Label>
                <Input value={editing.badge ?? ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Estrelas (1-5)</Label>
                <Input type="number" min={1} max={5} value={editing.stars ?? 4}
                  onChange={(e) => setEditing({ ...editing, stars: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tags (separadas por vírgula)</Label>
                <Input value={(editing.tags ?? []).join(", ")} onChange={(e) =>
                  setEditing({ ...editing, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => {
                if (!editing) return;
                const updated = isNew ? [...extra, editing] : extra.map((r) => r.id === editing.id ? editing : r);
                save(updated);
              }} disabled={saving || !editing.name}>
                <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar recurso"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loaded && extra.length === 0 && !editing && (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Library className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum recurso adicionado ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Novo recurso" para adicionar corretoras, plataformas, canais, etc.</p>
          </CardContent>
        </Card>
      )}

      {RESOURCE_SECTIONS.filter((s) => extra.some((r) => r.sectionId === s.id)).map((section) => (
        <div key={section.id}>
          <h3 className="text-sm font-semibold mb-2">{section.label}</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {extra.filter((r) => r.sectionId === section.id).map((r) => (
              <Card key={r.id} className="border-primary/40">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{r.name}</span>
                        {r.badge && <Badge variant="outline" className="text-[10px]">{r.badge}</Badge>}
                        {r.stars && (
                          <span className="text-[10px] text-yellow-400">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-primary flex items-center gap-0.5 mt-1 hover:underline">
                          <ExternalLink className="h-2.5 w-2.5" /> {r.url}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing({ ...r }); setIsNew(false); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                        onClick={() => { if (window.confirm("Excluir este recurso?")) save(extra.filter((x) => x.id !== r.id)); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================================
 * Simulator tab
 * ========================================================================= */
function SimulatorTab() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.admin.simulator>> | null>(null);
  useEffect(() => { api.admin.simulator().then(setData).catch(() => toast.error("Erro ao carregar simulador")); }, []);
  if (!data) return <p className="text-sm text-muted-foreground p-4">A carregar...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Monitor do Simulador</h2>
        <p className="text-sm text-muted-foreground">Leaderboard e trades recentes de todos os alunos.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-warning" /> Leaderboard — Top P&L
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>#</TableHead><TableHead>Aluno</TableHead>
                <TableHead className="text-right">Trades</TableHead>
                <TableHead className="text-right">P&L</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.leaderboard.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sem trades ainda.</TableCell></TableRow>
                )}
                {data.leaderboard.map((r, i) => (
                  <TableRow key={r.userId}>
                    <TableCell className="font-mono">{i + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.trades}</TableCell>
                    <TableCell className={cn("text-right font-mono", r.pnl >= 0 ? "text-bull" : "text-bear")}>{fmtUsd(r.pnl)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" /> Trades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Símbolo</TableHead><TableHead>Lado</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead>Motivo</TableHead><TableHead>Fechado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.recent.map((t) => {
                  const tt = t as Record<string, unknown>;
                  const pnl = Number(tt.pnl ?? 0);
                  return (
                    <TableRow key={String(tt.id)}>
                      <TableCell className="font-mono text-xs">{String(tt.symbol)}</TableCell>
                      <TableCell>
                        <Badge variant={tt.side === "buy" ? "default" : "secondary"} className="text-[10px]">{String(tt.side)}</Badge>
                      </TableCell>
                      <TableCell className={cn("text-right font-mono", pnl >= 0 ? "text-bull" : "text-bear")}>{fmtUsd(pnl)}</TableCell>
                      <TableCell className="text-xs">
                        {tt.reason === "liquidation"
                          ? <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" /> liq.</span>
                          : String(tt.reason)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(Number(tt.closedAt))}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* =========================================================================
 * Videos admin tab
 * ========================================================================= */
const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Análise Técnica":       TrendingUp,
  "Análise de Velas":      BarChart3,
  "Price Action":          Activity,
  "Gestão de Risco":       Shield,
  "Psicologia de Trading": Brain,
  "Macroeconomia":         Globe,
  "Forex":                 ArrowLeftRight,
  "Criptomoedas":          Coins,
  "Acções & Índices":      Building2,
  "Fundamentos":           BookOpen,
  "Geral":                 Video,
};
function CatIcon({ cat, className }: { cat: string; className?: string }) {
  const Icon = (CAT_ICONS[cat] ?? Video) as React.ComponentType<{ className?: string }>;
  return <Icon className={cn("h-4 w-4 shrink-0", className)} />;
}

const VIDEO_LEVELS: VideoLesson["level"][] = ["Iniciante", "Intermediário", "Avançado"];

const BLANK_VIDEO: Omit<VideoLesson, "id"> = {
  creator: "", title: "", level: "Iniciante", category: "Geral", tags: [],
  videoUrl: "", description: "", requiredXp: undefined, order: 99, duration: "",
};

function VideosTab() {
  const [videos, setVideos]   = useState<VideoLesson[]>([]);
  const [loaded, setLoaded]   = useState(false);
  const [editing, setEditing] = useState<VideoLesson | null>(null);
  const [isNew, setIsNew]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterCat, setFilterCat]       = useState("Todas");

  useEffect(() => {
    api.admin.getVideos()
      .then((r) => {
        const migrated = (r as any[]).map((v) => ({
          ...v,
          videoUrl:  v.videoUrl ?? v.youtubeUrl ?? "",
          category:  v.category ?? "Geral",
          tags:      Array.isArray(v.tags) ? v.tags : [],
        })) as VideoLesson[];
        setVideos(migrated.sort((a, b) => a.order - b.order));
        setLoaded(true);
      })
      .catch(() => { toast.error("Erro ao carregar vídeos"); setLoaded(true); });
  }, []);

  async function save(updated: VideoLesson[]) {
    setSaving(true);
    try {
      await api.admin.saveVideos(updated);
      setVideos(updated.sort((a, b) => a.order - b.order));
      toast.success("Vídeos actualizados");
      setEditing(null);
    } catch { toast.error("Falha ao salvar"); }
    finally { setSaving(false); }
  }

  function openNew() {
    setEditing({ id: uid(), ...BLANK_VIDEO, order: (videos.length + 1) * 10 });
    setIsNew(true);
    setPreview(null);
  }

  function openEdit(v: VideoLesson) { setEditing({ ...v }); setIsNew(false); setPreview(null); }

  function handleCommit() {
    if (!editing) return;
    const updated = isNew
      ? [...videos, editing]
      : videos.map((v) => v.id === editing.id ? editing : v);
    save(updated);
  }

  function moveUp(id: string) {
    const arr = [...videos];
    const i   = arr.findIndex((v) => v.id === id);
    if (i <= 0) return;
    [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
    const reordered = arr.map((v, idx) => ({ ...v, order: (idx + 1) * 10 }));
    save(reordered);
  }

  function moveDown(id: string) {
    const arr = [...videos];
    const i   = arr.findIndex((v) => v.id === id);
    if (i < 0 || i >= arr.length - 1) return;
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    const reordered = arr.map((v, idx) => ({ ...v, order: (idx + 1) * 10 }));
    save(reordered);
  }

  const editYtId = editing?.videoUrl ? extractYouTubeId(editing.videoUrl) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Vídeo Aulas</h2>
          <p className="text-sm text-muted-foreground">
            {videos.length} vídeo{videos.length !== 1 ? "s" : ""} · Adiciona aulas de qualquer plataforma (YouTube, Vimeo, etc.)
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo vídeo
        </Button>
      </div>

      {/* Editor */}
      {editing && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isNew ? "Novo vídeo" : `Editar: ${editing.title}`}</CardTitle>
            <CardDescription>
              Cola o link do vídeo — YouTube, Vimeo, ou qualquer outra plataforma. O player será incorporado internamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Criador / Canal</Label>
                <Input value={editing.creator} placeholder="Ex: Gustavo Cerbasi"
                  onChange={(e) => setEditing({ ...editing, creator: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nome da aula</Label>
                <Input value={editing.title} placeholder="Ex: Como calcular o Stop Loss"
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nível da aula</Label>
                <Select value={editing.level} onValueChange={(v) => setEditing({ ...editing, level: v as VideoLesson["level"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VIDEO_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Ordem de exibição</Label>
                <Input type="number" value={editing.order}
                  onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={editing.category || "Geral"} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIDEO_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        <span className="flex items-center gap-1.5">
                          <CatIcon cat={c} className="h-3.5 w-3.5" />{c}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Tags <span className="text-muted-foreground/60">(separadas por vírgula, opcional)</span></Label>
                <Input
                  value={(editing.tags ?? []).join(", ")}
                  placeholder="velas, price action, suporte, resistência..."
                  onChange={(e) => setEditing({
                    ...editing,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Link do vídeo <span className="text-muted-foreground/60">(YouTube, Vimeo, Facebook, TikTok, etc.)</span>
                </Label>
                <div className="flex gap-2">
                  <Input value={editing.videoUrl} placeholder="https://www.youtube.com/watch?v=... ou qualquer outro link"
                    onChange={(e) => setEditing({ ...editing, videoUrl: e.target.value })} className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => setPreview("show")}
                    disabled={!editing.videoUrl.trim()}>
                    Pré-visualizar
                  </Button>
                </div>
                {editYtId && (
                  <p className="text-[11px] text-bull mt-1">YouTube detectado — ID: <span className="font-mono">{editYtId}</span></p>
                )}
                {editing.videoUrl && !editYtId && (
                  <p className="text-[11px] text-muted-foreground mt-1">Link externo — será incorporado via iframe.</p>
                )}
              </div>

              {/* Preview */}
              {preview && editing.videoUrl && (
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1 block">Pré-visualização</Label>
                  <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: "16/9", maxWidth: 480 }}>
                    <iframe
                      src={editYtId ? `https://www.youtube.com/embed/${editYtId}?rel=0` : editing.videoUrl}
                      title="preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">
                  XP mínimo para desbloquear <span className="text-muted-foreground/60">(0 = livre)</span>
                </Label>
                <Input type="number" min={0} value={editing.requiredXp ?? ""}
                  placeholder="Deixe em branco para não exigir XP"
                  onChange={(e) => setEditing({
                    ...editing,
                    requiredXp: e.target.value === "" ? undefined : Number(e.target.value),
                  })} />
                {editing.requiredXp && (
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Alunos com menos de {editing.requiredXp} XP não conseguem ver este vídeo.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Duração <span className="text-muted-foreground/60">(ex: 12:34)</span></Label>
                <Input value={editing.duration ?? ""} placeholder="12:34"
                  onChange={(e) => setEditing({ ...editing, duration: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Descrição <span className="text-muted-foreground/60">(opcional)</span></Label>
                <Textarea rows={2} value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
            </div>

            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
              <p className="text-[11px] text-muted-foreground">
                <strong className="text-foreground">Aviso:</strong> Ao adicionar um vídeo, o conteúdo
                pertence ao criador original. O sistema apresenta uma nota automática de autoria aos alunos.
                Certifica-te de que tens permissão ou que o vídeo é de acesso público.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCommit} disabled={saving || !editing.title || !editing.creator || !editing.videoUrl.trim()}>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saving ? "Salvando..." : isNew ? "Adicionar vídeo" : "Guardar alterações"}
              </Button>
              <Button variant="ghost" onClick={() => { setEditing(null); setPreview(null); }}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {loaded && videos.length === 0 && !editing && (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PlayCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-sm">Nenhum vídeo aula adicionado</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Adiciona vídeos de qualquer plataforma para os alunos assistirem directamente na plataforma.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filter bar */}
      {loaded && videos.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Pesquisar vídeos..."
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="h-8 text-xs w-auto min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as categorias</SelectItem>
              {Array.from(new Set(videos.map((v) => v.category || "Geral"))).sort().map((cat) => (
                <SelectItem key={cat} value={cat}>
                  <span className="flex items-center gap-1.5">
                    <CatIcon cat={cat} className="h-3.5 w-3.5" />{cat}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filterSearch || filterCat !== "Todas") && (
            <Button size="sm" variant="ghost" className="h-8 text-xs px-2"
              onClick={() => { setFilterSearch(""); setFilterCat("Todas"); }}>
              <X className="h-3.5 w-3.5 mr-1" />Limpar
            </Button>
          )}
        </div>
      )}

      {/* Video list — grouped by category */}
      {loaded && videos.length > 0 && (() => {
        const filteredVids = videos.filter((v) => {
          const matchCat    = filterCat === "Todas" || (v.category || "Geral") === filterCat;
          const matchSearch = !filterSearch ||
            v.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
            v.creator.toLowerCase().includes(filterSearch.toLowerCase()) ||
            (v.tags ?? []).some((t) => t.toLowerCase().includes(filterSearch.toLowerCase()));
          return matchCat && matchSearch;
        });

        if (filteredVids.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <Search className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-sm font-medium">Nenhum vídeo encontrado</p>
            </div>
          );
        }

        const grouped: Record<string, VideoLesson[]> = {};
        filteredVids.forEach((v) => {
          const cat = v.category || "Geral";
          (grouped[cat] = grouped[cat] ?? []).push(v);
        });

        return (
          <div className="space-y-6">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catVideos]) => (
              <div key={cat} className="space-y-2">
                <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                  <CatIcon cat={cat} className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">{cat}</h3>
                  <Badge variant="outline" className="text-[10px] ml-auto">{catVideos.length} vídeo{catVideos.length !== 1 ? "s" : ""}</Badge>
                </div>
                {catVideos.map((v) => {
                  const i    = videos.indexOf(v);
                  const ytId = extractYouTubeId(v.videoUrl);
                  return (
                    <Card key={v.id} className="border-border/60">
                      <CardContent className="flex items-center gap-3 p-3">
                        {/* Thumbnail */}
                        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                          {ytId ? (
                            <img src={thumbnailUrl(ytId)} alt={v.title} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <PlayCircle className="h-5 w-5 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="font-medium text-sm truncate">{v.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className={cn("text-[10px]", LEVEL_COLORS[v.level])}>{v.level}</Badge>
                            {v.requiredXp && (
                              <Badge variant="outline" className="text-[10px]">
                                <Lock className="h-2.5 w-2.5 mr-0.5" />{v.requiredXp} XP
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{v.creator}</p>
                          {v.tags && v.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {v.tags.slice(0, 4).map((tag) => (
                                <span key={tag} className="text-[10px] bg-muted/60 text-muted-foreground rounded px-1.5 py-0.5">#{tag}</span>
                              ))}
                            </div>
                          )}
                          {v.duration && <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{v.duration}</p>}
                        </div>

                        {/* Order controls */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveUp(v.id)} disabled={i === 0}>
                            <ChevronRight className="h-3.5 w-3.5 -rotate-90" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveDown(v.id)} disabled={i === videos.length - 1}>
                            <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                          </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(v)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                            onClick={() => { if (window.confirm(`Excluir "${v.title}"?`)) save(videos.filter((x) => x.id !== v.id)); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

/* =========================================================================
 * Subscriptions tab
 * ========================================================================= */
function SubscriptionsTab() {
  const [subs, setSubs]         = useState<SubscriptionWithUser[]>([]);
  const [stats, setStats]       = useState<{ pending: number; active: number; expired: number; rejected: number; total: number } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading]   = useState(false);
  const [busy, setBusy]         = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [receiptModal, setReceiptModal] = useState<{ data: string; mimeType: string; filename: string } | null>(null);
  const [receiptLoading, setReceiptLoading] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [data, st] = await Promise.all([
        api.adminSubscriptions.list(filterStatus === "all" ? undefined : filterStatus),
        api.adminSubscriptions.stats(),
      ]);
      setSubs(data);
      setStats(st);
    } catch {
      toast.error("Erro ao carregar subscrições");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterStatus]);

  async function handleApprove(id: string) {
    setBusy(id);
    try {
      await api.adminSubscriptions.approve(id);
      toast.success("Subscrição aprovada — acesso ativo por 30 dias");
      load();
    } catch {
      toast.error("Erro ao aprovar");
    } finally {
      setBusy(null);
    }
  }

  async function handleReject(id: string) {
    setBusy(id);
    try {
      await api.adminSubscriptions.reject(id, rejectNote || undefined);
      toast.success("Pedido rejeitado");
      setRejectId(null);
      setRejectNote("");
      load();
    } catch {
      toast.error("Erro ao rejeitar");
    } finally {
      setBusy(null);
    }
  }

  async function handleViewReceipt(id: string) {
    setReceiptLoading(id);
    try {
      const data = await api.adminSubscriptions.getReceipt(id);
      setReceiptModal({ data: data.receiptData, mimeType: data.receiptMimeType, filename: data.receiptFilename });
    } catch {
      toast.error("Erro ao carregar comprovativo");
    } finally {
      setReceiptLoading(null);
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending:  { label: "Pendente",  className: "bg-warning/15 text-warning" },
      active:   { label: "Ativo",     className: "bg-bull/15 text-bull" },
      expired:  { label: "Expirado",  className: "bg-muted text-muted-foreground" },
      rejected: { label: "Rejeitado", className: "bg-bear/15 text-bear" },
    };
    const cfg = map[status] ?? { label: status, className: "" };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.className}`}>{cfg.label}</span>;
  };

  const fmt = (ts: number) => new Date(ts).toLocaleDateString("pt-PT");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Subscrições</h2>
        <p className="text-sm text-muted-foreground">Gestão manual de pagamentos — 15.000 AOA/mês</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Pendentes",  value: stats.pending,  icon: <Clock className="h-4 w-4 text-warning" />,          color: "border-warning/30" },
            { label: "Ativos",     value: stats.active,   icon: <CheckCircle2 className="h-4 w-4 text-bull" />,       color: "border-bull/30" },
            { label: "Expirados",  value: stats.expired,  icon: <XCircle className="h-4 w-4 text-muted-foreground" />, color: "" },
            { label: "Rejeitados", value: stats.rejected, icon: <XCircle className="h-4 w-4 text-bear" />,            color: "border-bear/30" },
          ].map((s) => (
            <Card key={s.label} className={`p-4 ${s.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                {s.icon}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        {["all", "pending", "active", "expired", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filterStatus === s
                ? "bg-primary text-primary-foreground"
                : "bg-surface-2 text-muted-foreground hover:text-foreground",
            )}
          >
            {s === "all" ? "Todos" : s === "pending" ? "Pendente" : s === "active" ? "Ativo" : s === "expired" ? "Expirado" : "Rejeitado"}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Modal de rejeição */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-sm p-5 space-y-3">
            <h3 className="font-semibold">Rejeitar pedido</h3>
            <div className="space-y-1">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ex: Referência não encontrada"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setRejectId(null); setRejectNote(""); }}>
                Cancelar
              </Button>
              <Button variant="destructive" className="flex-1" disabled={!!busy} onClick={() => handleReject(rejectId)}>
                {busy ? "A rejeitar…" : "Rejeitar"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : subs.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">
          Nenhuma subscrição encontrada.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ref. Pagamento</TableHead>
                <TableHead>Comprovativo</TableHead>
                <TableHead>Pedido em</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{sub.user.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(sub.status)}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">
                      {sub.paymentReference ?? <span className="text-muted-foreground italic">Não fornecida</span>}
                    </span>
                  </TableCell>
                  <TableCell>
                    {(sub as SubscriptionWithUser & { hasReceipt?: boolean }).hasReceipt ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        disabled={receiptLoading === sub.id}
                        onClick={() => handleViewReceipt(sub.id)}
                      >
                        {sub.receiptMimeType === "application/pdf"
                          ? <FileText className="h-3 w-3" />
                          : <Image className="h-3 w-3" />}
                        {receiptLoading === sub.id ? "…" : "Ver"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Sem ficheiro</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{fmt(sub.createdAt)}</TableCell>
                  <TableCell className="text-sm">
                    {sub.expiresAt ? fmt(sub.expiresAt) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {sub.amount.toLocaleString("pt-AO")} AOA
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {sub.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-bull hover:bg-bull/90"
                            disabled={busy === sub.id}
                            onClick={() => handleApprove(sub.id)}
                          >
                            {busy === sub.id ? "…" : "Aprovar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-bear border-bear/40 hover:bg-bear/10"
                            disabled={busy === sub.id}
                            onClick={() => { setRejectId(sub.id); setRejectNote(""); }}
                          >
                            Rejeitar
                          </Button>
                        </>
                      )}
                      {sub.status === "active" && (
                        <span className="text-xs text-bull flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Ativo
                        </span>
                      )}
                      {(sub.status === "expired" || sub.status === "rejected") && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal comprovativo */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setReceiptModal(null)}>
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-border bg-background p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                {receiptModal.mimeType === "application/pdf"
                  ? <FileText className="h-4 w-4" />
                  : <Image className="h-4 w-4" />}
                {receiptModal.filename || "Comprovativo"}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={`data:${receiptModal.mimeType};base64,${receiptModal.data}`}
                  download={receiptModal.filename || "comprovativo"}
                  className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-surface-2 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
                <button onClick={() => setReceiptModal(null)} className="rounded-md p-1.5 hover:bg-surface-2 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {receiptModal.mimeType.startsWith("image/") ? (
              <img
                src={`data:${receiptModal.mimeType};base64,${receiptModal.data}`}
                alt="Comprovativo"
                className="w-full rounded-lg object-contain"
              />
            ) : (
              <iframe
                src={`data:${receiptModal.mimeType};base64,${receiptModal.data}`}
                className="h-[70vh] w-full rounded-lg border border-border"
                title="Comprovativo PDF"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * Email Config tab
 * ========================================================================= */
function EmailConfigTab() {
  const [cfg, setCfg]         = useState({ gmailAppPassword: "", gmailUser: "aluka.co.ao@gmail.com", fromName: "ALUKA", adminEmail: "" });
  const [status, setStatus]   = useState<{ configured: boolean; keySource: string } | null>(null);
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    api.admin.getEmailConfig()
      .then((r: any) => {
        setStatus({ configured: r.configured, keySource: r.keySource });
        setCfg((prev) => ({
          ...prev,
          gmailUser:  r.gmailUser  || "aluka.co.ao@gmail.com",
          fromName:   r.fromName   || "ALUKA",
          adminEmail: r.adminEmail || "",
        }));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        gmailUser:  cfg.gmailUser.trim(),
        fromName:   cfg.fromName.trim(),
        adminEmail: cfg.adminEmail.trim(),
      };
      if (cfg.gmailAppPassword.trim()) payload.gmailAppPassword = cfg.gmailAppPassword.trim();
      const r = await api.admin.saveEmailConfig(payload);
      setStatus((prev) => ({ ...prev!, configured: r.configured, keySource: r.configured ? "database" : prev?.keySource ?? "none" }));
      setCfg((prev) => ({ ...prev, gmailAppPassword: "" }));
      toast.success(r.configured ? "Configurações Gmail guardadas com sucesso" : "Configurações guardadas (Gmail App Password não definida — a usar variável de ambiente)");
    } catch { toast.error("Erro ao guardar configurações"); }
    finally { setSaving(false); }
  }

  async function handleTest() {
    if (!cfg.adminEmail.trim()) { toast.error("Introduz o email de destino para o teste."); return; }
    setTesting(true);
    try {
      await api.admin.testEmailConfig(cfg.adminEmail.trim());
      toast.success(`Email de teste enviado para ${cfg.adminEmail}`);
    } catch (err: any) {
      const msg = err?.message ?? "";
      const reason = msg.includes("gmail_not_configured")
        ? "Gmail não configurado. Guarda a App Password ou define a variável de ambiente GMAIL_APP_PASSWORD."
        : "Erro ao enviar email de teste. Verifica as credenciais Gmail.";
      toast.error(reason);
    } finally { setTesting(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Email / Gmail SMTP</h2>
        <p className="text-sm text-muted-foreground">
          Envio de emails via Gmail SMTP com Nodemailer — verificação de email, recuperação de password, aprovação e rejeição de subscrições.
        </p>
      </div>

      {/* Status banner */}
      {loaded && (
        <Card className={cn("border", status?.configured ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5")}>
          <CardContent className="flex items-center gap-3 p-4">
            {status?.configured
              ? <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              : <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />}
            <div>
              <p className={cn("text-sm font-semibold", status?.configured ? "text-emerald-400" : "text-amber-400")}>
                {status?.configured ? "Gmail SMTP activo" : "Gmail SMTP não configurado"}
              </p>
              <p className="text-xs text-muted-foreground">
                {status?.configured
                  ? `App Password activa (fonte: ${status.keySource === "database" ? "painel admin" : "variável de ambiente GMAIL_APP_PASSWORD"}). Emails serão enviados automaticamente.`
                  : "App Password não definida. Os emails automáticos não serão enviados até configurares o Gmail SMTP."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Como criar App Password */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Como obter a Gmail App Password</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
            <li>Acede a <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-primary underline">myaccount.google.com/security</a></li>
            <li>Activa a <strong className="text-foreground">Verificação em dois passos</strong> (obrigatório)</li>
            <li>Pesquisa <strong className="text-foreground">"App passwords"</strong> nas definições da conta</li>
            <li>Cria uma nova App Password para <strong className="text-foreground">Mail</strong> e copia os 16 caracteres</li>
            <li>Cola abaixo sem espaços (são removidos automaticamente)</li>
          </ol>
        </CardContent>
      </Card>

      {/* Config form */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Credenciais Gmail SMTP</CardTitle>
          <CardDescription className="text-xs">
            Conta Gmail: <strong className="text-foreground">aluka.co.ao@gmail.com</strong> — SMTP: smtp.gmail.com:587 (STARTTLS)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">
              Conta Gmail (remetente)
            </Label>
            <Input
              type="email"
              placeholder="aluka.co.ao@gmail.com"
              value={cfg.gmailUser}
              onChange={(e) => setCfg((p) => ({ ...p, gmailUser: e.target.value }))}
              className="mt-1 font-mono text-xs"
              autoComplete="off"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Conta Gmail que envia os emails. Deve ter 2FA activo e App Password gerada.
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Gmail App Password
              {status?.configured && status.keySource === "database" && (
                <span className="ml-2 text-emerald-500">(guardada — deixa vazio para manter)</span>
              )}
              {status?.configured && status.keySource === "environment" && (
                <span className="ml-2 text-primary">(definida via variável de ambiente — não precisas de guardar aqui)</span>
              )}
            </Label>
            <Input
              type="password"
              placeholder={
                status?.configured
                  ? status.keySource === "environment"
                    ? "Definida via GMAIL_APP_PASSWORD (env var)"
                    : "•••• •••• •••• ••••  (activa — deixa vazio para manter)"
                  : "xxxx xxxx xxxx xxxx  (16 caracteres)"
              }
              value={cfg.gmailAppPassword}
              onChange={(e) => setCfg((p) => ({ ...p, gmailAppPassword: e.target.value }))}
              className="font-mono text-xs mt-1"
              autoComplete="off"
              disabled={status?.configured && status.keySource === "environment"}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              A variável de ambiente <code className="bg-surface-2 px-1 rounded">GMAIL_APP_PASSWORD</code> tem prioridade sobre este campo.
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Nome do remetente</Label>
            <Input
              placeholder="ALUKA"
              value={cfg.fromName}
              onChange={(e) => setCfg((p) => ({ ...p, fromName: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email de destino para teste</Label>
            <Input
              type="email"
              placeholder="admin@exemplo.com"
              value={cfg.adminEmail}
              onChange={(e) => setCfg((p) => ({ ...p, adminEmail: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving || !loaded}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? "A guardar..." : "Guardar configurações"}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing || !status?.configured}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {testing ? "A enviar..." : "Enviar email de teste"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* What gets sent */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Emails automáticos</CardTitle>
          <CardDescription className="text-xs">Todos enviados via smtp.gmail.com:587 (Nodemailer)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { icon: "📧", title: "Verificação de email (OTP)", desc: "Código de 6 dígitos enviado no registo. Obrigatório para activar a conta. Expira em 15 minutos." },
              { icon: "✅", title: "Subscrição aprovada", desc: "Enviado ao aluno quando o admin aprova o comprovativo de pagamento (15.000 AOA/mês)." },
              { icon: "❌", title: "Subscrição rejeitada", desc: "Enviado ao aluno quando o admin rejeita o pedido, com nota opcional explicativa." },
              { icon: "🔑", title: "Recuperação de password", desc: "Enviado quando o utilizador pede recuperação em /esqueci-senha. Link válido por 1 hora." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-lg border border-border/50 bg-surface-1 p-3">
                <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================================================================
 * SEO / Site Settings tab
 * ========================================================================= */
const SEO_EMPTY: SeoConfig = {
  siteName: "ALUKA", shortName: "ALUKA", domain: "",
  description: "A primeira plataforma angolana de educação em trading.",
  twitterHandle: "@ALUKAAO", themeColor: "#06b6d4", priceAoa: 15000,
  geo: "AO", geoCity: "Luanda, Angola",
};

function SeoSettingsTab() {
  const [cfg, setCfg]     = useState<SeoConfig>(SEO_EMPTY);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.admin.getSeoConfig()
      .then((r) => { setCfg(r); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  function set<K extends keyof SeoConfig>(key: K, val: SeoConfig[K]) {
    setCfg((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.admin.saveSeoConfig(cfg);
      toast.success("Configurações SEO guardadas. O manifesto PWA foi actualizado automaticamente.");
    } catch { toast.error("Erro ao guardar configurações SEO"); }
    finally { setSaving(false); }
  }

  const siteUrl = cfg.domain ? `https://${cfg.domain}` : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">SEO & Domínio</h2>
        <p className="text-sm text-muted-foreground">
          Configura o nome da plataforma, domínio e metadados de SEO. Ao guardares, o manifesto PWA é actualizado automaticamente.
        </p>
      </div>

      {/* Domain status */}
      {loaded && (
        <Card className={cn("border", siteUrl ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5")}>
          <CardContent className="flex items-center gap-3 p-4">
            {siteUrl
              ? <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              : <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />}
            <div>
              <p className={cn("text-sm font-semibold", siteUrl ? "text-emerald-400" : "text-amber-400")}>
                {siteUrl ? `Domínio configurado: ${cfg.domain}` : "Sem domínio configurado"}
              </p>
              <p className="text-xs text-muted-foreground">
                {siteUrl
                  ? "O canonical, Open Graph e o manifesto PWA apontam para este domínio."
                  : "Sem domínio, os URLs de SEO ficam incompletos. Adiciona o domínio assim que estiver disponível."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Identity */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Identidade do site</CardTitle>
          <CardDescription className="text-xs">O nome que aparece no browser, no PWA instalado e nos resultados de pesquisa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Nome completo</Label>
              <Input
                placeholder="ALUKA"
                value={cfg.siteName}
                onChange={(e) => set("siteName", e.target.value)}
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Usado em títulos, JSON-LD e emails.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nome curto (PWA)</Label>
              <Input
                placeholder="ALUKA"
                value={cfg.shortName}
                onChange={(e) => set("shortName", e.target.value)}
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Máx. ~12 caracteres — aparece no ícone instalado.</p>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <textarea
              rows={3}
              placeholder="A plataforma angolana de educação em trading..."
              value={cfg.description}
              onChange={(e) => set("description", e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* Domain */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Domínio</CardTitle>
          <CardDescription className="text-xs">
            Sem "https://" — ex: <code className="bg-muted px-1 rounded">aluka.app</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Domínio (sem https://)</Label>
            <div className="flex items-center mt-1">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 py-2 text-xs text-muted-foreground">https://</span>
              <Input
                placeholder="aluka.app"
                value={cfg.domain}
                onChange={(e) => set("domain", e.target.value.replace(/^https?:\/\//, "").replace(/\/$/, ""))}
                className="rounded-l-none font-mono text-sm"
              />
            </div>
          </div>

          {siteUrl && (
            <div className="rounded-lg border border-border/50 bg-surface-1 p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">URLs que serão usados em SEO</p>
              {[
                ["Canonical", siteUrl + "/"],
                ["Open Graph", siteUrl + "/"],
                ["OG Image", siteUrl + "/opengraph.jpg"],
                ["Manifesto PWA", "/api-server/api/manifest"],
              ].map(([label, url]) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-24 shrink-0">{label}</span>
                  <code className="text-primary truncate">{url}</code>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social & PWA extras */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Redes sociais & PWA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Twitter / X Handle</Label>
              <Input
                placeholder="@ALUKAAO"
                value={cfg.twitterHandle}
                onChange={(e) => set("twitterHandle", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cor do tema (PWA / browser)</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={cfg.themeColor}
                  onChange={(e) => set("themeColor", e.target.value)}
                  className="h-9 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <Input
                  value={cfg.themeColor}
                  onChange={(e) => set("themeColor", e.target.value)}
                  className="font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Região geo (ISO 3166)</Label>
              <Input
                placeholder="AO"
                value={cfg.geo}
                onChange={(e) => set("geo", e.target.value.toUpperCase())}
                className="mt-1 uppercase"
                maxLength={2}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cidade / região</Label>
              <Input
                placeholder="Luanda, Angola"
                value={cfg.geoCity}
                onChange={(e) => set("geoCity", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !loaded}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? "A guardar..." : "Guardar configurações SEO"}
        </Button>
      </div>

      {/* Instructions */}
      <Card className="border-border/60 bg-muted/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">O que muda automaticamente ao guardar</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Manifesto PWA (<code className="bg-muted px-1 rounded">/api-server/api/manifest</code>) — nome, short_name, descrição, cor, id</li>
            <li>Meta tags canonical, og:url, og:image actualizadas via script na página</li>
            <li>Título do browser e apple-mobile-web-app-title</li>
            <li>Twitter:site, og:site_name, og:description, meta description</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            <strong className="text-foreground">Nota:</strong> Para resultados de pesquisa do Google, as meta tags no HTML estático continuam a usar o placeholder até o site ser redeployado com o domínio definitivo. Isso é normal para uma SPA — o Google lerá os valores correctos após o deploy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================================================================
 * Social media links tab
 * ========================================================================= */
const SOCIAL_PLATFORMS: {
  key: keyof SocialConfig;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  hint: string;
}[] = [
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://www.youtube.com/@ALUKA",
    icon: (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 text-red-500">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </span>
    ),
    hint: "Canal do YouTube da ALUKA",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://www.instagram.com/aluka_ao",
    icon: (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600/10 text-pink-500">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      </span>
    ),
    hint: "Perfil do Instagram da ALUKA",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://www.tiktok.com/@aluka_ao",
    icon: (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-foreground">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.98a8.27 8.27 0 004.84 1.54V7.04a4.85 4.85 0 01-1.07-.35z"/>
        </svg>
      </span>
    ),
    hint: "Perfil do TikTok da ALUKA",
  },
  {
    key: "x",
    label: "X / Twitter",
    placeholder: "https://x.com/ALUKAAO",
    icon: (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-foreground">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </span>
    ),
    hint: "Perfil no X (antigo Twitter)",
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://www.facebook.com/aluka.angola",
    icon: (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-500">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </span>
    ),
    hint: "Página do Facebook da ALUKA",
  },
];

const SOCIAL_EMPTY: SocialConfig = { youtube: "", instagram: "", tiktok: "", x: "", facebook: "" };

function SocialTab() {
  const [cfg, setCfg]       = useState<SocialConfig>(SOCIAL_EMPTY);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.admin.getSocialConfig()
      .then((r) => { setCfg(r); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  function set(key: keyof SocialConfig, val: string) {
    setCfg((p) => ({ ...p, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.admin.saveSocialConfig(cfg);
      toast.success("Links de redes sociais guardados com sucesso.");
    } catch { toast.error("Erro ao guardar links de redes sociais."); }
    finally { setSaving(false); }
  }

  const activeCount = Object.values(cfg).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Redes Sociais</h2>
        <p className="text-sm text-muted-foreground">
          Configura os links das redes sociais da ALUKA. Os ícones aparecem automaticamente no footer do site quando o link estiver preenchido.
        </p>
      </div>

      {loaded && (
        <Card className={cn(
          "border",
          activeCount > 0
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-border/50 bg-muted/20",
        )}>
          <CardContent className="flex items-center gap-3 p-4">
            <Share2 className={cn("h-5 w-5 shrink-0", activeCount > 0 ? "text-emerald-500" : "text-muted-foreground")} />
            <div>
              <p className={cn("text-sm font-semibold", activeCount > 0 ? "text-emerald-400" : "text-muted-foreground")}>
                {activeCount > 0
                  ? `${activeCount} rede${activeCount !== 1 ? "s" : ""} social activa${activeCount !== 1 ? "s" : ""}`
                  : "Nenhuma rede social configurada"}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeCount > 0
                  ? "Os ícones activos aparecem no footer da landing page."
                  : "Preenche pelo menos um link para que os ícones apareçam no site."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Links das plataformas</CardTitle>
          <CardDescription className="text-xs">
            Cola o URL completo de cada perfil. Deixa em branco para ocultar o ícone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SOCIAL_PLATFORMS.map((p) => (
            <div key={p.key}>
              <Label className="text-xs text-muted-foreground">{p.label}</Label>
              <div className="flex items-center gap-2 mt-1">
                {p.icon}
                <Input
                  placeholder={p.placeholder}
                  value={(cfg as Record<string, string>)[p.key] ?? ""}
                  onChange={(e) => set(p.key, e.target.value)}
                  className="font-mono text-xs"
                  type="url"
                />
                {(cfg as Record<string, string>)[p.key] && (
                  <a
                    href={(cfg as Record<string, string>)[p.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    title="Abrir link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 pl-10">{p.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !loaded}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? "A guardar..." : "Guardar redes sociais"}
        </Button>
      </div>

      <Card className="border-border/60 bg-muted/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Onde os links aparecem</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Footer da landing page — ícones clicáveis para cada rede configurada</li>
            <li>Apenas as redes com URL preenchido são exibidas</li>
            <li>Os links abrem numa nova aba</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================================================================
 * Integrações tab — Google OAuth
 * ========================================================================= */
function IntegracoesTb() {
  const [cfg, setCfg] = useState({
    clientId: "",
    clientSecret: "",
    clientSecretPreview: "",
    enabled: false,
    configured: false,
    callbackUrl: "",
  });
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "ok" | "error">("idle");
  const [testMsg,    setTestMsg]    = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    api.admin.getGoogleOAuth()
      .then((data) => setCfg({ ...data, clientSecret: "" }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const body: { clientId?: string; clientSecret?: string; enabled?: boolean } = {
        enabled: cfg.enabled,
      };
      if (cfg.clientId.trim()) body.clientId = cfg.clientId.trim();
      if (newSecret.trim())   body.clientSecret = newSecret.trim();

      const res = await api.admin.saveGoogleOAuth(body);
      toast.success("Configuração Google OAuth guardada.");
      setCfg((prev) => ({
        ...prev,
        configured: res.configured,
        enabled: res.enabled,
        clientSecretPreview: newSecret.trim() ? `${"•".repeat(Math.max(0, newSecret.length - 4))}${newSecret.slice(-4)}` : prev.clientSecretPreview,
      }));
      setNewSecret("");
      setTestStatus("idle");
      setTestMsg("");
    } catch {
      toast.error("Erro ao guardar configuração.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (newSecret.trim()) {
      toast.error("Guarda primeiro as novas credenciais antes de testar.");
      return;
    }
    setTesting(true);
    setTestStatus("idle");
    setTestMsg("");
    try {
      const res = await api.admin.testGoogleOAuth();
      setTestStatus("ok");
      setTestMsg(res.message ?? "Credenciais reconhecidas pelo Google.");
    } catch (err: any) {
      setTestStatus("error");
      setTestMsg(err?.message ?? "Credenciais inválidas ou rejeitadas pelo Google.");
    } finally {
      setTesting(false);
    }
  }

  function copyCallback() {
    if (!cfg.callbackUrl) return;
    navigator.clipboard.writeText(cfg.callbackUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold">Integrações</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configura o Google OAuth para permitir que os alunos se registem e entrem com a conta Google.
        </p>
      </div>

      {/* Google OAuth Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white dark:bg-white">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-base">Google OAuth 2.0</CardTitle>
                <CardDescription className="text-xs">Login e registo com conta Google</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cfg.configured ? (
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-[11px]">
                  <CheckCircle className="h-3 w-3 mr-1" />Configurado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[11px]">
                  Não configurado
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Activar Google Login</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cfg.configured
                  ? cfg.enabled ? "Visível no login e registo." : "Configurado mas desactivado."
                  : "Adiciona as credenciais abaixo para activar."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCfg((p) => ({ ...p, enabled: !p.enabled }))}
              disabled={!cfg.configured}
              className="transition-colors disabled:opacity-40"
              title={cfg.enabled ? "Desactivar" : "Activar"}
            >
              {cfg.enabled
                ? <ToggleRight className="h-8 w-8 text-emerald-500" />
                : <ToggleLeft className="h-8 w-8 text-muted-foreground" />
              }
            </button>
          </div>

          {/* Client ID */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Client ID</Label>
            <Input
              value={cfg.clientId}
              onChange={(e) => setCfg((p) => ({ ...p, clientId: e.target.value }))}
              placeholder="123456789-abc.apps.googleusercontent.com"
              className="font-mono text-xs h-10"
            />
          </div>

          {/* Client Secret */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Client Secret</Label>
            {cfg.clientSecretPreview && !newSecret && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 mb-1.5">
                <span className="font-mono text-xs text-muted-foreground flex-1">{cfg.clientSecretPreview}</span>
                <span className="text-[10px] text-muted-foreground">guardado</span>
              </div>
            )}
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={newSecret}
                onChange={(e) => setNewSecret(e.target.value)}
                placeholder={cfg.clientSecretPreview ? "Novo secret (deixa vazio para manter)" : "GOCSPX-..."}
                className="pr-11 font-mono text-xs h-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Callback URL */}
          {cfg.callbackUrl && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                URL de Callback
                <span className="text-[10px] font-normal text-muted-foreground">(adiciona esta URL no Google Console)</span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2">
                  <p className="font-mono text-[11px] text-muted-foreground break-all">{cfg.callbackUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={copyCallback}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
                  title="Copiar URL"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">Como configurar no Google Cloud Console</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Acede a <span className="text-foreground font-mono">console.cloud.google.com</span></li>
              <li>Cria um projecto ou selecciona um existente</li>
              <li>Vai a <strong className="text-foreground">APIs &amp; Services → Credentials</strong></li>
              <li>Clica em <strong className="text-foreground">Create Credentials → OAuth 2.0 Client ID</strong></li>
              <li>Tipo de aplicação: <strong className="text-foreground">Web application</strong></li>
              <li>Em <strong className="text-foreground">Authorized redirect URIs</strong> adiciona a URL de callback acima</li>
              <li>Copia o Client ID e Client Secret para os campos acima</li>
            </ol>
          </div>

          {/* Test result banner */}
          {testStatus !== "idle" && (
            <div className={cn(
              "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
              testStatus === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400",
            )}>
              {testStatus === "ok"
                ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{testMsg}</span>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSave} disabled={saving || testing} className="h-10 gap-2">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />A guardar…</> : <><Save className="h-4 w-4" />Guardar configuração</>}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={saving || testing || !cfg.configured} className="h-10 gap-2">
              {testing ? <><Loader2 className="h-4 w-4 animate-spin" />A testar…</> : <><Wifi className="h-4 w-4" />Testar ligação</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================================================================
 * Admin sidebar navigation
 * ========================================================================= */
const NAV_ITEMS = [
  { id: "overview",       label: "Dashboard",             icon: BarChart3,      group: "negocio" },
  { id: "subscriptions",  label: "Subscrições",           icon: CreditCard,     group: "negocio" },
  { id: "users",          label: "Alunos",                icon: Users,          group: "negocio" },
  { id: "email",          label: "Email / SendGrid",      icon: Mail,           group: "negocio" },
  { id: "seo",            label: "SEO & Domínio",         icon: Globe,          group: "negocio" },
  { id: "social",         label: "Redes Sociais",         icon: Share2,         group: "negocio" },
  { id: "integracoes",    label: "Integrações",           icon: Plug,           group: "negocio" },
  { id: "aluka-ia",       label: "Aluka IA",              icon: Brain,          group: "negocio" },
  { id: "settings",       label: "Configurações",         icon: Settings,       group: "negocio" },
  { id: "curriculum",     label: "Trilha de Aprendizado", icon: GraduationCap,  group: "conteudo" },
  { id: "videos",         label: "Vídeo Aulas",           icon: PlayCircle,     group: "conteudo" },
  { id: "strategies",     label: "Estratégias",           icon: Compass,        group: "conteudo" },
  { id: "books",          label: "Biblioteca",            icon: BookMarked,     group: "conteudo" },
  { id: "glossary",       label: "Glossário",             icon: BookText,       group: "conteudo" },
  { id: "resources",      label: "Recursos",              icon: Library,        group: "conteudo" },
] as const;

type NavId = (typeof NAV_ITEMS)[number]["id"];

/* =========================================================================
 * Main Admin shell
 * ========================================================================= */
/* Tabs that a Professor (with JWT) can access — content management only */
const PROF_ALLOWED: ReadonlySet<NavId> = new Set([
  "curriculum", "videos", "strategies", "books", "glossary", "resources",
]);

export default function Admin() {
  useSEO({ title: "Painel de Gestão — ALUKA", noindex: true });
  const navigate                  = useNavigate();
  const { user: authUser, logout } = useAuthStore();
  const isMaster                  = authUser?.role === "master";
  const isAdmin                   = authUser?.role === "administrador";
  const isProf                    = authUser?.role === "professor";
  const hasJwtAccess              = isMaster || isAdmin || isProf;
  const [active, setActive]       = useState<NavId>(isProf && !isMaster && !isAdmin ? "curriculum" : "overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!hasJwtAccess) return <AdminGateLogin />;

  /* Professores só podem aceder a tabs permitidas */
  const effectiveActive: NavId =
    isProf && !isMaster && !isAdmin && !PROF_ALLOWED.has(active)
      ? "curriculum"
      : active;

  function handleSetActive(id: NavId) {
    if (isProf && !isMaster && !isAdmin && !PROF_ALLOWED.has(id)) return;
    setActive(id);
  }

  function handleLogout() { logout(); toast.success("Sessão encerrada"); }

  const TABS: Record<NavId, React.ReactNode> = {
    overview:      <OverviewTab />,
    subscriptions: <SubscriptionsTab />,
    users:         <UsersTab />,
    email:         <EmailConfigTab />,
    seo:           <SeoSettingsTab />,
    social:        <SocialTab />,
    integracoes:   <IntegracoesTb />,
    "aluka-ia":    <AlukaIaTab />,
    settings:      <SettingsTab />,
    curriculum:    <CurriculumTab />,
    videos:        <VideosTab />,
    strategies:    <StrategiesTab />,
    books:         <BooksTab />,
    glossary:      <GlossaryTab />,
    resources:     <ResourcesTab />,
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Admin sidebar ─────────────────────────────────────────────────── */}
      <aside className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-200",
        sidebarOpen ? "w-56" : "w-14",
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden">
            <img src="/logo-transparent.webp" alt="ALUKA" width="32" height="32" className="w-8 h-8 object-contain" loading="lazy" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-sm font-bold leading-none tracking-tight">Admin</div>
              <div className="text-[10px] text-muted-foreground tracking-wide mt-0.5">ALUKA</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-muted-foreground hover:text-foreground p-0.5 rounded"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", sidebarOpen && "rotate-180")} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {/* Negócio — oculto para Professores */}
          {!(isProf && !isMaster && !isAdmin) && (
            <>
              {sidebarOpen && (
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Negócio</p>
              )}
              <div className="space-y-0.5 mb-2">
                {NAV_ITEMS.filter((n) => n.group === "negocio").map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSetActive(item.id)}
                    title={!sidebarOpen ? item.label : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                      effectiveActive === item.id
                        ? "bg-sidebar-accent text-primary font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            </>
          )}
          {/* Conteúdo */}
          {sidebarOpen && (
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Conteúdo</p>
          )}
          {!sidebarOpen && <div className="my-1.5 border-t border-border/40 mx-1" />}
          <div className="space-y-0.5">
            {NAV_ITEMS.filter((n) => n.group === "conteudo").map((item) => (
              <button
                key={item.id}
                onClick={() => handleSetActive(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                  effectiveActive === item.id
                    ? "bg-sidebar-accent text-primary font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-1.5 space-y-0.5">
          <button
            onClick={() => navigate("/dashboard")}
            title={!sidebarOpen ? "Voltar ao app" : undefined}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Voltar ao app</span>}
          </button>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Sair" : undefined}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">
              {NAV_ITEMS.find((n) => n.id === effectiveActive)?.label ?? "Administração"}
            </span>
            <Badge variant="outline" className="ml-1 text-[10px]">
              {isProf && !isMaster && !isAdmin ? "PROFESSOR" : "ADMIN"}
            </Badge>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-6xl">
          {TABS[effectiveActive]}
        </main>
      </div>
    </div>
  );
}
