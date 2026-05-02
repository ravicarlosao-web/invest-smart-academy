export interface VideoLesson {
  id: string;
  creator: string;
  title: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  videoUrl: string;
  description?: string;
  requiredXp?: number;
  order: number;
  duration?: string;
}

/** Extract the YouTube video ID from any standard YouTube URL */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Returns true if the URL is from YouTube */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/** Returns a YouTube embed URL for a given video ID */
export function embedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`;
}

/** Returns YouTube thumbnail URL for a given video ID */
export function thumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Returns an embed-ready URL for any video link.
 * YouTube → standard embed URL.
 * Other    → the URL itself (works for direct mp4, Vimeo embed links, etc.)
 */
export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytId = extractYouTubeId(url);
  if (ytId) return embedUrl(ytId);
  return url;
}

export const LEVEL_COLORS: Record<VideoLesson["level"], string> = {
  "Iniciante":     "bg-bull/15 text-bull",
  "Intermediário": "bg-warning/15 text-warning",
  "Avançado":      "bg-bear/15 text-bear",
};
