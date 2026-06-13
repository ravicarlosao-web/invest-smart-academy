// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Crown, Users, Shield, GraduationCap, Settings, ChevronRight,
  LogOut, Home, Search, Zap, BookOpen, TrendingUp, BarChart3,
  UserPlus, Trash2, RefreshCw, Globe, DollarSign, CheckCircle2,
  AlertCircle, ExternalLink, Building2, Layers, Eye, EyeOff,
  Save, X, ArrowUpRight, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type MasterNav = "overview" | "equipa" | "utilizadores" | "plataforma";
type MUser = Awaited<ReturnType<typeof api.admin.users>>[number];

const ROLE_COLORS: Record<string, string> = {
  master:        "bg-amber-500/20 text-amber-300 border-amber-500/30",
  administrador: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  professor:     "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  aluno:         "bg-zinc-700/50 text-zinc-400 border-zinc-600/30",
};
const ROLE_LABELS: Record<string, string> = {
  master: "Master", administrador: "Admin", professor: "Professor", aluno: "Aluno",
};

function RoleChip({ role }: { role?: string }) {
  const r = role ?? "aluno";
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
      ROLE_COLORS[r] ?? ROLE_COLORS.aluno,
    )}>
      {ROLE_LABELS[r] ?? r}
    </span>
  );
}

/* ─── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({
  label, value, sub, icon: Icon, accent = false,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-4 flex gap-3 items-start",
      accent
        ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5"
        : "border-zinc-800 bg-zinc-900/60",
    )}>
      <div className={cn(
        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        accent ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400",
      )}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-500 leading-none mb-1">{label}</p>
        <p className={cn("text-2xl font-bold leading-none", accent ? "text-amber-300" : "text-zinc-100")}>
          {value}
        </p>
        {sub && <p className="mt-1 text-[11px] text-zinc-500">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Visão Geral Tab ────────────────────────────────────────────────────── */
function VisaoGeralTab() {
  const authUser = useAuthStore((s) => s.user);
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<MUser[] | null>(null);
  const [subStats, setSubStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.admin.overview().then(setOverview).catch(() => null),
      api.admin.users().then(setUsers).catch(() => null),
      api.adminSubscriptions.stats().then(setSubStats).catch(() => null),
    ]);
  }, []);

  const roleCounts = useMemo(() => {
    if (!users) return { administrador: 0, professor: 0, aluno: 0 };
    return {
      administrador: users.filter((u) => u.role === "administrador").length,
      professor:     users.filter((u) => u.role === "professor").length,
      aluno:         users.filter((u) => u.role === "aluno" || !u.role).length,
    };
  }, [users]);

  const recentUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).slice(0, 6);
  }, [users]);

  const displayName = authUser?.name || authUser?.email?.split("@")[0] || "Master";

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-100">
              Bem-vindo, {displayName}
            </h1>
            <p className="text-sm text-zinc-500">
              Controlo total da plataforma ALUKA · Acesso Master
            </p>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Utilizadores Totais" value={overview?.totals?.users ?? "—"} icon={Users} accent />
        <StatCard label="Administradores" value={roleCounts.administrador} icon={Shield} sub={`${roleCounts.professor} professores`} />
        <StatCard label="Subscrições Activas" value={subStats?.active ?? "—"} icon={CheckCircle2} sub={`${subStats?.pending ?? 0} pendentes`} />
        <StatCard label="Total XP (plataforma)" value={overview?.learning?.totalXp != null ? Number(overview.learning.totalXp).toLocaleString("pt") : "—"} icon={Zap} sub={`Média: ${overview?.learning?.avgXp ?? "—"} XP/user`} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Lições Concluídas" value={overview?.learning?.totalLessonsCompleted ?? "—"} icon={BookOpen} />
        <StatCard label="Streak Médio" value={overview?.learning?.avgStreak != null ? `${Number(overview.learning.avgStreak).toFixed(1)} dias` : "—"} icon={Activity} />
        <StatCard label="Trades Executados" value={overview?.totals?.trades ?? "—"} icon={TrendingUp} />
      </div>

      {/* Recent registrations */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-200">Registos Recentes</h3>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {!users && (
            <p className="px-4 py-6 text-center text-sm text-zinc-600">A carregar…</p>
          )}
          {recentUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                {(u.name || u.email || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200 truncate">{u.name || "—"}</p>
                <p className="text-xs text-zinc-500 truncate">{u.email || "—"}</p>
              </div>
              <RoleChip role={u.role} />
              <span className="text-[11px] text-zinc-600 shrink-0">
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt") : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Equipa Tab ─────────────────────────────────────────────────────────── */
function EquipaTab() {
  const [users, setUsers] = useState<MUser[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState<"administrador" | "professor" | null>(null);
  const [query, setQuery] = useState("");

  // Modal de criação de nova conta
  const [creating, setCreating] = useState<"administrador" | "professor" | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [createBusy, setCreateBusy] = useState(false);
  const [showCreatePw, setShowCreatePw] = useState(false);

  async function reload() {
    setUsers(null);
    setUsers(await api.admin.users());
  }
  useEffect(() => { reload().catch(() => toast.error("Erro ao carregar utilizadores")); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!creating) return;
    setCreateBusy(true);
    try {
      await api.admin.createAccount({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: creating,
      });
      toast.success(`Conta de ${ROLE_LABELS[creating]} criada com sucesso`);
      setCreating(null);
      setCreateForm({ name: "", email: "", password: "" });
      await reload();
    } catch (err: any) {
      const msg = err?.body?.message ?? err?.message ?? "Erro ao criar conta";
      toast.error(msg);
    } finally {
      setCreateBusy(false);
    }
  }

  const admins   = useMemo(() => users?.filter((u) => u.role === "administrador") ?? [], [users]);
  const profs    = useMemo(() => users?.filter((u) => u.role === "professor") ?? [], [users]);
  const eligible = useMemo(() => {
    if (!users || !adding) return [];
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.role !== "master" && u.role !== adding)
      .filter((u) => !q || (u.name?.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q)));
  }, [users, adding, query]);

  async function promote(userId: string, role: string) {
    setBusy(userId);
    try {
      await api.admin.updateUserRole(userId, role);
      toast.success(`Role ${ROLE_LABELS[role]} atribuído`);
      await reload();
    } catch (e) { toast.error(String(e)); }
    finally { setBusy(null); }
  }

  async function demote(userId: string, name: string) {
    if (!window.confirm(`Remover acesso de ${name || userId}?`)) return;
    setBusy(userId);
    try {
      await api.admin.updateUserRole(userId, "aluno");
      toast.success("Acesso removido");
      await reload();
    } catch (e) { toast.error(String(e)); }
    finally { setBusy(null); }
  }

  function TeamSection({
    title, icon: Icon, color, list, roleKey, addLabel,
  }: {
    title: string; icon: React.ElementType; color: string;
    list: MUser[]; roleKey: "administrador" | "professor"; addLabel: string;
  }) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", color)} />
            <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{list.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 border border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100"
              onClick={() => { setAdding(roleKey); setQuery(""); }}
            >
              <UserPlus className="h-3.5 w-3.5" /> {addLabel}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 border border-amber-700/50 text-amber-400 hover:border-amber-500/70 hover:text-amber-300"
              onClick={() => { setCreating(roleKey); setCreateForm({ name: "", email: "", password: "" }); }}
              title="Criar nova conta com e-mail e password"
            >
              <UserPlus className="h-3.5 w-3.5" /> Criar conta
            </Button>
          </div>
        </div>

        {!users && (
          <p className="px-4 py-6 text-center text-sm text-zinc-600">A carregar…</p>
        )}
        {users && list.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-600">
            Nenhum {title.toLowerCase()} ainda.
          </p>
        )}
        <div className="divide-y divide-zinc-800/60">
          {list.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-xs font-bold text-zinc-400">
                {(u.name || u.email || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200 truncate">{u.name || "—"}</p>
                <p className="text-xs text-zinc-500 truncate">{u.email}</p>
              </div>
              <div className="text-right text-xs text-zinc-600">
                <p>{u.xp} XP</p>
              </div>
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                title="Remover acesso"
                disabled={busy === u.id}
                onClick={() => demote(u.id, u.name ?? u.email ?? "")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TeamSection
        title="Administradores"
        icon={Shield}
        color="text-violet-400"
        list={admins}
        roleKey="administrador"
        addLabel="Adicionar Admin"
      />
      <TeamSection
        title="Professores"
        icon={GraduationCap}
        color="text-cyan-400"
        list={profs}
        roleKey="professor"
        addLabel="Adicionar Professor"
      />

      {/* Modal: promover utilizador existente */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-amber-400" />
                <h3 className="font-semibold text-zinc-100">
                  Promover utilizador a {ROLE_LABELS[adding]}
                </h3>
              </div>
              <button onClick={() => setAdding(null)} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 border-b border-zinc-800/60">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                <Input
                  placeholder="Pesquisar por nome ou e-mail…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-zinc-800/60">
              {eligible.length === 0 && (
                <p className="py-8 text-center text-sm text-zinc-600">
                  {query ? "Nenhum resultado encontrado." : "Todos os utilizadores já têm este role."}
                </p>
              )}
              {eligible.map((u) => (
                <button
                  key={u.id}
                  disabled={busy === u.id}
                  onClick={() => promote(u.id, adding)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/60 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                    {(u.name || u.email || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200 truncate">{u.name || "—"}</p>
                    <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <RoleChip role={u.role} />
                  {busy === u.id && <RefreshCw className="h-3.5 w-3.5 animate-spin text-zinc-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: criar nova conta admin/professor */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-amber-400" />
                <h3 className="font-semibold text-zinc-100">
                  Criar conta de {ROLE_LABELS[creating]}
                </h3>
              </div>
              <button onClick={() => { setCreating(null); setCreateForm({ name: "", email: "", password: "" }); }}
                className="text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Nome completo</label>
                <Input
                  placeholder="Ex: Ana Silva"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                  className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">E-mail</label>
                <Input
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Password</label>
                <div className="relative">
                  <Input
                    type={showCreatePw ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    minLength={6}
                    className="pr-10 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showCreatePw
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-600">
                Esta conta poderá fazer login em <strong className="text-zinc-500">/admin/entrar</strong> com as credenciais acima.
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 border border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  onClick={() => { setCreating(null); setCreateForm({ name: "", email: "", password: "" }); }}
                  disabled={createBusy}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createBusy || !createForm.name || !createForm.email || createForm.password.length < 6}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                >
                  {createBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Criar conta"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Utilizadores Tab ───────────────────────────────────────────────────── */
function UtilizadoresTab() {
  const [users, setUsers] = useState<MUser[] | null>(null);
  const [filter, setFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  async function reload() {
    setUsers(null);
    setUsers(await api.admin.users());
  }
  useEffect(() => { reload().catch(() => toast.error("Erro")); }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = filter.trim().toLowerCase();
    return users.filter((u) => {
      const matchRole = roleFilter === "todos" || u.role === roleFilter || (!u.role && roleFilter === "aluno");
      const matchQ = !q || (u.name?.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q));
      return matchRole && matchQ;
    });
  }, [users, filter, roleFilter]);

  const counts = useMemo(() => {
    if (!users) return {};
    return users.reduce<Record<string, number>>((acc, u) => {
      const r = u.role || "aluno";
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    }, {});
  }, [users]);

  async function changeRole(userId: string, role: string) {
    setChangingRole(userId);
    try {
      await api.admin.updateUserRole(userId, role);
      toast.success(`Role atualizado para ${ROLE_LABELS[role] ?? role}`);
      await reload();
    } catch (e) { toast.error(String(e)); }
    finally { setChangingRole(null); }
  }

  const ROLES_FILTER = ["todos", "master", "administrador", "professor", "aluno"];

  return (
    <div className="space-y-4">
      {/* Stats pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([role, count]) => (
          <span key={role} className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
            ROLE_COLORS[role] ?? ROLE_COLORS.aluno,
          )}>
            {ROLE_LABELS[role] ?? role} · {count}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
          <Input
            placeholder="Pesquisar…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600"
          />
        </div>
        <div className="flex gap-1">
          {ROLES_FILTER.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                roleFilter === r
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                  : "border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600",
              )}
            >
              {r === "todos" ? "Todos" : ROLE_LABELS[r] ?? r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-500">Utilizador</TableHead>
                <TableHead className="text-zinc-500">Role</TableHead>
                <TableHead className="text-right text-zinc-500">XP</TableHead>
                <TableHead className="text-right text-zinc-500">Lições</TableHead>
                <TableHead className="text-zinc-500">Último acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!users && (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={5} className="text-center text-zinc-600 py-8">A carregar…</TableCell>
                </TableRow>
              )}
              {users && filtered.length === 0 && (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={5} className="text-center text-zinc-600 py-8">Nenhum utilizador encontrado.</TableCell>
                </TableRow>
              )}
              {filtered.map((u) => (
                <TableRow key={u.id} className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableCell>
                    <div className="font-medium text-zinc-200">{u.name || "—"}</div>
                    <div className="text-xs text-zinc-500">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <RoleChip role={u.role} />
                      {u.role !== "master" && (
                        <select
                          value={u.role ?? "aluno"}
                          disabled={changingRole === u.id}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className="h-6 rounded border border-zinc-700 bg-zinc-900 px-1 text-[10px] text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
                        >
                          <option value="aluno">Aluno</option>
                          <option value="professor">Professor</option>
                          <option value="administrador">Administrador</option>
                        </select>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-300 text-sm">{u.xp}</TableCell>
                  <TableCell className="text-right font-mono text-zinc-400 text-sm">{u.completedLessons}</TableCell>
                  <TableCell className="text-xs text-zinc-600">{u.lastActivityDay ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

/* ─── Plataforma Tab ─────────────────────────────────────────────────────── */
function PlataformaTab() {
  const [seo, setSeo] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingSeo, setSavingSeo] = useState(false);
  const [planName, setPlanName] = useState("");
  const [priceAoa, setPriceAoa] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [siteDesc, setSiteDesc] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.admin.getSeoConfig().then((d) => {
      setSeo(d);
      setSiteTitle(d.title ?? "");
      setSiteDesc(d.description ?? "");
    }).catch(() => null);
    api.admin.getPlanConfig().then((d) => {
      setPlan(d);
      setPlanName(d.planName ?? "");
      setPriceAoa(String(d.priceAoa ?? ""));
    }).catch(() => null);
  }, []);

  async function savePlanCfg() {
    setSavingPlan(true);
    try {
      await api.admin.savePlanConfig({ planName, priceAoa: Number(priceAoa) });
      toast.success("Configuração do plano guardada");
    } catch (e) { toast.error(String(e)); }
    finally { setSavingPlan(false); }
  }

  async function saveSeoCfg() {
    setSavingSeo(true);
    try {
      await api.admin.saveSeoConfig({ title: siteTitle, description: siteDesc });
      toast.success("Configuração da plataforma guardada");
    } catch (e) { toast.error(String(e)); }
    finally { setSavingSeo(false); }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Identity */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <Globe className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Identidade da Plataforma</h3>
          <span className="ml-auto rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] text-amber-400">White-Label</span>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Título do Site</Label>
            <Input
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="ALUKA — Aprende a Investir"
              className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600"
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Descrição do Site</Label>
            <textarea
              value={siteDesc}
              onChange={(e) => setSiteDesc(e.target.value)}
              rows={3}
              placeholder="Descrição da plataforma para SEO e redes sociais…"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>
          <Button
            onClick={saveSeoCfg} disabled={savingSeo}
            className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold"
            size="sm"
          >
            {savingSeo ? <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Guardar Identidade
          </Button>
        </div>
      </div>

      {/* Plan / Pricing */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <DollarSign className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Plano & Preços</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-zinc-400 mb-1.5 block">Nome do Plano</Label>
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Plano Premium"
                className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400 mb-1.5 block">Preço (AOA / mês)</Label>
              <Input
                type="number"
                value={priceAoa}
                onChange={(e) => setPriceAoa(e.target.value)}
                placeholder="0"
                className="bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600"
              />
            </div>
          </div>
          <Button
            onClick={savePlanCfg} disabled={savingPlan}
            className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold"
            size="sm"
          >
            {savingPlan ? <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Guardar Plano
          </Button>
        </div>
      </div>

      {/* Quick access */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <Layers className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Acesso Rápido</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/ta-painel-gestao")}
            className="flex items-center gap-3 rounded-lg border border-zinc-700 p-3 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors text-left group"
          >
            <Shield className="h-5 w-5 text-violet-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Painel Admin</p>
              <p className="text-xs text-zinc-500">Gestão completa</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-zinc-600 ml-auto group-hover:text-zinc-400 transition-colors" />
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 rounded-lg border border-zinc-700 p-3 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors text-left group"
          >
            <Home className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-zinc-200">App de Alunos</p>
              <p className="text-xs text-zinc-500">Ver como aluno</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-zinc-600 ml-auto group-hover:text-zinc-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Navigation items ───────────────────────────────────────────────────── */
const MASTER_NAV: Array<{ id: MasterNav; label: string; icon: React.ElementType; sub?: string }> = [
  { id: "overview",     label: "Visão Geral",   icon: BarChart3,     sub: "KPIs & actividade" },
  { id: "equipa",       label: "Equipa",         icon: Users,         sub: "Admins & Professores" },
  { id: "utilizadores", label: "Utilizadores",   icon: Shield,        sub: "Gestão de roles" },
  { id: "plataforma",   label: "Plataforma",     icon: Building2,     sub: "White-label" },
];

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function MasterPanel() {
  useSEO({ title: "Master Control — ALUKA", noindex: true });
  const navigate  = useNavigate();
  const authUser  = useAuthStore((s) => s.user);
  const logout    = useAuthStore((s) => s.logout);

  const [active, setActive] = useState<MasterNav>("overview");
  const [collapsed, setCollapsed] = useState(false);

  if (!authUser || authUser.role !== "master") {
    return <Navigate to="/master/entrar" replace />;
  }

  const TABS: Record<MasterNav, React.ReactNode> = {
    overview:     <VisaoGeralTab />,
    equipa:       <EquipaTab />,
    utilizadores: <UtilizadoresTab />,
    plataforma:   <PlataformaTab />,
  };

  function handleLogout() {
    logout();
    navigate("/master/entrar", { replace: true });
    toast.success("Sessão Master encerrada");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#0a0b0e", color: "#e4e4e7" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "flex flex-col border-r transition-all duration-200",
          collapsed ? "w-[60px]" : "w-[220px]",
        )}
        style={{ borderColor: "#1e1e24", background: "#0d0d11" }}
      >
        {/* Logo */}
        <div
          className="flex h-14 items-center gap-2.5 border-b px-3"
          style={{ borderColor: "#1e1e24" }}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            <Crown className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-100 leading-none tracking-tight">Master Control</div>
              <div className="text-[10px] text-amber-500/70 tracking-wide mt-0.5">ALUKA</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-zinc-600 hover:text-zinc-300 transition-colors p-0.5 rounded"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", !collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-1.5 space-y-0.5">
          {MASTER_NAV.map((item) => {
            const active_ = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm transition-colors text-left",
                  active_
                    ? "bg-amber-500/10 text-amber-300"
                    : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200",
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", active_ ? "text-amber-400" : "")} />
                {!collapsed && (
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-none">{item.label}</div>
                    {item.sub && <div className="text-[10px] text-zinc-600 mt-0.5">{item.sub}</div>}
                  </div>
                )}
                {!collapsed && active_ && (
                  <div className="ml-auto w-1 h-4 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}

          {/* Divider */}
          <div className="my-2 border-t" style={{ borderColor: "#1e1e24" }} />

          {/* Admin Panel shortcut */}
          <button
            onClick={() => navigate("/ta-painel-gestao")}
            title={collapsed ? "Painel Admin" : undefined}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm text-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-300 transition-colors"
          >
            <Shield className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="text-sm">Painel Admin</span>
                <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0" />
              </>
            )}
          </button>
        </nav>

        {/* Footer */}
        <div className="border-t p-1.5 space-y-0.5" style={{ borderColor: "#1e1e24" }}>
          <button
            onClick={() => navigate("/dashboard")}
            title={collapsed ? "Ver App" : undefined}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-300 transition-colors"
          >
            <Home className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Ver App</span>}
          </button>
          <button
            onClick={handleLogout}
            title={collapsed ? "Terminar Sessão" : undefined}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-red-500/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Terminar Sessão</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header
          className="sticky top-0 z-10 flex h-14 items-center justify-between border-b px-5"
          style={{ borderColor: "#1e1e24", background: "#0d0d11" }}
        >
          <div className="flex items-center gap-2.5">
            {(() => {
              const item = MASTER_NAV.find((n) => n.id === active);
              const Icon = item?.icon ?? BarChart3;
              return (
                <>
                  <Icon className="h-4 w-4 text-amber-400" />
                  <span className="font-semibold text-zinc-100 text-sm">{item?.label ?? "Master"}</span>
                  <span
                    className="ml-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400"
                  >
                    MASTER
                  </span>
                </>
              );
            })()}
          </div>
          <div className="flex items-center gap-2.5 text-xs text-zinc-500">
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            {authUser?.email}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          {TABS[active]}
        </main>
      </div>
    </div>
  );
}
