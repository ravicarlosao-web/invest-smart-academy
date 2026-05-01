/**
 * UserStateSync
 * Mounts silently inside <BrowserRouter>.
 *
 * • Login  → switches the zustand-persist key to "tradeacademy-store-{userId}"
 *            and rehydrates so this user's cached state is merged with DB data.
 * • Logout → resets the app store to its initial defaults.
 * • Always → calls useDbSync to load from / save to the Turso database.
 */
import { useEffect, useRef } from "react";
import { useAuthStore }      from "@/store/useAuthStore";
import { useAppStore }       from "@/store/useAppStore";
import { useDbSync }         from "@/hooks/useDbSync";

const ANON_KEY = "tradeacademy-store-v2";

export default function UserStateSync() {
  const user   = useAuthStore((s) => s.user);
  const prevId = useRef<string | null>(null);

  /* Per-user localStorage key switching */
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (currentId === prevId.current) return;
    prevId.current = currentId;

    if (currentId) {
      const userKey = `tradeacademy-store-${currentId}`;
      useAppStore.persist.setOptions({ name: userKey });
      void useAppStore.persist.rehydrate();
    } else {
      useAppStore.getState().resetAll();
      useAppStore.persist.setOptions({ name: ANON_KEY });
    }
  }, [user?.id]);

  /* DB synchronisation */
  useDbSync(user?.id ?? null);

  return null;
}
