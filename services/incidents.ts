import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import { STRINGS } from "@/constants/strings";
import { authFetch, fetchWithTimeout, parseApiError, UPLOAD_TIMEOUT_MS } from "@/services/api-client";
import type {
    CreateIncidentPayload,
    IncidentListResponse,
    IncidentResponse,
    MapSummaryResponse,
    PhotoResponse,
    ReverseGeocodeResult,
    StatusHistoryEntry,
    VoteResponse,
} from "@/types/incidents";

export type { ReverseGeocodeResult };

// Mapping vers les valeurs entières .NET (ordre de l'enum côté backend)
const INCIDENT_TYPE_INT: Record<string, number> = {
  Road: 0,
  Lighting: 1,
  Waste: 2,
  Graffiti: 3,
  Safety: 4,
  Other: 5,
};

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  const response = await fetch(
    `${API_ENDPOINTS.geocodeReverse}?lat=${lat}&lng=${lng}`,
  );
  if (!response.ok) return null;
  return response.json() as Promise<ReverseGeocodeResult>;
}

export async function createIncident(
  payload: CreateIncidentPayload,
  accessToken: string,
): Promise<IncidentResponse> {
  const response = await fetchWithTimeout(API_ENDPOINTS.incidents, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      latitude: payload.latitude,
      longitude: payload.longitude,
      type: INCIDENT_TYPE_INT[payload.type] ?? payload.type,
      description: payload.description,
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let msg = `Erreur ${response.status}`;
    try {
      const data = JSON.parse(text) as Record<string, unknown>;
      if (data?.errors && typeof data.errors === "object") {
        const fields = Object.entries(data.errors as Record<string, string[]>)
          .map(([k, v]) => `${k}: ${v.join(", ")}`)
          .join(" | ");
        msg = fields || (data.title as string) || msg;
      } else {
        msg =
          ((data?.error ?? data?.message ?? data?.title ?? text) as string) ||
          msg;
      }
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }
  return response.json() as Promise<IncidentResponse>;
}

export async function getIncidents(params?: {
  status?: string;
  type?: string;
  page?: number;
  pageSize?: number;
  /**
   * Ramener aussi les contenus masqués par la modération. Le serveur ne
   * l'accorde qu'aux agents et aux admins, et ignore la demande des autres — le
   * jeton est donc indispensable pour que le drapeau serve à quelque chose.
   */
  includeHidden?: boolean;
  token?: string;
}): Promise<IncidentListResponse> {
  const url = new URL(API_ENDPOINTS.incidents);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.type) url.searchParams.set("type", params.type);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.pageSize)
    url.searchParams.set("pageSize", String(params.pageSize));
  if (params?.includeHidden) url.searchParams.set("includeHidden", "true");

  const headers: HeadersInit = params?.token ? { Authorization: `Bearer ${params.token}` } : {};
  const response = await fetch(url.toString(), { headers });
  if (!response.ok) throw new Error(STRINGS.api.incidentsLoadError);
  return response.json() as Promise<IncidentListResponse>;
}

/**
 * Un signalement par son identifiant.
 *
 * Nécessaire parce que la liste ne suffit pas : elle est paginée — un
 * signalement au-delà de la première page n'y figure pas — et le serveur en
 * retire les contenus masqués. Chercher dans la liste pour ouvrir une fiche
 * n'ouvrait donc rien dans les deux cas.
 *
 * Le jeton est facultatif mais compte : c'est lui qui permet à l'auteur d'un
 * contenu masqué, et à la modération, de le lire quand même. Sans jeton, le
 * serveur répond 404 sur un contenu masqué — ce qui est le comportement voulu.
 */
export async function getIncidentById(
  id: string,
  accessToken?: string,
): Promise<IncidentResponse> {
  const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const response = await fetch(`${API_ENDPOINTS.incidents}/${id}`, { headers });
  if (!response.ok) throw new Error(`Erreur ${response.status}`);
  return response.json() as Promise<IncidentResponse>;
}

export async function updateIncidentStatus(
  id: string,
  status: string,
  accessToken: string,
  comment?: string,
): Promise<void> {
  const response = await authFetch(
    `${API_ENDPOINTS.incidents}/${id}/status`,
    accessToken,
    { method: "PATCH", body: JSON.stringify({ status, comment }) },
  );
  if (!response.ok) {
    throw new Error(await parseApiError(response, `Erreur ${response.status}`));
  }
}

export async function deleteIncident(
  id: string,
  accessToken: string,
): Promise<void> {
  const response = await authFetch(
    `${API_ENDPOINTS.incidents}/${id}`,
    accessToken,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw new Error(await parseApiError(response, `Erreur ${response.status}`));
  }
}

/**
 * Rend joignable une URL de photo renvoyée par le stockage.
 *
 * Le back expose `Minio.PublicBaseUrl`, qui vaut `http://localhost:9000` en
 * développement — inatteignable depuis un téléphone ou un émulateur. Deux
 * topologies coexistent, et c'est la présence d'un **port explicite** sur
 * l'API qui les distingue :
 *
 *   direct  `http://192.168.1.152:5158`  on parle à l'API et au stockage en
 *                                        direct : on remplace l'hôte de la
 *                                        photo, en gardant le port du stockage.
 *   proxifié `http://172.20.10.245/api`  un reverse proxy sert `/photos` :
 *                                        on reconstruit ce chemin.
 *
 * L'ancienne version écrasait le port (`split(":")[0]`) et appliquait la
 * réécriture proxifiée partout. En développement les photos pointaient donc sur
 * le port 80 d'une machine qui n'y écoute pas — invisibles, sans erreur.
 * En production rien ne change : l'URL y est déjà publique, donc jamais réécrite.
 */
function resolvePhotoUrl(url: string): string {
  if (!url) return url;

  const afterProto = API_BASE_URL.split("//")[1] ?? "";
  const authority = afterProto.split("/")[0];
  const [apiHost, apiPort] = authority.split(":");
  const apiProto = API_BASE_URL.startsWith("https") ? "https" : "http";
  const isDirect = Boolean(apiPort);

  if (url.startsWith("/")) {
    return isDirect
      ? `${apiProto}://${authority}${url}`
      : `${apiProto}://${apiHost}/photos${url}`;
  }

  try {
    const u = new URL(url);
    const isInternal = u.hostname === "localhost"
      || u.hostname === "127.0.0.1"
      || !u.hostname.includes(".");
    if (isInternal) {
      if (isDirect) {
        u.hostname = apiHost;
        return u.toString();
      }
      return `${apiProto}://${apiHost}/photos${u.pathname}${u.search}`;
    }
  } catch { return url; }

  return url;
}

export async function getPhotos(incidentId: string): Promise<PhotoResponse[]> {
  const response = await fetch(API_ENDPOINTS.incidentPhotos(incidentId));
  if (!response.ok) throw new Error(`Erreur ${response.status}`);
  const body = await response.json() as PhotoResponse[] | { data: PhotoResponse[] };
  const list = Array.isArray(body) ? body : (body.data ?? []);
  return list.map((p) => ({ ...p, url: resolvePhotoUrl(p.url) }));
}

export async function uploadPhoto(
  incidentId: string,
  uri: string,
  fileName: string,
  mimeType: string,
  token: string,
): Promise<PhotoResponse> {
  const form = new FormData();
  form.append("file", { uri, name: fileName, type: mimeType } as unknown as Blob);
  const response = await fetchWithTimeout(API_ENDPOINTS.incidentPhotos(incidentId), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  }, UPLOAD_TIMEOUT_MS); // multipart/form-data — timeout étendu pour les fichiers lourds
  if (!response.ok) {
    throw new Error(await parseApiError(response, `Erreur ${response.status}`));
  }
  return response.json() as Promise<PhotoResponse>;
}

export async function deletePhoto(
  incidentId: string,
  photoId: string,
  token: string,
): Promise<void> {
  const response = await authFetch(
    API_ENDPOINTS.incidentPhoto(incidentId, photoId),
    token,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw new Error(await parseApiError(response, `Erreur ${response.status}`));
  }
}

export async function getMapSummary(params?: {
  zoom?: number;
  latMin?: number; latMax?: number;
  lngMin?: number; lngMax?: number;
  status?: string;
  type?: string;
}): Promise<MapSummaryResponse> {
  const url = new URL(API_ENDPOINTS.mapSummary);
  if (params?.zoom !== undefined) url.searchParams.set("zoom", String(params.zoom));
  if (params?.latMin !== undefined) url.searchParams.set("latMin", String(params.latMin));
  if (params?.latMax !== undefined) url.searchParams.set("latMax", String(params.latMax));
  if (params?.lngMin !== undefined) url.searchParams.set("lngMin", String(params.lngMin));
  if (params?.lngMax !== undefined) url.searchParams.set("lngMax", String(params.lngMax));
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.type) url.searchParams.set("type", params.type);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(STRINGS.api.incidentsLoadError);
  return response.json() as Promise<MapSummaryResponse>;
}

export async function getVotes(incidentId: string, token?: string): Promise<VoteResponse> {
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(API_ENDPOINTS.incidentVotes(incidentId), { headers });
  if (!response.ok) throw new Error(`Erreur ${response.status}`);
  return response.json() as Promise<VoteResponse>;
}

export async function addVote(incidentId: string, token: string): Promise<VoteResponse> {
  const response = await authFetch(API_ENDPOINTS.incidentVotes(incidentId), token, { method: "POST" });
  if (!response.ok) throw new Error(await parseApiError(response, `Erreur ${response.status}`));
  return response.json() as Promise<VoteResponse>;
}

export async function removeVote(incidentId: string, token: string): Promise<void> {
  const response = await authFetch(API_ENDPOINTS.incidentVoteMe(incidentId), token, { method: "DELETE" });
  if (!response.ok) throw new Error(await parseApiError(response, `Erreur ${response.status}`));
}

export async function getStatusHistory(incidentId: string): Promise<StatusHistoryEntry[]> {
  const response = await fetch(API_ENDPOINTS.incidentStatusHistory(incidentId));
  if (!response.ok) throw new Error(`Erreur ${response.status}`);
  const body = await response.json() as { data: StatusHistoryEntry[] };
  return body.data ?? [];
}
