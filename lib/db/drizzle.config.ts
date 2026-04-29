import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url   = process.env["TURSO_DATABASE_URL"];
const token = process.env["TURSO_AUTH_TOKEN"];

if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL must be set. " +
    "Create a database at turso.tech and add the secret in Replit.",
  );
}

export default defineConfig({
  schema:   path.join(__dirname, "./src/schema/index.ts"),
  out:      path.join(__dirname, "./drizzle"),
  dialect:  "turso",
  dbCredentials: {
    url,
    authToken: token,
  },
});
