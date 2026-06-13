import * as signalR from "@microsoft/signalr";
import { API_ENDPOINTS } from "@/constants/api";
import { getMessages, sendMessage } from "@/services/messages";
import { getValidToken } from "@/storage/tokens";
import type { MessageResponse } from "@/types/messages";
import { useCallback, useEffect, useRef, useState } from "react";

export function useIncidentChat(incidentId: string | null) {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!incidentId) return;

    let cancelled = false;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(API_ENDPOINTS.incidentChatHub, {
        accessTokenFactory: async () => {
          const token = await getValidToken();
          return token ?? "";
        },
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on("ReceiveMessage", (msg: MessageResponse) => {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    });

    connection.onreconnected(() => setConnected(true));
    connection.onreconnecting(() => setConnected(false));
    connection.onclose(() => setConnected(false));

    const start = async () => {
      setLoading(true);
      try {
        await connection.start();
        if (cancelled) { await connection.stop(); return; }
        await connection.invoke("JoinIncident", incidentId);
        setConnected(true);

        const token = await getValidToken();
        if (token && !cancelled) {
          const history = await getMessages(incidentId, token).catch(() => []);
          if (!cancelled) setMessages(history);
        }
      } catch {
        // connexion échouée — silencieux, l'UI affiche le dot rouge
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void start();

    return () => {
      cancelled = true;
      void (async () => {
        try {
          if (connection.state !== signalR.HubConnectionState.Disconnected) {
            await connection.invoke("LeaveIncident", incidentId).catch(() => {});
            await connection.stop();
          }
        } catch { /* ignore */ }
      })();
      setConnected(false);
      setMessages([]);
    };
  }, [incidentId]);

  const send = useCallback(async (content: string) => {
    if (!incidentId || !content.trim()) return;
    const token = await getValidToken();
    if (!token) return;
    await sendMessage(incidentId, content.trim(), token);
  }, [incidentId]);

  return { messages, send, connected, loading };
}
