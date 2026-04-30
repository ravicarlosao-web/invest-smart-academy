import { useState, useMemo } from "react";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GLOSSARY, ALPHABET, CATEGORIES, CATEGORY_COLORS, GlossaryCategory } from "@/data/glossary";

export default function Glossario() {
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | null>(null);

  const filtered = useMemo(() => {
    return GLOSSARY.filter((t) => {
      const matchQuery =
        query.trim() === "" ||
        t.term.toLowerCase().includes(query.toLowerCase()) ||
        t.definition.toLowerCase().includes(query.toLowerCase());
      const matchLetter = !activeLetter || t.term.toUpperCase().startsWith(activeLetter);
      const matchCat = !activeCategory || t.category === activeCategory;
      return matchQuery && matchLetter && matchCat;
    }).sort((a, b) => a.term.localeCompare(b.term, "pt"));
  }, [query, activeLetter, activeCategory]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    filtered.forEach((t) => {
      const letter = t.term[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(t);
    });
    return map;
  }, [filtered]);

  const lettersWithTerms = Object.keys(grouped).sort();

  function clearFilters() {
    setQuery("");
    setActiveLetter(null);
    setActiveCategory(null);
  }

  return (
    <div className="min-h-full p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Glossário de Trading</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {GLOSSARY.length} termos essenciais explicados em português
        </p>
      </div>

      {/* Search + filters */}
      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveLetter(null); }}
            placeholder="Buscar termos ou definições..."
            className="pl-9 bg-surface-1 border-border"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all border ${
                activeCategory === cat
                  ? `${CATEGORY_COLORS[cat]} border-transparent`
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Alphabet nav */}
        <div className="flex flex-wrap gap-1">
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => { setActiveLetter(activeLetter === letter ? null : letter); setQuery(""); }}
              className={`h-7 w-7 rounded text-[11px] font-bold transition-colors ${
                activeLetter === letter
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {letter}
            </button>
          ))}
          {(activeLetter || activeCategory || query) && (
            <button
              onClick={clearFilters}
              className="h-7 px-2 rounded text-[11px] font-medium bg-surface-1 text-muted-foreground hover:text-foreground"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Terms list */}
      {lettersWithTerms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BookOpen className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">Nenhum termo encontrado.</p>
          <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {lettersWithTerms.map((letter) => (
            <div key={letter}>
              {/* Letter divider */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-black text-primary/40">{letter}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Terms grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {grouped[letter].map((t) => (
                  <div
                    key={t.term}
                    className="group rounded-xl border border-border bg-surface-1 p-4 hover:border-primary/30 hover:bg-surface-2 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-semibold text-sm leading-tight">{t.term}</span>
                      <Badge
                        className={`shrink-0 text-[9px] px-1.5 py-0 h-4 font-medium border-0 ${CATEGORY_COLORS[t.category]}`}
                      >
                        {t.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
