import type { Dictionary } from "@/constants/i18n";
import * as Linking from "expo-linking";

type Shareable = {
  id: string;
  type: string;
  addressLabel?: string | null;
  description?: string | null;
};

/**
 * Lien profond vers un incident.
 *
 * `Linking.createURL` compose l'adresse à partir du scheme déclaré dans
 * `app.config.ts` — plutôt que de recopier `citycaremobile://` ici, où il aurait
 * fini par diverger. En développement il rend l'adresse du serveur Metro, ce qui
 * permet d'essayer le lien sans build.
 */
export function incidentUrl(id: string): string {
  return Linking.createURL(`/incident/${id}`);
}

/**
 * Message de partage.
 *
 * Un lien nu ne dit rien : celui qui le reçoit doit savoir ce qu'il ouvre avant
 * de l'ouvrir. On donne donc le type, l'adresse quand on l'a, puis l'adresse
 * web — dans cet ordre, parce que les messageries coupent la fin et jamais le
 * début.
 */
export function incidentShareMessage(incident: Shareable, t: Dictionary): string {
  const type = t.incidentTypes[incident.type as keyof Dictionary["incidentTypes"]] ?? incident.type;
  const place = incident.addressLabel?.trim();

  const headline = place ? `${type} — ${place}` : type;
  return `${headline}\n${incidentUrl(incident.id)}`;
}
