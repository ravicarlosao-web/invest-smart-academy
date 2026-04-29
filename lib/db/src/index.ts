import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const tursoUrl   = process.env["TURSO_DATABASE_URL"];
const tursoToken = process.env["TURSO_AUTH_TOKEN"];

if (!tursoUrl) {
  throw new Error(
    "TURSO_DATABASE_URL must be set. " +
    "Create a database at turso.tech and set the secret in the Replit Secrets tab.",
  );
}

const client = createClient({
  url:       tursoUrl,
  authToken: tursoToken ?? undefined,
});

export const db = drizzle(client, { schema });
export * from "./schema";
