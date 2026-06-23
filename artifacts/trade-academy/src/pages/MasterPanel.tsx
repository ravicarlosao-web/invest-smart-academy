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
  Save, X, ArrowUpRight, Activity, ClipboardList,
  Mail, Send, CheckCircle, AlertTriangle, Plug, Copy,
  ToggleLeft, ToggleRight, Share2, Brain, Lock, Loader2,
  Wifi, WifiOff, Image,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SeoConfig, SocialConfig } from "@/lib/apiClient";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ProfessorLogsTab } from "./ProfessorLogsTab";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type MasterNav = "overview" | "equipa" | "utilizadores" | "plataforma" | "logs" | "email" | "seo" | "social" | "integracoes" | "aluka-ia";
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

/* =========================================================================
 * Aluka IA tab — Google Gemini dual-model config (MASTER ONLY)
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
          <Brain className="h-5 w-5 text-amber-400" /> Aluka IA
        </h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          Configura os modelos Google Gemini para activar análise inteligente de trades e gráficos.
          Obtém a chave gratuitamente em{" "}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
            className="underline underline-offset-2 text-amber-400 hover:opacity-80">
            aistudio.google.com
          </a>{" "}— 1 500 requests/dia grátis.
        </p>
      </div>

      <Card className="border-zinc-700/60 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
            <Brain className="h-4 w-4 text-amber-400" />
            Gemini — Análise de Texto
            {aiCfg && (
              <Badge variant="outline" className={cn("ml-auto text-[10px] font-semibold",
                aiCfg.textConfigured ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5" : "border-zinc-700 text-zinc-500")}>
                {aiCfg.textConfigured ? "Chave configurada" : "Sem chave"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Analisa os dados de cada trade após ser fechado: entrada, saída, resultado e gestão de risco.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-zinc-200">Activar análise de texto</p>
              <p className="text-[11px] text-zinc-500">Feedback automático com IA após cada trade fechado</p>
            </div>
            <Switch checked={geminiTextEnabled} onCheckedChange={setGeminiTextEnabled} />
          </div>
          {aiCfg?.textConfigured && (
            <div className="rounded-md border border-zinc-700/50 bg-zinc-800/30 px-3 py-2.5 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span className="font-mono text-xs text-zinc-500 tracking-widest flex-1 truncate">{aiCfg.textKeyPreview}</span>
              <span className="text-[10px] text-zinc-500">chave actual</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="m-gemini-text-key" className="text-zinc-400">{aiCfg?.textConfigured ? "Substituir Gemini API Key (Texto)" : "Gemini API Key (Texto)"}</Label>
            <div className="relative max-w-sm">
              <Input id="m-gemini-text-key" type={showTextKey ? "text" : "password"}
                value={geminiTextKey} onChange={(e) => setGeminiTextKey(e.target.value)}
                placeholder="AIza..." className="pr-10 font-mono text-sm bg-zinc-800/50 border-zinc-700" autoComplete="off" spellCheck={false} />
              <button type="button" onClick={() => setShowTextKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors" tabIndex={-1}>
                {showTextKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">Deixa em branco para manter a chave existente.</p>
          </div>
          {aiTextStatus !== "idle" && (
            <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
              aiTextStatus === "ok" ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400" : "border-red-500/40 bg-red-500/5 text-red-400")}>
              {aiTextStatus === "ok" ? <Wifi className="h-4 w-4 shrink-0" /> : <WifiOff className="h-4 w-4 shrink-0" />}
              <span>{aiTextMsg}</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => testAiKey("text")}
            disabled={aiTesting !== null || aiSaving || (!aiCfg?.textConfigured && !geminiTextKey.trim())}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            {aiTesting === "text" || aiSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wifi className="mr-1.5 h-3.5 w-3.5" />}
            {aiTesting === "text" ? "A testar…" : aiSaving ? "A guardar…" : "Testar ligação"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-zinc-700/60 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
            <Image className="h-4 w-4 text-amber-400" />
            Gemini — Análise de Gráfico (Imagem)
            {aiCfg && (
              <Badge variant="outline" className={cn("ml-auto text-[10px] font-semibold",
                aiCfg.imageConfigured ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5" : "border-zinc-700 text-zinc-500")}>
                {aiCfg.imageConfigured ? "Chave configurada" : "Sem chave"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Analisa o screenshot do gráfico capturado pelo aluno. Identifica padrões, suportes e resistências.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-zinc-200">Activar análise de imagem</p>
              <p className="text-[11px] text-zinc-500">Análise visual do gráfico com um clique do aluno</p>
            </div>
            <Switch checked={geminiImageEnabled} onCheckedChange={setGeminiImageEnabled} />
          </div>
          {aiCfg?.imageConfigured && (
            <div className="rounded-md border border-zinc-700/50 bg-zinc-800/30 px-3 py-2.5 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span className="font-mono text-xs text-zinc-500 tracking-widest flex-1 truncate">{aiCfg.imageKeyPreview}</span>
              <span className="text-[10px] text-zinc-500">chave actual</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="m-gemini-image-key" className="text-zinc-400">{aiCfg?.imageConfigured ? "Substituir Gemini API Key (Imagem)" : "Gemini API Key (Imagem)"}</Label>
            <div className="relative max-w-sm">
              <Input id="m-gemini-image-key" type={showImageKey ? "text" : "password"}
                value={geminiImageKey} onChange={(e) => setGeminiImageKey(e.target.value)}
                placeholder="AIza..." className="pr-10 font-mono text-sm bg-zinc-800/50 border-zinc-700" autoComplete="off" spellCheck={false} />
              <button type="button" onClick={() => setShowImageKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors" tabIndex={-1}>
                {showImageKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">Pode ser a mesma chave que a de texto. Deixa em branco para manter.</p>
          </div>
          {aiImageStatus !== "idle" && (
            <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
              aiImageStatus === "ok" ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400" : "border-red-500/40 bg-red-500/5 text-red-400")}>
              {aiImageStatus === "ok" ? <Wifi className="h-4 w-4 shrink-0" /> : <WifiOff className="h-4 w-4 shrink-0" />}
              <span>{aiImageMsg}</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => testAiKey("image")}
            disabled={aiTesting !== null || aiSaving || (!aiCfg?.imageConfigured && !geminiImageKey.trim())}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            {aiTesting === "image" || aiSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wifi className="mr-1.5 h-3.5 w-3.5" />}
            {aiTesting === "image" ? "A testar…" : aiSaving ? "A guardar…" : "Testar ligação"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={saveAi} disabled={aiSaving} className="bg-amber-500 hover:bg-amber-400 text-black">
          {aiSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
          {aiSaving ? "A guardar…" : "Guardar configurações"}
        </Button>
      </div>

      <Card className="border-zinc-700/40 bg-zinc-900/40">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">O que o Aluka IA faz</p>
          <ul className="space-y-1.5 text-sm text-zinc-500">
            {[
              "Analisa cada trade após ser fechado — entrada, saída, risco e R:R (modelo de texto)",
              "Analisa o gráfico visualmente a partir do screenshot do aluno (modelo de imagem)",
              "Os dois modelos são independentes — podes activar um sem o outro",
              "Funciona 100% no servidor — as chaves nunca são enviadas ao browser",
              "Tier gratuito do Gemini: 1 500 requests/dia — suficiente para começar",
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <Brain className="h-3.5 w-3.5 mt-0.5 text-amber-400 shrink-0" />
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
 * Email Config tab (MASTER ONLY)
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
        <h2 className="text-xl font-bold text-zinc-100">Email / Gmail SMTP</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          Envio de emails via Gmail SMTP com Nodemailer — verificação de email, recuperação de password, aprovação e rejeição de subscrições.
        </p>
      </div>

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
              <p className="text-xs text-zinc-500">
                {status?.configured
                  ? `App Password activa (fonte: ${status.keySource === "database" ? "painel master" : "variável de ambiente GMAIL_APP_PASSWORD"}). Emails serão enviados automaticamente.`
                  : "App Password não definida. Os emails automáticos não serão enviados até configurares o Gmail SMTP."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Como obter a Gmail App Password</p>
          <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside leading-relaxed">
            <li>Acede a <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-amber-400 underline">myaccount.google.com/security</a></li>
            <li>Activa a <strong className="text-zinc-200">Verificação em dois passos</strong> (obrigatório)</li>
            <li>Pesquisa <strong className="text-zinc-200">"App passwords"</strong> nas definições da conta</li>
            <li>Cria uma nova App Password para <strong className="text-zinc-200">Mail</strong> e copia os 16 caracteres</li>
            <li>Cola abaixo sem espaços (são removidos automaticamente)</li>
          </ol>
        </CardContent>
      </Card>

      <Card className="border-zinc-700/60 bg-zinc-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-zinc-100">Credenciais Gmail SMTP</CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Conta Gmail: <strong className="text-zinc-300">aluka.co.ao@gmail.com</strong> — SMTP: smtp.gmail.com:587 (STARTTLS)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-zinc-400">Conta Gmail (remetente)</Label>
            <Input type="email" placeholder="aluka.co.ao@gmail.com" value={cfg.gmailUser}
              onChange={(e) => setCfg((p) => ({ ...p, gmailUser: e.target.value }))}
              className="mt-1 font-mono text-xs bg-zinc-800/50 border-zinc-700" autoComplete="off" />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">
              Gmail App Password
              {status?.configured && status.keySource === "database" && (
                <span className="ml-2 text-emerald-500">(guardada — deixa vazio para manter)</span>
              )}
              {status?.configured && status.keySource === "environment" && (
                <span className="ml-2 text-amber-400">(definida via variável de ambiente — não precisas de guardar aqui)</span>
              )}
            </Label>
            <Input type="password"
              placeholder={
                status?.configured
                  ? status.keySource === "environment"
                    ? "Definida via GMAIL_APP_PASSWORD (env var)"
                    : "•••• •••• •••• ••••  (activa — deixa vazio para manter)"
                  : "xxxx xxxx xxxx xxxx  (16 caracteres)"
              }
              value={cfg.gmailAppPassword}
              onChange={(e) => setCfg((p) => ({ ...p, gmailAppPassword: e.target.value }))}
              className="font-mono text-xs mt-1 bg-zinc-800/50 border-zinc-700"
              autoComplete="off"
              disabled={status?.configured && status.keySource === "environment"}
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Nome do remetente</Label>
            <Input placeholder="ALUKA" value={cfg.fromName}
              onChange={(e) => setCfg((p) => ({ ...p, fromName: e.target.value }))}
              className="mt-1 bg-zinc-800/50 border-zinc-700" />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Email de destino para teste</Label>
            <Input type="email" placeholder="admin@exemplo.com" value={cfg.adminEmail}
              onChange={(e) => setCfg((p) => ({ ...p, adminEmail: e.target.value }))}
              className="mt-1 bg-zinc-800/50 border-zinc-700" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving || !loaded} className="bg-amber-500 hover:bg-amber-400 text-black">
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? "A guardar..." : "Guardar configurações"}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing || !status?.configured}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {testing ? "A enviar..." : "Enviar email de teste"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-700/60 bg-zinc-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-zinc-100">Emails automáticos</CardTitle>
          <CardDescription className="text-xs text-zinc-500">Todos enviados via smtp.gmail.com:587 (Nodemailer)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { icon: "📧", title: "Verificação de email (OTP)", desc: "Código de 6 dígitos enviado no registo. Obrigatório para activar a conta. Expira em 15 minutos." },
              { icon: "✅", title: "Subscrição aprovada", desc: "Enviado ao aluno quando o admin aprova o comprovativo de pagamento." },
              { icon: "❌", title: "Subscrição rejeitada", desc: "Enviado ao aluno quando o admin rejeita o pedido, com nota opcional explicativa." },
              { icon: "🔑", title: "Recuperação de password", desc: "Enviado quando o utilizador pede recuperação em /esqueci-senha. Link válido por 1 hora." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3">
                <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{item.title}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
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
 * SEO / Site Settings tab (MASTER ONLY)
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
        <h2 className="text-xl font-bold text-zinc-100">SEO & Domínio</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          Configura o nome da plataforma, domínio e metadados de SEO. Ao guardares, o manifesto PWA é actualizado automaticamente.
        </p>
      </div>

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
              <p className="text-xs text-zinc-500">
                {siteUrl
                  ? "O canonical, Open Graph e o manifesto PWA apontam para este domínio."
                  : "Sem domínio, os URLs de SEO ficam incompletos."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-700/60 bg-zinc-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-zinc-100">Identidade do site</CardTitle>
          <CardDescription className="text-xs text-zinc-500">O nome que aparece no browser, no PWA instalado e nos resultados de pesquisa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-zinc-400">Nome completo</Label>
              <Input placeholder="ALUKA" value={cfg.siteName}
                onChange={(e) => set("siteName", e.target.value)}
                className="mt-1 bg-zinc-800/50 border-zinc-700" />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Nome curto (PWA)</Label>
              <Input placeholder="ALUKA" value={cfg.shortName}
                onChange={(e) => set("shortName", e.target.value)}
                className="mt-1 bg-zinc-800/50 border-zinc-700" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Descrição</Label>
            <textarea rows={3} placeholder="A plataforma angolana de educação em trading..."
              value={cfg.description} onChange={(e) => set("description", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-700/60 bg-zinc-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-zinc-100">Domínio</CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Sem "https://" — ex: <code className="bg-zinc-800 px-1 rounded">aluka.ao</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-zinc-400">Domínio (sem https://)</Label>
            <div className="flex items-center mt-1">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-500">https://</span>
              <Input placeholder="aluka.ao" value={cfg.domain}
                onChange={(e) => set("domain", e.target.value.replace(/^https?:\/\//, "").replace(/\/$/, ""))}
                className="rounded-l-none font-mono text-sm bg-zinc-800/50 border-zinc-700" />
            </div>
          </div>
          {siteUrl && (
            <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 space-y-1.5">
              <p className="text-xs font-medium text-zinc-400">URLs que serão usados em SEO</p>
              {[
                ["Canonical", siteUrl + "/"],
                ["Open Graph", siteUrl + "/"],
                ["OG Image", siteUrl + "/opengraph.jpg"],
                ["Manifesto PWA", "/api-server/api/manifest"],
              ].map(([label, url]) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500 w-24 shrink-0">{label}</span>
                  <code className="text-amber-400 truncate">{url}</code>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-700/60 bg-zinc-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-zinc-100">Redes sociais & PWA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-zinc-400">Twitter / X Handle</Label>
              <Input placeholder="@ALUKAAO" value={cfg.twitterHandle}
                onChange={(e) => set("twitterHandle", e.target.value)}
                className="mt-1 bg-zinc-800/50 border-zinc-700" />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Cor do tema (PWA / browser)</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={cfg.themeColor} onChange={(e) => set("themeColor", e.target.value)}
                  className="h-9 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5" />
                <Input value={cfg.themeColor} onChange={(e) => set("themeColor", e.target.value)}
                  className="font-mono text-sm bg-zinc-800/50 border-zinc-700" maxLength={7} />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-zinc-400">Região geo (ISO 3166)</Label>
              <Input placeholder="AO" value={cfg.geo}
                onChange={(e) => set("geo", e.target.value.toUpperCase())}
                className="mt-1 uppercase bg-zinc-800/50 border-zinc-700" maxLength={2} />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Cidade / região</Label>
              <Input placeholder="Luanda, Angola" value={cfg.geoCity}
                onChange={(e) => set("geoCity", e.target.value)}
                className="mt-1 bg-zinc-800/50 border-zinc-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !loaded} className="bg-amber-500 hover:bg-amber-400 text-black">
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? "A guardar..." : "Guardar configurações SEO"}
        </Button>
      </div>
    </div>
  );
}

/* =========================================================================
 * Social media links tab (MASTER ONLY)
 * ========================================================================= */
const SOCIAL_PLATFORMS: {
  key: keyof SocialConfig;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  hint: string;
}[] = [
  {
    key: "youtube", label: "YouTube", placeholder: "https://www.youtube.com/@ALUKA",
    icon: <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 text-red-500">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    </span>,
    hint: "Canal do YouTube da ALUKA",
  },
  {
    key: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/aluka_ao",
    icon: <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600/10 text-pink-500">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    </span>,
    hint: "Perfil do Instagram da ALUKA",
  },
  {
    key: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@aluka_ao",
    icon: <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-200">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.98a8.27 8.27 0 004.84 1.54V7.04a4.85 4.85 0 01-1.07-.35z"/>
      </svg>
    </span>,
    hint: "Perfil do TikTok da ALUKA",
  },
  {
    key: "x", label: "X / Twitter", placeholder: "https://x.com/ALUKAAO",
    icon: <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-200">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    </span>,
    hint: "Perfil no X (antigo Twitter)",
  },
  {
    key: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/aluka.angola",
    icon: <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-500">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    </span>,
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
        <h2 className="text-xl font-bold text-zinc-100">Redes Sociais</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          Configura os links das redes sociais da ALUKA. Os ícones aparecem automaticamente no footer do site quando o link estiver preenchido.
        </p>
      </div>

      {loaded && (
        <Card className={cn("border", activeCount > 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-700/50 bg-zinc-800/20")}>
          <CardContent className="flex items-center gap-3 p-4">
            <Share2 className={cn("h-5 w-5 shrink-0", activeCount > 0 ? "text-emerald-500" : "text-zinc-500")} />
            <div>
              <p className={cn("text-sm font-semibold", activeCount > 0 ? "text-emerald-400" : "text-zinc-500")}>
                {activeCount > 0 ? `${activeCount} rede${activeCount !== 1 ? "s" : ""} social activa${activeCount !== 1 ? "s" : ""}` : "Nenhuma rede social configurada"}
              </p>
              <p className="text-xs text-zinc-500">
                {activeCount > 0 ? "Os ícones activos aparecem no footer da landing page." : "Preenche pelo menos um link para que os ícones apareçam no site."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-700/60 bg-zinc-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-zinc-100">Links das plataformas</CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Cola o URL completo de cada perfil. Deixa em branco para ocultar o ícone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SOCIAL_PLATFORMS.map((p) => (
            <div key={p.key}>
              <Label className="text-xs text-zinc-400">{p.label}</Label>
              <div className="flex items-center gap-2 mt-1">
                {p.icon}
                <Input placeholder={p.placeholder} value={(cfg as Record<string, string>)[p.key] ?? ""}
                  onChange={(e) => set(p.key, e.target.value)}
                  className="font-mono text-xs bg-zinc-800/50 border-zinc-700" type="url" />
                {(cfg as Record<string, string>)[p.key] && (
                  <a href={(cfg as Record<string, string>)[p.key]} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-zinc-500 hover:text-zinc-200 transition-colors" title="Abrir link">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="text-[10px] text-zinc-600 mt-0.5 pl-10">{p.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !loaded} className="bg-amber-500 hover:bg-amber-400 text-black">
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? "A guardar..." : "Guardar redes sociais"}
        </Button>
      </div>
    </div>
  );
}

/* =========================================================================
 * Integrações tab — Google OAuth (MASTER ONLY)
 * ========================================================================= */
function IntegracoesTb() {
  const [cfg, setCfg] = useState({
    clientId: "", clientSecret: "", clientSecretPreview: "",
    enabled: false, configured: false, callbackUrl: "",
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
      const body: { clientId?: string; clientSecret?: string; enabled?: boolean } = { enabled: cfg.enabled };
      if (cfg.clientId.trim()) body.clientId = cfg.clientId.trim();
      if (newSecret.trim())   body.clientSecret = newSecret.trim();
      const res = await api.admin.saveGoogleOAuth(body);
      toast.success("Configuração Google OAuth guardada.");
      setCfg((prev) => ({
        ...prev, configured: res.configured, enabled: res.enabled,
        clientSecretPreview: newSecret.trim() ? `${"•".repeat(Math.max(0, newSecret.length - 4))}${newSecret.slice(-4)}` : prev.clientSecretPreview,
      }));
      setNewSecret("");
      setTestStatus("idle");
      setTestMsg("");
    } catch { toast.error("Erro ao guardar configuração."); }
    finally { setSaving(false); }
  }

  async function handleTest() {
    if (newSecret.trim()) { toast.error("Guarda primeiro as novas credenciais antes de testar."); return; }
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
    } finally { setTesting(false); }
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
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-zinc-100">Integrações</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          Configura o Google OAuth para permitir que os alunos se registem e entrem com a conta Google.
        </p>
      </div>

      <Card className="border-zinc-700/60 bg-zinc-900/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-white">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-base text-zinc-100">Google OAuth 2.0</CardTitle>
                <CardDescription className="text-xs text-zinc-500">Login e registo com conta Google</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cfg.configured ? (
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-[11px]">
                  <CheckCircle className="h-3 w-3 mr-1" />Configurado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-zinc-500 text-[11px] border-zinc-700">
                  Não configurado
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Activar Google Login</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {cfg.configured
                  ? cfg.enabled ? "Visível no login e registo." : "Configurado mas desactivado."
                  : "Adiciona as credenciais abaixo para activar."}
              </p>
            </div>
            <button type="button" onClick={() => setCfg((p) => ({ ...p, enabled: !p.enabled }))}
              disabled={!cfg.configured} className="transition-colors disabled:opacity-40"
              title={cfg.enabled ? "Desactivar" : "Activar"}>
              {cfg.enabled
                ? <ToggleRight className="h-8 w-8 text-emerald-500" />
                : <ToggleLeft className="h-8 w-8 text-zinc-500" />}
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-zinc-300">Client ID</Label>
            <Input value={cfg.clientId} onChange={(e) => setCfg((p) => ({ ...p, clientId: e.target.value }))}
              placeholder="123456789-abc.apps.googleusercontent.com"
              className="font-mono text-xs h-10 bg-zinc-800/50 border-zinc-700" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-zinc-300">Client Secret</Label>
            {cfg.clientSecretPreview && !newSecret && (
              <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/30 px-3 py-2 mb-1.5">
                <span className="font-mono text-xs text-zinc-400 flex-1">{cfg.clientSecretPreview}</span>
                <span className="text-[10px] text-zinc-500">guardado</span>
              </div>
            )}
            <div className="relative">
              <Input type={showSecret ? "text" : "password"} value={newSecret}
                onChange={(e) => setNewSecret(e.target.value)}
                placeholder={cfg.clientSecretPreview ? "Novo secret (deixa vazio para manter)" : "GOCSPX-..."}
                className="pr-11 font-mono text-xs h-10 bg-zinc-800/50 border-zinc-700" />
              <button type="button" onClick={() => setShowSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors" tabIndex={-1}>
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {cfg.callbackUrl && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
                URL de Callback
                <span className="text-[10px] font-normal text-zinc-500">(adiciona esta URL no Google Console)</span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/20 px-3 py-2">
                  <p className="font-mono text-[11px] text-zinc-400 break-all">{cfg.callbackUrl}</p>
                </div>
                <button type="button" onClick={copyCallback}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors"
                  title="Copiar URL">
                  {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-zinc-400" />}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-zinc-800/30 border border-zinc-700 p-4 space-y-2">
            <p className="text-xs font-semibold text-zinc-200">Como configurar no Google Cloud Console</p>
            <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
              <li>Acede a <span className="text-zinc-200 font-mono">console.cloud.google.com</span></li>
              <li>Cria um projecto ou selecciona um existente</li>
              <li>Vai a <strong className="text-zinc-200">APIs &amp; Services → Credentials</strong></li>
              <li>Clica em <strong className="text-zinc-200">Create Credentials → OAuth 2.0 Client ID</strong></li>
              <li>Tipo de aplicação: <strong className="text-zinc-200">Web application</strong></li>
              <li>Em <strong className="text-zinc-200">Authorized redirect URIs</strong> adiciona a URL de callback acima</li>
              <li>Copia o Client ID e Client Secret para os campos acima</li>
            </ol>
          </div>

          {testStatus !== "idle" && (
            <div className={cn(
              "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
              testStatus === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400",
            )}>
              {testStatus === "ok" ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{testMsg}</span>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSave} disabled={saving || testing} className="h-10 gap-2 bg-amber-500 hover:bg-amber-400 text-black">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />A guardar…</> : <><Save className="h-4 w-4" />Guardar configuração</>}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={saving || testing || !cfg.configured}
              className="h-10 gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              {testing ? <><Loader2 className="h-4 w-4 animate-spin" />A testar…</> : <><Wifi className="h-4 w-4" />Testar ligação</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Navigation items ───────────────────────────────────────────────────── */
const MASTER_NAV: Array<{ id: MasterNav; label: string; icon: React.ElementType; sub?: string; group?: string }> = [
  { id: "overview",     label: "Visão Geral",        icon: BarChart3,     sub: "KPIs & actividade",      group: "geral" },
  { id: "equipa",       label: "Equipa",              icon: Users,         sub: "Admins & Professores",   group: "geral" },
  { id: "utilizadores", label: "Utilizadores",        icon: Shield,        sub: "Gestão de roles",        group: "geral" },
  { id: "plataforma",   label: "Plataforma",          icon: Building2,     sub: "White-label",            group: "geral" },
  { id: "logs",         label: "Logs de Professores", icon: ClipboardList, sub: "Actividade de conteúdo", group: "geral" },
  { id: "email",        label: "Email / SendGrid",    icon: Mail,          sub: "Gmail SMTP",             group: "sistema" },
  { id: "seo",          label: "SEO & Domínio",       icon: Globe,         sub: "Meta & PWA",             group: "sistema" },
  { id: "social",       label: "Redes Sociais",       icon: Share2,        sub: "Links de perfil",        group: "sistema" },
  { id: "integracoes",  label: "Integrações",         icon: Plug,          sub: "Google OAuth",           group: "sistema" },
  { id: "aluka-ia",     label: "Aluka IA",            icon: Brain,         sub: "Google Gemini",          group: "sistema" },
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
    logs:         <ProfessorLogsTab />,
    email:        <EmailConfigTab />,
    seo:          <SeoSettingsTab />,
    social:       <SocialTab />,
    integracoes:  <IntegracoesTb />,
    "aluka-ia":   <AlukaIaTab />,
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
          {/* Gestão */}
          {!collapsed && (
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#52525b" }}>Gestão</p>
          )}
          {MASTER_NAV.filter((n) => n.group === "geral").map((item) => {
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

          {/* Divider + Sistema (só Master) */}
          <div className="my-2 border-t" style={{ borderColor: "#1e1e24" }} />
          {!collapsed && (
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#52525b" }}>
              Sistema <span className="normal-case text-amber-500/60">· só master</span>
            </p>
          )}
          {MASTER_NAV.filter((n) => n.group === "sistema").map((item) => {
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

          {/* Divider + Admin shortcut */}
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
