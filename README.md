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
| **Citoyen** | Déclare des incidents avec photos, consulte ses signalements (avec stats), vote pour soutenir un incident, chat en temps réel |
| **Agent**   | Voit sa file de travail (déclarés + en cours), filtre par catégorie et statut, change les statuts, chat      |
| **Admin**   | Vue globale — statistiques, filtres type & statut, suppression d'incidents et de photos, chat                |

---

## Fonctionnalités

### Signalement d'incident (`report.tsx`)
- Formulaire avec géolocalisation automatique et carte interactive
- **Capture photo** : appareil photo ou galerie (jusqu'à 3 photos par signalement)
- Demande de permissions caméra / galerie avec messages d'erreur explicites
- Upload des photos après création du signalement

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
  - **Chat temps réel** (SignalR) — fil de discussion lié à l'incident

### Liste des signalements (`index.tsx`)
- Vue adaptée au rôle (Citoyen / Agent / Admin)
- **Citoyen** : section "Mes stats" (Déclarés / En cours / Résolus) + onglets "Les miens" / "Communauté"
  - Badge **"Le mien"** sur les incidents de l'utilisateur dans la vue Communauté
- Chaque ligne affiche : type (gras), début de description (30 chars), ville extraite de l'adresse, date, badge statut
- Barre colorée latérale par statut, chevron de navigation
- En-têtes de section avec barre d'accent et compteur

### Notifications (`notifications.tsx`)
- Écran dédié avec liste de toutes les notifications
- Badge non-lus en temps réel sur l'onglet de navigation (polling 30 s + listener temps réel)
- **Swipe gauche** pour supprimer une notification
- Marquer comme lu au tap, tout lire, tout supprimer
- Tap → navigation directe vers l'incident concerné
- Types gérés : nouveau signalement, changement de statut, nouveau message
- **Push notifications** sur Android via Expo + Firebase FCM V1 (token enregistré après login, vidé au logout)

### Préférences de notifications (`profile.tsx`)
- Toggles email / push
- Sélection des types d'incidents suivis (Voirie, Éclairage, Déchets, Graffiti, Sécurité, Autre)

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
| Jest / jest-expo            | ~29.7 / ~54 | Tests unitaires (300 tests)                |

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
    profile.tsx        # Profil utilisateur, préférences notifs & déconnexion
  login.tsx            # Authentification (Keycloak)
  register.tsx         # Création de compte
  report.tsx           # Formulaire de signalement + capture photo

components/
  incident-filter-bar.tsx  # Barre de filtres chips (overlay carte)
  incident-row.tsx         # Ligne d'incident (stripe couleur, type, description, ville, statut, badge "Le mien")
  ui/                      # Button, Card, Input, Logo, Toast, GlassPillSelector, MapPin…

constants/
  api.ts          # API_BASE_URL + tous les endpoints
  config.ts       # Valeurs centralisées : DEFAULT_LOCATION, MAP_DELTAS, CLUSTER_ZOOM_THRESHOLD, INCIDENTS_PAGE_SIZE
  incidents.ts    # STATUS_COLOR, STATUS_LABEL, TYPE_LABEL, NEXT_STATUSES, MAX_INCIDENT_PHOTOS
  strings.ts      # Toutes les chaînes UI
  theme.ts        # CityCareColors

context/
  AuthContext.tsx          # Authentification, rôle, logout (vide le push token)
  NotificationContext.tsx  # Compteur non-lus, polling, listener temps réel, enregistrement push token

hooks/
  use-user-location.ts         # Géolocalisation partagée (explore + report)
  use-incident-filters.ts      # Filtres type + statut réutilisables
  use-incident-chat.ts         # Chat SignalR (connexion, messages, send)
  use-incident-votes.ts        # Vote / soutien (toggle, compteur)
  use-incident-photos.ts       # Photos d'un incident
  use-incident-permissions.ts  # Droits de l'utilisateur sur un incident
  use-map-clusters.ts          # Clustering serveur (debounce, zoom, bounds)
  use-notification-settings.ts # Préférences de notifications (toggle, save)
  use-push-token.ts            # Enregistrement du token push après login
  use-app-colors.ts            # Thème clair/sombre

services/
  api-client.ts   # fetchWithTimeout, authFetch, throwFromResponse
  incidents.ts    # getIncidents, createIncident, updateIncidentStatus, deleteIncident,
                  # getPhotos, uploadPhoto, deletePhoto, getStatusHistory, reverseGeocode,
                  # getMapSummary, addVote, removeVote, getVotes
  messages.ts     # getMessages, sendMessage
  users.ts        # getUserMe, getMyIncidents, updateMe, deleteAccount
  auth.ts         # login, register, refresh, logout
  notifications.ts # getNotifications, getUnreadCount, markAsRead, markAllAsRead,
                   # deleteNotification, deleteAllNotifications,
                   # registerPushToken, getNotificationSettings, updateNotificationSettings

storage/
  tokens.ts      # Stockage sécurisé des tokens JWT (access + refresh)

types/
  incidents.ts      # IncidentResponse, PhotoResponse, StatusHistoryEntry, VoteResponse, MapClusterDto…
  users.ts          # UserMeResponse, MyIncidentItem, MyIncidentsResponse, UpdateMePayload
  auth.ts           # LoginPayload, LoginResponse, RegisterPayload, RegisterResponse, MeResponse
  messages.ts       # MessageResponse, CreateMessageRequest
  notifications.ts  # NotificationResponse, NotificationSettingsResponse, UpdateNotificationSettingsRequest…

utils/
  format-date.ts     # formatDateShort, formatDate, formatIncidentDateTime, extractCity, timeAgo
  format-address.ts  # extractCity

tests/
  unit/
    services/    # api-client, incidents, users, auth, notifications, messages
    hooks/       # use-incident-filters, use-app-colors, use-easter-egg, use-user-location,
                 # use-color-scheme-web, use-incident-votes, use-incident-chat,
                 # use-map-clusters, use-notification-settings, use-push-token
    utils/       # format-date, format-address
    storage/     # tokens
```

---

## Configuration

La config Expo est centralisée dans `app.config.ts`. La version de l'app est lue depuis `package.json` — c'est le seul fichier à modifier pour bumper la version.

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
| GET      | `/users/me/incidents`                           | Mes signalements                       |
| PATCH    | `/users/me/push-token`                          | Enregistrement / vidage token push     |
| GET      | `/users/me/notification-settings`              | Préférences de notifications           |
| PATCH    | `/users/me/notification-settings`              | Mise à jour des préférences            |
| GET      | `/users/me/notifications`                       | Liste des notifications                |
| GET      | `/users/me/notifications/unread-count`          | Compteur non-lus                       |
| PATCH    | `/users/me/notifications/{id}/read`             | Marquer comme lu                       |
| POST     | `/users/me/notifications/read-all`              | Tout marquer comme lu                  |
| DELETE   | `/users/me/notifications/{id}`                  | Supprimer une notification             |
| DELETE   | `/users/me/notifications`                       | Supprimer toutes les notifications     |
| GET      | `/incidents`                                    | Liste avec filtres & pagination        |
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

---

## Tests

```bash
# Lancer les tests
npm test

# Lancer les tests avec rapport de coverage
npm run test:coverage
```

300 tests unitaires couvrant les services, hooks, utilitaires et stockage.

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

---

## Licence

Projet académique — YNOV / ORT 2025-2026
