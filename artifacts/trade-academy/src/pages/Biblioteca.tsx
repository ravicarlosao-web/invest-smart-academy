import { useNavigate } from "react-router-dom";
import { BookOpen, Lock, CheckCircle2, Clock, ChevronRight, Library } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/useAppStore";
import { BOOKS_CATALOG, isBookUnlocked } from "@/data/books";

export default function Biblioteca() {
  const navigate = useNavigate();
  const booksProgress = useAppStore((s) => s.booksProgress);
  const completedBookIds = Object.entries(booksProgress)
    .filter(([, p]) => p.completed)
    .map(([id]) => id);

  const totalBooks     = BOOKS_CATALOG.length;
  const completedCount = completedBookIds.length;

  return (
    <div className="min-h-full p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Library className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Biblioteca</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Livros de trading para aprofundar o seu conhecimento. Leia na ordem para desbloquear o próximo.
        </p>
      </div>

      {/* Progress summary */}
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso da Biblioteca</span>
          <span className="font-mono text-sm font-bold text-primary">
            {completedCount}/{totalBooks}
          </span>
        </div>
        <Progress value={(completedCount / totalBooks) * 100} className="h-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          {completedCount === 0
            ? "Comece pelo primeiro livro — ele já está desbloqueado."
            : completedCount === totalBooks
            ? "Parabéns! Leu todos os livros disponíveis."
            : `${totalBooks - completedCount} livro(s) restante(s).`}
        </p>
      </div>

      {/* Book cards */}
      <div className="space-y-4">
        {BOOKS_CATALOG.sort((a, b) => a.order - b.order).map((book) => {
          const prog    = booksProgress[book.id];
          const unlocked = isBookUnlocked(book.id, completedBookIds);
          const completed = prog?.completed ?? false;
          const scrollPct = prog?.scrollPercent ?? 0;

          return (
            <div
              key={book.id}
              onClick={() => unlocked && navigate(`/biblioteca/${book.id}`)}
              className={`group rounded-xl border transition-all duration-200 overflow-hidden ${
                unlocked
                  ? "border-border bg-card hover:border-primary/40 hover:shadow-elev-md cursor-pointer"
                  : "border-border/50 bg-card/50 cursor-not-allowed opacity-60"
              }`}
            >
              <div className="flex items-start gap-4 p-4">
                {/* Cover */}
                <div className={`flex h-16 w-14 shrink-0 items-center justify-center rounded-lg text-3xl ${
                  completed
                    ? "bg-bull/10 ring-1 ring-bull/30"
                    : unlocked
                    ? "bg-primary/10 ring-1 ring-primary/20"
                    : "bg-muted"
                }`}>
                  {book.cover}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm leading-tight">{book.title}</h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-4 px-1.5 ${
                            book.category === "Iniciante"
                              ? "border-bull/40 text-bull"
                              : book.category === "Intermediário"
                              ? "border-primary/40 text-primary"
                              : "border-warning/40 text-warning"
                          }`}
                        >
                          {book.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
                    </div>

                    {/* Status icon */}
                    <div className="shrink-0">
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5 text-bull" />
                      ) : !unlocked ? (
                        <Lock className="h-5 w-5 text-muted-foreground/50" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                    {book.description}
                  </p>

                  {/* Footer meta */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {book.pages} págs.
                      </span>
                      {!unlocked && (
                        <span className="flex items-center gap-1 text-muted-foreground/60">
                          <Lock className="h-3 w-3" />
                          Complete o livro anterior para desbloquear
                        </span>
                      )}
                      {unlocked && !completed && scrollPct > 0 && (
                        <span className="flex items-center gap-1 text-primary">
                          <Clock className="h-3 w-3" />
                          {scrollPct}% lido
                        </span>
                      )}
                      {completed && (
                        <span className="flex items-center gap-1 text-bull">
                          <CheckCircle2 className="h-3 w-3" />
                          Concluído
                        </span>
                      )}
                    </div>

                    {/* Reading progress bar */}
                    {unlocked && scrollPct > 0 && !completed && (
                      <div className="w-24">
                        <Progress value={scrollPct} className="h-1" />
                      </div>
                    )}
                    {completed && (
                      <div className="w-24">
                        <Progress value={100} className="h-1 [&>div]:bg-bull" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add books hint */}
      <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Para adicionar novos livros, coloque ficheiros <span className="font-mono">.docx</span> na
          pasta <span className="font-mono">public/books/</span> e registe-os em{" "}
          <span className="font-mono">src/data/books.ts</span>.
        </p>
      </div>
    </div>
  );
}
