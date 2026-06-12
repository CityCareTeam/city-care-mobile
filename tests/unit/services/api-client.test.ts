import { fetchWithTimeout, throwFromResponse, TIMEOUT_MS } from '@/services/api-client';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls fetch with the provided url and options', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    await fetchWithTimeout('https://api.example.com/test', { method: 'POST' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('injects an AbortSignal into the request', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    await fetchWithTimeout('https://api.example.com/test');
    expect(mockFetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it('resolves with the fetch response on success', async () => {
    const mockResponse = { ok: true, status: 200 } as Response;
    mockFetch.mockResolvedValueOnce(mockResponse);
    const result = await fetchWithTimeout('https://api.example.com/test');
    expect(result).toBe(mockResponse);
  });

  it(`aborts the request after ${TIMEOUT_MS}ms`, async () => {
    mockFetch.mockImplementationOnce((_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
      }),
    );
    const promise = fetchWithTimeout('https://api.example.com/test');
    jest.advanceTimersByTime(TIMEOUT_MS);
    await expect(promise).rejects.toThrow('Aborted');
  });

  it('does NOT abort before the timeout elapses', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    const promise = fetchWithTimeout('https://api.example.com/test');
    jest.advanceTimersByTime(TIMEOUT_MS - 1);
    await expect(promise).resolves.toBeDefined();
  });

  it('clears the timeout after fetch resolves', async () => {
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    await fetchWithTimeout('https://api.example.com/test');
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});

describe('throwFromResponse', () => {
  function makeResponse(body: string): Response {
    return { text: () => Promise.resolve(body) } as unknown as Response;
  }

  it('throws the first validation error (ASP.NET Core errors object)', async () => {
    const body = JSON.stringify({ errors: { Username: ['Username is required'] } });
    await expect(throwFromResponse(makeResponse(body), 'fallback'))
      .rejects.toThrow('Username is required');
  });

  it('throws error_description (Keycloak format)', async () => {
    const body = JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid credentials' });
    await expect(throwFromResponse(makeResponse(body), 'fallback'))
      .rejects.toThrow('Invalid credentials');
  });

  it('throws the message field', async () => {
    const body = JSON.stringify({ message: 'Custom error' });
    await expect(throwFromResponse(makeResponse(body), 'fallback'))
      .rejects.toThrow('Custom error');
  });

  it('throws the error field', async () => {
    const body = JSON.stringify({ error: 'Unauthorized' });
    await expect(throwFromResponse(makeResponse(body), 'fallback'))
      .rejects.toThrow('Unauthorized');
  });

  it('throws the title field', async () => {
    const body = JSON.stringify({ title: 'Not Found' });
    await expect(throwFromResponse(makeResponse(body), 'fallback'))
      .rejects.toThrow('Not Found');
  });

  it('throws raw text when body is not valid JSON', async () => {
    await expect(throwFromResponse(makeResponse('Service Unavailable'), 'fallback'))
      .rejects.toThrow('Service Unavailable');
  });

  it('throws fallback when body is empty', async () => {
    await expect(throwFromResponse(makeResponse(''), 'my fallback'))
      .rejects.toThrow('my fallback');
  });

  it('throws fallback when JSON has no known error fields', async () => {
    await expect(throwFromResponse(makeResponse('{}'), 'my fallback'))
      .rejects.toThrow('my fallback');
  });

  it('falls through errors object when the array is empty', async () => {
    const body = JSON.stringify({ errors: { Username: [] }, message: 'Fallthrough message' });
    await expect(throwFromResponse(makeResponse(body), 'fb'))
      .rejects.toThrow('Fallthrough message');
  });
});
