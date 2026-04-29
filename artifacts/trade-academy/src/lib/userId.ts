/**
 * Anonymous user ID — persisted in localStorage.
 * Used as the `userId` key in all API calls to the Turso-backed API server.
 * No authentication required: each browser gets a stable UUID on first visit.
 */

const STORAGE_KEY = "tradeacademy-uid";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "uid-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getUserId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
