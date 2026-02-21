"use client";

import { useCallback, useEffect, useState } from "react";

export function useLikes(isAuthenticated: boolean) {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch liked IDs on sign-in
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    fetch("/api/likes")
      .then((res) => (res.ok ? res.json() : []))
      .then((ids: string[]) => setLikedIds(new Set(ids)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const isLiked = useCallback(
    (fileId: string) => likedIds.has(fileId),
    [likedIds]
  );

  const toggleLike = useCallback(
    async (fileId: string) => {
      const wasLiked = likedIds.has(fileId);

      // Optimistic update
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) {
          next.delete(fileId);
        } else {
          next.add(fileId);
        }
        return next;
      });

      // Sync to server
      try {
        const res = await fetch("/api/likes", {
          method: wasLiked ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId }),
        });
        if (!res.ok) throw new Error();
      } catch {
        // Revert on failure
        setLikedIds((prev) => {
          const reverted = new Set(prev);
          if (wasLiked) {
            reverted.add(fileId);
          } else {
            reverted.delete(fileId);
          }
          return reverted;
        });
      }
    },
    [likedIds]
  );

  return { likedIds, isLiked, toggleLike, loading };
}
