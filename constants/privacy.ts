import type { Language } from "@/constants/i18n";

/**
 * Politique de confidentialité.
 *
 * Écrite à partir des flux réellement constatés dans le code, et non d'un modèle
 * générique : chaque destinataire cité ci-dessous correspond à un appel que
 * l'application passe pour de vrai. C'est ce qui fait la différence entre un
 * document juste et un document rassurant.
 *
 * ⚠️ Les mentions `[À COMPLÉTER]` ne sont pas des oublis. Ce sont les seules
 * choses que le code ne peut pas savoir — qui répond juridiquement, à quelle
 * adresse on écrit, et combien de temps les données sont gardées côté serveur.
 * Un document qui les inventerait serait faux, et un document faux vaut moins
 * que pas de document.
 */
export type PrivacySection = { title: string; body: string[] };

const FR: PrivacySection[] = [
  {
    title: "Qui traite vos données",
    body: [
      "CityCare+ est édité par [À COMPLÉTER : nom de l’éditeur, adresse]. Pour toute question sur vos données ou pour exercer vos droits, écrivez à [À COMPLÉTER : adresse de contact].",
    ],
  },
  {
    title: "Ce que nous recueillons, et pourquoi",
    body: [
      "Votre compte : prénom, nom, nom d’utilisateur, adresse électronique. Sans eux, personne ne peut vous répondre ni retrouver vos signalements. Base légale : l’exécution du service que vous demandez.",
      "Vos signalements : la catégorie, votre description, les coordonnées du point choisi, l’horodatage, et les photos que vous joignez. C’est l’objet même de l’application.",
      "Votre position, si vous l’autorisez : pour centrer la carte, trier par proximité, proposer votre ville et afficher la météo locale. Base légale : votre consentement, retirable à tout moment dans Réglages → Localisation.",
      "Un identifiant de notification, si vous les acceptez : pour vous prévenir qu’un de vos signalements a changé d’état.",
    ],
  },
  {
    title: "Les photos méritent une mise en garde",
    body: [
      "Photographier l’espace public capture souvent des personnes, des visages, des plaques d’immatriculation ou des fenêtres. Ces éléments sont des données personnelles concernant des gens qui n’ont rien demandé.",
      "Cadrez le problème que vous signalez, pas ses alentours. Évitez les personnes reconnaissables. Un signalement reste parfaitement utile sans elles.",
    ],
  },
  {
    title: "Qui d’autre voit passer quelque chose",
    body: [
      "Nos serveurs, pour tout ce qui précède.",
      "Open-Meteo, qui reçoit des coordonnées approximatives pour renvoyer une température — sans votre identité.",
      "Nominatim (OpenStreetMap), quand vous cherchez une adresse : il reçoit le texte tapé.",
      "Opendatasoft et les agendas publics, quand vous ouvrez l’onglet Actus : ils reçoivent la ville consultée, pas qui la consulte.",
      "Expo, qui achemine les notifications jusqu’à votre téléphone.",
      "Aucune de ces données n’est vendue, ni utilisée pour de la publicité, ni pour vous profiler.",
    ],
  },
  {
    title: "Ce qui reste sur votre téléphone",
    body: [
      "Vos brouillons, vos favoris, vos réglages et une copie des derniers signalements consultés, pour que l’application fonctionne sans réseau. Rien de tout cela ne nous est envoyé, et Réglages → Effacer les données locales les supprime d’un geste.",
      "Vos jetons de connexion sont gardés dans le coffre chiffré du système, jamais dans un stockage ordinaire.",
    ],
  },
  {
    title: "Combien de temps",
    body: [
      "Votre compte et vos signalements : [À COMPLÉTER : durée de conservation]. Les données gardées sur votre téléphone : les caches expirent au bout de vingt-quatre heures, les brouillons et favoris restent jusqu’à ce que vous les supprimiez.",
    ],
  },
  {
    title: "Vos droits",
    body: [
      "Vous pouvez consulter, corriger et supprimer vos données, vous opposer à leur traitement, en demander une copie, et retirer votre consentement à la localisation.",
      "La suppression de votre compte se fait depuis l’écran Profil, et elle est définitive. Pour tout le reste, écrivez à l’adresse indiquée plus haut.",
      "Si notre réponse ne vous satisfait pas, vous pouvez saisir la CNIL.",
    ],
  },
];

const EN: PrivacySection[] = [
  {
    title: "Who handles your data",
    body: [
      "CityCare+ is published by [TO BE COMPLETED: publisher name, address]. For any question about your data, or to exercise your rights, write to [TO BE COMPLETED: contact address].",
    ],
  },
  {
    title: "What we collect, and why",
    body: [
      "Your account: first and last name, username, email address. Without them nobody can reply to you or find your reports. Legal basis: performing the service you asked for.",
      "Your reports: the category, your description, the coordinates of the point you picked, the timestamp, and any photos you attach. That is what the app is for.",
      "Your location, if you allow it: to centre the map, sort by distance, suggest your town and show local weather. Legal basis: your consent, withdrawable at any time in Settings → Location.",
      "A notification identifier, if you accept notifications: to tell you when one of your reports changes state.",
    ],
  },
  {
    title: "Photos deserve a warning",
    body: [
      "Photographing public space often captures people, faces, number plates or windows. Those are personal data about people who did not ask for it.",
      "Frame the problem you are reporting, not its surroundings. Avoid recognisable people. A report is perfectly useful without them.",
    ],
  },
  {
    title: "Who else sees something",
    body: [
      "Our servers, for everything above.",
      "Open-Meteo, which receives approximate coordinates and returns a temperature — without your identity.",
      "Nominatim (OpenStreetMap), when you search an address: it receives the text you typed.",
      "Opendatasoft and public agendas, when you open the News tab: they receive the town being viewed, not who is viewing it.",
      "Expo, which carries notifications to your phone.",
      "None of this data is sold, used for advertising, or used to profile you.",
    ],
  },
  {
    title: "What stays on your phone",
    body: [
      "Your drafts, bookmarks, settings and a copy of recently viewed reports, so the app works without a network. None of it is sent to us, and Settings → Clear local data removes it in one gesture.",
      "Your sign-in tokens are kept in the system’s encrypted vault, never in ordinary storage.",
    ],
  },
  {
    title: "For how long",
    body: [
      "Your account and reports: [TO BE COMPLETED: retention period]. Data kept on your phone: caches expire after twenty-four hours; drafts and bookmarks stay until you delete them.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "You may access, correct and delete your data, object to its processing, request a copy, and withdraw your consent to location.",
      "Deleting your account is done from the Profile screen, and it is permanent. For anything else, write to the address above.",
      "If our answer does not satisfy you, you may complain to your data protection authority — the CNIL in France.",
    ],
  },
];

export function privacySections(language: Language): PrivacySection[] {
  return language === "en" ? EN : FR;
}

/**
 * Date de la dernière révision, affichée en tête.
 *
 * Une politique sans date ne permet pas de savoir ce qu'on a accepté : à
 * changer en même temps que le texte, jamais séparément.
 */
export const PRIVACY_UPDATED = "2026-08-17";
