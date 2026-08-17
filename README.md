# CityCare+ Mobile

> Application mobile citoyenne de signalement d'incidents urbains — voirie, éclairage, déchets, graffiti et plus.

[![Version](https://img.shields.io/github/v/release/CityCareTeam/city-care-mobile?style=flat-square&color=f6aa54)](https://github.com/CityCareTeam/city-care-mobile/releases)
[![Last Commit](https://img.shields.io/github/last-commit/CityCareTeam/city-care-mobile?style=flat-square)](https://github.com/CityCareTeam/city-care-mobile/commits)
[![Issues](https://img.shields.io/github/issues/CityCareTeam/city-care-mobile?style=flat-square)](https://github.com/CityCareTeam/city-care-mobile/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/CityCareTeam/city-care-mobile?style=flat-square)](https://github.com/CityCareTeam/city-care-mobile/pulls)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white&style=flat-square)](https://expo.dev)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey?style=flat-square)](#)
[![CI/CD](https://img.shields.io/github/actions/workflow/status/CityCareTeam/city-care-mobile/ci-cd.yml?style=flat-square&label=CI/CD)](https://github.com/CityCareTeam/city-care-mobile/actions)
[![Coverage main](https://codecov.io/gh/CityCareTeam/city-care-mobile/branch/main/graph/badge.svg)](https://codecov.io/gh/CityCareTeam/city-care-mobile)
[![Coverage dev](https://codecov.io/gh/CityCareTeam/city-care-mobile/branch/dev/graph/badge.svg)](https://codecov.io/gh/CityCareTeam/city-care-mobile)

---

## Présentation

CityCare+ connecte les citoyens à leur mairie. Les signalements remontent en temps réel sur une carte interactive et sont traités par les agents municipaux.

**Rôles disponibles :**

| Rôle        | Accès                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| **Citoyen** | Déclare des incidents avec photos, consulte ses signalements (avec stats), vote pour soutenir un incident, chat en temps réel, **signale un contenu** à la modération |
| **Agent**   | Voit sa file de travail (déclarés + en cours), filtre par catégorie et statut, change les statuts, chat, **file de modération** — masque ou garde un contenu signalé |
| **Admin**   | Tout ce qui précède, plus la **suppression définitive** d'un contenu masqué et la **gestion des comptes** (rôles, activation) |

> Le personnel ne signale pas et ne vote pas : il tranche. Un agent qui repère
> lui-même un contenu le masque directement, avec motif — se signaler à
> soi-même n'apporterait rien.

---

## Fonctionnalités

### Signalement d'incident (`report.tsx`)
- Formulaire avec géolocalisation automatique et carte interactive
- **Capture photo** : appareil photo ou galerie (jusqu'à 3 photos par signalement)
- Demande de permissions caméra / galerie avec messages d'erreur explicites
- Upload des photos après création du signalement
- **Brouillon persistant** : le formulaire survit à une fermeture de
  l'application et se restaure au retour (3 jours), avec un bouton pour l'effacer
- **Envoi différé** : un signalement rédigé sans réseau est accepté localement et
  part au retour de la connexion. Un refus du serveur, lui, ne boucle pas — il
  est remonté à l'utilisateur sur l'accueil
- **Recherche d'adresse** pour poser le point sans se déplacer sur la carte
- **Détection de doublon** : un signalement du même type déjà déclaré à
  proximité est montré avant l'envoi — on choisit alors de le soutenir plutôt
  que d'en créer un second
- Guide en plusieurs étapes, franchissables au glissé

### Carte interactive (`explore.tsx`)
- **Clustering serveur** via `GET /incidents/map-summary` — marqueurs regroupés par viewport avec debounce 300 ms
  - Couleur dominante par statut (rouge / orange / vert)
  - Tap cluster → zoom in → re-fetch automatique
  - Zoom ≥ 15 → bascule vers les incidents individuels
- Filtres overlay (statut + type) sans quitter la carte
- **Bottom sheet détail** au tap sur un marqueur :
  - Timeline horizontale Déclaré → En cours → Résolu avec dates
  - Description complète et adresse
  - **Photos** avec visionneuse plein écran au tap (zoom)
  - Suppression de photo (admin ou uploadeur uniquement)
  - Changement de statut (agents / admins)
  - Suppression d'incident (admin uniquement)
  - **Vote / Soutien** (citoyens) — compteur en temps réel
  - **Signaler** le contenu, ou le **masquer** pour un agent, à gauche du vote
  - **Chat temps réel** (SignalR) — fil de discussion lié à l'incident, chaque
    message signalable
  - **Itinéraire** ouvert dans l'application de cartes du téléphone
  - Distance depuis sa position, en orange
- **Cache hors ligne** : la dernière carte connue s'affiche sans réseau, avec la
  date de sa dernière mise à jour
- **Alertes de proximité** quand un signalement paraît près de soi (rayon
  réglable, éteintes par défaut)

### Liste des signalements (`index.tsx`)
- Vue adaptée au rôle (Citoyen / Agent / Admin)
- **Citoyen** : section "Mes stats" (Déclarés / En cours / Résolus) + onglets
  "Les miens" / "Communauté" / "Suivis"
  - Badge **"Le mien"** sur ses propres signalements
  - Un signalement **masqué par la modération** reste dans sa liste, en rouge
- **Agents et admins** voient aussi les contenus masqués, en rouge : c'est leur
  file de travail
- Recherche plein texte et tri — récents, anciens, proches — avec la distance
  affichée dès que la position est connue
- Chaque ligne affiche : description en titre, catégorie et ville, distance,
  date, badge de statut ; barre colorée latérale
- Pagination et chargement progressif

### Notifications (`notifications.tsx`)
- Écran dédié avec liste de toutes les notifications
- Badge non-lus en temps réel sur l'onglet de navigation (polling 30 s + listener temps réel)
- **Swipe gauche** pour supprimer une notification
- Marquer comme lu au tap, tout lire, tout supprimer
- Tap → navigation vers l'incident concerné, sur le bon onglet (fiche ou fil)
- Types gérés : nouveau signalement, changement de statut, nouveau message,
  **contenu signalé** (modérateurs) et **contenu modéré** (auteur)
- **Push notifications** sur Android via Expo + Firebase FCM V1 (token enregistré après login, vidé au logout)
- Son court optionnel en complément de la vibration

### Actus (`news.tsx`)
- Agenda des événements de la ville, groupé par période (aujourd'hui, cette
  semaine, ce mois, plus tard)
- Ville choisie dans une liste déroulante, ou déduite de la position à
  l'ouverture — avec un message distinct selon qu'il n'y a rien à afficher ou
  qu'on n'est pas connecté
- Sources multiples par ville, agrégées et dédupliquées ; une source en panne
  n'emporte pas les autres
- Partage d'un événement, décompte avant sa tenue

### Modération
- **Signaler** un signalement ou un message, avec l'un des six motifs repris des
  conditions d'utilisation. Le contenu disparaît de l'appareil aussitôt, même si
  les modérateurs sont injoignables — et l'écran dit lequel des deux s'est
  produit
- **File de modération** (agents / admins), ouverte depuis le profil avec une
  pastille de compteur. Agrégée par contenu et non par signalement, extrait à
  l'appui, ouvrable sur la fiche concernée
- Deux décisions de même poids : masquer, ou garder et clore
- **Onglet « Masqués »** — qui a tranché, quand, avec quel motif ; on rend
  visible, ou l'on supprime définitivement (admin)
- **Masquage automatique** au-delà de dix signalements sur un même contenu :
  mesure conservatoire, la décision reste à prendre
- L'auteur est prévenu du retrait **et du motif**, puis du rétablissement. Son
  signalement reste dans sa liste, en rouge

### Gestion des comptes (admins)
- Ouverte depuis le menu latéral, section « Administration »
- Recherche côté serveur, filtres par rôle avec effectifs, pagination
- Changement de rôle et activation / désactivation d'un compte — jamais sur le
  sien, et confirmation pour nommer un administrateur

### Réglages (menu latéral)
- Thème, langue, **taille du texte**
- Retours haptiques et sonores, essayés à l'activation
- Usage de la position, avec ce que le couper retire écrit noir sur blanc
- Ordre par défaut du fil, **mode économie** (sondages espacés)
- Revoir le guide, réinitialiser les réglages, effacer les données locales

### Compte et données personnelles (`profile.tsx`)
- Préférences de notifications : email / push, types d'incidents suivis,
  alertes de proximité et leur rayon
- **Export de ses données** — un fichier JSON de ses signalements, messages,
  votes et préférences, envoyé où l'on veut
- Politique de confidentialité et conditions d'utilisation consultables à tout
  moment depuis le menu, acceptation explicite à l'inscription

---

## Stack technique

| Technologie                 | Version     | Usage                                      |
| --------------------------- | ----------- | ------------------------------------------ |
| Expo SDK                    | ~54.0.35    | Socle applicatif                           |
| expo-router                 | ~6.0.24     | Navigation basée sur les fichiers          |
| React Native                | 0.81.5      |                                            |
| React                       | 19.1.0      |                                            |
| TypeScript                  | 5           |                                            |
| react-native-maps           | 1.20.1      | Carte + marqueurs individuels              |
| @microsoft/signalr          | ^10.0.0     | Chat temps réel (WebSocket)                |
| expo-image                  | ~3.0.11     | Affichage optimisé des photos              |
| expo-image-picker           | ~17.0.11    | Capture photo / galerie                    |
| expo-location               | ~19.0.8     | Géolocalisation                            |
| expo-notifications          | ~0.32.17    | Push notifications                         |
| expo-secure-store           | ~15.0.8     | Stockage sécurisé des tokens JWT           |
| expo-updates                | ~29.0.19    | Mises à jour du bundle JS à la volée (OTA) |
| expo-audio                  | ~1.1.1      | Sons courts de l'interface                 |
| expo-file-system            | ~19.0.24    | Écriture du fichier d'export               |
| expo-sharing                | ~14.0.8     | Remise de l'export à une autre application |
| expo-blur                   | ~15.0.8     | Surfaces flottantes (iOS)                  |
| expo-haptics                | ~15.0.8     | Retours haptiques                          |
| react-native-reanimated     | ~4.1.1      | Barre d'onglets, gestes                    |
| async-storage               | 2.2.0       | Brouillon, cache du fil, file d'envoi, réglages |
| Jest / jest-expo            | ~29.7 / ~54 | Tests unitaires (829 tests, 91 suites)     |

---

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer l'app (scan QR avec Expo Go)
npx expo start --clear
```

> **Note** : les push notifications ne fonctionnent pas dans Expo Go depuis SDK 53. Utiliser un build EAS.

Cibles directes :

```bash
npm run android
npm run ios
```

---

## Structure du projet

```
app/
  (tabs)/
    index.tsx          # Dashboard rôle-adaptatif (Citoyen / Agent / Admin)
    explore.tsx        # Carte plein écran + clustering serveur + bottom sheet détail + chat
    notifications.tsx  # Centre de notifications (liste, swipe, push)
    news.tsx           # Agenda des événements de la ville
    profile.tsx        # Profil, préférences notifs, file de modération, export, déconnexion
  login.tsx            # Authentification (Keycloak)
  register.tsx         # Création de compte + acceptation des conditions
  report.tsx           # Formulaire de signalement + capture photo

components/
  incident-filter-bar.tsx  # Barre de filtres chips (overlay carte)
  incident-row.tsx         # Ligne d'incident (stripe couleur, distance, badges « Le mien » / « Masqué »)
  admin/                   # AccountsModal — rôles, activation, recherche, pagination
  app/                     # AppMenu (menu latéral), SettingsModal, GuideModal, LegalModal,
                           # LocationConsentModal, UpdatesModal, ErrorBoundary
  explore/                 # IncidentDetailSheet, IncidentChatTab, AddressSearch, ClusterLegend…
  moderation/              # FlagContentModal (signaler / masquer), ModerationQueueModal
  ui/                      # AppText (échelle de texte), Button, Card, Input, Toast,
                           # GlassPillSelector, ModalShell, MapPin, Skeleton…

constants/
  api.ts             # API_BASE_URL + tous les endpoints
  config.ts          # DEFAULT_LOCATION, MAP_DELTAS, CLUSTER_ZOOM_THRESHOLD, POLL_INTERVAL_MS…
  incidents.ts       # STATUS_COLOR, STATUS_LABEL, TYPE_LABEL, NEXT_STATUSES, MAX_INCIDENT_PHOTOS
  i18n/              # fr.ts (référence) + en.ts, typé d'après le français
  news-cities.ts     # Villes et leurs sources d'événements
  privacy.ts         # Politique de confidentialité
  terms.ts           # Conditions d'utilisation
  native-runtime.json # Version du runtime natif + liste des modules (garde-fou OTA)
  theme.ts           # CityCareColors

context/
  AuthContext.tsx          # Authentification, rôle, logout (vide le push token)
  NotificationContext.tsx  # Compteur non-lus, polling, listener temps réel, token push
  PreferencesContext.tsx   # Thème, langue, taille du texte, retours, position, économie
  AppMenuContext.tsx       # Ouverture du menu latéral

hooks/
  use-user-location.ts         # Géolocalisation partagée (explore + report)
  use-incident-filters.ts      # Filtres type + statut réutilisables
  use-incident-search.ts       # Recherche et tri du fil, distance
  use-incident-chat.ts         # Chat SignalR (connexion, messages, send)
  use-incident-votes.ts        # Vote / soutien (toggle, compteur)
  use-incident-photos.ts       # Photos d'un incident
  use-incident-permissions.ts  # Droits sur un incident, dont signaler / masquer
  use-content-report.ts        # Signaler, masquer, masquage local
  use-map-clusters.ts          # Clustering serveur (debounce, zoom, bounds)
  use-nearby-alerts.ts         # Alertes de proximité
  use-auto-refresh.ts          # Sondage au premier plan, cadence de reprise, économie
  use-app-colors.ts            # Thème clair/sombre

services/
  api-client.ts    # fetchWithTimeout, authFetch, throwFromResponse
  incidents.ts     # getIncidents (dont includeHidden), getIncidentById, createIncident,
                   # updateIncidentStatus, deleteIncident, photos, votes, historique,
                   # getMapSummary, reverseGeocode
  messages.ts      # getMessages, sendMessage
  users.ts         # getUserMe, getMyIncidents, updateMe, deleteAccount
  auth.ts          # login, register, refresh, logout
  notifications.ts # liste, compteur, lecture, suppression, token push, préférences
  moderation.ts    # flagContent, hideContent, file, décisions, masqués, restauration
  admin.ts         # getAdminUsers, setUserRole, setUserEnabled
  data-export.ts   # exportMyData (fichier JSON + feuille de partage)
  news*.ts         # Agrégation des sources d'événements

storage/
  tokens.ts          # Stockage sécurisé des tokens JWT (access + refresh)
  preferences.ts     # Réglages de l'appareil
  hidden-content.ts  # Contenus masqués localement après signalement
  onboarding.ts      # Guide vu / à revoir
  consent.ts         # Trace de la demande de position

types/
  incidents.ts      # IncidentResponse (dont visibility), PhotoResponse, MapClusterDto…
  users.ts          # UserMeResponse, MyIncidentItem (dont visibility), UpdateMePayload
  auth.ts           # LoginPayload, LoginResponse, RegisterPayload, MeResponse
  messages.ts       # MessageResponse, CreateMessageRequest
  notifications.ts  # NotificationResponse, NotificationSettingsResponse…

tests/
  unit/
    components/  # incident-row, chat tab, file de modération, comptes, AppText,
                 # notifications, bannières, fenêtres…
    services/    # api-client, incidents, users, auth, notifications, messages,
                 # moderation, admin, news
    hooks/       # filtres, couleurs, votes, chat, clusters, position, préférences notifs…
    utils/       # dates, adresses, distances, partage, groupes d'actus
    storage/     # tokens
```

---

## Configuration

La config Expo est centralisée dans `app.config.ts`. La version de l'app est lue depuis `package.json` — c'est le seul fichier à modifier pour bumper la version.

Deux langues sont livrées, français et anglais. `constants/i18n/fr.ts` fait
référence et `en.ts` en est typé : ajouter une clé sans la traduire ne compile
pas. Une traduction manquante est donc une erreur au build, jamais une chaîne
vide à l'écran.

Les valeurs globales de l'application sont centralisées dans `constants/config.ts`.

---

## Variables d'environnement

Créer un fichier `.env` à la racine pour le développement local :

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5158
```

> Utiliser l'IP locale de la machine (pas `localhost`) pour que l'app sur le téléphone puisse joindre l'API.

La clé Google Maps (`GOOGLE_MAPS_API_KEY`) est gérée comme secret EAS.

---

## Push Notifications (Android)

Les push notifications Android nécessitent Firebase FCM V1. La configuration est en deux parties :

**Client (embarqué dans l'APK) :**
- `google-services.json` à la racine du projet (téléchargé depuis la console Firebase)
- Déclaré dans `app.config.ts` : `android.googleServicesFile: "./google-services.json"`

**Serveur (credentials EAS) :**
```bash
npx eas credentials --platform android
# → Google Service Account → Push Notifications (FCM V1)
# → uploader le JSON de compte de service Firebase (Project Settings → Service Accounts)
```

> Les push notifications ne fonctionnent pas dans Expo Go depuis SDK 53 — utiliser un build EAS.

**Flow :**
- Login → token Expo Push enregistré sur le backend via `PATCH /users/me/push-token`
- Logout → token vidé (`null`) pour éviter les notifications sur le mauvais compte

---

## API — Endpoints utilisés

| Méthode  | Endpoint                                        | Usage                                  |
| -------- | ----------------------------------------------- | -------------------------------------- |
| POST     | `/auth/login`                                   | Connexion                              |
| POST     | `/auth/register`                                | Inscription                            |
| POST     | `/auth/refresh`                                 | Renouvellement token                   |
| POST     | `/auth/logout`                                  | Déconnexion                            |
| GET      | `/auth/me`                                      | Infos utilisateur connecté             |
| GET      | `/users/me`                                     | Profil DB utilisateur                  |
| PATCH    | `/users/me`                                     | Mise à jour du profil                  |
| DELETE   | `/users/me`                                     | Suppression du compte                  |
| GET      | `/users/me/incidents`                           | Mes signalements (dont les masqués)    |
| GET      | `/users/me/export`                              | Export de ses données (JSON)           |
| PATCH    | `/users/me/push-token`                          | Enregistrement / vidage token push     |
| GET      | `/users/me/notification-settings`              | Préférences de notifications           |
| PATCH    | `/users/me/notification-settings`              | Mise à jour des préférences            |
| GET      | `/users/me/notifications`                       | Liste des notifications                |
| GET      | `/users/me/notifications/unread-count`          | Compteur non-lus                       |
| PATCH    | `/users/me/notifications/{id}/read`             | Marquer comme lu                       |
| POST     | `/users/me/notifications/read-all`              | Tout marquer comme lu                  |
| DELETE   | `/users/me/notifications/{id}`                  | Supprimer une notification             |
| DELETE   | `/users/me/notifications`                       | Supprimer toutes les notifications     |
| GET      | `/incidents`                                    | Liste avec filtres & pagination — `includeHidden` pour agents / admins |
| GET      | `/incidents/{id}`                               | Détail — un contenu masqué n'est servi qu'à son auteur et à la modération |
| POST     | `/incidents`                                    | Créer un signalement                   |
| PATCH    | `/incidents/{id}/status`                        | Changer le statut                      |
| DELETE   | `/incidents/{id}`                               | Supprimer (admin)                      |
| GET      | `/incidents/{id}/photos`                        | Photos d'un incident                   |
| POST     | `/incidents/{id}/photos`                        | Upload photo (multipart)               |
| DELETE   | `/incidents/{id}/photos/{photoId}`              | Supprimer une photo                    |
| GET      | `/incidents/{id}/status-history`                | Historique des changements statut      |
| GET      | `/incidents/{id}/votes`                         | Votes d'un incident                    |
| POST     | `/incidents/{id}/votes`                         | Voter pour un incident                 |
| DELETE   | `/incidents/{id}/votes/me`                      | Retirer son vote                       |
| GET      | `/incidents/{id}/messages`                      | Messages du chat                       |
| POST     | `/incidents/{id}/messages`                      | Envoyer un message                     |
| GET      | `/incidents/map-summary`                        | Clustering serveur (AllowAnonymous)    |
| GET      | `/geocode/reverse`                              | Géocodage inverse                      |
| WS       | `/hubs/incident-chat`                           | Hub SignalR chat temps réel            |
| POST     | `/moderation/flags`                             | Signaler un contenu (409 si déjà fait) |
| POST     | `/moderation/hide`                              | Masquer directement (agent / admin)    |
| GET      | `/moderation/queue`                             | File des contenus signalés             |
| GET      | `/moderation/queue/count`                       | Compteur pour la pastille              |
| POST     | `/moderation/queue/{id}/hide` · `/keep`         | Trancher                               |
| GET      | `/moderation/hidden`                            | Contenus masqués, et par qui           |
| POST     | `/moderation/hidden/restore`                    | Rendre visible                         |
| DELETE   | `/moderation/hidden/{type}/{id}`                | Supprimer définitivement (admin)       |
| GET      | `/admin/users`                                  | Comptes — recherche, pagination        |
| PUT      | `/admin/users/{keycloakId}/role`                | Changer le rôle                        |
| PUT      | `/admin/users/{keycloakId}/enabled`             | Activer / désactiver un compte         |

---

## Confidentialité et modération

**Ce qui est masqué l'est côté serveur.** Un filtre de requête global écarte les
contenus masqués de toutes les lectures ordinaires — liste, détail, carte,
votes, photos, historique, fil de discussion. Si le filtrage était laissé au
mobile, le contenu litigieux continuerait de partir vers tous les téléphones et
ne serait masqué que par politesse. Deux appelants seulement demandent
explicitement à le voir : la modération et la suppression admin.

**Les photos sont servies par des liens signés**, valables six heures. Elles
étaient auparavant lisibles par n'importe qui connaissant l'adresse, sans jeton
ni expiration — masquer un signalement laissait donc ses images accessibles.

**L'auteur garde la main sur ses données** : son contenu masqué reste visible
dans sa liste, en rouge, avec le motif du retrait ; il peut exporter l'ensemble
de ce que l'application détient sur lui, et supprimer son compte.

> ⚠️ **Deux points restent ouverts.** L'API de production est jointe en **HTTP
> clair** (`usesCleartextTraffic`) : jetons, photos et coordonnées circulent en
> clair. Et `constants/privacy.ts` et `constants/terms.ts` contiennent des
> marqueurs `[À COMPLÉTER]` — éditeur, contact, durées de conservation, droit
> applicable — à renseigner avant toute publication réelle.

---

## Tests

```bash
# Lancer les tests
npm test

# Lancer les tests avec rapport de coverage
npm run test:coverage
```

829 tests répartis en 91 suites, couvrant les composants, services, hooks,
utilitaires et stockage.

Ils servent surtout à verrouiller des défauts déjà rencontrés : une propriété
déclarée mais jamais transmise, une fenêtre qu'aucun bouton n'ouvre, un rôle
comparé dans la mauvaise casse, une liste paginée qui redemande le mauvais rang.
Chacun de ces tests porte en commentaire le défaut qu'il empêche de revenir.

---

## CI/CD

La pipeline GitHub Actions (`ci-cd.yml`) tourne sur chaque push/PR :

| Job               | Déclencheur          | Action                                              |
| ----------------- | -------------------- | --------------------------------------------------- |
| `lint`            | push / PR            | ESLint                                              |
| `type-check`      | push / PR            | `tsc --noEmit`                                      |
| `audit`           | push / PR            | `npm audit --audit-level=high`                      |
| `test`            | push / PR            | Jest + upload Codecov                               |
| `version-check`   | PR vers `main`       | Bloque si version non bumpée dans `package.json`    |
| `tag`             | merge sur `main`     | Maj badge README + création tag `vX.Y.Z`            |
| `build`           | merge sur `main`     | EAS build production Android + notif Discord        |

---

## Build EAS

```bash
# Build preview (APK interne)
eas build --profile preview --platform android

# Build production
eas build --platform android --profile production --non-interactive --clear-cache
```

### Mises à jour à la volée (OTA)

Un correctif qui ne touche que du JS n'a pas besoin d'un nouvel APK : il se
pousse sur les appareils déjà installés, appliqué au lancement suivant ou tout
de suite via la bannière.

```bash
npm run update:beta   # canal beta  (profil dev-local)
npm run update:prod   # canal production
```

Le message publié est le sujet du dernier commit, et les `EXPO_PUBLIC_*` du
profil correspondant sont réinjectés à la publication — ils sont inlinés dans le
bundle, un update publié depuis le mauvais environnement enverrait les appareils
sur le mauvais back.

Le journal des versions est régénéré et commité au passage : il est compilé dans
le bundle, donc il doit décrire ce bundle. Le rang de pré-version (`beta.2`), lui,
ne bouge pas — il compte les APK, pas les mises à jour à la volée, qui se
distinguent par l'identifiant de bundle affiché dans la pastille de version.

Toute modification native (nouvelle dépendance, permission, plugin) sort du
périmètre de l'OTA et exige un build complet — **et l'incrémentation de
`version` dans `constants/native-runtime.json`**, qui sert de `runtimeVersion` :
un bundle n'est servi qu'aux binaires portant la même valeur. Sans elle, le
nouveau JS partirait vers des APK dépourvus du module qu'il appelle.
`tests/unit/native-runtime.test.ts` échoue si une dépendance native a bougé sans
que la liste du même fichier soit mise à jour.

---

## Licence

Projet académique — YNOV / ORT 2025-2026
