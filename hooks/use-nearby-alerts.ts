import { TYPE_LABEL } from "@/constants/incidents";
import { usePreferences } from "@/context/PreferencesContext";
import { getStrings } from "@/constants/i18n";
import { loadAnnounced, remember } from "@/storage/nearby-alerts";
import type { IncidentResponse } from "@/types/incidents";
import { formatDistance } from "@/utils/format-distance";
import { distanceKm } from "@/utils/incident-search";
import { alertableIncidents, isQuietHour } from "@/utils/nearby";
import Constants from "expo-constants";
import { useEffect, useRef } from "react";

/**
 * Les notifications locales n'existent pas dans Expo Go depuis le SDK 53, et
 * l'import lui-même y a des effets de bord. Le reste de l'application prend déjà
 * cette précaution.
 */
const isExpoGo = Constants.appOwnership === "expo";

/**
 * Prévient quand un signalement apparaît à côté de soi.
 *
 * Tout se passe sur l'appareil : le serveur n'a pas à savoir où se trouve
 * l'utilisateur, et n'a rien à pousser. Le fil se rafraîchit déjà toutes les
 * quinze secondes tant que l'écran est au premier plan ; il suffit de regarder
 * ce qui arrive et de mesurer.
 *
 * La contrepartie est claire et vaut d'être dite : cela ne fonctionne que
 * l'application ouverte. Une vraie alerte en arrière-plan demanderait au serveur
 * de connaître la position de chacun — un back à modifier, et une donnée
 * autrement plus sensible à conserver.
 *
 * Désactivé par défaut. Une application qui se met à notifier sans qu'on l'ait
 * demandé se fait retirer ses autorisations, pas régler.
 */
export function useNearbyAlerts(
  incidents: IncidentResponse[],
  origin: { latitude: number; longitude: number } | null,
  selfId?: string | null,
) {
  const { nearbyAlerts, nearbyRadiusKm } = usePreferences();
  const announced = useRef<Set<string> | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (!nearbyAlerts || isExpoGo || !origin || incidents.length === 0) return;
    if (busy.current) return;

    busy.current = true;
    void (async () => {
      try {
        announced.current ??= await loadAnnounced();

        const found = alertableIncidents(incidents, {
          origin,
          radiusKm: nearbyRadiusKm,
          announced: announced.current,
          selfId,
        });
        if (found.length === 0) return;

        /**
         * La nuit, on note sans prévenir.
         *
         * Reporter au matin donnerait une salve de notifications à sept heures,
         * pour des signalements que le fil montre déjà. Une alerte de proximité
         * parle de maintenant : passé la nuit, elle n'a plus rien à dire.
         */
        const silent = isQuietHour();
        announced.current = await remember(found.map((incident) => incident.id));
        if (silent) return;

        const t = getStrings();
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Notifications = require("expo-notifications") as typeof import("expo-notifications");

        for (const incident of found) {
          const type = TYPE_LABEL[incident.type] ?? incident.type;
          const away = formatDistance(distanceKm(origin, incident), t.locale);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: t.nearby.title,
              body: t.nearby.body(type, away, incident.addressLabel ?? null),
              // Lu par l'écoute des appuis, qui ouvre le signalement concerné.
              data: { incidentId: incident.id },
            },
            trigger: null,
          });
        }
      } catch {
        // Une notification ratée n'est pas un incident : l'écran montre déjà les
        // signalements dont on aurait prévenu.
      } finally {
        busy.current = false;
      }
    })();
  }, [incidents, origin, nearbyAlerts, nearbyRadiusKm, selfId]);
}
