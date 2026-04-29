import { drizzle } from "drizzle-orm/libsql/http";
import * as schema from "./schema";

const rawUrl    = process.env["TURSO_DATABASE_URL"];
const tursoToken = process.env["TURSO_AUTH_TOKEN"];

if (!rawUrl) {
  throw new Error(
    "TURSO_DATABASE_URL must be set. " +
    "Create a database at turso.tech and set the secret in the Replit Secrets tab.",
  );
}

/* Turso URLs use the libsql:// scheme; the HTTP-only client needs https:// */
const tursoUrl = rawUrl.replace(/^libsql:\/\//, "https://");

export const db = drizzle({
  connection: { url: tursoUrl, authToken: tursoToken ?? undefined },
  schema,
});

export * from "./schema";

/* Re-export drizzle-orm query helpers so consumers don't need their own copy */
export { eq, and, or, not, desc, asc, sql, inArray, isNull, isNotNull } from "drizzle-orm";
