import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, LogOut, Users, LineChart as LineChartIcon, BookOpen, Activity,
  Trash2, RotateCcw, Search, Save, AlertTriangle, Trophy, Home,
  Compass, Library, BookMarked, BookText, Plus, Pencil, X, ChevronRight,
  BarChart3, GraduationCap, Star, ExternalLink, Tag, ChevronDown, ChevronUp,
  Coins,
} from "lucide-react";
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

/* =========================================================================
 * Login screen
 * ========================================================================= */
function AdminLogin() {
  const login = useAdminStore((s) => s.login);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await login(password);
    setLoading(false);
    if (!res.ok) toast.error(res.error ?? "Falha no login");
    else toast.success("Acesso liberado");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="mt-3">Painel de Administração</CardTitle>
          <CardDescription>Acesso restrito. Informe a senha de administrador.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="adminpw">Senha</Label>
              <Input id="adminpw" type="password" autoFocus value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A verificar..." : "Entrar"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Defina <code className="font-mono">ADMIN_PASSWORD</code> no servidor para alterar a senha.
            </p>
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
 * Overview tab
 * ========================================================================= */
function OverviewTab() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.admin.overview>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { api.admin.overview().then(setData).catch((e) => setErr(String(e))); }, []);

  if (err) return <p className="text-sm text-destructive p-4">{err}</p>;
  if (!data) return <p className="text-sm text-muted-foreground p-4">A carregar...</p>;

  const cards = [
    { label: "Alunos registados",    value: String(data.totals.users),         icon: Users,          color: "text-primary" },
    { label: "Trades fechados",      value: String(data.totals.trades),         icon: LineChartIcon,  color: "text-bull" },
    { label: "Duelos realizados",    value: String(data.totals.duelos),         icon: Trophy,         color: "text-warning" },
    { label: "XP médio / aluno",     value: data.learning.avgXp.toFixed(0),    icon: Star,           color: "text-yellow-400" },
    { label: "Lições concluídas",    value: String(data.learning.totalLessonsCompleted), icon: GraduationCap, color: "text-info" },
    { label: "Streak médio",         value: data.learning.avgStreak.toFixed(1) + " d", icon: BarChart3, color: "text-purple-400" },
    { label: "Win rate simulador",   value: fmtPct(data.simulator.winRate),    icon: Activity,       color: "text-bull",
      hint: `${data.simulator.wins}W · ${data.simulator.losses}L · ${data.simulator.liquidations} liq.` },
    { label: "P&L total agregado",   value: fmtUsd(data.simulator.totalPnl),   icon: Coins,
      color: data.simulator.totalPnl >= 0 ? "text-bull" : "text-bear" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Visão Geral</h2>
        <p className="text-sm text-muted-foreground">Métricas consolidadas da plataforma em tempo real.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-border/60">
            <CardContent className="p-4 flex items-start gap-3">
              <div className={cn("mt-0.5 rounded-md bg-muted p-2", c.color)}>
                <c.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{c.label}</p>
                <p className="font-mono text-xl font-bold tracking-tight">{c.value}</p>
                {c.hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{c.hint}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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

  async function action(label: string, fn: () => Promise<unknown>, userId: string, confirmMsg: string) {
    if (!window.confirm(confirmMsg)) return;
    setBusy(userId + label);
    try { await fn(); toast.success(`${label} concluído`); await reload(); }
    catch (e) { toast.error(`Falha: ${String(e)}`); }
    finally { setBusy(null); }
  }

  async function saveXp() {
    if (!editXp) return;
    const val = Number(newXp);
    if (isNaN(val) || val < 0) return toast.error("XP inválido");
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
 * Admin sidebar navigation
 * ========================================================================= */
const NAV_ITEMS = [
  { id: "overview",    label: "Visão Geral",    icon: BarChart3 },
  { id: "users",       label: "Alunos",          icon: Users },
  { id: "curriculum",  label: "Trilha de Aprendizado", icon: GraduationCap },
  { id: "strategies",  label: "Estratégias",     icon: Compass },
  { id: "books",       label: "Biblioteca",      icon: BookMarked },
  { id: "glossary",    label: "Glossário",       icon: BookText },
  { id: "resources",   label: "Recursos",        icon: Library },
  { id: "simulator",   label: "Simulador",       icon: LineChartIcon },
] as const;

type NavId = (typeof NAV_ITEMS)[number]["id"];

/* =========================================================================
 * Main Admin shell
 * ========================================================================= */
export default function Admin() {
  const navigate                  = useNavigate();
  const { token, logout }         = useAdminStore();
  const [active, setActive]       = useState<NavId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!token) return <AdminLogin />;

  function handleLogout() { logout(); toast.success("Sessão encerrada"); }

  const TABS: Record<NavId, React.ReactNode> = {
    overview:   <OverviewTab />,
    users:      <UsersTab />,
    curriculum: <CurriculumTab />,
    strategies: <StrategiesTab />,
    books:      <BooksTab />,
    glossary:   <GlossaryTab />,
    resources:  <ResourcesTab />,
    simulator:  <SimulatorTab />,
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Shield className="h-4 w-4 text-primary-foreground" />
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
        <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {NAV_ITEMS.map((item) => (
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
