import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, LogOut, Users, LineChart as LineChartIcon, BookOpen, Activity,
  Trash2, RotateCcw, Search, Save, AlertTriangle, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { useAdminStore } from "@/store/useAdminStore";
import { api } from "@/lib/apiClient";
import { LEVELS } from "@/data/curriculum";

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
              <Input
                id="adminpw"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
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
function fmtUsd(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "USD" });
}
function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}
function fmtDate(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("pt-BR");
}

/* =========================================================================
 * Overview tab
 * ========================================================================= */
function OverviewTab() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.admin.overview>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.admin.overview().then(setData).catch((e) => setErr(String(e)));
  }, []);

  if (err) return <p className="text-sm text-destructive">{err}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">A carregar...</p>;

  const cards: { label: string; value: string; hint?: string }[] = [
    { label: "Usuários",         value: String(data.totals.users) },
    { label: "Trades fechados",  value: String(data.totals.trades) },
    { label: "Duelos",           value: String(data.totals.duelos) },
    { label: "Notificações",     value: String(data.totals.notifications) },
    { label: "XP médio",         value: data.learning.avgXp.toFixed(0), hint: `total ${data.learning.totalXp}` },
    { label: "Lições concluídas",value: String(data.learning.totalLessonsCompleted) },
    { label: "Streak médio",     value: data.learning.avgStreak.toFixed(1) + " d" },
    { label: "Win rate sim.",    value: fmtPct(data.simulator.winRate),
      hint: `${data.simulator.wins} W · ${data.simulator.losses} L · ${data.simulator.liquidations} liq.` },
    { label: "P&L agregado",     value: fmtUsd(data.simulator.totalPnl) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight">{c.value}</p>
            {c.hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{c.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* =========================================================================
 * Users tab
 * ========================================================================= */
type AdminUser = Awaited<ReturnType<typeof api.admin.users>>[number];

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    setUsers(null);
    setUsers(await api.admin.users());
  }
  useEffect(() => { reload().catch(() => toast.error("Erro ao carregar usuários")); }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q),
    );
  }, [users, filter]);

  async function action(label: string, fn: () => Promise<unknown>, userId: string, confirmMsg: string) {
    if (!window.confirm(confirmMsg)) return;
    setBusy(userId + label);
    try {
      await fn();
      toast.success(`${label} concluído`);
      await reload();
    } catch (e) {
      toast.error(`Falha: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>{users?.length ?? 0} contas registradas</CardDescription>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nome ou e-mail…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-7"
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead className="text-right">XP</TableHead>
              <TableHead className="text-right">Lições</TableHead>
              <TableHead className="text-right">Streak</TableHead>
              <TableHead className="text-right">Saldo sim.</TableHead>
              <TableHead>Última atividade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                Nenhum usuário.
              </TableCell></TableRow>
            )}
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email || "—"}</div>
                </TableCell>
                <TableCell className="text-right font-mono">{u.xp}</TableCell>
                <TableCell className="text-right font-mono">{u.completedLessons}</TableCell>
                <TableCell className="text-right font-mono">{u.streakDays}</TableCell>
                <TableCell className="text-right font-mono">{fmtUsd(u.simCashBalance)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.lastActivityDay ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      size="sm" variant="ghost" title="Resetar progresso"
                      disabled={busy === u.id + "Reset progresso"}
                      onClick={() => action("Reset progresso", () => api.admin.resetUserProgress(u.id), u.id,
                        `Resetar todo o progresso de ${u.email}?`)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" title="Resetar simulador"
                      disabled={busy === u.id + "Reset simulador"}
                      onClick={() => action("Reset simulador", () => api.admin.resetUserSim(u.id), u.id,
                        `Apagar todos os trades de ${u.email}?`)}
                    >
                      <LineChartIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                      title="Excluir usuário"
                      disabled={busy === u.id + "Excluir"}
                      onClick={() => action("Excluir", () => api.admin.deleteUser(u.id), u.id,
                        `EXCLUIR DEFINITIVAMENTE ${u.email}? Esta ação não pode ser desfeita.`)}
                    >
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
  );
}

/* =========================================================================
 * Curriculum editor tab — overrides applied on top of static LEVELS.
 * ========================================================================= */
type LessonOverride = { title?: string; summary?: string; xp?: number; hidden?: boolean };

function CurriculumTab() {
  const [overrides, setOverrides] = useState<Record<string, LessonOverride>>({});
  const [loaded, setLoaded] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api.admin.getCurriculumOverride()
      .then((r) => {
        setOverrides((r.value?.lessons as Record<string, LessonOverride>) ?? {});
        setLoaded(true);
      })
      .catch(() => { toast.error("Erro ao carregar overrides"); setLoaded(true); });
  }, []);

  function update(lessonId: string, patch: Partial<LessonOverride>) {
    setOverrides((prev) => ({ ...prev, [lessonId]: { ...prev[lessonId], ...patch } }));
  }

  async function persist() {
    setSavingId("__all__");
    try {
      // Strip empty entries
      const cleaned: Record<string, LessonOverride> = {};
      for (const [id, o] of Object.entries(overrides)) {
        const hasAny = Object.values(o).some((v) => v !== undefined && v !== "");
        if (hasAny) cleaned[id] = o;
      }
      await api.admin.saveCurriculumOverride({ lessons: cleaned });
      setOverrides(cleaned);
      toast.success("Overrides salvos");
    } catch {
      toast.error("Falha ao salvar");
    } finally {
      setSavingId(null);
    }
  }

  function reset(lessonId: string) {
    setOverrides((prev) => {
      const n = { ...prev };
      delete n[lessonId];
      return n;
    });
  }

  const allLessons = LEVELS.flatMap((lvl) =>
    lvl.lessons.map((l) => ({ ...l, levelTitle: lvl.title, levelId: lvl.id })),
  );
  const filtered = filter
    ? allLessons.filter((l) => l.title.toLowerCase().includes(filter.toLowerCase()) || l.id.includes(filter))
    : allLessons;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Editor de currículo</CardTitle>
          <CardDescription>
            Sobrescreve título, resumo, XP ou esconde lições. Os textos originais ficam intactos no código —
            estes ajustes vivem em <code className="font-mono">admin_settings</code>.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filtrar..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-44"
          />
          <Button onClick={persist} disabled={!loaded || savingId === "__all__"}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Salvar tudo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!loaded && <p className="text-sm text-muted-foreground">A carregar...</p>}
        {loaded && filtered.map((l) => {
          const o = overrides[l.id] ?? {};
          const dirty = Object.keys(o).length > 0;
          return (
            <div key={l.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">{l.id}</Badge>
                    <span className="text-xs text-muted-foreground">Nível {l.levelId} · {l.levelTitle}</span>
                    {o.hidden && <Badge variant="destructive" className="text-[10px]">Oculta</Badge>}
                    {dirty && <Badge className="text-[10px]">Modificada</Badge>}
                  </div>
                  <div className="mt-1 text-sm font-medium">{o.title ?? l.title}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => reset(l.id)} disabled={!dirty}>
                  Resetar
                </Button>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div>
                  <Label className="text-xs">Título (sobrescrita)</Label>
                  <Input
                    value={o.title ?? ""}
                    placeholder={l.title}
                    onChange={(e) => update(l.id, { title: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <Label className="text-xs">XP (sobrescrita)</Label>
                  <Input
                    type="number"
                    value={o.xp ?? ""}
                    placeholder={String(l.xp)}
                    onChange={(e) => update(l.id, { xp: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Resumo (sobrescrita)</Label>
                  <Textarea
                    rows={2}
                    value={o.summary ?? ""}
                    placeholder={l.summary}
                    onChange={(e) => update(l.id, { summary: e.target.value || undefined })}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(o.hidden)}
                    onChange={(e) => update(l.id, { hidden: e.target.checked || undefined })}
                  />
                  Esconder esta lição dos alunos
                </label>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* =========================================================================
 * Simulator monitor tab
 * ========================================================================= */
function SimulatorTab() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.admin.simulator>> | null>(null);

  useEffect(() => {
    api.admin.simulator().then(setData).catch(() => toast.error("Erro ao carregar simulador"));
  }, []);

  if (!data) return <p className="text-sm text-muted-foreground">A carregar...</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" /> Leaderboard (P&L)
          </CardTitle>
          <CardDescription>Top traders por P&L acumulado</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="text-right">Trades</TableHead>
                <TableHead className="text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.leaderboard.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  Sem trades ainda.
                </TableCell></TableRow>
              )}
              {data.leaderboard.map((r, i) => (
                <TableRow key={r.userId}>
                  <TableCell className="font-mono">{i + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{r.trades}</TableCell>
                  <TableCell className={`text-right font-mono ${r.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                    {fmtUsd(r.pnl)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Trades recentes
          </CardTitle>
          <CardDescription>Últimos 50 trades fechados</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Símbolo</TableHead>
                <TableHead>Lado</TableHead>
                <TableHead className="text-right">Tam.</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Fechado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recent.map((t) => {
                const tt = t as Record<string, unknown>;
                const pnl = Number(tt.pnl ?? 0);
                return (
                  <TableRow key={String(tt.id)}>
                    <TableCell className="font-mono text-xs">{String(tt.symbol)}</TableCell>
                    <TableCell>
                      <Badge variant={tt.side === "buy" ? "default" : "secondary"} className="text-[10px]">
                        {String(tt.side)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{Number(tt.size).toFixed(4)}</TableCell>
                    <TableCell className={`text-right font-mono ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                      {fmtUsd(pnl)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {tt.reason === "liquidation"
                        ? <span className="inline-flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-3 w-3" /> liquidação
                          </span>
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
  );
}

/* =========================================================================
 * Main Admin shell
 * ========================================================================= */
export default function Admin() {
  const navigate = useNavigate();
  const { token, logout } = useAdminStore();

  if (!token) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary shadow-glow">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight">Painel de Administração</h1>
          <Badge variant="outline" className="ml-2 text-[10px]">ADMIN</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => navigate("/dashboard")}>
            Voltar ao app
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { logout(); toast.success("Sessão admin encerrada"); }}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview"><Activity className="mr-1.5 h-3.5 w-3.5" />Visão geral</TabsTrigger>
            <TabsTrigger value="users"><Users className="mr-1.5 h-3.5 w-3.5" />Usuários</TabsTrigger>
            <TabsTrigger value="curriculum"><BookOpen className="mr-1.5 h-3.5 w-3.5" />Currículo</TabsTrigger>
            <TabsTrigger value="simulator"><LineChartIcon className="mr-1.5 h-3.5 w-3.5" />Simulador</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="curriculum"><CurriculumTab /></TabsContent>
          <TabsContent value="simulator"><SimulatorTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
