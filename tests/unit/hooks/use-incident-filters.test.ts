import { renderHook, act } from '@testing-library/react-native';
import { useIncidentFilters } from '@/hooks/use-incident-filters';
import type { IncidentResponse } from '@/types/incidents';

function makeIncident(type: string, status: IncidentResponse['status']): IncidentResponse {
  return {
    id: `${type}-${status}`,
    authorUserId: 'user-1',
    type,
    description: 'test',
    latitude: 0,
    longitude: 0,
    addressLabel: 'Somewhere',
    status,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    resolvedAt: null,
  };
}

const incidents: IncidentResponse[] = [
  makeIncident('Road', 'reported'),
  makeIncident('Road', 'in_progress'),
  makeIncident('Waste', 'reported'),
  makeIncident('Waste', 'resolved'),
  makeIncident('Graffiti', 'in_progress'),
];

describe('useIncidentFilters', () => {
  it('returns all incidents when no filter is set', () => {
    const { result } = renderHook(() => useIncidentFilters(incidents));
    expect(result.current.filteredIncidents).toHaveLength(5);
  });

  it('initial filter values are null', () => {
    const { result } = renderHook(() => useIncidentFilters(incidents));
    expect(result.current.filterType).toBeNull();
    expect(result.current.filterStatus).toBeNull();
  });

  it('filters by type', () => {
    const { result } = renderHook(() => useIncidentFilters(incidents));
    act(() => result.current.setFilterType('Road'));

    expect(result.current.filterType).toBe('Road');
    expect(result.current.filteredIncidents).toHaveLength(2);
    expect(result.current.filteredIncidents.every((i) => i.type === 'Road')).toBe(true);
  });

  it('filters by status', () => {
    const { result } = renderHook(() => useIncidentFilters(incidents));
    act(() => result.current.setFilterStatus('reported'));

    expect(result.current.filterStatus).toBe('reported');
    expect(result.current.filteredIncidents).toHaveLength(2);
    expect(result.current.filteredIncidents.every((i) => i.status === 'reported')).toBe(true);
  });

  it('applies both type and status filters simultaneously', () => {
    const { result } = renderHook(() => useIncidentFilters(incidents));
    act(() => {
      result.current.setFilterType('Waste');
      result.current.setFilterStatus('resolved');
    });

    expect(result.current.filteredIncidents).toHaveLength(1);
    expect(result.current.filteredIncidents[0].type).toBe('Waste');
    expect(result.current.filteredIncidents[0].status).toBe('resolved');
  });

  it('returns empty array when no incident matches combined filters', () => {
    const { result } = renderHook(() => useIncidentFilters(incidents));
    act(() => {
      result.current.setFilterType('Graffiti');
      result.current.setFilterStatus('resolved');
    });

    expect(result.current.filteredIncidents).toHaveLength(0);
  });

  it('clears type filter by setting null', () => {
    const { result } = renderHook(() => useIncidentFilters(incidents));
    act(() => result.current.setFilterType('Road'));
    act(() => result.current.setFilterType(null));

    expect(result.current.filterType).toBeNull();
    expect(result.current.filteredIncidents).toHaveLength(5);
  });

  it('clears status filter by setting null', () => {
    const { result } = renderHook(() => useIncidentFilters(incidents));
    act(() => result.current.setFilterStatus('reported'));
    act(() => result.current.setFilterStatus(null));

    expect(result.current.filterStatus).toBeNull();
    expect(result.current.filteredIncidents).toHaveLength(5);
  });
});
