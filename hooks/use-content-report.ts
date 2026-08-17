import { getStrings } from "@/constants/i18n";
import {
  flagContent,
  hideContent,
  MODERATION_UNAVAILABLE,
  type FlagReason,
  type FlagTarget,
} from "@/services/moderation";
import { hide, loadHidden, unhide } from "@/storage/hidden-content";
import { getValidToken } from "@/storage/tokens";
import { warned } from "@/utils/feedback";
import { useCallback, useEffect, useState } from "react";

/** Ce qui s'est passé, du point de vue de l'utilisateur. */
export type ReportOutcome = "sent" | "hiddenOnly" | "failed";

/**
 * Signaler un contenu, et le masquer chez soi.
 *
 * Deux effets, volontairement dissociés : le masquage local aboutit toujours et
 * tout de suite, l'envoi aux modérateurs peut échouer. C'est ce qui permet de
 * dire la vérité — « masqué, mais les modérateurs n'ont pas été prévenus » — au
 * lieu d'un échec global qui laisserait l'utilisateur revoir ce qu'il vient de
 * signaler.
 *
 * Tant que le serveur ne connaît pas la route, le geste reste donc utile : il
 * fait disparaître le contenu de cet appareil, et l'écran le dit sans mentir.
 */
export function useContentReport() {
  const [hidden, setHidden] = useState<{ incidents: string[]; messages: string[] }>({
    incidents: [],
    messages: [],
  });

  useEffect(() => {
    void loadHidden().then(setHidden);
  }, []);

  const report = useCallback(
    async (target: FlagTarget, id: string, reason: FlagReason): Promise<ReportOutcome> => {
      // Le masquage d'abord : il ne dépend de rien et ne doit pas attendre le
      // réseau pour prendre effet.
      setHidden(await hide(target === "incident" ? "incidents" : "messages", id));
      warned();

      try {
        const token = await getValidToken();
        if (!token) throw new Error(getStrings().api.unauthenticated);
        await flagContent(target, id, reason, token);
        return "sent";
      } catch (e) {
        return e instanceof Error && e.message === MODERATION_UNAVAILABLE ? "hiddenOnly" : "failed";
      }
    },
    [],
  );

  /**
   * Masquer, pour un modérateur.
   *
   * Rien n'est caché localement au préalable, contrairement au signalement : ici
   * le serveur retire le contenu pour tout le monde, et l'échec doit donc être un
   * échec. Masquer chez soi un contenu qu'on croit avoir retiré partout serait le
   * pire des deux mondes.
   */
  const moderate = useCallback(
    async (target: FlagTarget, id: string, reason: FlagReason): Promise<boolean> => {
      try {
        const token = await getValidToken();
        if (!token) throw new Error(getStrings().api.unauthenticated);
        await hideContent(target, id, reason, token);
        // Masqué localement **après** la réussite, et non avant : le contenu est
        // réellement retiré, l'appareil ne fait que refléter ce qui est. C'est
        // aussi ce qui fait disparaître la bulle du fil sans attendre un
        // rechargement.
        setHidden(await hide(target === "incident" ? "incidents" : "messages", id));
        warned();
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const restore = useCallback(async (target: FlagTarget, id: string) => {
    setHidden(await unhide(target === "incident" ? "incidents" : "messages", id));
  }, []);

  return {
    report,
    moderate,
    restore,
    hiddenIncidents: hidden.incidents,
    hiddenMessages: hidden.messages,
  };
}
