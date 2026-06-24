import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus, Trash2, Save, Loader2, Star, CheckCircle2, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/apiClient";
import type { AdminPlan, AdminPlanWithPerms, AdminPlanPermission } from "@/lib/apiClient";

/* ────────────────────────── helpers ────────────────────────────── */
const DURATION_OPTIONS = [
  { value: "7",     label: "7 dias" },
  { value: "30",    label: "30 dias" },
  { value: "90",    label: "90 dias" },
  { value: "180",   label: "180 dias (6 meses)" },
  { value: "365",   label: "365 dias (1 ano)" },
  { value: "36500", label: "Ilimitado (~100 anos)" },
  { value: "custom", label: "Personalizado..." },
];

function fmtPrice(v: number) { return v === 0 ? "Gratuito" : `${v.toLocaleString("pt-AO")} AOA`; }
function fmtDuration(d: number) {
  if (d >= 36500) return "Ilimitado";
  if (d === 365)  return "1 ano";
  if (d === 180)  return "6 meses";
  if (d === 90)   return "3 meses";
  if (d === 30)   return "30 dias";
  if (d === 7)    return "7 dias";
  return `${d} dias`;
}
function durSelect(days: number): string {
  return [7, 30, 90, 180, 365, 36500].includes(days) ? String(days) : "custom";
}

/* ────────────────────────── Plan card ──────────────────────────── */
function PlanCard({ plan, selected, onClick }: { plan: AdminPlan; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition-all hover:border-primary/60",
        selected ? "border-primary bg-primary/5" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm truncate">{plan.name}</span>
        <div className="flex items-center gap-1 shrink-0">
          {plan.isDefault === 1 && <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">DEFAULT</Badge>}
          {plan.isActive === 1
            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
            : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{fmtPrice(plan.priceAoa)} · {fmtDuration(plan.durationDays)}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {plan.permissionsCount ?? 0} permissões · {plan.activeSubsCount ?? 0} subs activas
      </p>
    </button>
  );
}

/* ────────────────────────── Duration select ────────────────────── */
function DurationSelect({
  value, onChange, customDays, onCustomDaysChange,
}: {
  value: string; onChange: (v: string) => void;
  customDays: string; onCustomDaysChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1 text-sm h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DURATION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {value === "custom" && (
        <Input
          type="number" min="1" placeholder="dias"
          value={customDays} onChange={e => onCustomDaysChange(e.target.value)}
          className="w-24 h-8 text-sm"
        />
      )}
    </div>
  );
}

/* ─────────────────────── Permissions tab content ───────────────── */
const PERM_TABS = [
  { id: "lessons",    label: "Lições" },
  { id: "books",      label: "Livros" },
  { id: "strategies", label: "Estratégias" },
  { id: "videos",     label: "Vídeos" },
  { id: "resources",  label: "Recursos" },
] as const;
type PermSubTab = (typeof PERM_TABS)[number]["id"];

function PermRow({
  checked, indeterminate, disabled, label, subLabel, spinning,
  onChange,
}: {
  checked: boolean; indeterminate?: boolean; disabled?: boolean;
  label: string; subLabel?: string; spinning?: boolean;
  onChange: () => void;
}) {
  return (
    <label className={cn("flex items-start gap-2.5 py-1.5 cursor-pointer", disabled && "opacity-50 cursor-default")}>
      <div className="mt-0.5 relative shrink-0">
        {spinning
          ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
          : <Checkbox checked={checked} onCheckedChange={disabled ? undefined : onChange} />}
      </div>
      <div>
        <p className="text-sm leading-snug">{label}</p>
        {subLabel && <p className="text-[11px] text-muted-foreground">{subLabel}</p>}
      </div>
    </label>
  );
}

/* ═══════════════════════════ MAIN TAB ══════════════════════════════ */
export function PlanosTab() {
  /* ─── State ─── */
  const [plans,          setPlans]          = useState<AdminPlan[]>([]);
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [details,        setDetails]        = useState<AdminPlanWithPerms | null>(null);
  const [loadingPlans,   setLoadingPlans]   = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [showCreate,     setShowCreate]     = useState(false);
  const [creating,       setCreating]       = useState(false);
  const [activeTab,      setActiveTab]      = useState<"config" | "perms">("config");
  const [permSub,        setPermSub]        = useState<PermSubTab>("lessons");
  const [savingPerms,    setSavingPerms]    = useState<Set<string>>(new Set());
  const [expandedLevels, setExpandedLevels] = useState<Set<string | number>>(new Set());

  /* Content for permissions */
  const [curriculum,    setCurriculum]    = useState<any[]>([]);
  const [books,         setBooks]         = useState<any[]>([]);
  const [strategies,    setStrategies]    = useState<any[]>([]);
  const [videos,        setVideos]        = useState<any[]>([]);
  const [resources,     setResources]     = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const contentLoaded = useRef(false);

  /* Config form */
  const [cfg, setCfg] = useState({ name: "", description: "", priceAoa: "0", dur: "30", customDays: "", isActive: true });

  /* Create form */
  const [newPlan, setNewPlan] = useState({ name: "", description: "", priceAoa: "0", dur: "30", customDays: "", isDefault: false });

  /* ─── Derived ─── */
  const permMap = useMemo(() => {
    const m: Record<string, string> = {};
    details?.permissions?.forEach(p => { m[`${p.contentType}:${p.contentId}`] = p.id; });
    return m;
  }, [details?.permissions]);

  /* ─── Effects ─── */
  useEffect(() => { fetchPlans(); }, []);

  useEffect(() => {
    if (selectedId) fetchDetails(selectedId);
    else setDetails(null);
  }, [selectedId]);

  useEffect(() => {
    if (!details) return;
    const d = details.durationDays;
    setCfg({
      name: details.name,
      description: details.description ?? "",
      priceAoa: String(details.priceAoa),
      dur: durSelect(d),
      customDays: durSelect(d) === "custom" ? String(d) : "",
      isActive: details.isActive === 1,
    });
  }, [details?.id]);

  useEffect(() => {
    if (activeTab === "perms") loadContent();
  }, [activeTab]);

  /* ─── Fetchers ─── */
  async function fetchPlans() {
    setLoadingPlans(true);
    try { setPlans(await api.adminPlans.list()); }
    catch { toast.error("Erro ao carregar planos"); }
    finally { setLoadingPlans(false); }
  }

  async function fetchDetails(id: string) {
    setLoadingDetails(true);
    try { setDetails(await api.adminPlans.get(id)); }
    catch { toast.error("Erro ao carregar detalhes do plano"); }
    finally { setLoadingDetails(false); }
  }

  async function loadContent() {
    if (contentLoaded.current) return;
    contentLoaded.current = true;
    setLoadingContent(true);
    try {
      const [cur, bks, strs, vids, res] = await Promise.all([
        api.content.curriculum(),
        api.content.books(),
        api.content.strategies(),
        api.content.videos(),
        api.content.resources(),
      ]);
      setCurriculum(cur);
      setBooks(bks);
      setStrategies(strs);
      setVideos(vids);
      setResources(res);
      // Expand all levels by default
      setExpandedLevels(new Set(cur.map((lv: any) => lv.id)));
    } catch { toast.error("Erro ao carregar conteúdo da plataforma"); }
    finally { setLoadingContent(false); }
  }

  /* ─── Permission toggle ─── */
  async function togglePerm(contentType: string, contentId: string) {
    if (!selectedId) return;
    const key = `${contentType}:${contentId}`;
    if (savingPerms.has(key)) return;
    setSavingPerms(prev => new Set(prev).add(key));
    try {
      const existingId = permMap[key];
      if (existingId) {
        await api.adminPlans.removePermission(selectedId, existingId);
        setDetails(prev => prev ? { ...prev, permissions: prev.permissions.filter(p => p.id !== existingId) } : prev);
        toast.success("Permissão removida");
      } else {
        const newPerm = await api.adminPlans.addPermission(selectedId, contentType, contentId);
        setDetails(prev => prev ? { ...prev, permissions: [...prev.permissions, newPerm as AdminPlanPermission] } : prev);
        toast.success("Permissão adicionada");
      }
    } catch {
      toast.error("Erro ao actualizar permissão");
    } finally {
      setSavingPerms(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }

  /* ─── Config actions ─── */
  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const days = cfg.dur === "custom" ? Number(cfg.customDays) : Number(cfg.dur);
      const updated = await api.adminPlans.update(selectedId, {
        name: cfg.name,
        description: cfg.description || null,
        priceAoa: Number(cfg.priceAoa),
        durationDays: days,
        isActive: cfg.isActive ? 1 : 0,
      });
      setPlans(prev => prev.map(p => p.id === selectedId ? { ...p, ...updated } : p));
      setDetails(prev => prev ? { ...prev, ...updated } : prev);
      toast.success("Plano guardado");
    } catch (e: any) { toast.error(e?.message || "Erro ao guardar"); }
    finally { setSaving(false); }
  }

  async function handleSetDefault() {
    if (!selectedId) return;
    try {
      await api.adminPlans.setDefault(selectedId);
      await fetchPlans();
      setDetails(prev => prev ? { ...prev, isDefault: 1 } : prev);
      toast.success("Plano definido como default");
    } catch (e: any) { toast.error(e?.message || "Erro"); }
  }

  async function handleDelete() {
    if (!selectedId || !details) return;
    if (!window.confirm(`Apagar "${details.name}"? Esta acção é irreversível.`)) return;
    try {
      await api.adminPlans.remove(selectedId);
      setPlans(prev => prev.filter(p => p.id !== selectedId));
      setSelectedId(null);
      toast.success("Plano apagado");
    } catch (e: any) { toast.error(e?.message || "Erro ao apagar"); }
  }

  /* ─── Create action ─── */
  async function handleCreate() {
    if (!newPlan.name.trim()) { toast.error("Nome obrigatório"); return; }
    setCreating(true);
    try {
      const days = newPlan.dur === "custom" ? Number(newPlan.customDays) : Number(newPlan.dur);
      const created = await api.adminPlans.create({
        name: newPlan.name.trim(),
        description: newPlan.description || null,
        priceAoa: Number(newPlan.priceAoa),
        durationDays: days,
        isDefault: newPlan.isDefault ? 1 : 0,
      });
      setShowCreate(false);
      setNewPlan({ name: "", description: "", priceAoa: "0", dur: "30", customDays: "", isDefault: false });
      await fetchPlans();
      setSelectedId(created.id);
      setActiveTab("perms");
      toast.success("Plano criado! Configura agora as permissões.");
    } catch (e: any) { toast.error(e?.message || "Erro ao criar plano"); }
    finally { setCreating(false); }
  }

  /* ─── Permissions render helpers ─── */
  function renderLessons() {
    if (loadingContent) return <Loader2 className="h-5 w-5 animate-spin mx-auto mt-8 text-muted-foreground" />;
    return (
      <div className="space-y-3">
        {curriculum.map((lv: any) => {
          const levelKey = `level:${lv.id}`;
          const levelChecked = !!permMap[levelKey];
          const isExpanded = expandedLevels.has(lv.id);
          return (
            <div key={lv.id} className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                <div className="relative shrink-0 mt-0.5">
                  {savingPerms.has(levelKey)
                    ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    : <Checkbox checked={levelChecked} onCheckedChange={() => togglePerm("level", String(lv.id))} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{lv.title}</p>
                  <p className="text-[11px] text-muted-foreground">{lv.difficulty} · {lv.lessons?.length ?? 0} lições</p>
                </div>
                <button onClick={() => setExpandedLevels(prev => {
                  const n = new Set(prev); n.has(lv.id) ? n.delete(lv.id) : n.add(lv.id); return n;
                })} className="shrink-0 p-1 rounded hover:bg-muted transition-colors">
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
              {isExpanded && (
                <div className="px-3 py-1 divide-y divide-border/40">
                  {lv.lessons?.map((ls: any) => {
                    const lsKey = `lesson:${ls.id}`;
                    const inherited = levelChecked;
                    const checked = inherited || !!permMap[lsKey];
                    return (
                      <PermRow
                        key={ls.id}
                        checked={checked}
                        disabled={inherited}
                        spinning={savingPerms.has(lsKey)}
                        label={ls.title}
                        subLabel={inherited ? "Desbloqueado via nível" : undefined}
                        onChange={() => togglePerm("lesson", ls.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {curriculum.length === 0 && !loadingContent && (
          <p className="text-sm text-muted-foreground text-center py-8">Sem lições disponíveis.</p>
        )}
      </div>
    );
  }

  function renderSimpleList(items: any[], contentType: string, idKey = "id", labelKey = "title", subKey?: string) {
    if (loadingContent) return <Loader2 className="h-5 w-5 animate-spin mx-auto mt-8 text-muted-foreground" />;
    return (
      <div className="space-y-1 divide-y divide-border/40">
        {items.map((item: any) => {
          const key = `${contentType}:${item[idKey]}`;
          return (
            <PermRow
              key={item[idKey]}
              checked={!!permMap[key]}
              spinning={savingPerms.has(key)}
              label={item[labelKey]}
              subLabel={subKey ? item[subKey] : undefined}
              onChange={() => togglePerm(contentType, item[idKey])}
            />
          );
        })}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sem conteúdo disponível.</p>}
      </div>
    );
  }

  function renderVideos() {
    if (loadingContent) return <Loader2 className="h-5 w-5 animate-spin mx-auto mt-8 text-muted-foreground" />;
    const grouped: Record<string, any[]> = {};
    videos.forEach((v: any) => { (grouped[v.level] = grouped[v.level] ?? []).push(v); });
    return (
      <div className="space-y-3">
        {Object.entries(grouped).map(([level, vids]) => (
          <div key={level}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{level}</p>
            <div className="divide-y divide-border/40 border border-border rounded-lg px-3">
              {vids.map((v: any) => {
                const key = `video:${v.id}`;
                return (
                  <PermRow
                    key={v.id}
                    checked={!!permMap[key]}
                    spinning={savingPerms.has(key)}
                    label={v.title}
                    subLabel={v.creator}
                    onChange={() => togglePerm("video", v.id)}
                  />
                );
              })}
            </div>
          </div>
        ))}
        {videos.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sem vídeos disponíveis.</p>}
      </div>
    );
  }

  /* ═══════════════════════ RENDER ═══════════════════════════════════ */
  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* ── Left panel: plan list ─────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Planos</h3>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" /> Novo Plano
          </Button>
        </div>
        {loadingPlans
          ? <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          : (
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {plans.map(p => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  selected={p.id === selectedId}
                  onClick={() => { setSelectedId(p.id); setActiveTab("config"); }}
                />
              ))}
              {plans.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum plano criado.</p>}
            </div>
          )}
      </div>

      {/* ── Right panel: details ──────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
            <Star className="h-8 w-8 opacity-20" />
            <p className="text-sm">Selecciona um plano para editar</p>
          </div>
        ) : loadingDetails ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : details ? (
          <div className="flex flex-col gap-4">
            {/* Tab switcher */}
            <div className="flex gap-1 border-b border-border pb-0">
              {(["config", "perms"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab === "config" ? "Configuração" : "Permissões"}
                </button>
              ))}
            </div>

            {/* ── Configuração tab ───────────────────────────────── */}
            {activeTab === "config" && (
              <div className="space-y-4 max-w-lg">
                <div className="space-y-1">
                  <Label className="text-xs">Nome do plano</Label>
                  <Input value={cfg.name} onChange={e => setCfg(p => ({ ...p, name: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descrição</Label>
                  <Textarea value={cfg.description} onChange={e => setCfg(p => ({ ...p, description: e.target.value }))} rows={2} className="text-sm resize-none" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Preço (AOA)</Label>
                  <Input
                    type="number" min="0" value={cfg.priceAoa}
                    onChange={e => setCfg(p => ({ ...p, priceAoa: e.target.value }))}
                    disabled={details.isDefault === 1}
                    className="h-8 text-sm"
                  />
                  {details.isDefault === 1 && <p className="text-[11px] text-muted-foreground">O plano gratuito não pode ter preço.</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duração</Label>
                  <DurationSelect
                    value={cfg.dur} onChange={v => setCfg(p => ({ ...p, dur: v }))}
                    customDays={cfg.customDays} onCustomDaysChange={v => setCfg(p => ({ ...p, customDays: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">Plano activo</Label>
                    {details.isDefault === 1 && <p className="text-[11px] text-muted-foreground">O plano default não pode ser desactivado.</p>}
                  </div>
                  <Switch
                    checked={cfg.isActive}
                    onCheckedChange={v => setCfg(p => ({ ...p, isActive: v }))}
                    disabled={details.isDefault === 1}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Guardar
                  </Button>
                  {details.isDefault !== 1 && (
                    <Button size="sm" variant="outline" onClick={handleSetDefault} className="gap-1.5">
                      <Star className="h-3.5 w-3.5" />
                      Definir como Default
                    </Button>
                  )}
                  <Button
                    size="sm" variant="destructive" onClick={handleDelete}
                    disabled={details.isDefault === 1 || (details.activeSubsCount ?? 0) > 0}
                    className="gap-1.5 ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Apagar
                  </Button>
                </div>
                {(details.activeSubsCount ?? 0) > 0 && details.isDefault !== 1 && (
                  <p className="text-[11px] text-muted-foreground">
                    Não é possível apagar: {details.activeSubsCount} subscrição(ões) activa(s).
                  </p>
                )}
              </div>
            )}

            {/* ── Permissões tab ─────────────────────────────────── */}
            {activeTab === "perms" && (
              <div className="space-y-3">
                {/* Sub-tabs */}
                <div className="flex gap-1 flex-wrap">
                  {PERM_TABS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setPermSub(t.id)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                        permSub === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="overflow-y-auto max-h-[calc(100vh-28rem)] pr-1">
                  {permSub === "lessons"    && renderLessons()}
                  {permSub === "books"      && renderSimpleList(books, "book", "id", "title", "author")}
                  {permSub === "strategies" && renderSimpleList(strategies, "strategy", "id", "name", "subtitle")}
                  {permSub === "videos"     && renderVideos()}
                  {permSub === "resources"  && renderSimpleList(resources, "resource_section", "id", "title")}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Create Plan Modal ─────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Criar novo plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1">
              <Label className="text-xs">Nome <span className="text-destructive">*</span></Label>
              <Input
                placeholder="ex: Plano Mensal"
                value={newPlan.name}
                onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descrição</Label>
              <Textarea
                placeholder="Descrição visível ao aluno..."
                value={newPlan.description}
                onChange={e => setNewPlan(p => ({ ...p, description: e.target.value }))}
                rows={2} className="text-sm resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Preço (AOA) <span className="text-destructive">*</span></Label>
              <Input
                type="number" min="0" placeholder="15000"
                value={newPlan.priceAoa}
                onChange={e => setNewPlan(p => ({ ...p, priceAoa: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duração</Label>
              <DurationSelect
                value={newPlan.dur} onChange={v => setNewPlan(p => ({ ...p, dur: v }))}
                customDays={newPlan.customDays} onCustomDaysChange={v => setNewPlan(p => ({ ...p, customDays: v }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-xs font-medium">Definir como plano default?</p>
                <p className="text-[11px] text-muted-foreground">Remove o default do plano actual.</p>
              </div>
              <Switch checked={newPlan.isDefault} onCheckedChange={v => setNewPlan(p => ({ ...p, isDefault: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={creating || !newPlan.name.trim()} className="gap-1.5">
              {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
