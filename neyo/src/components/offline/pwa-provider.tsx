"use client";

import * as React from "react";
import { syncQueue } from "@/lib/offline/queue";
import { useToast } from "@/components/ui/toast";

/**
 * Registers the service worker and auto-syncs the offline queue when the
 * connection returns (Feature G.2). Mounted once in the app shell.
 */
export function PwaProvider() {
  const { toast } = useToast();

  React.useEffect(() => {
    // Register the service worker (no-op if unsupported / insecure context).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* SW unavailable (e.g. preview iframe) — app still works online */
      });
    }

    async function onOnline() {
      const { sent } = await syncQueue();
      if (sent > 0) {
        toast({
          title: `${sent} saved action${sent === 1 ? "" : "s"} synced`,
          tone: "success",
        });
      }
    }

    window.addEventListener("online", onOnline);
    // Attempt a sync on load too (in case items were left over).
    if (navigator.onLine) void syncQueue();

    return () => window.removeEventListener("online", onOnline);
  }, [toast]);

  return null;
}
