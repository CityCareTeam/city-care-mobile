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

/**
 * Message de partage d'un événement.
 *
 * Même grammaire que ci-dessus, et pour la même raison : ce qu'on partage
 * d'abord, où et quand ensuite, le lien en dernier — les messageries coupent la
 * fin, jamais le début.
 *
 * Une différence : le lien n'est pas un lien profond mais l'adresse publique de
 * la fiche chez la source. Partager un événement, c'est l'envoyer à quelqu'un qui
 * n'a pas l'application — un lien qui exige de l'installer ne se partage pas.
 */
export function eventShareMessage(event: {
  title: string;
  when?: string;
  place?: string | null;
  url?: string | null;
}): string {
  const lines = [event.title.trim()];

  const situation = [event.when?.trim(), event.place?.trim()].filter(Boolean).join(" · ");
  if (situation) lines.push(situation);
  if (event.url) lines.push(event.url);

  return lines.join("\n");
}
