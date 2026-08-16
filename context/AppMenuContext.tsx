import { AppMenu, MenuSwipeArea } from "@/components/app/AppMenu";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type AppMenuValue = {
  open: () => void;
};

const AppMenuContext = createContext<AppMenuValue>({ open: () => {} });

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

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <AppMenuContext.Provider value={value}>
      <MenuSwipeArea onOpen={open}>{children}</MenuSwipeArea>
      <AppMenu visible={visible} onClose={close} />
    </AppMenuContext.Provider>
  );
}

export function useAppMenu(): AppMenuValue {
  return useContext(AppMenuContext);
}
