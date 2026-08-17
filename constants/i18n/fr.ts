/**
 * Dictionnaire de référence.
 *
 * C'est lui qui définit la forme : `en.ts` est typé d'après ce fichier, donc
 * ajouter une clé ici sans la traduire là-bas ne compile pas. Une traduction
 * manquante est une erreur au build, jamais une chaîne vide à l'écran.
 */
export const fr = {
  locale: "fr-FR",
  relative: {
    now: "À l'instant",
    minutes: (count: number) => `Il y a ${count} min`,
    hours: (count: number) => `Il y a ${count}h`,
    yesterday: "Hier",
    days: (count: number) => `Il y a ${count} jours`,
  },

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
    loadFailedTitle: "Chargement impossible",
    cancel: "Annuler",
    a11yClearAddress: "Effacer l’adresse",
    a11yRemovePhoto: "Retirer cette photo",
    a11ySend: "Envoyer le message",
    a11yClose: "Fermer",
    a11yDeletePhoto: "Supprimer cette photo",
    a11yShowPassword: "Afficher le mot de passe",
    a11yHidePassword: "Masquer le mot de passe",
    a11yOpenPhoto: "Agrandir la photo",
  },
  emptyState: {
    noMyIncidents: "Vous n'avez pas encore fait de signalement.",
    noFilterResults: "Aucun résultat pour ces filtres.",
    noAllIncidents: "Aucun signalement pour le moment.",
    agentAllDone: "Tout est traité, bon travail !",
    noIncidents: "Aucun signalement.",
  },

  // ── Navigation ──
  tabs: {
    home: "Accueil",
    map: "Carte",
    notifications: "Notifs",
    news: "Actus",
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
    settingsDetail: "Thème, langue, retours, données",
  },

  // ── Écran de secours ──
  crash: {
    title: "Quelque chose s’est cassé",
    detail:
      "L’écran n’a pas pu s’afficher. Réessayer suffit le plus souvent ; sinon, une version corrigée est peut-être déjà disponible.",
    retry: "Réessayer",
    lookForFix: "Chercher une version corrigée",
    applying: "Application de la mise à jour…",
    noFix: "Aucune version plus récente pour l’instant.",
    checkFailed: "Recherche impossible. Vérifiez votre connexion.",
  },

  // ── Mises à jour ──
  updates: {
    title: "Mises à jour",
    ready: "Mise à jour prête",
    upToDateTitle: "Application à jour",
    checking: "Recherche en cours…",
    checkingDetail: "Interrogation du serveur de mises à jour.",
    failedTitle: "Recherche impossible",
    unavailableTitle: "Mises à jour inactives",
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


  // ── Accueil ──
  home: {
    greeting: "Bonjour",
    greetingNamed: (name: string) => `Bonjour, ${name}`,
    myStats: "Mes stats",
    communityStats: "Stats communauté",
    reported: "Déclarés",
    inProgress: "En cours",
    resolved: "Résolus",
    toHandle: "À traiter",
    tabFollowed: "Suivis",
    noFollowed: "Aucun signalement suivi pour l’instant.",
    followedHint: "Ouvrez un signalement et posez un signet pour le retrouver ici.",
    followedMissing: (count: number) => `${count} suivi${count > 1 ? "s" : ""} pas encore chargé${count > 1 ? "s" : ""}`,
    tabMine: "Les miens",
    tabCommunity: "Communauté",
    byCategory: "Par catégorie",
    incidentsToHandle: "Incidents à traiter",
    reports: "Signalements",
    searchPlaceholder: "Rechercher un signalement…",
    searchClear: "Effacer la recherche",
    sortRecent: "Récents",
    sortOldest: "Anciens",
    sortNearest: "Proches",
    noSearchResults: (query: string) => `Aucun résultat pour « ${query} »`,
    allFilter: "Tous",
    showMore: (count: number) => `Afficher ${count} de plus`,
    loadMore: "Charger la suite",
    loadMoreA11y: "Charger davantage de signalements",
    showMoreA11y: "Afficher davantage de signalements",
    reportIncident: "Signaler un incident",
    resumeReport: "Reprendre mon signalement",
    draftBadge: "Brouillon",
    staleData: "Les signalements affichés peuvent être obsolètes.",
    cachedData: (ago: string) => `Dernières données connues, ${ago}.`,
    pendingReports: (count: number) =>
      count > 1
        ? `${count} signalements en attente d’envoi — ils partiront au retour du réseau.`
        : "1 signalement en attente d’envoi — il partira au retour du réseau.",
    rejectedReports: (count: number) =>
      `${count} signalement${count !== 1 ? "s" : ""} refusé${count !== 1 ? "s" : ""}`,
    acknowledge: "J’ai compris",
    sentReports: (count: number) => `${count} signalement${count > 1 ? "s" : ""} envoyé${count > 1 ? "s" : ""}`,
    sentReportsDetail: "Ce qui attendait le réseau est parti.",
  },

  weather: {
    clear: "Ciel dégagé",
    partlyCloudy: "Partiellement nuageux",
    cloudy: "Couvert",
    fog: "Brouillard",
    drizzle: "Bruine",
    rain: "Pluie",
    snow: "Neige",
    thunderstorm: "Orage",
  },

  // ── Bilan personnel ──
  stats: {
    title: "Mon bilan",
    reports: (count: number) => `signalement${count > 1 ? "s" : ""}`,
    resolved: "résolus",
    pending: "en cours",
    open: "déclarés",
    cityTitle: "La communauté",
    resolutionRate: "Taux de résolution",
    resolvedOf: (resolved: number, total: number) => `${resolved} résolu${resolved > 1 ? "s" : ""} sur ${total}`,
    backlog: (count: number) =>
      count === 0
        ? "Rien à traiter"
        : `${count} signalement${count > 1 ? "s" : ""} à traiter`,
    topCategory: "Catégorie la plus signalée",
    since: (date: string) => `Premier signalement le ${date}`,
    empty: "Votre premier signalement ouvrira ce bilan.",
    inProgress: (count: number) => `${count} en cours de traitement`,
  },

  // ── Carte ──
  map: {
    report: "Signaler",
    resume: "Reprendre",
    recenter: "Revenir à ma position",
    searchTitle: "Aller à une adresse",
    searchPlaceholder: "Rue, ville, lieu…",
    searchHint: "Saisissez au moins trois caractères.",
    searchNoResult: (query: string) => `Aucune adresse trouvée pour « ${query} ».`,
    searchFailed: "Recherche indisponible. Vérifiez votre connexion.",
  },

  // ── Notifications ──
  notifications: {
    title: "Notifications",
    unreadSummary: (count: number) => `${count} non lue${count > 1 ? "s" : ""}`,
    allRead: "Tout est lu",
    readAll: "Tout lire",
    clearAllA11y: "Vider toutes les notifications",
    empty: "Aucune notification",
    today: "Aujourd’hui",
    yesterday: "Hier",
    earlier: "Plus tôt",
    clearTitle: "Vider les notifications",
    clearMessage: "Supprimer toutes vos notifications ?",
    delete: "Supprimer",
    deleteOne: (title: string) => `Supprimer la notification : ${title}`,
  },

  // ── Actualités ──
  news: {
    title: "Actualités",
    loading: "Chargement des événements…",
    count: (n: number) =>
      n > 1 ? `${n} événements à venir` : n === 1 ? "1 événement à venir" : "Rien à venir",
    // Trois façons de n'avoir aucune ville, trois phrases : elles ne se règlent
    // pas au même endroit.
    locating: "Recherche de votre ville…",
    uncovered: "Aucune ville couverte près de vous.",
    unavailable: "Position indisponible.",
    pickPrompt: "Choisissez une ville pour voir ses événements.",
    choose: "Choisir",
    changeCity: "Changer de ville",
    pickTitle: "Ville",
    open: "Voir la fiche",
    share: "Partager cet événement",
    today: "Aujourd’hui",
    thisWeek: "Cette semaine",
    thisMonth: "Ce mois-ci",
    later: "Plus tard",
    undated: "Sans date",
    empty: "Aucun événement à venir pour le moment.",
    failed: "Impossible de charger les actualités.",
    // On lit la page d'un office de tourisme : la citer n'est pas une
    // politesse, c'est la moindre des choses.
    sources: (parts: string) => `Sources : ${parts}`,
    sourceNational: (city: string, km: number) =>
      `événements publics OpenAgenda à ${km} km autour de ${city}`,
  },

  // ── Profil ──
  profile: {
    information: "Informations",
    firstName: "Prénom",
    lastName: "Nom",
    username: "Nom d'utilisateur",
    email: "Email",
    memberSince: "Membre depuis",
    myAccount: "Mon compte",
    editDetails: "Modifier mes informations",
    changePassword: "Changer le mot de passe",
    notifications: "Notifications",
    session: "Session",
    signOut: "Se déconnecter",
    dangerZone: "Zone dangereuse",
    deleteAccount: "Supprimer mon compte",
  },


  // ── Signalement ──
  report: {
    duplicateTitle: (count: number, meters: number) =>
      count > 1
        ? `${count} signalements du même type à moins de ${meters} m`
        : `Un signalement du même type à ${meters} m`,
    duplicateOpen: "Ouvrir le signalement existant",
    duplicateConfirmTitle: "Déjà signalé ?",
    // Type de retour explicite : deux littéraux sans lui donnent une union de
    // littéraux, que la traduction anglaise ne peut alors plus satisfaire.
    duplicateConfirmMsg: (count: number): string =>
      count > 1
        ? "Plusieurs signalements du même type sont ouverts juste à côté. Envoyer quand même ?"
        : "Un signalement du même type est ouvert juste à côté. Envoyer quand même ?",
    duplicateSendAnyway: "Envoyer quand même",
    screenTitle: "Signaler un incident",
    location: "Localisation",
    addressPlaceholder: "Rechercher ou taper une adresse...",
    category: "Catégorie",
    description: "Description",
    descriptionPlaceholder: "Décrivez brièvement l'incident...",
    charactersLeft: (count: number) => `${count} caractère${count !== 1 ? "s" : ""} restant${count !== 1 ? "s" : ""}`,
    photos: "Photos (optionnel)",
    photosLeft: (count: number) => `${count} restante${count !== 1 ? "s" : ""}`,
    submit: "Envoyer le signalement",
    needBoth: "Sélectionnez une catégorie et entrez une description",
    needCategory: "Sélectionnez une catégorie",
    needDescription: "Entrez une description",
    draftRestored: "Brouillon repris là où vous l’aviez laissé.",
    newDraft: "Nouveau",
    newDraftA11y: "Mettre de côté et commencer un nouveau signalement",
    draftsTitle: "Brouillons en cours",
    draftCount: (count: number) => `${count} brouillon${count > 1 ? "s" : ""}`,
    untitledDraft: "Signalement sans description",
    discardTitle: "Effacer le brouillon",
    discardMessage: "Le signalement en cours sera perdu. Confirmer ?",
    discardDraft: "Effacer",
    queuedTitle: "Signalement enregistré",
    queuedDetail: "Il sera envoyé dès le retour du réseau.",
    addPhoto: "Ajouter une photo",
    takePhoto: "Prendre une photo",
    pickPhoto: "Choisir depuis la galerie",
    permissionDenied: "Permission refusée",
    types: {
      Road: "Voirie",
      Lighting: "Éclairage",
      Waste: "Déchets",
      Graffiti: "Graffiti",
      Safety: "Sécurité",
      Other: "Autre",
    },
  },

  // ── Connexion et inscription ──
  auth: {
    tagline: "Signalez, suivez, améliorez votre ville",
    signIn: "Connexion",
    identifier: "Email ou nom d'utilisateur",
    password: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    forgotSoonTitle: "Bientôt disponible",
    forgotSoon: "La réinitialisation du mot de passe arrive prochainement.",
    signInAction: "Se connecter",
    createAccount: "Créer un compte",
    joinCommunity: "Rejoignez la communauté CityCare",
    identity: "Identité",
    firstName: "Prénom",
    firstNamePlaceholder: "Jean",
    lastName: "Nom",
    lastNamePlaceholder: "Dupont",
    account: "Compte",
    email: "Email",
    username: "Nom d'utilisateur",
    security: "Sécurité",
    confirmPassword: "Confirmer le mot de passe",
    passwordsDiffer: "Les mots de passe ne correspondent pas",
    signUpAction: "S'inscrire",
    invalidFields: "Champs invalides",
  },


  // ── Vocabulaire métier ──
  status: {
    reported: "Déclaré",
    in_progress: "En cours",
    resolved: "Résolu",
  },
  incidentTypes: {
    Road: "Voirie",
    Lighting: "Éclairage",
    Waste: "Déchets",
    Graffiti: "Graffiti",
    Safety: "Sécurité",
    Other: "Autre",
  },
  roles: {
    Admin: "Administrateur",
    Agent: "Agent municipal",
    Citizen: "Citoyen",
  },

  // ── Carte : détail d'un incident ──
  incident: {
    followedChanged: (count: number) => `${count} signalement${count > 1 ? "s" : ""} suivi${count > 1 ? "s" : ""} a changé`,
    followedChangedOne: (status: string) => `Un signalement suivi est passé à « ${status} »`,
    follow: "Suivre",
    unfollow: "Suivi",
    followA11y: "Suivre ce signalement",
    unfollowA11y: "Ne plus suivre ce signalement",
    followedFilter: "Suivis",
    followedFilterA11y: "N’afficher que les signalements suivis",
    mineOnly: "Les miens",
    mineOnlyA11y: "N’afficher que mes signalements",
    share: "Partager",
    shareA11y: "Partager ce signalement",
    directions: "Y aller",
    directionsA11y: "Ouvrir l’itinéraire vers ce signalement",
    directionsFailed: "Aucune application de cartes n’a répondu.",
    shareTitle: "Signalement CityCare+",
    details: "Détails",
    chat: "Discussion",
    photos: "Photos",
    noPhotos: "Aucune photo jointe",
    commentTitle: (status: string) => `Passer en « ${status} »`,
    commentHint: "Un mot sur ce qui a été fait ou ce qui va l’être. Facultatif — il apparaîtra dans le suivi du signalement.",
    commentPlaceholder: "Intervention prévue jeudi…",
    commentSkip: "Changer sans",
    commentSend: "Envoyer",
    changeStatus: "Changer le statut",
    mine: "Le mien",
    delete: "Supprimer",
    voteFailed: "Votre vote n’a pas pu être enregistré.",
    error: "Erreur",
    reports: "Signalements",
    allFilter: "Tous",
    noMessages: "Aucun message pour l’instant.",
    beFirst: "Soyez le premier à commenter.",
    messagePlaceholder: "Votre message…",
    offline: "Hors ligne",
  },

  // ── Bandeaux de la carte ──
  mapNotice: {
    unavailableTitle: "Données indisponibles",
    unavailableDetail: "Impossible de joindre le serveur.",
    staleTitle: "Données datées",
    staleDetail: "Voici le dernier état connu de la carte.",
    emptyDetail: "Personne n'a encore signalé quoi que ce soit ici.",
    emptyTitle: "Aucun signalement",
    noResultsTitle: "Aucun résultat",
    noResultsDetail: "Aucun signalement ne correspond à ces filtres.",
    retry: "Réessayer",
    retryA11y: "Réessayer le chargement",
    clearFilters: "Tout afficher",
  },

  // ── Préférences de notification ──
  notifSettings: {
    title: "Notifications",
    inApp: "In-app",
    push: "Push",
    email: "Email",
    reports: "Signalements",
    reportsDetail: "Nouveaux et changements de statut",
    messages: "Messages",
    messagesDetail: "Nouvelles discussions",
    emailNotifications: "Notifications par email",
    soon: "Bientôt",
    thisDevice: "Sur cet appareil",
    followedTypes: "Types d'incidents suivis",
  },

  // ── Fenêtres du profil ──
  profileModals: {
    editTitle: "Modifier mes informations",
    changePasswordTitle: "Changer le mot de passe",
    newPassword: "Nouveau mot de passe",
    save: "Enregistrer",
  },

  // ── Notes de version ──
  releaseNotes: {
    title: "Notes de version",
    version: (minor: string) => `Version ${minor}`,
    releases: (count: number) => `${count} publication${count > 1 ? "s" : ""}`,
    yourVersion: "Votre version",
    upcoming: "à venir",
  },

  // ── Guide ──
  guide: {
    title: "Guide",
    menuDetail: "Revoir la présentation",
    skip: "Passer",
    next: "Suivant",
    back: "Retour",
    done: "C’est parti",
    stepA11y: (position: number, total: number) => `Étape ${position} sur ${total}`,
    swipeHint: "Glissez pour parcourir",
    steps: [
      {
        title: "Signalez en deux gestes",
        body: "Une catégorie, une description, une photo si vous en avez une. Si un signalement du même type existe à deux pas, l’application vous le montre avant l’envoi. Sans réseau, le vôtre est gardé et part dès que la connexion revient.",
      },
      {
        title: "Suivez les signalements sur la carte",
        body: "Les épingles se regroupent quand vous dézoomez. Cherchez une adresse pour aller voir un autre quartier, et ouvrez l’itinéraire vers un signalement depuis sa fiche.",
      },
      {
        title: "Retrouvez tout dans le fil",
        body: "Cherchez par description ou par rue, triez par date ou par proximité — chaque ligne indique alors sa distance. Les filtres restent au-dessus de la liste.",
      },
      {
        title: "Suivez ce qui bouge",
        body: "Posez un signet sur un signalement pour être prévenu de ses changements. Une discussion est attachée à chacun, pour échanger avec les agents.",
      },
      {
        title: "Voyez ce qui se passe",
        body: "L’onglet Actus donne les événements de votre ville — choisie d’après votre position, ou dans la liste. Appuyez sur une carte pour ouvrir la fiche complète.",
      },
      {
        title: "Réglez l’application",
        body: "Glissez depuis le bord droit de l’écran : thème, langue, mises à jour et ce guide s’y trouvent.",
      },
    ],
  },

  // ── Alerte de proximité ──
  // ── Compte à rebours ──
  countdown: {
    now: "En cours",
    soon: "Dans moins d'une heure",
    hours: (n: number) => `Dans ${n} h`,
    tomorrow: "Demain",
    days: (n: number) => `Dans ${n} jours`,
  },


  nearby: {
    title: "Signalement près de vous",
    // Le lieu en dernier : les notifications Android coupent la fin, et une
    // adresse tronquée reste lisible là où un type tronqué ne dit plus rien.
    body: (type: string, away: string, place: string | null) =>
      place ? `${type} à ${away} — ${place}` : `${type} à ${away}`,
  },

  // ── Politique de confidentialité ──
  privacy: {
    title: "Confidentialité",
    menuDetail: "Ce que l’application sait de vous",
    updated: (date: string) => `Dernière révision : ${date}`,
    link: "Politique de confidentialité",
  },

  // ── Modération ──
  moderation: {
    flagTitle: "Signaler ce contenu",
    flagIntro: "Dites en quoi ce contenu enfreint les conditions d’utilisation. Un motif précis permet à un modérateur de trancher ; « inapproprié » ne lui apprend rien.",
    flagEffect: "Le contenu disparaîtra de cet appareil immédiatement. Un modérateur décidera ensuite de le retirer pour tout le monde ou de le garder.",
    flagShort: "Signaler",
    flagSend: "Signaler",
    reasons: {
      hateful: "Propos injurieux, haineux ou menaçants",
      personal_data: "Données personnelles d’autrui (visage, plaque, nom)",
      off_topic: "Hors sujet",
      false_report: "Faux signalement ou doublon volontaire",
      advertising: "Publicité",
      other: "Autre raison",
    },
    sent: "Signalé. Un modérateur va regarder.",
    hiddenOnly: "Masqué sur cet appareil. Les modérateurs ne sont pas encore joignables.",
    failed: "Masqué sur cet appareil, mais le signalement n’est pas parti.",
    // ── File, pour les agents et les administrateurs ──
    queue: "Modération",
    queueDetail: "Contenus signalés",
    queueTitle: "Contenus signalés",
    queueEmpty: "Rien à modérer. Tout est en ordre.",
    queueFailed: "Impossible de charger la file.",
    notReady: "La modération n’est pas encore active côté serveur. Les signalements des citoyens masquent déjà le contenu sur leur appareil ; la file s’ouvrira dès que les routes existeront.",
    onIncident: "Sur un signalement",
    onMessage: "Sur un message",
    noExcerpt: "Aucun extrait disponible.",
    openContent: "Ouvrir",
    keep: "Garder",
    hide: "Masquer",
    decided: "Décision enregistrée",
    decideFailed: "La décision n’a pas pu être enregistrée.",
    // ── Contenus masqués ──
    /** Sur sa propre ligne, quand la modération l'a retirée. */
    hiddenTag: "Masqué",
    hiddenNotice:
      "Ce signalement a été masqué par la modération. Il n’est plus visible par les autres utilisateurs.",
    tabQueue: "À traiter",
    tabHidden: "Masqués",
    hiddenEmpty: "Aucun contenu masqué.",
    hiddenNoReason: "Masqué sans signalement",
    hiddenBy: (name: string): string => `Masqué par ${name}`,
    restore: "Rendre visible",
    restored: "Contenu rendu visible",
    deleteShort: "Supprimer",
    deleteTitle: "Supprimer définitivement ?",
    deleteMessage:
      "Le contenu et ses signalements seront effacés. Masquer se corrige, supprimer ne se corrige pas.",
    deleteConfirm: "Supprimer",
    deleted: "Contenu supprimé",
    deleteFailed: "La suppression a échoué.",
  },

  // ── Conditions d’utilisation ──
  terms: {
    title: "Conditions d’utilisation",
    menuDetail: "Les règles du service",
    link: "conditions d’utilisation",
    // La case porte sur le contrat, pas sur le traitement des données : celui
    // qui fait fonctionner le service repose sur l’exécution du contrat, pas sur
    // un consentement. On accepte les unes, on prend connaissance de l’autre —
    // et la nuance n’est pas cosmétique, elle décide de ce qu’un refus permet.
    accept: "J’accepte les",
    acceptAnd: "et j’ai pris connaissance de la",
    mustAccept: "Acceptez les conditions d’utilisation pour créer votre compte.",
  },

  // ── Consentement à la localisation ──
  consent: {
    title: "Utiliser votre position ?",
    intro: "Vous pouvez refuser : l’application marche sans, et vous pourrez changer d’avis à tout moment.",
    uses: [
      "Ouvrir la carte là où vous êtes.",
      "Trier les signalements par proximité et afficher leur distance.",
      "Proposer votre ville dans l’onglet Actus.",
      "Afficher la météo de votre commune.",
      "Vous prévenir d’un signalement proche, si vous activez cette alerte.",
    ],
    leaves: "Ce qui quitte l’appareil : des coordonnées approximatives vers Open-Meteo pour la température, et vers nos serveurs pour nommer la commune. Jamais votre identité avec.",
    refuse: "Si vous refusez : la carte s’ouvre sur le centre-ville, vous choisissez votre ville à la main, et tout le reste fonctionne — signaler, suivre, discuter, consulter.",
    readPolicy: "Lire la politique de confidentialité",
    allow: "Autoriser",
    deny: "Sans ma position",
    changeLater: "Réglages → Localisation, à tout moment.",
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

    nearbyAlerts: "Me prévenir des signalements proches",
    nearbyAlertsDetail: "Une notification quand un signalement apparaît près de vous.",
    nearbyLimit:
      "Fonctionne quand l'application est ouverte, et se tait entre 22 h et 7 h. Jamais plus de trois notifications d'affilée.",
    location: "Localisation",
    locationUse: "Utiliser ma position",
    locationUseDetail: "Pour centrer la carte, trier par proximité et proposer votre ville.",
    locationOffHint: "La carte s’ouvre sur le centre-ville, le tri « Proches » disparaît, la ville des actus se choisit à la main et les alertes de proximité restent muettes. L’autorisation Android, elle, n’est pas touchée.",
    feedback: "Retours",
    haptics: "Vibrations",
    hapticsDetail: "Un retour discret sur les gestes qui comptent.",
    sounds: "Sons",
    soundsDetail: "Un son court à l’envoi, au vote, à la suppression.",

    defaultSort: "Ordre du fil à l’ouverture",
    sortNearestHint: "L’application demandera votre position à l’ouverture du fil.",

    localData: "Données de cet appareil",
    localDataDetail:
      "Brouillons, favoris, signalements en attente d’envoi et données gardées hors ligne. Vos réglages et votre session ne sont pas touchés.",
    clearLocalData: "Effacer les données locales",
    clearConfirm:
      "Brouillons, favoris et signalements en attente d’envoi seront perdus. Cette action est définitive.",
    clearConfirmAction: "Effacer",
    cleared: "Données locales effacées",
  },
};
