/**
 * seedVideos.ts
 *
 * Migra os vídeos de admin_settings ("content.videos") para a tabela `videos`.
 * INSERT OR IGNORE → idempotente (chamado a cada arranque em initDb).
 * Se não houver vídeos em admin_settings, não faz nada.
 */
import { db, sql, eq, adminSettingsTable, videosTable } from "@workspace/db";

export async function seedVideos(_unused?: any): Promise<void> {
  try {
    // Lê vídeos do admin_settings (fonte actual)
    const row = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "content.videos"))
      .get();

    if (!row?.value) return;

    let videos: any[];
    try {
      videos = JSON.parse(row.value);
    } catch {
      return;
    }

    if (!Array.isArray(videos) || videos.length === 0) return;

    const now = Date.now();

    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      if (!v?.id || !v?.title) continue;

      const id          = String(v.id);
      const creator     = String(v.creator ?? "Desconhecido").replace(/'/g, "''");
      const title       = String(v.title).replace(/'/g, "''");
      const level       = String(v.level ?? "Iniciante").replace(/'/g, "''");
      const category    = String(v.category ?? "Geral").replace(/'/g, "''");
      const tags        = JSON.stringify(Array.isArray(v.tags) ? v.tags : []).replace(/'/g, "''");
      const videoUrl    = String(v.videoUrl ?? v.youtubeUrl ?? "").replace(/'/g, "''");
      const description = v.description ? String(v.description).replace(/'/g, "''") : null;
      const sortOrder   = Number.isFinite(v.order) ? v.order : i;

      await db.run(sql.raw(
        `INSERT OR IGNORE INTO videos
           (id, creator, title, level, category, tags, video_url, description, sort_order, created_at, updated_at)
         VALUES
           ('${id}', '${creator}', '${title}', '${level}', '${category}',
            '${tags}', '${videoUrl}', ${description ? `'${description}'` : "NULL"},
            ${sortOrder}, ${now}, ${now})`,
      ));
    }

    console.info(`[seed] seedVideos: ${videos.length} vídeo(s) processados (INSERT OR IGNORE).`);
  } catch (err) {
    // Falha silenciosa — não deve impedir o arranque do servidor
    console.warn("[seed] seedVideos: erro durante migração:", err);
  }
}
