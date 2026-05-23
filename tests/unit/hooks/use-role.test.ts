import { renderHook, waitFor } from '@testing-library/react-native';
import { useRole } from '@/hooks/use-role';

jest.mock('@/services/auth');
jest.mock('@/storage/tokens');

import { getMe } from '@/services/auth';
import { getValidToken } from '@/storage/tokens';

const mockGetMe = getMe as jest.Mock;
const mockGetValidToken = getValidToken as jest.Mock;

describe('useRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null role initially before data loads', () => {
    mockGetValidToken.mockResolvedValue(null);
    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBeNull();
    expect(result.current.isStaff).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.firstName).toBeNull();
  });

  it('sets Citizen role and keeps isStaff/isAdmin false', async () => {
    mockGetValidToken.mockResolvedValue('token');
    mockGetMe.mockResolvedValue({ mainRole: 'Citizen', firstName: 'Jean', roles: ['Citizen'] });

    const { result } = renderHook(() => useRole());
    await waitFor(() => expect(result.current.role).toBe('Citizen'));

    expect(result.current.isStaff).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.firstName).toBe('Jean');
  });

  it('sets isStaff true for Agent role', async () => {
    mockGetValidToken.mockResolvedValue('token');
    mockGetMe.mockResolvedValue({ mainRole: 'Agent', firstName: 'Marie', roles: ['Agent'] });

    const { result } = renderHook(() => useRole());
    await waitFor(() => expect(result.current.role).toBe('Agent'));

    expect(result.current.isStaff).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('sets isStaff and isAdmin true for Admin role', async () => {
    mockGetValidToken.mockResolvedValue('token');
    mockGetMe.mockResolvedValue({ mainRole: 'Admin', firstName: 'Admin', roles: ['Admin'] });

    const { result } = renderHook(() => useRole());
    await waitFor(() => expect(result.current.role).toBe('Admin'));

    expect(result.current.isStaff).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it('keeps null role when no valid token is available', async () => {
    mockGetValidToken.mockResolvedValue(null);

    const { result } = renderHook(() => useRole());
    await waitFor(() => expect(mockGetValidToken).toHaveBeenCalled());

    expect(result.current.role).toBeNull();
    expect(mockGetMe).not.toHaveBeenCalled();
  });

  it('keeps null role when auth service throws', async () => {
    mockGetValidToken.mockResolvedValue('token');
    mockGetMe.mockRejectedValue(new Error('Non autorisé'));

    const { result } = renderHook(() => useRole());
    await waitFor(() => expect(mockGetMe).toHaveBeenCalled());

    expect(result.current.role).toBeNull();
    expect(result.current.isStaff).toBe(false);
  });
});
