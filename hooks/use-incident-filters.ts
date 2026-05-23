import { useState } from "react";

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

export function useIncidentFilters<T extends Filterable>(
  incidents: T[],
): UseIncidentFiltersResult<T> {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  return {
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filteredIncidents: applyFilters(incidents, filterType, filterStatus),
  };
}
