/**
 * Vercel Serverless Function — Express adapter
 * All /api/* requests are rewritten here by vercel.json.
 * Vercel's Node.js runtime accepts a standard (req, res) handler,
 * and Express apps are themselves (req, res) functions.
 */
import app from "../artifacts/api-server/src/app";

export default app;
