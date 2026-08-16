import { AppMenu, MenuSwipeArea } from "@/components/app/AppMenu";
import { GuideModal } from "@/components/app/GuideModal";
import { hasSeenGuide, markGuideSeen } from "@/storage/onboarding";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AppMenuValue = {
  open: () => void;
  openGuide: () => void;
};

const AppMenuContext = createContext<AppMenuValue>({ open: () => {}, openGuide: () => {} });

/**
 * Le menu latéral, monté une fois pour tous les onglets.
 *
 * Il vivait dans l'écran d'accueil : le glissé depuis le bord ne marchait donc
 * que là, et passer sur la carte ou les notifications le faisait disparaître.
 * Un menu d'application ne dépend pas de l'écran regardé.
 *
 * Le contexte n'expose que l'ouverture. C'est tout ce dont un écran a besoin —
 * le bouton de l'accueil s'en sert — et la fermeture reste l'affaire du panneau,
 * qui la déclenche par sa croix, son voile ou son glissé.
 */
export function AppMenuProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const openGuide = useCallback(() => setGuideVisible(true), []);

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

  const closeGuide = useCallback(() => setGuideVisible(false), []);
  const value = useMemo(() => ({ open, openGuide }), [open, openGuide]);

  return (
    <AppMenuContext.Provider value={value}>
      <MenuSwipeArea onOpen={open}>{children}</MenuSwipeArea>
      <AppMenu visible={visible} onClose={close} onOpenGuide={openGuide} />
      <GuideModal visible={guideVisible} onClose={closeGuide} />
    </AppMenuContext.Provider>
  );
}

export function useAppMenu(): AppMenuValue {
  return useContext(AppMenuContext);
}
