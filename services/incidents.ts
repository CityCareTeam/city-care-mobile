import { API_ENDPOINTS } from "@/constants/api";
import { STRINGS } from "@/constants/strings";
import { fetchWithTimeout } from "@/services/api-client";
import type {
    CreateIncidentPayload,
    IncidentListResponse,
    IncidentResponse,
} from "@/types/incidents";

export type ReverseGeocodeResult = {
  address_label: string;
  city: string;
  postcode: string;
  country: string;
};

async function parseErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const text = await response.text().catch(() => "");
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    return ((data?.error ?? data?.message ?? data?.title ?? text) as string) || fallback;
  } catch {
    return text || fallback;
  }
}

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
}): Promise<IncidentListResponse> {
  const url = new URL(API_ENDPOINTS.incidents);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.type) url.searchParams.set("type", params.type);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.pageSize)
    url.searchParams.set("pageSize", String(params.pageSize));

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(STRINGS.api.incidentsLoadError);
  return response.json() as Promise<IncidentListResponse>;
}

export async function updateIncidentStatus(
  id: string,
  status: string,
  accessToken: string,
  comment?: string,
): Promise<void> {
  const response = await fetchWithTimeout(
    `${API_ENDPOINTS.incidents}/${id}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status, comment }),
    },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Erreur ${response.status}`));
  }
}

export async function deleteIncident(
  id: string,
  accessToken: string,
): Promise<void> {
  const response = await fetchWithTimeout(
    `${API_ENDPOINTS.incidents}/${id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Erreur ${response.status}`));
  }
}
