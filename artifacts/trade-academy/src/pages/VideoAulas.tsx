import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Play, Lock, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle,
  ExternalLink, Video, Loader2, Star, BookOpen, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { api } from "@/lib/apiClient";
import { useAppStore } from "@/store/useAppStore";
import {
  type VideoLesson,
  extractYouTubeId,
  embedUrl,
  thumbnailUrl,
  LEVEL_COLORS,
} from "@/data/videos";

/* =========================================================================
 * Helpers
 * ========================================================================= */
function useVideos() {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.videos
      .list()
      .then((raw) => setVideos((raw as VideoLesson[]).sort((a, b) => a.order - b.order)))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  return { videos, loading };
}

/** Determine if a video is accessible given the user's XP and the list of watched videos */
function isUnlocked(
  video: VideoLesson,
  idx: number,
  allVideos: VideoLesson[],
  userXp: number,
  watchedIds: string[],
): boolean {
  // XP gate — if set, user must have enough XP
  if (video.requiredXp && userXp < video.requiredXp) return false;
  // Sequential gate — first video is always unlocked (if XP is ok),
  // subsequent ones require the previous to have been watched
  if (idx === 0) return true;
  const prev = allVideos[idx - 1];
  return watchedIds.includes(prev.id);
}

/* =========================================================================
 * Gallery view — /video-aulas
 * ========================================================================= */
function GalleryView({ videos, loading }: { videos: VideoLesson[]; loading: boolean }) {
  const navigate       = useNavigate();
  const userXp         = useAppStore((s) => s.progress.xp);
  const watchedVideos  = useAppStore((s) => s.watchedVideos);

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
        <div>
          <p className="font-semibold">Nenhum vídeo disponível</p>
          <p className="text-sm text-muted-foreground mt-1">O administrador ainda não adicionou vídeo aulas.</p>
        </div>
      </div>
    );
  }

  // Group by creator
  const byCreator = videos.reduce<Record<string, VideoLesson[]>>((acc, v) => {
    (acc[v.creator] = acc[v.creator] ?? []).push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
        <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Os vídeos presentes nesta secção <strong className="text-foreground">não são de nossa autoria</strong> e
          pertencem aos respectivos criadores no YouTube. Podem ser removidos a qualquer momento caso o criador
          assim o solicite. Curámos apenas os melhores conteúdos relacionados com cada tema.
        </p>
      </div>

      {/* Gallery by creator */}
      {Object.entries(byCreator).map(([creator, creatorVideos]) => (
        <section key={creator}>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base leading-none">{creator}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{creatorVideos.length} vídeos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {creatorVideos.map((v, i) => {
              // Find global index for sequential check
              const globalIdx = videos.indexOf(v);
              const unlocked  = isUnlocked(v, globalIdx, videos, userXp, watchedVideos);
              const watched   = watchedVideos.includes(v.id);
              const videoId   = extractYouTubeId(v.youtubeUrl);

              return (
                <button
                  key={v.id}
                  onClick={() => unlocked && navigate(`/video-aulas/${v.id}`)}
                  className={cn(
                    "group relative rounded-xl overflow-hidden border text-left transition-all",
                    unlocked
                      ? "border-border/60 hover:border-primary/40 hover:shadow-glow cursor-pointer"
                      : "border-border/30 cursor-not-allowed opacity-60",
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted">
                    {videoId ? (
                      <img
                        src={thumbnailUrl(videoId)}
                        alt={v.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Video className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}

                    {/* Overlay */}
                    <div className={cn(
                      "absolute inset-0 flex items-center justify-center transition-opacity",
                      unlocked ? "bg-black/30 opacity-0 group-hover:opacity-100" : "bg-black/60 opacity-100",
                    )}>
                      {unlocked ? (
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

                    {/* Watched badge */}
                    {watched && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-5 w-5 text-bull drop-shadow" />
                      </div>
                    )}

                    {/* Duration */}
                    {v.duration && (
                      <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
                        {v.duration}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-card">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <Badge className={cn("text-[10px] px-1.5 py-0", LEVEL_COLORS[v.level])}>{v.level}</Badge>
                      {!unlocked && v.requiredXp && userXp < v.requiredXp && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          <Lock className="h-2.5 w-2.5 mr-0.5" />{v.requiredXp} XP
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-snug line-clamp-2">{v.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{creator}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/* =========================================================================
 * Player view — /video-aulas/:videoId
 * ========================================================================= */
function PlayerView({ videoId: vid, videos }: { videoId: string; videos: VideoLesson[] }) {
  const navigate       = useNavigate();
  const userXp         = useAppStore((s) => s.progress.xp);
  const watchedVideos  = useAppStore((s) => s.watchedVideos);
  const markWatched    = useAppStore((s) => s.markVideoWatched);
  const iframeRef      = useRef<HTMLIFrameElement>(null);
  const [videoEnded, setVideoEnded]   = useState(false);
  const [markedDone, setMarkedDone]   = useState(false);

  const video    = videos.find((v) => v.id === vid);
  const idx      = video ? videos.indexOf(video) : -1;
  const ytId     = video ? extractYouTubeId(video.youtubeUrl) : null;
  const prevVid  = idx > 0 ? videos[idx - 1] : null;
  const nextVid  = idx < videos.length - 1 ? videos[idx + 1] : null;

  const isWatched    = watchedVideos.includes(vid);
  const nextUnlocked = nextVid ? isUnlocked(nextVid, idx + 1, videos, userXp, watchedVideos) : false;
  const canGoNext    = Boolean(nextVid) && (isWatched || nextUnlocked);

  // Listen for YouTube postMessage (video ended)
  useEffect(() => {
    setVideoEnded(false);
    setMarkedDone(false);

    function onMessage(e: MessageEvent) {
      if (e.origin !== "https://www.youtube.com") return;
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        // YouTube sends {event:"onStateChange",info:0} when ended
        if (data?.event === "onStateChange" && data?.info === 0) {
          setVideoEnded(true);
        }
      } catch { /* ignore */ }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [vid]);

  // Auto-mark when video ends
  useEffect(() => {
    if (videoEnded && !isWatched) {
      handleMarkDone();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoEnded]);

  function handleMarkDone() {
    if (markedDone || isWatched) return;
    markWatched(vid);
    setMarkedDone(true);
    toast.success("Vídeo concluído!", {
      description: nextVid ? "Próximo vídeo desbloqueado." : "Parabéns, completaste todos os vídeos!",
    });
  }

  function goTo(v: VideoLesson) {
    navigate(`/video-aulas/${v.id}`);
  }

  if (!video || !ytId) {
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

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* ── Main column ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Back link */}
        <Link to="/video-aulas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar à galeria
        </Link>

        {/* Player */}
        <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16/9" }}>
          <iframe
            ref={iframeRef}
            src={embedUrl(ytId)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>

        {/* Navigation controls */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={!prevVid}
            onClick={() => prevVid && goTo(prevVid)}>
            <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Anterior
          </Button>

          {!isWatched && !markedDone ? (
            <Button size="sm" onClick={handleMarkDone} className="bg-bull/90 hover:bg-bull text-white">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Marcar como assistido
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-bull font-medium">
              <CheckCircle2 className="h-4 w-4" /> Concluído
            </div>
          )}

          <Button variant="outline" size="sm"
            disabled={!nextVid || (!isWatched && !markedDone)}
            onClick={() => nextVid && (isWatched || markedDone) && goTo(nextVid)}>
            Próximo <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Video info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-snug">{video.title}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-sm text-muted-foreground">{video.creator}</span>
                <Badge className={cn("text-[10px]", LEVEL_COLORS[video.level])}>{video.level}</Badge>
                {video.requiredXp && (
                  <Badge variant="outline" className="text-[10px]">
                    {video.requiredXp} XP mínimo
                  </Badge>
                )}
              </div>
            </div>
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" /> YouTube
            </a>
          </div>

          {video.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{video.description}</p>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3">
            <AlertCircle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Este vídeo não é de nossa autoria. O conteúdo pertence ao criador original no YouTube e pode ser
              removido a qualquer momento. Curámos este material por considerar de excelente qualidade para o tema.
            </p>
          </div>
        </div>
      </div>

      {/* ── Sidebar — playlist ─────────────────────────────────────────────── */}
      <aside className="w-full lg:w-80 xl:w-96 shrink-0 space-y-2">
        <h3 className="text-sm font-semibold px-1">Todos os vídeos</h3>
        <div className="space-y-1.5 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
          {videos.map((v, i) => {
            const unlocked   = isUnlocked(v, i, videos, userXp, watchedVideos);
            const isActive   = v.id === vid;
            const isWatched2 = watchedVideos.includes(v.id);
            const vYtId      = extractYouTubeId(v.youtubeUrl);

            return (
              <button
                key={v.id}
                onClick={() => {
                  if (!unlocked) return;
                  // can only go to other videos after watching current
                  if (!isActive && !isWatched && !markedDone) {
                    toast.warning("Termina o vídeo actual antes de avançar.");
                    return;
                  }
                  goTo(v);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-all",
                  isActive
                    ? "bg-primary/15 border border-primary/30"
                    : unlocked
                    ? "hover:bg-muted/60 cursor-pointer"
                    : "opacity-50 cursor-not-allowed",
                )}
              >
                {/* Thumbnail */}
                <div className="relative h-14 w-24 shrink-0 rounded-md overflow-hidden bg-muted">
                  {vYtId ? (
                    <img src={thumbnailUrl(vYtId)} alt={v.title}
                      className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Video className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                  {/* Lock / active overlay */}
                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Lock className="h-4 w-4 text-white/80" />
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
                  <p className={cn("text-xs font-medium leading-snug line-clamp-2",
                    isActive && "text-primary")}>{v.title}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">{v.creator}</span>
                    <Badge className={cn("text-[9px] px-1 py-0", LEVEL_COLORS[v.level])}>{v.level}</Badge>
                  </div>
                </div>

                {/* Status icon */}
                <div className="shrink-0">
                  {isWatched2 ? (
                    <CheckCircle2 className="h-4 w-4 text-bull" />
                  ) : !unlocked ? (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : null}
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
    <div className="space-y-6">
      {/* Header */}
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
