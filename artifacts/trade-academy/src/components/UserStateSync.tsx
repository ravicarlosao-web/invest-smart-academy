/**
 * UserStateSync — mounts silently inside <BrowserRouter>.
 *
 * Watches the authenticated user and:
 *   • Login  → switches the zustand-persist key to "tradeacademy-store-{userId}"
 *              and rehydrates so this user's saved state is loaded from localStorage.
 *   • Logout → resets the app store to its initial defaults so the next user
 *              starts with a clean slate (their own data is still safely stored
 *              under their own key and will reload on their next login).
 */
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";

const ANON_KEY = "tradeacademy-store-v2";

export default function UserStateSync() {
  const user    = useAuthStore((s) => s.user);
  const prevId  = useRef<string | null>(null);

  useEffect(() => {
    const currentId = user?.id ?? null;

    // Nothing changed — skip
    if (currentId === prevId.current) return;
    prevId.current = currentId;

    if (currentId) {
      // ── User logged in ───────────────────────────────────────────────
      const userKey = `tradeacademy-store-${currentId}`;
      useAppStore.persist.setOptions({ name: userKey });
      void useAppStore.persist.rehydrate();
    } else {
      // ── User logged out ──────────────────────────────────────────────
      // Reset all app state to defaults so the next user starts fresh
      useAppStore.getState().resetAll();
      // Restore the anonymous key (so there is no leftover user-keyed data)
      useAppStore.persist.setOptions({ name: ANON_KEY });
    }
  }, [user?.id]);

  return null;
}
