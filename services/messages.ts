import { API_ENDPOINTS } from "@/constants/api";
import { fetchWithTimeout } from "@/services/api-client";
import type { MessageResponse } from "@/types/messages";

export async function getMessages(incidentId: string, token: string): Promise<MessageResponse[]> {
  const response = await fetchWithTimeout(API_ENDPOINTS.incidentMessages(incidentId), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Erreur ${response.status}`);
  const body = await response.json() as MessageResponse[] | { data: MessageResponse[] };
  return Array.isArray(body) ? body : (body.data ?? []);
}

export async function sendMessage(
  incidentId: string,
  content: string,
  token: string,
): Promise<MessageResponse> {
  const response = await fetchWithTimeout(API_ENDPOINTS.incidentMessages(incidentId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error(`Erreur ${response.status}`);
  return response.json() as Promise<MessageResponse>;
}
