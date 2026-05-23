import type { IncidentResponse } from "@/types/incidents";
import { useState } from "react";

type UseIncidentFiltersResult = {
  filterType: string | null;
  setFilterType: (v: string | null) => void;
  filterStatus: string | null;
  setFilterStatus: (v: string | null) => void;
  filteredIncidents: IncidentResponse[];
};

export function useIncidentFilters(
  incidents: IncidentResponse[],
): UseIncidentFiltersResult {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredIncidents = incidents.filter((inc) => {
    if (filterType && inc.type !== filterType) return false;
    if (filterStatus && inc.status !== filterStatus) return false;
    return true;
  });

  return {
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filteredIncidents,
  };
}
