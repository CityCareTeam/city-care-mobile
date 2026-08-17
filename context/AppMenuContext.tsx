import { AppMenu, MenuSwipeArea } from "@/components/app/AppMenu";
import { GuideModal } from "@/components/app/GuideModal";
import { LocationConsentModal } from "@/components/app/LocationConsentModal";
import { PrivacyModal } from "@/components/app/PrivacyModal";
import { usePreferences } from "@/context/PreferencesContext";
import { locationAsked, markLocationAsked } from "@/storage/consent";
import { hasSeenGuide, markGuideSeen } from "@/storage/onboarding";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AppMenuValue = {
  open: () => void;
  openGuide: () => void;
  openPrivacy: () => void;
};

const AppMenuContext = createContext<AppMenuValue>({
  open: () => {},
  openGuide: () => {},
  openPrivacy: () => {},
});

/**
 * Le menu latéral, monté une fois pour tous les onglets.
 *
 * Il vivait dans l'écran d'accueil : le glissé depuis le bord ne marchait donc
 * que là, et passer sur la carte ou les notifications le faisait disparaître.
 * Un menu d'application ne dépend pas de l'écran regardé.
 *
 * Il porte aussi les deux fenêtres de première ouverture — le guide et le
 * consentement — pour la même raison : elles ne dépendent d'aucun écran, et
 * l'accueil n'a pas à savoir qu'elles existent.
 */
export function AppMenuProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [consentVisible, setConsentVisible] = useState(false);
  const { setLocation } = usePreferences();

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const openGuide = useCallback(() => setGuideVisible(true), []);
  const openPrivacy = useCallback(() => setPrivacyVisible(true), []);

  /**
   * Le guide se montre une fois par appareil, au premier passage dans
   * l'application connectée — jamais sur l'écran de connexion, où il
   * expliquerait des écrans qu'on n'a pas encore vus.
   *
   * Il est marqué comme vu à l'ouverture et non à la fermeture : quelqu'un qui
   * le referme aussitôt a fait son choix, et le lui reproposer au lancement
   * suivant serait le lui imposer.
   */
  useEffect(() => {
    void (async () => {
      if (await hasSeenGuide()) return;
      setGuideVisible(true);
      void markGuideSeen();
    })();
  }, []);

  /**
   * Le consentement, une seule fois, et seulement s'il n'a jamais été tranché.
   *
   * Il attend que le guide soit refermé : deux fenêtres empilées au premier
   * lancement, et l'on appuie sur la première chose qui ferme — ce qui produit
   * un consentement qui n'en est pas un.
   */
  useEffect(() => {
    if (guideVisible) return;
    void (async () => {
      if (await locationAsked()) return;
      setConsentVisible(true);
    })();
  }, [guideVisible]);

  /**
   * La réponse est enregistrée dans les deux sens.
   *
   * Un refus qu'on n'enregistrerait pas reviendrait à reposer la question à
   * chaque lancement, ce qui n'est plus demander mais insister.
   */
  const decideLocation = useCallback(
    (allow: boolean) => {
      setLocation(allow);
      void markLocationAsked();
      setConsentVisible(false);
    },
    [setLocation],
  );

  const closeGuide = useCallback(() => setGuideVisible(false), []);
  const value = useMemo(
    () => ({ open, openGuide, openPrivacy }),
    [open, openGuide, openPrivacy],
  );

  return (
    <AppMenuContext.Provider value={value}>
      <MenuSwipeArea onOpen={open}>{children}</MenuSwipeArea>
      <AppMenu visible={visible} onClose={close} onOpenGuide={openGuide} onOpenPrivacy={openPrivacy} />
      <GuideModal visible={guideVisible} onClose={closeGuide} />
      <LocationConsentModal
        visible={consentVisible}
        onDecide={decideLocation}
        // La politique par-dessus le consentement : on la lit sans avoir à
        // répondre d'abord, ce qui serait répondre à l'aveugle.
        onReadPolicy={openPrivacy}
      />
      <PrivacyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
    </AppMenuContext.Provider>
  );
}

export function useAppMenu(): AppMenuValue {
  return useContext(AppMenuContext);
}
