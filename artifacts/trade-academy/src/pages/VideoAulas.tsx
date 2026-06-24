import { useEffect, useRef, useState, useCallback, useId, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Play, Pause, Lock, CheckCircle2, ChevronLeft, ChevronRight,
  AlertCircle, Video, Loader2, Star, ArrowLeft,
  Volume1, Volume2, VolumeX, RotateCcw, RotateCw, Maximize2,
  Search, X, Users, Tag, BookOpen,
  TrendingUp, Activity, BarChart3, Shield, Brain, Globe,
  ArrowLeftRight, Coins, Building2, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { api } from "@/lib/apiClient";
import { useAppStore } from "@/store/useAppStore";
import { PlanWall } from "@/components/PlanWall";
import {
  type VideoLesson,
  extractYouTubeId,
  thumbnailUrl,
  getVideoEmbedUrl,
  LEVEL_COLORS,
} from "@/data/videos";

/* =========================================================================
 * YouTube IFrame API loader (singleton)
 * ========================================================================= */
let _ytApiPromise: Promise<void> | null = null;
function loadYTApi(): Promise<void> {
  if (_ytApiPromise) return _ytApiPromise;
  _ytApiPromise = new Promise<void>((resolve) => {
    if ((window as any).YT?.Player) { resolve(); return; }
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
  return _ytApiPromise;
}

/* =========================================================================
 * CustomYTPlayer — player completamente personalizado
 * Sem controlos do YouTube, sem branding. Barrier invisível bloqueia tudo.
 * ========================================================================= */
interface CustomYTPlayerProps {
  videoId: string;
  title: string;
  thumbnail: string;
  onEnded?: () => void;
}

function CustomYTPlayer({ videoId, title, thumbnail, onEnded }: CustomYTPlayerProps) {
  const uid = useId().replace(/:/g, "_");
  const divId = `yt_player_${uid}`;

  const playerRef    = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ytState,      setYtState]      = useState<number>(-1); // YT.PlayerState
  const [currentTime,  setCurrent]      = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [volume,       setVolume]       = useState(75);
  const [muted,        setMuted]        = useState(false);
  const [showCtrls,    setShowCtrls]    = useState(false);
  const [showVolSlider,setShowVolSlider]= useState(false);
  const [buffering,    setBuffering]    = useState(false);

  // YT states: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
  const isPlaying = ytState === 1;
  const isEnded   = ytState === 0;
  const showCover = ytState !== 1 && ytState !== 3; // show thumbnail unless actively playing/buffering

  /* ── Polling current time ──────────────────────────────────────────── */
  function startPoll() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (!playerRef.current) return;
      setCurrent(playerRef.current.getCurrentTime?.() ?? 0);
      setDuration(playerRef.current.getDuration?.() ?? 0);
    }, 500);
  }
  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  /* ── Load player ───────────────────────────────────────────────────── */
  useEffect(() => {
    let destroyed = false;
    loadYTApi().then(() => {
      if (destroyed) return;
      playerRef.current?.destroy();
      playerRef.current = new (window as any).YT.Player(divId, {
        videoId,
        playerVars: {
          controls:       0,
          modestbranding: 1,
          rel:            0,
          playsinline:    1,
          disablekb:      1,
          iv_load_policy: 3,
          fs:             0,
          origin:         window.location.origin,
          cc_load_policy: 0,
          showinfo:       0,
        },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(75);
            setDuration(e.target.getDuration() ?? 0);
          },
          onStateChange: (e: any) => {
            const s: number = e.data;
            setYtState(s);
            setBuffering(s === 3);
            if (s === 1) {
              startPoll();
            } else {
              stopPoll();
              setCurrent(playerRef.current?.getCurrentTime?.() ?? 0);
              setDuration(playerRef.current?.getDuration?.() ?? 0);
            }
            if (s === 0) onEnded?.();
          },
        },
      });
    });
    return () => {
      destroyed = true;
      stopPoll();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  /* ── Controls visibility ───────────────────────────────────────────── */
  function revealControls() {
    setShowCtrls(true);
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => {
      setShowCtrls(false);
      setShowVolSlider(false);
    }, 2800);
  }

  /* ── Playback helpers ──────────────────────────────────────────────── */
  function togglePlay() {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
    revealControls();
  }
  function seek(delta: number) {
    if (!playerRef.current) return;
    const t = Math.max(0, (playerRef.current.getCurrentTime?.() ?? 0) + delta);
    playerRef.current.seekTo(t, true);
    setCurrent(t);
    revealControls();
  }
  function handleSeekBar(e: React.ChangeEvent<HTMLInputElement>) {
    const t = parseFloat(e.target.value);
    playerRef.current?.seekTo(t, true);
    setCurrent(t);
  }
  function handleVolumeChange(v: number) {
    setVolume(v);
    setMuted(v === 0);
    playerRef.current?.setVolume(v);
    v === 0 ? playerRef.current?.mute() : playerRef.current?.unMute();
  }
  function toggleMute() {
    if (muted || volume === 0) {
      const nv = volume === 0 ? 75 : volume;
      setMuted(false);
      setVolume(nv);
      playerRef.current?.unMute();
      playerRef.current?.setVolume(nv);
    } else {
      setMuted(true);
      playerRef.current?.mute();
    }
  }
  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  const effectiveVol = muted ? 0 : volume;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl bg-black select-none"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={revealControls}
      onMouseLeave={() => { setShowCtrls(false); setShowVolSlider(false); }}
    >
      {/* ── YT iframe injected here ──────────────────────────────────── */}
      <div id={divId} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* ── Thumbnail cover (quando não está a tocar) ──────────────── */}
      <div
        className={cn(
          "absolute inset-0 z-10 transition-opacity duration-300",
          showCover ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <img
          src={thumbnail}
          alt={title}
          className="h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* ── Barrier invisível — bloqueia TODOS os controlos do YouTube ─ */}
      <div className="absolute inset-0 z-20" onClick={togglePlay} style={{ cursor: "default" }} />

      {/* ── Buffering spinner ─────────────────────────────────────────── */}
      {buffering && (
        <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
          <Loader2 className="h-10 w-10 animate-spin text-white/70" />
        </div>
      )}

      {/* ── Controlo overlay ─────────────────────────────────────────── */}
      <div
        className={cn(
          "absolute inset-0 z-30 flex flex-col justify-between transition-opacity duration-200 pointer-events-none",
          (showCtrls || showCover) ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Top bar — Volume */}
        <div
          className="flex items-center justify-end gap-2 px-4 pt-3 pb-10 pointer-events-auto"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)" }}
        >
          <div
            className="flex items-center gap-2"
            onMouseEnter={() => setShowVolSlider(true)}
            onMouseLeave={() => setShowVolSlider(false)}
          >
            <div
              className={cn(
                "flex items-center overflow-hidden transition-all duration-200",
                showVolSlider ? "w-24 opacity-100 mr-1" : "w-0 opacity-0",
              )}
            >
              <input
                type="range" min={0} max={100}
                value={effectiveVol}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24 h-1 cursor-pointer accent-white"
                style={{ WebkitAppearance: "none" }}
              />
            </div>
            <button
              onClick={toggleMute}
              className="text-white/80 hover:text-white transition-colors"
              title={muted ? "Activar som" : "Silenciar"}
            >
              {effectiveVol === 0
                ? <VolumeX className="h-4 w-4" />
                : effectiveVol < 50
                ? <Volume1 className="h-4 w-4" />
                : <Volume2 className="h-4 w-4" />
              }
            </button>
          </div>
        </div>

        {/* Centro — Recuar / Play-Pause / Avançar */}
        <div className="flex items-center justify-center gap-8 pointer-events-auto">
          <button
            onClick={() => seek(-10)}
            className="group/btn flex flex-col items-center text-white/80 hover:text-white transition-all hover:scale-110"
            title="Recuar 10s"
          >
            <RotateCcw className="h-7 w-7" />
            <span className="text-[9px] font-bold mt-0.5 tabular-nums">10</span>
          </button>

          <button
            onClick={togglePlay}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm border border-white/30 transition-all hover:scale-110 active:scale-95"
          >
            {isPlaying
              ? <Pause className="h-6 w-6 text-white fill-white" />
              : <Play  className="h-6 w-6 text-white fill-white ml-0.5" />
            }
          </button>

          <button
            onClick={() => seek(10)}
            className="group/btn flex flex-col items-center text-white/80 hover:text-white transition-all hover:scale-110"
            title="Avançar 10s"
          >
            <RotateCw className="h-7 w-7" />
            <span className="text-[9px] font-bold mt-0.5 tabular-nums">10</span>
          </button>
        </div>

        {/* Bottom — Progress + tempo + fullscreen */}
        <div
          className="px-4 pb-3 pt-10 pointer-events-auto"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.70), transparent)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-white/80 text-[11px] font-mono tabular-nums w-10 text-right shrink-0">
              {fmtTime(currentTime)}
            </span>
            <input
              type="range" min={0} max={duration || 100}
              value={currentTime}
              onChange={handleSeekBar}
              className="flex-1 h-1 cursor-pointer accent-white"
              style={{ WebkitAppearance: "none" }}
            />
            <span className="text-white/60 text-[11px] font-mono tabular-nums w-10 shrink-0">
              {fmtTime(duration)}
            </span>
            <button
              onClick={toggleFullscreen}
              className="text-white/70 hover:text-white transition-colors ml-1 shrink-0"
              title="Ecrã inteiro"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
 * Helpers / hooks
 * ========================================================================= */
function useVideos() {
  const [videos,  setVideos]  = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.content
      .videos()
      .then((raw) => {
        const migrated = (raw as any[]).map((v) => ({
          ...v,
          videoUrl:  v.videoUrl ?? v.youtubeUrl ?? "",
          category:  v.category ?? "Geral",
          tags:      Array.isArray(v.tags) ? v.tags : [],
        })) as VideoLesson[];
        setVideos(migrated.sort((a, b) => a.order - b.order));
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  return { videos, loading };
}

function isUnlocked(
  video: VideoLesson,
  _idx: number,
  _allVideos: VideoLesson[],
  userXp: number,
  _watchedIds: string[],
): boolean {
  if (video.requiredXp && userXp < video.requiredXp) return false;
  return true;
}

/* =========================================================================
 * Gallery — /video-aulas
 * ========================================================================= */
const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Análise Técnica":       TrendingUp,
  "Análise de Velas":      BarChart3,
  "Price Action":          Activity,
  "Gestão de Risco":       Shield,
  "Psicologia de Trading": Brain,
  "Macroeconomia":         Globe,
  "Forex":                 ArrowLeftRight,
  "Criptomoedas":          Coins,
  "Acções & Índices":      Building2,
  "Fundamentos":           BookOpen,
  "Geral":                 Video,
};
function CatIcon({ cat, className }: { cat: string; className?: string }) {
  const Icon = (CAT_ICONS[cat] ?? Video) as React.ComponentType<{ className?: string }>;
  return <Icon className={cn("h-4 w-4 shrink-0", className)} />;
}

function VideoCard({
  v, videos, userXp, watchedVideos, navigate, onPlanWall,
}: {
  v: VideoLesson; videos: VideoLesson[]; userXp: number; watchedVideos: string[];
  navigate: ReturnType<typeof useNavigate>; onPlanWall?: () => void;
}) {
  const globalIdx    = videos.indexOf(v);
  const planLocked   = (v as any).accessible === false;
  const unlocked     = !planLocked && isUnlocked(v, globalIdx, videos, userXp, watchedVideos);
  const watched      = watchedVideos.includes(v.id);
  const videoId      = extractYouTubeId(v.videoUrl);

  return (
    <button
      onClick={() => {
        if (planLocked) { onPlanWall?.(); return; }
        if (unlocked) navigate(`/video-aulas/${v.id}`);
      }}
      className={cn(
        "group relative rounded-xl overflow-hidden border text-left transition-all w-full",
        planLocked
          ? "border-amber-500/20 hover:border-amber-500/40 cursor-pointer"
          : unlocked
          ? "border-border/60 hover:border-primary/40 hover:shadow-glow cursor-pointer"
          : "border-border/30 cursor-not-allowed opacity-60",
      )}
    >
      <div className="relative aspect-video bg-muted">
        {videoId ? (
          <img src={thumbnailUrl(videoId)} alt={v.title}
            className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Video className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity",
          planLocked
            ? "bg-black/50 opacity-100"
            : unlocked ? "bg-black/30 opacity-0 group-hover:opacity-100" : "bg-black/60 opacity-100",
        )}>
          {planLocked ? (
            <div className="flex flex-col items-center gap-1.5">
              <Crown className="h-6 w-6 text-amber-400" />
            </div>
          ) : unlocked ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="h-5 w-5 text-black fill-black ml-0.5" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Lock className="h-6 w-6 text-white" />
              {v.requiredXp && userXp < v.requiredXp && (
                <span className="text-[10px] text-white font-medium bg-black/50 rounded px-1.5 py-0.5">
                  {v.requiredXp} XP
                </span>
              )}
            </div>
          )}
        </div>
        {watched && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="h-5 w-5 text-bull drop-shadow" />
          </div>
        )}
        {v.duration && (
          <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
            {v.duration}
          </div>
        )}
      </div>

      <div className="p-3 bg-card">
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <Badge className={cn("text-[10px] px-1.5 py-0", LEVEL_COLORS[v.level])}>{v.level}</Badge>
          {v.category && v.category !== "Geral" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
              <CatIcon cat={v.category} className="h-3 w-3" />{v.category}
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium leading-snug line-clamp-2">{v.title}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{v.creator}</p>
        {v.tags && v.tags.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {v.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] bg-muted/60 text-muted-foreground rounded px-1.5 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

/* =========================================================================
 * Gallery — /video-aulas
 * ========================================================================= */
function GalleryView({ videos, loading }: { videos: VideoLesson[]; loading: boolean }) {
  const navigate      = useNavigate();
  const userXp        = useAppStore((s) => s.progress.xp);
  const watchedVideos = useAppStore((s) => s.watchedVideos);
  const [showPlanWall, setShowPlanWall] = useState(false);
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeCreator, setActiveCreator]   = useState("Todos");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(videos.map((v) => v.category || "Geral"))).sort();
    return ["Todos", ...cats];
  }, [videos]);

  const creatorsInView = useMemo(() => {
    const src = activeCategory === "Todos" ? videos : videos.filter((v) => (v.category || "Geral") === activeCategory);
    return ["Todos", ...Array.from(new Set(src.map((v) => v.creator))).sort()];
  }, [videos, activeCategory]);

  const filtered = useMemo(() => videos.filter((v) => {
    if (activeCategory !== "Todos" && (v.category || "Geral") !== activeCategory) return false;
    if (activeCreator !== "Todos" && v.creator !== activeCreator) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.creator.toLowerCase().includes(q) ||
        (v.description ?? "").toLowerCase().includes(q) ||
        (v.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  }), [videos, activeCategory, activeCreator, search]);

  const grouped = useMemo<[string, VideoLesson[]][]>(() => {
    if (search.trim()) return filtered.length > 0 ? [["Resultados da pesquisa", filtered]] : [];
    if (activeCreator !== "Todos") return [[activeCreator, filtered]];
    if (activeCategory !== "Todos") {
      const map: Record<string, VideoLesson[]> = {};
      filtered.forEach((v) => { (map[v.creator] = map[v.creator] ?? []).push(v); });
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    }
    const map: Record<string, VideoLesson[]> = {};
    filtered.forEach((v) => {
      const cat = v.category || "Geral";
      (map[cat] = map[cat] ?? []).push(v);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, search, activeCategory, activeCreator]);

  const totalCreators = useMemo(() => new Set(videos.map((v) => v.creator)).size, [videos]);
  const totalCats     = useMemo(() => new Set(videos.map((v) => v.category || "Geral")).size, [videos]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">A carregar vídeos...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="rounded-full bg-muted p-5">
          <Video className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <p className="font-semibold">Nenhum vídeo disponível</p>
        <p className="text-sm text-muted-foreground">O administrador ainda não adicionou vídeo aulas.</p>
      </div>
    );
  }

  const isFiltered = search.trim() !== "" || activeCategory !== "Todos" || activeCreator !== "Todos";

  return (
    <div className="space-y-6">
      {/* PlanWall modal */}
      {showPlanWall && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl">
            <PlanWall onClose={() => setShowPlanWall(false)} />
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
        <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Os vídeos nesta secção <strong className="text-foreground">não são de nossa autoria</strong> e
          pertencem aos respectivos criadores. Curámos apenas os melhores conteúdos relacionados com cada tema.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: videos.length, label: "Vídeos" },
          { value: totalCats,     label: "Categorias" },
          { value: totalCreators, label: "Criadores" },
        ].map(({ value, label }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card p-3 text-center">
            <p className="text-xl font-bold tabular-nums">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar vídeos, criadores, temas..."
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pl-9 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categorias</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {categories.map((cat) => (
            <button key={cat}
              onClick={() => { setActiveCategory(cat); setActiveCreator("Todos"); }}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {cat !== "Todos" && <CatIcon cat={cat} className="h-3.5 w-3.5" />}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Creator filter */}
      {creatorsInView.length > 2 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Criadores</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {creatorsInView.map((cr) => (
              <button key={cr} onClick={() => setActiveCreator(cr)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all",
                  activeCreator === cr
                    ? "border-primary/50 bg-primary/10 text-primary font-medium"
                    : "border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Star className="h-3 w-3 opacity-60" />
                {cr}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active filter summary */}
      {isFiltered && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{filtered.length} vídeo{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</span>
          <button onClick={() => { setSearch(""); setActiveCategory("Todos"); setActiveCreator("Todos"); }}
            className="text-xs text-primary hover:underline flex items-center gap-1">
            <X className="h-3 w-3" /> Limpar filtros
          </button>
        </div>
      )}

      {/* No results */}
      {grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Search className="h-8 w-8 text-muted-foreground/30" />
          <p className="font-medium text-sm">Nenhum vídeo encontrado</p>
          <p className="text-xs text-muted-foreground">Tenta pesquisar por outro termo ou limpa os filtros.</p>
        </div>
      )}

      {/* Video groups */}
      {grouped.map(([groupTitle, groupVideos]) => {
        const isCreatorGroup = activeCategory !== "Todos" || activeCreator !== "Todos";
        return (
          <section key={groupTitle}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                {isCreatorGroup || search.trim()
                  ? <Star className="h-4 w-4 text-primary" />
                  : <CatIcon cat={groupTitle} className="h-4 w-4 text-primary" />
                }
              </div>
              <div>
                <h2 className="font-semibold text-base leading-none">{groupTitle}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {groupVideos.length} vídeo{groupVideos.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groupVideos.map((v) => (
                <VideoCard key={v.id} v={v} videos={videos} userXp={userXp}
                  watchedVideos={watchedVideos} navigate={navigate} onPlanWall={() => setShowPlanWall(true)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* =========================================================================
 * Player — /video-aulas/:videoId
 * ========================================================================= */
function PlayerView({ videoId: vid, videos }: { videoId: string; videos: VideoLesson[] }) {
  const navigate      = useNavigate();
  const userXp        = useAppStore((s) => s.progress.xp);
  const watchedVideos = useAppStore((s) => s.watchedVideos);
  const markWatched   = useAppStore((s) => s.markVideoWatched);
  const [markedDone,  setMarkedDone] = useState(false);

  const video   = videos.find((v) => v.id === vid);
  const idx     = video ? videos.indexOf(video) : -1;
  const ytId    = video ? extractYouTubeId(video.videoUrl) : null;
  const prevVid = idx > 0 ? videos[idx - 1] : null;
  const nextVid = idx < videos.length - 1 ? videos[idx + 1] : null;

  const isWatched = watchedVideos.includes(vid);
  const canGoNext = Boolean(nextVid);

  // Reset when navigating
  useEffect(() => { setMarkedDone(false); }, [vid]);

  function handleMarkDone() {
    if (markedDone || isWatched) return;
    markWatched(vid);
    setMarkedDone(true);
    toast.success("Vídeo concluído!", {
      description: nextVid ? "Podes continuar para o próximo." : "Parabéns, completaste todos os vídeos!",
    });
  }

  function goTo(v: VideoLesson) { navigate(`/video-aulas/${v.id}`); }

  if (!video || !video.videoUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Vídeo não encontrado ou URL inválido.</p>
        <Button variant="outline" asChild>
          <Link to="/video-aulas"><ArrowLeft className="mr-1.5 h-4 w-4" />Voltar à galeria</Link>
        </Button>
      </div>
    );
  }

  const thumb = ytId ? thumbnailUrl(ytId).replace("mqdefault", "hqdefault") : "";

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
      {/* ── Coluna principal ──────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Back link */}
        <Link
          to="/video-aulas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar à galeria
        </Link>

        {/* ── Player ────────────────────────────────────────────────── */}
        {ytId ? (
          <CustomYTPlayer
            videoId={ytId}
            title={video.title}
            thumbnail={thumb}
            onEnded={handleMarkDone}
          />
        ) : (
          <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16/9" }}>
            <iframe
              src={getVideoEmbedUrl(video.videoUrl) ?? video.videoUrl}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        )}

        {/* Navegação */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={!prevVid}
            onClick={() => prevVid && goTo(prevVid)}>
            <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Anterior
          </Button>

          {!isWatched && !markedDone ? (
            <Button size="sm" onClick={handleMarkDone}
              className="bg-bull/90 hover:bg-bull text-white">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Marcar como assistido
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-bull font-medium">
              <CheckCircle2 className="h-4 w-4" /> Concluído
            </div>
          )}

          <Button variant="outline" size="sm"
            disabled={!canGoNext}
            onClick={() => canGoNext && nextVid && goTo(nextVid)}>
            Próximo <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Info do vídeo */}
        <div className="space-y-3 pt-1">
          <div>
            <h1 className="text-lg font-bold leading-snug sm:text-xl">{video.title}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-sm text-muted-foreground">{video.creator}</span>
              <Badge className={cn("text-[10px]", LEVEL_COLORS[video.level])}>{video.level}</Badge>
              {video.category && video.category !== "Geral" && (
                <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                  <CatIcon cat={video.category} className="h-3 w-3" />{video.category}
                </Badge>
              )}
              {video.requiredXp && (
                <Badge variant="outline" className="text-[10px]">{video.requiredXp} XP mínimo</Badge>
              )}
            </div>
            {video.tags && video.tags.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {video.tags.map((tag) => (
                  <span key={tag} className="text-[11px] bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5 flex items-center gap-1">
                    <Tag className="h-2.5 w-2.5" />#{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {video.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{video.description}</p>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3">
            <AlertCircle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Este vídeo não é de nossa autoria. O conteúdo pertence ao criador original e pode ser
              removido a qualquer momento. Curámos este material por considerar de excelente qualidade para o tema.
            </p>
          </div>
        </div>
      </div>

      {/* ── Sidebar — playlist ──────────────────────────────────────── */}
      <aside className="w-full lg:w-72 xl:w-80 shrink-0">
        <h3 className="text-sm font-semibold mb-3 px-1">Todos os vídeos</h3>
        <div className="space-y-1 max-h-[calc(100vh-10rem)] overflow-y-auto pr-0.5">
          {videos.map((v, i) => {
            const unlocked    = isUnlocked(v, i, videos, userXp, watchedVideos);
            const isActive    = v.id === vid;
            const isWatched2  = watchedVideos.includes(v.id);
            const vYtId       = extractYouTubeId(v.videoUrl);

            return (
              <button
                key={v.id}
                onClick={() => {
                  if (!unlocked) return;
                  goTo(v);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-all",
                  isActive
                    ? "bg-primary/15 border border-primary/30"
                    : unlocked
                    ? "hover:bg-muted/60 cursor-pointer"
                    : "opacity-45 cursor-not-allowed",
                )}
              >
                {/* Thumbnail */}
                <div className="relative h-12 w-20 shrink-0 rounded-md overflow-hidden bg-muted">
                  {vYtId ? (
                    <img src={thumbnailUrl(vYtId)} alt={v.title}
                      className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Video className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Lock className="h-3.5 w-3.5 text-white/80" />
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="h-4 w-4 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-xs font-medium leading-snug line-clamp-2",
                    isActive && "text-primary",
                  )}>{v.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">{v.creator}</span>
                    <Badge className={cn("text-[9px] px-1 py-0", LEVEL_COLORS[v.level])}>{v.level}</Badge>
                  </div>
                </div>

                {/* Status */}
                <div className="shrink-0 ml-0.5">
                  {isWatched2
                    ? <CheckCircle2 className="h-4 w-4 text-bull" />
                    : !unlocked
                    ? <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    : null
                  }
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

/* =========================================================================
 * Main page
 * ========================================================================= */
export default function VideoAulas() {
  const { videoId } = useParams<{ videoId?: string }>();
  const { videos, loading } = useVideos();

  return (
    <div className="container py-6 lg:py-8 space-y-6">
      {!videoId && (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Vídeo Aulas</h1>
            <p className="text-sm text-muted-foreground">
              Os melhores vídeos seleccionados para o teu aprendizado
            </p>
          </div>
        </div>
      )}

      {videoId ? (
        loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <PlayerView videoId={videoId} videos={videos} />
        )
      ) : (
        <GalleryView videos={videos} loading={loading} />
      )}
    </div>
  );
}
