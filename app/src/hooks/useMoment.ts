import { useEffect, useState } from "react";
import { useMomentStore } from "../stores/momentStore";
import type { MomentLocal } from "../types";

/**
 * A single Moment by id, for screens about one Moment (live, confirmation,
 * arrival, feedback...). Falls back to fetching it when it isn't in the map
 * list, which only holds active Moments: a full, completed or deep-linked
 * Moment would otherwise show as "not found".
 */
export function useMoment(momentId: string | undefined): { moment: MomentLocal | undefined; loading: boolean } {
  const moment = useMomentStore((state) => (momentId ? state.findMoment(momentId) : undefined));
  const fetchMomentById = useMomentStore((state) => state.fetchMomentById);
  const [loading, setLoading] = useState(!moment && !!momentId);

  const found = !!moment;
  useEffect(() => {
    if (!momentId || found) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchMomentById(momentId).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [momentId, found, fetchMomentById]);

  return { moment, loading };
}
