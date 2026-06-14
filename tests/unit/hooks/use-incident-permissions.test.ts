import { renderHook } from '@testing-library/react-native';
import { useIncidentPermissions } from '@/hooks/use-incident-permissions';
import { useAuth } from '@/context/AuthContext';
import type { IncidentResponse } from '@/types/incidents';

jest.mock('@/context/AuthContext');

const mockUseAuth = useAuth as jest.Mock;

const incident: IncidentResponse = {
  id: 'inc-1',
  authorUserId: 'user-1',
  type: 'Road',
  description: 'Nid de poule',
  latitude: 48.8,
  longitude: 2.3,
  addressLabel: '1 rue de la Paix',
  status: 'reported',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  resolvedAt: null,
};

function setupAuth(overrides: { isStaff?: boolean; isAdmin?: boolean; dbUserId?: string | null }) {
  mockUseAuth.mockReturnValue({
    isStaff: overrides.isStaff ?? false,
    isAdmin: overrides.isAdmin ?? false,
    dbUser: overrides.dbUserId != null ? { id: overrides.dbUserId } : null,
  });
}

describe('useIncidentPermissions', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── canAccessChat ────────────────────────────────────────────────────────────

  it('canAccessChat is true for staff', () => {
    setupAuth({ isStaff: true, dbUserId: 'other' });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canAccessChat).toBe(true);
  });

  it('canAccessChat is true for the incident author', () => {
    setupAuth({ isStaff: false, dbUserId: 'user-1' });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canAccessChat).toBe(true);
  });

  it('canAccessChat is false for non-staff non-author', () => {
    setupAuth({ isStaff: false, dbUserId: 'other-user' });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canAccessChat).toBe(false);
  });

  it('canAccessChat is false when incident is null', () => {
    setupAuth({ isStaff: false, dbUserId: 'user-1' });
    const { result } = renderHook(() => useIncidentPermissions(null));
    expect(result.current.canAccessChat).toBe(false);
  });

  // ── canChangeStatus ──────────────────────────────────────────────────────────

  it('canChangeStatus is true for staff', () => {
    setupAuth({ isStaff: true });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canChangeStatus).toBe(true);
  });

  it('canChangeStatus is false for non-staff', () => {
    setupAuth({ isStaff: false });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canChangeStatus).toBe(false);
  });

  // ── canDeleteIncident ────────────────────────────────────────────────────────

  it('canDeleteIncident is true for admin', () => {
    setupAuth({ isAdmin: true });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canDeleteIncident).toBe(true);
  });

  it('canDeleteIncident is false for non-admin staff', () => {
    setupAuth({ isStaff: true, isAdmin: false });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canDeleteIncident).toBe(false);
  });

  // ── canReportIncident ────────────────────────────────────────────────────────

  it('canReportIncident is true for citizens', () => {
    setupAuth({ isStaff: false });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canReportIncident).toBe(true);
  });

  it('canReportIncident is false for staff', () => {
    setupAuth({ isStaff: true });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canReportIncident).toBe(false);
  });

  // ── canDeletePhoto ───────────────────────────────────────────────────────────

  it('canDeletePhoto is true for admin regardless of uploader', () => {
    setupAuth({ isAdmin: true, dbUserId: 'user-1' });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canDeletePhoto({ uploadedByUserId: 'other-user' })).toBe(true);
  });

  it('canDeletePhoto is true when user uploaded the photo', () => {
    setupAuth({ isAdmin: false, dbUserId: 'user-1' });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canDeletePhoto({ uploadedByUserId: 'user-1' })).toBe(true);
  });

  it('canDeletePhoto is false when non-admin did not upload the photo', () => {
    setupAuth({ isAdmin: false, dbUserId: 'user-1' });
    const { result } = renderHook(() => useIncidentPermissions(incident));
    expect(result.current.canDeletePhoto({ uploadedByUserId: 'someone-else' })).toBe(false);
  });
});
