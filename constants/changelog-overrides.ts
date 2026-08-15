import type { ReleaseNote } from "@/types/changelog";

/**
 * Reformulations à destination des utilisateurs.
 *
 * Le journal généré depuis git dit la vérité, mais dans la langue des commits :
 * « Add silent auto-refresh polling for incidents list ». Exact, et illisible
 * pour qui n'a pas écrit le code. On surcharge donc ici les versions qui
 * méritent d'être racontées — les autres restent telles quelles, ce qui vaut
 * mieux qu'une ligne absente.
 *
 * Une entrée dont le numéro n'a pas encore de tag git est traitée comme une
 * version **à venir** : c'est ainsi qu'on décrit la beta en cours.
 */
export const CHANGELOG_OVERRIDES: Record<string, Partial<ReleaseNote>> = {
  "1.5.5": {
    date: "2026-08-14",
    headline: "La carte se lit mieux et se tient à jour toute seule.",
    changes: [
      { kind: "fix", text: "Les regroupements de signalements s'affichaient tronqués en dézoom." },
      { kind: "fix", text: "Une fois zoomé, une partie des épingles manquait à l'appel." },
      { kind: "feature", text: "Les épingles portent l'icône du type de signalement." },
      { kind: "feature", text: "Au-delà de 20 signalements, un regroupement passe au rouge pour signaler un foyer." },
      { kind: "improvement", text: "La couleur d'un regroupement suit le statut majoritaire." },
      { kind: "improvement", text: "Les signalements résolus sont atténués sur la carte." },
      { kind: "feature", text: "Carte, accueil et notifications se rafraîchissent seuls et reprennent après une coupure réseau." },
      { kind: "improvement", text: "Une panne réseau ne se confond plus avec une zone sans signalement." },
      { kind: "feature", text: "La pastille de la barre d'onglets se déplace au doigt." },
      { kind: "fix", text: "Un glissement involontaire supprimait une notification sans confirmation." },
    ],
  },
  "1.5.4": {
    headline: "Les données se mettent à jour sans intervention.",
    changes: [
      { kind: "feature", text: "La liste des signalements, leur statut et les votes se mettent à jour en arrière-plan." },
    ],
  },
  "1.5.3": {
    changes: [
      { kind: "fix", text: "Le jeton de notification est effacé à la déconnexion — plus de notifications reçues pour un autre compte." },
    ],
  },
  "1.4.0": {
    headline: "Le chat et les notifications arrivent.",
  },
};
