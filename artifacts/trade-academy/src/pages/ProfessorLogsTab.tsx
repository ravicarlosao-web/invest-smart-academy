// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Download, Trash2, RefreshCw, Search, ChevronLeft, ChevronRight,
  ClipboardList, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type ProfLog = {
  id: string;
  professorId: string;
  professorName: string;
  professorEmail: string;
  action: "added" | "removed" | "updated";
  resourceType: string;
  resourceName: string;
  details: string | null;
  createdAt: number;
};

type LogsResponse = {
  logs: ProfLog[];
  total: number;
  pages: number;
  page: number;
  limit: number;
};

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const RESOURCE_LABELS: Record<string, string> = {
  strategy:          "Estratégia",
  book:              "Livro",
  glossary:          "Glossário",
  resource:          "Recurso",
  video:             "Vídeo Aula",
  curriculum_level:  "Nível do Curso",
  curriculum_lesson: "Lição",
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("pt-PT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    added:   "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
    removed: "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400",
    updated: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
  };
  const labels: Record<string, string> = {
    added: "Adicionou", removed: "Removeu", updated: "Actualizou",
  };
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] px-1.5 h-5 font-semibold", styles[action] ?? "bg-muted text-muted-foreground")}
    >
      {labels[action] ?? action}
    </Badge>
  );
}

function downloadCSV(logs: ProfLog[], filename = "professor_logs.csv") {
  const header = ["Data", "Professor", "Email", "Acção", "Tipo de Recurso", "Nome do Recurso", "Detalhes"];
  const rows = logs.map((l) => [
    formatDate(l.createdAt),
    l.professorName,
    l.professorEmail,
    l.action,
    RESOURCE_LABELS[l.resourceType] ?? l.resourceType,
    l.resourceName,
    l.details ?? "",
  ]);
  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Component ──────────────────────────────────────────────────────────────── */
export function ProfessorLogsTab() {
  const [data,         setData]         = useState<LogsResponse | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [emailFilter,  setEmailFilter]  = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [purgeConfirm, setPurgeConfirm] = useState(false);
  const [purging,      setPurging]      = useState(false);
  const [downloading,  setDownloading]  = useState(false);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "50" });
      if (emailFilter)             params.set("professorEmail", emailFilter);
      if (actionFilter !== "all")  params.set("action",        actionFilter);
      if (typeFilter   !== "all")  params.set("resourceType",  typeFilter);
      const result = await api.admin.getProfessorLogs(params.toString());
      setData(result);
      setPage(pg);
    } catch {
      toast.error("Erro ao carregar logs de actividade");
    } finally {
      setLoading(false);
    }
  }, [emailFilter, actionFilter, typeFilter]);

  useEffect(() => { load(1); }, [emailFilter, actionFilter, typeFilter]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "10000" });
      if (emailFilter)             params.set("professorEmail", emailFilter);
      if (actionFilter !== "all")  params.set("action",        actionFilter);
      if (typeFilter   !== "all")  params.set("resourceType",  typeFilter);
      const result = await api.admin.getProfessorLogs(params.toString());
      const date   = new Date().toISOString().split("T")[0];
      downloadCSV(result.logs, `professor_logs_${date}.csv`);
      toast.success(`${result.logs.length} registos exportados para CSV`);
    } catch {
      toast.error("Erro ao exportar CSV");
    } finally {
      setDownloading(false);
    }
  }

  async function handlePurge() {
    setPurging(true);
    try {
      const result = await api.admin.purgeProfessorLogs();
      toast.success(
        result.deleted > 0
          ? `${result.deleted} registo${result.deleted !== 1 ? "s" : ""} eliminado${result.deleted !== 1 ? "s" : ""} (mais de 60 dias)`
          : "Sem registos antigos para eliminar",
      );
      setPurgeConfirm(false);
      load(1);
    } catch {
      toast.error("Erro ao purgar logs");
    } finally {
      setPurging(false);
    }
  }

  const hasFilters = emailFilter || actionFilter !== "all" || typeFilter !== "all";
  const logs = data?.logs ?? [];

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cyan-500" />
            Logs de Professores
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-md">
            Histórico de adições, actualizações e remoções de conteúdo. Registos eliminados automaticamente após 60 dias.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => load(page)} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={handleDownload}
            disabled={downloading || (data !== null && data.total === 0)}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {downloading ? "A exportar…" : "Exportar CSV"}
          </Button>
          {!purgeConfirm ? (
            <Button
              variant="outline" size="sm"
              onClick={() => setPurgeConfirm(true)}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Purgar &gt;60 dias
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1">
              <span className="text-xs font-medium text-destructive">Eliminar logs antigos?</span>
              <Button variant="destructive" size="sm" className="h-6 text-xs px-2" onClick={handlePurge} disabled={purging}>
                {purging ? "A purgar…" : "Confirmar"}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setPurgeConfirm(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="Filtrar por email do professor…"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="h-8 text-sm w-40">
            <SelectValue placeholder="Acção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as acções</SelectItem>
            <SelectItem value="added">Adicionou</SelectItem>
            <SelectItem value="removed">Removeu</SelectItem>
            <SelectItem value="updated">Actualizou</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-sm w-44">
            <SelectValue placeholder="Tipo de recurso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="curriculum_level">Nível do Curso</SelectItem>
            <SelectItem value="curriculum_lesson">Lição</SelectItem>
            <SelectItem value="video">Vídeo Aula</SelectItem>
            <SelectItem value="strategy">Estratégia</SelectItem>
            <SelectItem value="book">Livro</SelectItem>
            <SelectItem value="glossary">Glossário</SelectItem>
            <SelectItem value="resource">Recurso</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost" size="sm" className="h-8"
            onClick={() => { setEmailFilter(""); setActionFilter("all"); setTypeFilter("all"); }}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* ── Count ──────────────────────────────────────────────────────────── */}
      {data && (
        <p className="text-xs text-muted-foreground">
          {data.total === 0
            ? "Sem registos"
            : `${data.total} registo${data.total !== 1 ? "s" : ""} encontrado${data.total !== 1 ? "s" : ""}`}
          {data.pages > 1 && ` — página ${page} de ${data.pages}`}
        </p>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            A carregar registos…
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium">Sem registos de actividade</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-[300px]">
                {hasFilters
                  ? "Nenhum registo corresponde aos filtros seleccionados."
                  : "Os logs aparecem aqui quando um professor adicionar, remover ou actualizar conteúdo."}
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold w-36">Data</TableHead>
                <TableHead className="text-xs font-semibold">Professor</TableHead>
                <TableHead className="text-xs font-semibold w-28">Acção</TableHead>
                <TableHead className="text-xs font-semibold w-36">Tipo</TableHead>
                <TableHead className="text-xs font-semibold">Recurso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/20">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-2.5">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div>
                      <p className="text-xs font-semibold leading-tight">{log.professorName || "—"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{log.professorEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="text-xs text-muted-foreground">
                      {RESOURCE_LABELS[log.resourceType] ?? log.resourceType}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="text-xs font-medium">{log.resourceName}</span>
                    {log.details && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{log.details}</p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => load(page - 1)}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {page} / {data.pages}
          </span>
          <Button
            variant="outline" size="sm"
            onClick={() => load(page + 1)}
            disabled={page >= data.pages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
