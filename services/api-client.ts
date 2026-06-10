export const TIMEOUT_MS = 8000;

export function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
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
