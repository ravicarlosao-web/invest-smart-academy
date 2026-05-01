/**
 * Vercel Serverless Function — Express adapter
 * All /api/* requests are rewritten here by vercel.json.
 *
 * Vercel may strip or modify req.url when routing through rewrites,
 * so we normalise the URL to always include the /api prefix
 * that Express expects (app.use("/api", router)).
 */
import type { IncomingMessage, ServerResponse } from "http";
import app from "../artifacts/api-server/_src/app";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  // Ensure the URL always starts with /api so Express routes match correctly.
  // When Vercel rewrites /api/:path* → /api/index, req.url may arrive as
  // /api/auth/login (full) or stripped. Either way, we normalise here.
  if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + req.url;
  }
  return (app as any)(req, res);
}
