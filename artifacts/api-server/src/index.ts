import app from "./app";
import { logger } from "./lib/logger";
import { initDb } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/* Ensure all DB tables exist before accepting requests */
try {
  await initDb();
  logger.info("Database tables verified");
} catch (err) {
  logger.error({ err }, "Failed to initialise database tables");
  process.exit(1);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
