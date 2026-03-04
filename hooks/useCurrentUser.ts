"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/app/actions/userAction";

export function useCurrentUser() {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser(retry = false) {
      const result = await getCurrentUser();
      if (cancelled) return;
      if (result.success) {
        setUser(result.user);
        setError(null);
        setIsLoading(false);
        return;
      }
      if (!retry && result.error === "User not found") {
        await new Promise((r) => setTimeout(r, 800));
        if (cancelled) return;
        return fetchUser(true);
      }
      setUser(null);
      setError(result.error);
      setIsLoading(false);
    }

    fetchUser();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, isLoading, error };
}
