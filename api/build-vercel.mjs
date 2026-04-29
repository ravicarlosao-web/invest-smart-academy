/**
 * Pre-bundles the Express API server into a single CJS file
 * so Vercel's serverless function builder receives plain JavaScript.
 */
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.resolve(__dirname, "..");

// Resolve esbuild from the api-server package where it is a dependency
const req   = createRequire(path.resolve(root, "artifacts/api-server/package.json"));
const { build } = req("esbuild");

await build({
  entryPoints: [path.resolve(__dirname, "server.ts")],
  bundle:      true,
  platform:    "node",
  format:      "cjs",
  target:      "node20",
  outfile:     path.resolve(__dirname, "index.js"),
  external: [
    "*.node",
    "pino-pretty",
    "sharp", "canvas", "bcrypt", "argon2", "fsevents",
  ],
  nodePaths: [
    path.resolve(root, "node_modules"),
    path.resolve(root, "artifacts/api-server/node_modules"),
    path.resolve(root, "lib/db/node_modules"),
  ],
  logLevel: "info",
});

console.log("✓ api/index.js built successfully");
