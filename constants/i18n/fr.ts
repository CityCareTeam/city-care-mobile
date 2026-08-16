/**
 * Dictionnaire de référence.
 *
 * C'est lui qui définit la forme : `en.ts` est typé d'après ce fichier, donc
 * ajouter une clé ici sans la traduire là-bas ne compile pas. Une traduction
 * manquante est une erreur au build, jamais une chaîne vide à l'écran.
 */
export const fr = {
  api: {
    networkError: "Connexion impossible. Vérifiez votre réseau et réessayez.",
    invalidCredentials: "Identifiant ou mot de passe incorrect.",
    registerError: "La création de compte a échoué. Réessayez dans un moment.",
    sessionExpired: "Votre session a expiré, veuillez vous reconnecter.",
    unauthorized: "Vous n'avez pas accès à cette fonctionnalité.",
    unauthenticated: "Veuillez vous connecter pour continuer.",
    profileLoadError: "Impossible de charger vos informations. Réessayez.",
    incidentsLoadError: "Impossible de charger les signalements. Réessayez.",
    updateProfileError: "Impossible de mettre à jour le profil.",
    deleteAccountError: "Impossible de supprimer le compte.",
    notifSettingsLoadError: "Impossible de charger les préférences de notifications.",
    notifSettingsUpdateError: "Impossible de mettre à jour les préférences de notifications.",
    unknownError: "Une erreur inattendue s'est produite.",
    genericError: "Quelque chose s'est mal passé. Réessayez.",
  },
  toast: {
    missingFieldsTitle: "Champs manquants",
    missingFields: "Veuillez remplir tous les champs avant de continuer.",
    passwordMismatchTitle: "Mots de passe différents",
    passwordMismatch: "Les deux mots de passe ne correspondent pas.",
    passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères.",
    nameTooLong: "Le prénom et le nom ne peuvent pas dépasser 30 caractères.",
    usernameTooLong: "Le nom d'utilisateur ne peut pas dépasser 30 caractères.",
    nameInvalidChars: "Le prénom et le nom ne peuvent contenir que des lettres, espaces, tirets ou apostrophes.",
    usernameInvalidChars: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, points, tirets ou underscores (pas d'espace).",
    loginFailedTitle: "Connexion échouée",
    registerFailedTitle: "Inscription échouée",
    registerSuccessTitle: "Compte créé !",
    registerSuccess: "Bienvenue ! Vous pouvez maintenant vous connecter.",
    reportSuccessTitle: "Signalement envoyé !",
    reportSuccess: "Merci, votre signalement a bien été enregistré.",
  },
  photos: {
    permissionDeniedCamera: "Autorisez l'accès à l'appareil photo dans les paramètres.",
    permissionDeniedGallery: "Autorisez l'accès à vos photos dans les paramètres.",
    limitReached: "Vous avez atteint la limite de 3 photos par signalement.",
    uploadError: "Certaines photos n'ont pas pu être envoyées.",
    deleteError: "Impossible de supprimer la photo. Réessayez.",
    loadError: "Impossible de charger les photos.",
    deleteConfirmTitle: "Supprimer la photo",
    deleteConfirmMsg: "Cette suppression est définitive. Confirmer ?",
  },
  alert: {
    errorTitle: "Oups, une erreur",
    sessionExpiredTitle: "Session expirée",
    sessionExpiredMsg: "Votre session a expiré. Reconnectez-vous pour continuer.",
    deleteIncidentTitle: "Supprimer le signalement",
    deleteIncidentMsg: "Cette suppression est définitive. Confirmer ?",
    deleteAccountTitle: "Supprimer le compte",
    deleteAccountMsg: "Cette action est irréversible. Votre compte sera définitivement supprimé.",
    deleteAccountConfirm: "Supprimer définitivement",
    passwordChangedTitle: "Succès",
    passwordChangedMsg: "Votre mot de passe a bien été modifié.",
    cancel: "Annuler",
  },
  emptyState: {
    noMyIncidents: "Vous n'avez pas encore fait de signalement.",
    noFilterResults: "Aucun résultat pour ces filtres.",
    noAllIncidents: "Aucun signalement dans la ville pour le moment.",
    agentAllDone: "Tout est traité, bon travail !",
    noIncidents: "Aucun signalement.",
  },

  // ── Navigation ──
  tabs: {
    home: "Accueil",
    map: "Carte",
    notifications: "Notifs",
    profile: "Profil",
  },

  // ── Menu de l'application ──
  menu: {
    eyebrow: "Application",
    close: "Fermer le menu",
    open: "Ouvrir le menu de l’application",
    releaseNotes: "Notes de version",
    releaseNotesDetail: "Ce qui a changé",
    updates: "Mises à jour",
    updatesDetail: "Vérifier et appliquer",
    settings: "Réglages",
    settingsDetail: "Thème, langue",
  },

  // ── Mises à jour ──
  updates: {
    title: "Mises à jour",
    ready: "Mise à jour prête",
    upToDateTitle: "Application à jour",
    installedVersion: "Version installée",
    runningBundle: "Bundle en cours",
    embedded: "Livré avec l’application",
    channel: "Canal",
    noChannel: "aucun",
    none: "Aucune mise à jour en attente sur cet appareil.",
    applyHint: "Relancez pour l’appliquer.",
    check: "Rechercher une mise à jour",
    relaunch: "Relancer maintenant",
    upToDate: "Vous avez déjà la dernière version.",
    downloaded: "Mise à jour téléchargée. Relancez pour l’appliquer.",
    unavailable: "Les mises à jour ne sont pas actives sur cette installation.",
    failed: "Recherche impossible. Vérifiez votre connexion.",
    bannerTitle: "Mise à jour prête",
    bannerDetail: "Relancez l’application pour l’appliquer.",
    bannerAction: "Relancer",
    bannerApply: "Relancer l’application pour appliquer la mise à jour",
    bannerDismiss: "Ignorer la mise à jour",
  },

  // ── Réglages ──
  settings: {
    title: "Réglages",
    theme: "Thème",
    themeSystem: "Système",
    themeLight: "Clair",
    themeDark: "Sombre",
    themeFollowsDevice: "L’application suit le réglage de votre téléphone.",
    themeFixed: "Choix fixé pour cet appareil, quel que soit le réglage du téléphone.",
    language: "Langue",
    languageSystem: "Système",
    languageFollowsDevice: "L’application suit la langue de votre téléphone.",
    languageFixed: "Choix fixé pour cet appareil, quelle que soit la langue du téléphone.",
  },
};
