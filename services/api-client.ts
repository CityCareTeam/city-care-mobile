export const TIMEOUT_MS = 8000;
export const UPLOAD_TIMEOUT_MS = 30_000;

export async function authFetch(
  url: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetchWithTimeout(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export async function parseApiError(response: Response, fallback: string): Promise<string> {
  const text = await response.text().catch(() => "");
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    const msg = (data?.error ?? data?.message ?? data?.title) as string | undefined;
    return msg || fallback;
  } catch {
    return text || fallback;
  }
}

/**
 * La requête a-t-elle seulement atteint le serveur ?
 *
 * C'est la question qui décide du sort d'un signalement raté : jamais partie,
 * on la rejouera au retour du réseau ; refusée par le serveur, insister ne
 * changera rien. Un `fetch` qui n'aboutit pas rejette avec un `TypeError`, et
 * `fetchWithTimeout` avorte avec un `AbortError` — dans les deux cas, personne
 * n'a jamais lu la requête. Une réponse HTTP, même 500, est une réponse.
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError") return true;
  return (
    error instanceof TypeError ||
    /network request failed|failed to fetch|network error/i.test(error.message)
  );
}

export function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

export async function throwFromResponse(
  response: Response,
  fallback: string,
): Promise<never> {
  const text = await response.text().catch(() => "");
  try {
    const json = JSON.parse(text);
    if (json.errors && typeof json.errors === "object") {
      const first = Object.values(json.errors as Record<string, string[]>)[0];
      if (Array.isArray(first) && first.length > 0) throw new Error(first[0]);
    }
    if (json.error_description) throw new Error(json.error_description);
    const msg = json.message ?? json.error ?? json.title;
    throw new Error(msg ?? fallback);
  } catch (e) {
    if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
    throw new Error(text || fallback);
  }
}
