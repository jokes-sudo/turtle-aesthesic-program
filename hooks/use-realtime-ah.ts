"use client";

import { useEffect, useRef } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

/**
 * Subscribes to INSERT events on apple_health_records.
 * Calls onUpdate() whenever new data arrives so the caller can re-fetch.
 * Returns whether Realtime is active (false when Supabase isn't configured).
 */
export function useRealtimeAH(onUpdate: () => void): boolean {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  const activeRef = useRef(false);

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;

    activeRef.current = true;

    const channel = sb
      .channel("ah-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "apple_health_records" },
        () => cbRef.current()
      )
      .subscribe();

    return () => {
      activeRef.current = false;
      sb.removeChannel(channel);
    };
  }, []);

  return activeRef.current;
}
