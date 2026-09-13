"use client";

import { useEffect, useCallback } from "react";

export function useSyncStorage(callback: () => void) {
  const sync = useCallback(() => {
    callback();
  }, [callback]);

  useEffect(() => {
    // Sync when localStorage changes from another tab
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("awfood-mvp-")) {
        sync();
      }
    };

    // Sync when user switches back to this tab
    const onVis = () => {
      if (document.visibilityState === "visible") {
        sync();
      }
    };

    // Sync on focus
    const onFocus = () => sync();

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [sync]);
}
