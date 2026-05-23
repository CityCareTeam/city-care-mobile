import { isTokenExpired, getValidToken } from '@/storage/tokens';
import * as SecureStore from 'expo-secure-store';
import { refreshToken as apiRefreshToken } from '@/services/auth';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/auth', () => ({
  refreshToken: jest.fn(),
}));

const mockStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockRefreshToken = apiRefreshToken as jest.Mock;

function makeJwt(expSeconds: number): string {
  const payload = Buffer.from(JSON.stringify({ exp: expSeconds, sub: 'test' })).toString('base64');
  return `header.${payload}.sig`;
}

describe('isTokenExpired', () => {
  it('returns false for a token valid for 1 hour', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    expect(isTokenExpired(makeJwt(future))).toBe(false);
  });

  it('returns true for an already expired token', () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    expect(isTokenExpired(makeJwt(past))).toBe(true);
  });

  it('returns true for a token expiring within the 30s safety margin', () => {
    const soon = Math.floor(Date.now() / 1000) + 20;
    expect(isTokenExpired(makeJwt(soon))).toBe(true);
  });

  it('returns false for a token expiring exactly 31s from now', () => {
    const safe = Math.floor(Date.now() / 1000) + 31;
    expect(isTokenExpired(makeJwt(safe))).toBe(false);
  });

  it('returns true for a malformed token', () => {
    expect(isTokenExpired('not-a-jwt')).toBe(true);
    expect(isTokenExpired('')).toBe(true);
  });
});

describe('getValidToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a valid access token directly without refresh', async () => {
    const validToken = makeJwt(Math.floor(Date.now() / 1000) + 3600);
    mockStore.getItemAsync.mockResolvedValueOnce(validToken);

    await expect(getValidToken()).resolves.toBe(validToken);
    expect(mockRefreshToken).not.toHaveBeenCalled();
  });

  it('uses refresh token when access token is expired', async () => {
    const expiredToken = makeJwt(Math.floor(Date.now() / 1000) - 3600);
    const newAccessToken = makeJwt(Math.floor(Date.now() / 1000) + 3600);

    mockStore.getItemAsync
      .mockResolvedValueOnce(expiredToken)
      .mockResolvedValueOnce('stored-refresh-token');

    mockRefreshToken.mockResolvedValueOnce({
      accessToken: newAccessToken,
      refreshToken: 'new-refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });

    await expect(getValidToken()).resolves.toBe(newAccessToken);
    expect(mockStore.setItemAsync).toHaveBeenCalledTimes(2);
  });

  it('returns null when refresh token call fails', async () => {
    const expiredToken = makeJwt(Math.floor(Date.now() / 1000) - 3600);
    mockStore.getItemAsync
      .mockResolvedValueOnce(expiredToken)
      .mockResolvedValueOnce('old-refresh');
    mockRefreshToken.mockRejectedValueOnce(new Error('Session expirée'));

    await expect(getValidToken()).resolves.toBeNull();
  });

  it('returns null when no tokens are stored', async () => {
    mockStore.getItemAsync.mockResolvedValue(null);
    await expect(getValidToken()).resolves.toBeNull();
  });
});
