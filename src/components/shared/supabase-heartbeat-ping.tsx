"use client";

import { useEffect } from "react";

const HEARTBEAT_STORAGE_KEY = "infi_supabase_last_heartbeat";
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Silent, non-blocking client-side keep-alive component.
 * Whenever an active user accesses the dashboard, if no heartbeat was registered
 * in the last 48 hours, it fires a background request to /api/cron/keep-alive.
 */
export function SupabaseHeartbeatPing() {
  useEffect(() => {
    try {
      const lastPing = localStorage.getItem(HEARTBEAT_STORAGE_KEY);
      const now = Date.now();

      if (!lastPing || now - Number(lastPing) >= FORTY_EIGHT_HOURS_MS) {
        fetch("/api/cron/keep-alive", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
          cache: "no-store",
        })
          .then((res) => {
            if (res.ok) {
              localStorage.setItem(HEARTBEAT_STORAGE_KEY, String(now));
            }
          })
          .catch(() => {
            // Silent error suppression so client UX is never interrupted
          });
      }
    } catch {
      // Graceful fallback if localStorage is blocked by browser security
    }
  }, []);

  return null;
}
