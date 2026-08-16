import { readJson, writeJson } from "@/storage/local-store";
import { useCallback, useEffect, useState } from "react";

type Filterable = { type: string; status: string };

type UseIncidentFiltersResult<T> = {
  filterType: string | null;
  setFilterType: (v: string | null) => void;
  filterStatus: string | null;
  setFilterStatus: (v: string | null) => void;
  filteredIncidents: T[];
};

export function applyFilters<T extends Filterable>(
  items: T[],
  filterType: string | null,
  filterStatus: string | null,
): T[] {
  return items.filter((inc) => {
    if (filterType && inc.type !== filterType) return false;
    if (filterStatus && inc.status !== filterStatus) return false;
    return true;
  });
}

type Persisted = { type: string | null; status: string | null };

/**
 * Filtres d'une liste d'incidents.
 *
 * `persistKey` les retient d'une visite à l'autre. Sans lui, ils repartaient de
 * zéro à chaque montage : un agent qui filtrait sur « voirie, à traiter »
 * retrouvait la liste entière dès un aller-retour vers la carte, et devait
 * refaire deux appuis à chaque fois.
 *
 * La relecture est asynchrone, donc le premier rendu montre la liste complète
 * avant de se resserrer. C'est visible et assumé : garder l'écran vide en
 * attendant le disque coûterait plus cher que ce clignotement.
 */
export function useIncidentFilters<T extends Filterable>(
  incidents: T[],
  persistKey?: string,
): UseIncidentFiltersResult<T> {
  const [filterType, setType] = useState<string | null>(null);
  const [filterStatus, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!persistKey) return;
    let alive = true;
    void readJson<Persisted>(`filters_${persistKey}`).then((stored) => {
      if (!alive || !stored) return;
      setType(stored.type ?? null);
      setStatus(stored.status ?? null);
    });
    return () => {
      alive = false;
    };
  }, [persistKey]);

  const remember = useCallback(
    (next: Persisted) => {
      if (persistKey) void writeJson(`filters_${persistKey}`, next);
    },
    [persistKey],
  );

  const setFilterType = useCallback(
    (value: string | null) => {
      setType(value);
      remember({ type: value, status: filterStatus });
    },
    [filterStatus, remember],
  );

  const setFilterStatus = useCallback(
    (value: string | null) => {
      setStatus(value);
      remember({ type: filterType, status: value });
    },
    [filterType, remember],
  );

  return {
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filteredIncidents: applyFilters(incidents, filterType, filterStatus),
  };
}
