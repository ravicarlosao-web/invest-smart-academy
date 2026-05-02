import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  Brain, Eye, EyeOff, Loader2, Wifi, WifiOff,
} from "lucide-react";
import type { SubscriptionWithUser } from "@/lib/apiClient";
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

import { useAdminStore } from "@/store/useAdminStore";
import { api } from "@/lib/apiClient";
import { LEVELS } from "@/data/curriculum";
import { STRATEGIES, type Strategy, type RiskLevel } from "@/data/strategies";
import { BOOKS_CATALOG, type BookMeta } from "@/data/books";
import { GLOSSARY, type GlossaryTerm, type GlossaryCategory, CATEGORY_COLORS } from "@/data/glossary";
import { type VideoLesson, extractYouTubeId, thumbnailUrl, LEVEL_COLORS } from "@/data/videos";

/* =========================================================================
 * Login screen
 * ========================================================================= */
function AdminLogin() {
  const login = useAdminStore((s) => s.login);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const res = await login(password);
    setLoading(false);
    if (!res.ok) {
      const isLocked = res.error === "too_many_attempts";
      setLocked(isLocked);
      setErrorMsg(res.message ?? res.error ?? "Senha incorrecta.");
    } else {
      toast.success("Acesso autorizado");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="mt-3">Área Restrita</CardTitle>
          <CardDescription>Acesso exclusivo para administradores.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="adminpw">Senha de acesso</Label>
              <Input
                id="adminpw"
                type="password"
                autoFocus
                value={password}
                disabled={locked}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                placeholder="••••••••"
              />
            </div>
            {errorMsg && (
              <p className="text-[12px] text-destructive flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {errorMsg}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading || locked}>
              {loading ? "A verificar..." : locked ? "Bloqueado" : "Entrar"}
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
            Visão financeira e de crescimento do TradeAcademy · {fin?.plan.planName} · {fin ? fmtAoa(fin.plan.priceAoa) : "…"}/mês
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

  /* ── AI Config state ── */
  const [aiCfg, setAiCfg]     = useState<{ configured: boolean; keyPreview: string; model: string } | null>(null);
  const [aiKey, setAiKey]      = useState("");
  const [aiModel, setAiModel]  = useState("gpt-4o-mini");
  const [showKey, setShowKey]  = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiStatus, setAiStatus]   = useState<"idle" | "ok" | "error">("idle");
  const [aiStatusMsg, setAiStatusMsg] = useState("");

  useEffect(() => {
    api.admin.getPlanConfig()
      .then((c) => { setCfg(c); setEditPrice(String(c.priceAoa)); setEditName(c.planName); setLoading(false); })
      .catch(() => { toast.error("Erro ao carregar configurações"); setLoading(false); });
    api.admin.getAiConfig()
      .then((c) => { setAiCfg(c); setAiModel(c.model); })
      .catch(() => {});
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

  async function saveAi() {
    if (!aiKey.trim() && aiModel === aiCfg?.model) { toast.error("Nada a guardar"); return; }
    setAiSaving(true);
    setAiStatus("idle");
    try {
      const payload: { openaiKey?: string; model?: string } = { model: aiModel };
      if (aiKey.trim()) payload.openaiKey = aiKey.trim();
      await api.admin.saveAiConfig(payload);
      const updated = await api.admin.getAiConfig();
      setAiCfg(updated); setAiModel(updated.model); setAiKey("");
      toast.success("Configurações do Aluka IA guardadas");
    } catch { toast.error("Falha ao guardar"); }
    finally { setAiSaving(false); }
  }

  async function testAi() {
    setAiTesting(true); setAiStatus("idle"); setAiStatusMsg("");
    try {
      await api.admin.testAiConfig();
      setAiStatus("ok"); setAiStatusMsg("Ligação bem-sucedida — chave válida.");
    } catch (err: any) {
      setAiStatus("error");
      setAiStatusMsg(err?.message ?? "Chave inválida ou sem permissões.");
    } finally { setAiTesting(false); }
  }

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

      {/* ── Aluka IA — AI Config ── */}
      <div className="pt-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> Aluka IA
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configura a chave API da OpenAI para activar a análise inteligente de trades no simulador.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" /> Integração OpenAI
            {aiCfg && (
              <Badge
                variant="outline"
                className={cn(
                  "ml-auto text-[10px] font-semibold",
                  aiCfg.configured
                    ? "border-bull/40 text-bull bg-bull/5"
                    : "border-border text-muted-foreground",
                )}
              >
                {aiCfg.configured ? "Chave configurada" : "Sem chave"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            A chave é guardada de forma segura no servidor e nunca exposta ao cliente.
            Obtém a tua chave em{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-primary hover:opacity-80"
            >
              platform.openai.com/api-keys
            </a>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Current key preview */}
          {aiCfg?.configured && (
            <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2.5 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono text-xs text-muted-foreground tracking-widest flex-1 truncate">
                {aiCfg.keyPreview}
              </span>
              <span className="text-[10px] text-muted-foreground">chave actual</span>
            </div>
          )}

          {/* New key input */}
          <div className="space-y-1.5">
            <Label htmlFor="ai-key">
              {aiCfg?.configured ? "Substituir chave API" : "Chave API da OpenAI"}
            </Label>
            <div className="relative max-w-sm">
              <Input
                id="ai-key"
                type={showKey ? "text" : "password"}
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="pr-10 font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deixa em branco se não quiseres alterar a chave existente.
            </p>
          </div>

          {/* Model selector */}
          <div className="space-y-1.5">
            <Label htmlFor="ai-model">Modelo</Label>
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger id="ai-model" className="max-w-sm">
                <SelectValue placeholder="Selecciona modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">
                  <span className="font-medium">GPT-4o Mini</span>
                  <span className="ml-2 text-[11px] text-muted-foreground">Rápido e económico — recomendado</span>
                </SelectItem>
                <SelectItem value="gpt-4o">
                  <span className="font-medium">GPT-4o</span>
                  <span className="ml-2 text-[11px] text-muted-foreground">Mais capaz, maior custo</span>
                </SelectItem>
                <SelectItem value="gpt-4-turbo">
                  <span className="font-medium">GPT-4 Turbo</span>
                  <span className="ml-2 text-[11px] text-muted-foreground">Contexto longo</span>
                </SelectItem>
                <SelectItem value="gpt-3.5-turbo">
                  <span className="font-medium">GPT-3.5 Turbo</span>
                  <span className="ml-2 text-[11px] text-muted-foreground">Muito económico</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status badge after test */}
          {aiStatus !== "idle" && (
            <div className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
              aiStatus === "ok"
                ? "border-bull/40 bg-bull/5 text-bull"
                : "border-bear/40 bg-bear/5 text-bear",
            )}>
              {aiStatus === "ok"
                ? <Wifi className="h-4 w-4 shrink-0" />
                : <WifiOff className="h-4 w-4 shrink-0" />}
              <span>{aiStatusMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button onClick={saveAi} disabled={aiSaving}>
              {aiSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
              {aiSaving ? "A guardar…" : "Guardar"}
            </Button>
            <Button
              variant="outline"
              onClick={testAi}
              disabled={aiTesting || !aiCfg?.configured}
              title={!aiCfg?.configured ? "Guarda primeiro uma chave para poder testar" : ""}
            >
              {aiTesting
                ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                : <Wifi className="mr-1.5 h-3.5 w-3.5" />}
              {aiTesting ? "A testar…" : "Testar ligação"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info about AI */}
      <Card className="border-border/40 bg-muted/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">O que o Aluka IA faz</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {[
              "Analisa cada trade após ser fechado — entrada, saída, risco e R:R",
              "Identifica padrões de comportamento: overtrading, FOMO, disciplina",
              "Sugere melhorias com base no historial de operações da sessão",
              "Funciona 100% no servidor — a chave nunca é enviada ao browser",
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

function UsersTab() {
  const [users, setUsers]     = useState<AdminUser[] | null>(null);
  const [filter, setFilter]   = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [editXp, setEditXp]   = useState<{ userId: string; current: number } | null>(null);
  const [newXp, setNewXp]     = useState("");

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
                <TableHead>Aluno</TableHead>
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
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">A carregar...</TableCell></TableRow>
              )}
              {users && filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum aluno encontrado.</TableCell></TableRow>
              )}
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email || "—"}</div>
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
                        title="Excluir aluno" disabled={busy === u.id + "Excluir"}
                        onClick={() => action("Excluir", () => api.admin.deleteUser(u.id), u.id,
                          `EXCLUIR DEFINITIVAMENTE ${u.email}? Esta acção não pode ser desfeita.`)}>
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
  );
}

/* =========================================================================
 * Curriculum tab
 * ========================================================================= */
type LessonOverride = { title?: string; summary?: string; xp?: number; hidden?: boolean };

function CurriculumTab() {
  const [overrides, setOverrides] = useState<Record<string, LessonOverride>>({});
  const [loaded, setLoaded]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [filter, setFilter]       = useState("");

  useEffect(() => {
    api.admin.getCurriculumOverride()
      .then((r) => { setOverrides((r.value?.lessons as Record<string, LessonOverride>) ?? {}); setLoaded(true); })
      .catch(() => { toast.error("Erro ao carregar overrides"); setLoaded(true); });
  }, []);

  function update(lessonId: string, patch: Partial<LessonOverride>) {
    setOverrides((prev) => ({ ...prev, [lessonId]: { ...prev[lessonId], ...patch } }));
  }

  async function persist() {
    setSaving(true);
    try {
      const cleaned: Record<string, LessonOverride> = {};
      for (const [id, o] of Object.entries(overrides)) {
        if (Object.values(o).some((v) => v !== undefined && v !== "")) cleaned[id] = o;
      }
      await api.admin.saveCurriculumOverride({ lessons: cleaned });
      setOverrides(cleaned);
      toast.success("Trilha de aprendizado actualizada");
    } catch { toast.error("Falha ao salvar"); }
    finally { setSaving(false); }
  }

  const allLessons = LEVELS.flatMap((lvl) =>
    lvl.lessons.map((l) => ({ ...l, levelTitle: lvl.title, levelId: lvl.id })),
  );
  const filtered = filter
    ? allLessons.filter((l) => l.title.toLowerCase().includes(filter.toLowerCase()) || l.id.includes(filter))
    : allLessons;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Trilha de Aprendizado</h2>
          <p className="text-sm text-muted-foreground">
            Sobrescreve título, XP ou resumo de qualquer lição. Esconde lições sem apagar o código.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Input placeholder="Filtrar lições..." value={filter}
            onChange={(e) => setFilter(e.target.value)} className="w-44" />
          <Button onClick={persist} disabled={!loaded || saving}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Salvando..." : "Salvar tudo"}
          </Button>
        </div>
      </div>

      {!loaded && <p className="text-sm text-muted-foreground">A carregar...</p>}
      <div className="space-y-2">
        {loaded && filtered.map((l) => {
          const o = overrides[l.id] ?? {};
          const dirty = Object.keys(o).length > 0;
          return (
            <Card key={l.id} className={cn("border-border/60", dirty && "border-primary/40 bg-primary/5")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-[10px]">{l.id}</Badge>
                    <span className="text-xs text-muted-foreground">Nível {l.levelId} · {l.levelTitle}</span>
                    {o.hidden && <Badge variant="destructive" className="text-[10px]">Oculta</Badge>}
                    {dirty && <Badge className="text-[10px] bg-primary/20 text-primary">Modificada</Badge>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setOverrides((prev) => { const n = { ...prev }; delete n[l.id]; return n; });
                  }} disabled={!dirty}>Resetar</Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Título</Label>
                    <Input value={o.title ?? ""} placeholder={l.title}
                      onChange={(e) => update(l.id, { title: e.target.value || undefined })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">XP (padrão: {l.xp})</Label>
                    <Input type="number" value={o.xp ?? ""} placeholder={String(l.xp)}
                      onChange={(e) => update(l.id, { xp: e.target.value === "" ? undefined : Number(e.target.value) })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Resumo</Label>
                    <Textarea rows={2} value={o.summary ?? ""} placeholder={l.summary}
                      onChange={(e) => update(l.id, { summary: e.target.value || undefined })} />
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={Boolean(o.hidden)}
                      onChange={(e) => update(l.id, { hidden: e.target.checked || undefined })} />
                    Ocultar esta lição para os alunos
                  </label>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
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
  order: 99, title: "", author: "TradeAcademy", cover: "BookOpen",
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
const VIDEO_LEVELS: VideoLesson["level"][] = ["Iniciante", "Intermediário", "Avançado"];

const BLANK_VIDEO: Omit<VideoLesson, "id"> = {
  creator: "", title: "", level: "Iniciante", youtubeUrl: "",
  description: "", requiredXp: undefined, order: 99, duration: "",
};

function VideosTab() {
  const [videos, setVideos]   = useState<VideoLesson[]>([]);
  const [loaded, setLoaded]   = useState(false);
  const [editing, setEditing] = useState<VideoLesson | null>(null);
  const [isNew, setIsNew]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    api.admin.getVideos()
      .then((r) => { setVideos((r as VideoLesson[]).sort((a, b) => a.order - b.order)); setLoaded(true); })
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

  const editYtId = editing?.youtubeUrl ? extractYouTubeId(editing.youtubeUrl) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Vídeo Aulas</h2>
          <p className="text-sm text-muted-foreground">
            {videos.length} vídeo{videos.length !== 1 ? "s" : ""} · Adiciona aulas do YouTube para os alunos
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
              Cole a URL do YouTube — o player será incorporado internamente na plataforma.
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
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">URL do vídeo no YouTube</Label>
                <div className="flex gap-2">
                  <Input value={editing.youtubeUrl} placeholder="https://www.youtube.com/watch?v=..."
                    onChange={(e) => setEditing({ ...editing, youtubeUrl: e.target.value })} className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => setPreview(editYtId)}
                    disabled={!editYtId}>
                    Pré-visualizar
                  </Button>
                </div>
                {editing.youtubeUrl && !editYtId && (
                  <p className="text-[11px] text-destructive mt-1">URL inválido — verifique o formato do link YouTube.</p>
                )}
                {editYtId && (
                  <p className="text-[11px] text-bull mt-1">ID detectado: <span className="font-mono">{editYtId}</span></p>
                )}
              </div>

              {/* Preview */}
              {preview && editYtId && (
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1 block">Pré-visualização</Label>
                  <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: "16/9", maxWidth: 480 }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${editYtId}?rel=0`}
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
                <strong className="text-foreground">Aviso:</strong> Ao adicionar um vídeo do YouTube, o conteúdo
                pertence ao criador original. O sistema apresenta uma nota automática de autoria aos alunos.
                Certifica-te de que tens permissão ou que o vídeo é de acesso público.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCommit} disabled={saving || !editing.title || !editing.creator || !editYtId}>
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
              Adiciona vídeos do YouTube para os alunos assistirem directamente na plataforma com o player interno.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Video list */}
      {loaded && videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((v, i) => {
            const ytId = extractYouTubeId(v.youtubeUrl);
            return (
              <Card key={v.id} className="border-border/60">
                <CardContent className="flex items-center gap-3 p-3">
                  {/* Thumbnail */}
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                    {ytId ? (
                      <img src={thumbnailUrl(ytId)} alt={v.title}
                        className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <PlayCircle className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{v.title}</span>
                      <Badge className={cn("text-[10px]", LEVEL_COLORS[v.level])}>{v.level}</Badge>
                      {v.requiredXp && (
                        <Badge variant="outline" className="text-[10px]">
                          <Lock className="h-2.5 w-2.5 mr-0.5" />{v.requiredXp} XP
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.creator}</p>
                    {v.duration && <p className="text-[11px] text-muted-foreground/60 font-mono">{v.duration}</p>}
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
      )}
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
        <p className="text-sm text-muted-foreground">Gestão manual de pagamentos — 5.000 AOA/mês</p>
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
 * Admin sidebar navigation
 * ========================================================================= */
const NAV_ITEMS = [
  { id: "overview",       label: "Dashboard",             icon: BarChart3,      group: "negocio" },
  { id: "subscriptions",  label: "Subscrições",           icon: CreditCard,     group: "negocio" },
  { id: "users",          label: "Alunos",                icon: Users,          group: "negocio" },
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
export default function Admin() {
  useSEO({ title: "Painel de Gestão — TradeAcademy", noindex: true });
  const navigate                  = useNavigate();
  const { token, logout }         = useAdminStore();
  const [active, setActive]       = useState<NavId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);

  if (!token) return <AdminLogin />;

  function handleLogout() { logout(); toast.success("Sessão encerrada"); }

  const TABS: Record<NavId, React.ReactNode> = {
    overview:      <OverviewTab />,
    subscriptions: <SubscriptionsTab />,
    users:         <UsersTab />,
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
            <img src="/logo-transparent.png" alt="TradeAcademy" className="w-8 h-8 object-contain" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-sm font-bold leading-none tracking-tight">Admin</div>
              <div className="text-[10px] text-muted-foreground tracking-wide mt-0.5">TradeAcademy</div>
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
          {/* Negócio */}
          {sidebarOpen && (
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Negócio</p>
          )}
          <div className="space-y-0.5 mb-2">
            {NAV_ITEMS.filter((n) => n.group === "negocio").map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                  active === item.id
                    ? "bg-sidebar-accent text-primary font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </div>
          {/* Conteúdo */}
          {sidebarOpen && (
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Conteúdo</p>
          )}
          {!sidebarOpen && <div className="my-1.5 border-t border-border/40 mx-1" />}
          <div className="space-y-0.5">
            {NAV_ITEMS.filter((n) => n.group === "conteudo").map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                  active === item.id
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
              {NAV_ITEMS.find((n) => n.id === active)?.label ?? "Administração"}
            </span>
            <Badge variant="outline" className="ml-1 text-[10px]">ADMIN</Badge>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-6xl">
          {TABS[active]}
        </main>
      </div>
    </div>
  );
}
