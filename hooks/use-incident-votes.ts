import { POLL_INTERVAL_MS } from "@/constants/config";
import { addVote, getVotes, removeVote } from "@/services/incidents";
import { getValidToken } from "@/storage/tokens";
import type { VoteResponse } from "@/types/incidents";
import { useEffect, useState } from "react";

export function useIncidentVotes(incidentId: string | null) {
  const [votes, setVotes] = useState<VoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!incidentId) { setVotes(null); return; }

    const fetchVotes = (silent = false) => {
      if (!silent) setLoading(true);
      return getValidToken()
        .then((token) => getVotes(incidentId, token ?? undefined))
        .then(setVotes)
        .catch(() => {})
        .finally(() => { if (!silent) setLoading(false); });
    };

    void fetchVotes();
    const timer = setInterval(() => void fetchVotes(true), POLL_INTERVAL_MS.votes);
    return () => clearInterval(timer);
  }, [incidentId]);

  const toggleVote = async () => {
    if (!incidentId || toggling) return;
    const token = await getValidToken();
    if (!token) return;
    setToggling(true);
    try {
      if (votes?.hasVoted) {
        await removeVote(incidentId, token);
        setVotes((prev) => prev ? { ...prev, hasVoted: false, voteCount: prev.voteCount - 1 } : null);
      } else {
        const updated = await addVote(incidentId, token);
        setVotes(updated);
      }
    } catch {
      // conflit ou erreur réseau — silent
    } finally {
      setToggling(false);
    }
  };

  return { votes, loading, toggling, toggleVote };
}
