import { db, revokedTokensTable, lt } from "@workspace/db";
import { logger } from "./logger.js";

const INTERVAL_MS = 60 * 60 * 1000; // 1 hora

export function startTokenCleanupJob(): void {
  const run = async () => {
    try {
      const result = await db
        .delete(revokedTokensTable)
        .where(lt(revokedTokensTable.expiresAt, Date.now()));
      logger.debug({ result }, "[token-cleanup-job] Expired revoked tokens purged");
    } catch (err) {
      logger.error({ err }, "[token-cleanup-job] Failed to purge expired tokens");
    }
  };

  setInterval(run, INTERVAL_MS);
  logger.info("[token-cleanup-job] Started — interval: 3600s");
}
