import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, BookOpen, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { BOOKS_CATALOG, isBookUnlocked } from "@/data/books";
import { toast } from "sonner";

/* ────────────────────────────────────────────────────────── */

async function loadDocx(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  // mammoth.browser.js exposes a global-style CommonJS module
  const mammoth = await import("mammoth");
  const result = await (mammoth as any).convertToHtml({ arrayBuffer });
  return (result.value as string) || "";
}

/* ────────────────────────────────────────────────────────── */

export default function BookReader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const booksProgress    = useAppStore((s) => s.booksProgress);
  const updateBookProgress = useAppStore((s) => s.updateBookProgress);
  const markBookComplete   = useAppStore((s) => s.markBookComplete);

  const completedBookIds = Object.entries(booksProgress)
    .filter(([, p]) => p.completed)
    .map(([id]) => id);

  const book     = BOOKS_CATALOG.find((b) => b.id === bookId);
  const unlocked = book ? isBookUnlocked(book.id, completedBookIds) : false;
  const prog     = bookId ? booksProgress[bookId] : undefined;

  const [html, setHtml]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [scrollPct, setScrollPct] = useState(prog?.scrollPercent ?? 0);
  const [showCompleted, setShowCompleted] = useState(prog?.completed ?? false);

  const contentRef = useRef<HTMLDivElement>(null);
  const endRef     = useRef<HTMLDivElement>(null);
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Load content ── */
  useEffect(() => {
    if (!book) { setError("Livro não encontrado."); setLoading(false); return; }
    if (!unlocked) { setError("Livro bloqueado. Termine o livro anterior primeiro."); setLoading(false); return; }

    async function load() {
      setLoading(true);
      try {
        if (book!.docxFile) {
          const docxHtml = await loadDocx(`/books/${book!.docxFile}`);
          setHtml(docxHtml || book!.content || "<p>Sem conteúdo disponível.</p>");
        } else {
          setHtml(book!.content || "<p>Sem conteúdo disponível.</p>");
        }
      } catch {
        setHtml(book!.content || "<p>Erro ao carregar o ficheiro. A mostrar conteúdo incorporado.</p>");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [book, unlocked]);

  /* ── Scroll tracking ── */
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el || !bookId) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const max = scrollHeight - clientHeight;
    if (max <= 0) return;

    const pct = Math.round((scrollTop / max) * 100);
    setScrollPct(pct);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateBookProgress(bookId, pct);
    }, 800);
  }, [bookId, updateBookProgress]);

  /* ── End-of-page detection ── */
  useEffect(() => {
    if (!endRef.current || !bookId || prog?.completed) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          markBookComplete(bookId);
          setShowCompleted(true);
          setScrollPct(100);
          toast.success("📚 Livro concluído! O próximo foi desbloqueado.", {
            duration: 5000,
          });
        }
      },
      { threshold: 0.8 },
    );
    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, [bookId, prog?.completed, markBookComplete]);

  /* ── Guards ── */
  if (!book) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-bear mb-3" />
          <p className="text-sm text-muted-foreground">Livro não encontrado.</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate("/biblioteca")}>
            Voltar à Biblioteca
          </Button>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="font-semibold mb-1">Livro Bloqueado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Complete o livro anterior para desbloquear <strong>{book.title}</strong>.
          </p>
          <Button variant="outline" onClick={() => navigate("/biblioteca")}>
            Voltar à Biblioteca
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Reading progress bar (fixed top) ── */}
      <div className="sticky top-0 z-20">
        <div
          className="h-1 bg-primary transition-all duration-300"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-md sticky top-1 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => navigate("/biblioteca")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight truncate">{book.title}</p>
          <p className="text-[11px] text-muted-foreground">{book.author}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs text-muted-foreground">{scrollPct}%</span>
          <Badge
            variant="outline"
            className={`text-[10px] h-5 ${
              showCompleted
                ? "border-bull/40 text-bull"
                : "border-border text-muted-foreground"
            }`}
          >
            {showCompleted ? (
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Concluído</span>
            ) : (
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />A ler</span>
            )}
          </Badge>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-2xl mx-auto px-6 py-10">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">A carregar o livro…</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-bear/30 bg-bear/5 p-4 text-center">
              <AlertTriangle className="mx-auto h-6 w-6 text-bear mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {html && !loading && (
            <article
              className="book-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}

          {/* End marker — triggers completion */}
          {html && !loading && (
            <div ref={endRef} className="mt-16 mb-8">
              <div className={`rounded-xl border p-6 text-center transition-all ${
                showCompleted
                  ? "border-bull/30 bg-bull/5"
                  : "border-border bg-muted/30"
              }`}>
                {showCompleted ? (
                  <>
                    <CheckCircle2 className="mx-auto h-10 w-10 text-bull mb-3" />
                    <h3 className="font-semibold mb-1">Livro Concluído!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Excelente! O próximo livro foi desbloqueado na Biblioteca.
                    </p>
                    <Button onClick={() => navigate("/biblioteca")}>
                      Ir para a Biblioteca
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Chegou ao fim. Role para cima para reler ou regresse à Biblioteca.
                    </p>
                    <Button variant="outline" className="mt-3" onClick={() => navigate("/biblioteca")}>
                      Voltar à Biblioteca
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
