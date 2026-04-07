"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const MIN_MS_BETWEEN_REFRESH = 45_000;

/**
 * Refetches the current route when the tab becomes visible again (throttled),
 * so the feed can pick up new posts / engagement without a full reload.
 */
export default function FeedRefresher() {
  const router = useRouter();
  const lastRefreshRef = useRef(0);

  // Establish baseline after mount so the first visibility event doesn’t double-fetch with SSR.
  useEffect(() => {
    lastRefreshRef.current = Date.now();
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - lastRefreshRef.current < MIN_MS_BETWEEN_REFRESH) return;
      lastRefreshRef.current = now;
      router.refresh();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [router]);

  return null;
}
