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
| **Citoyen** | Déclare des incidents avec photos, consulte ses signalements (avec stats) et tous ceux de la ville           |
| **Agent**   | Voit sa file de travail (déclarés + en cours), filtre par catégorie et statut, change les statuts            |
| **Admin**   | Vue globale — statistiques, filtres type & statut, suppression d'incidents et de photos                      |

---

## Fonctionnalités

### Signalement d'incident (`report.tsx`)
- Formulaire avec géolocalisation automatique et carte interactive
- **Capture photo** : appareil photo ou galerie (jusqu'à 3 photos par signalement)
- Demande de permissions caméra / galerie avec messages d'erreur explicites
- Upload des photos après création du signalement

### Carte interactive (`explore.tsx`)
- Clustering des marqueurs colorés par statut
- Filtres overlay (statut + type) sans quitter la carte
- **Bottom sheet détail** au tap sur un marqueur :
  - Timeline horizontale Déclaré → En cours → Résolu avec dates
  - Description complète et adresse
  - **Photos** avec visionneuse plein écran au tap (zoom)
  - Suppression de photo (admin ou uploadeur uniquement)
  - Changement de statut (agents / admins)
  - Suppression d'incident (admin uniquement)

### Liste des signalements (`index.tsx`)
- Vue adaptée au rôle (Citoyen / Agent / Admin)
- **Citoyen** : section "Mes stats" (Déclarés / En cours / Résolus) + "Mes signalements" + "Tous les signalements"
- Chaque ligne affiche : type (gras), début de description (30 chars), ville extraite de l'adresse, date, badge statut
- Barre colorée latérale par statut, chevron de navigation
- En-têtes de section avec barre d'accent et compteur

---

## Stack technique

| Technologie                 | Version    | Usage                              |
| --------------------------- | ---------- | ---------------------------------- |
| Expo SDK                    | ~54.0.35   | Socle applicatif                   |
| expo-router                 | ~6.0.24    | Navigation basée sur les fichiers  |
| React Native                | 0.81.5     |                                    |
| React                       | 19.1.0     |                                    |
| TypeScript                  | 5          |                                    |
| react-native-maps           | 1.20.1     | Carte + marqueurs                  |
| react-native-map-clustering | ^4.0.0     | Clustering des pins                |
| expo-image                  | ~3.0.11    | Affichage optimisé des photos      |
| expo-image-picker           | ~17.0.11   | Capture photo / galerie            |
| expo-location               | ~19.0.8    | Géolocalisation                    |
| expo-secure-store           | ~15.0.8    | Stockage sécurisé des tokens JWT   |
| Jest / jest-expo            | ~29.7 / ~54 | Tests unitaires (120 tests)       |

---

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer l'app (scan QR avec Expo Go)
npx expo start --clear
```

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
    index.tsx        # Dashboard rôle-adaptatif (Citoyen / Agent / Admin)
    explore.tsx      # Carte plein écran + clustering + bottom sheet détail
    profile.tsx      # Profil utilisateur & déconnexion
  login.tsx          # Authentification (Keycloak)
  register.tsx       # Création de compte
  report.tsx         # Formulaire de signalement + capture photo

components/
  incident-filter-bar.tsx  # Barre de filtres chips (overlay carte)
  incident-row.tsx         # Ligne d'incident (stripe couleur, type, description, ville, statut)
  ui/                      # Button, Card, Input, Logo, Toast, GlassPillSelector, MapPin…

constants/
  api.ts          # API_BASE_URL + tous les endpoints (incidents, photos, status-history…)
  config.ts       # Valeurs centralisées : DEFAULT_LOCATION, MAP_DELTAS, MAP_ANIMATION_MS, INCIDENTS_PAGE_SIZE
  incidents.ts    # STATUS_COLOR, STATUS_LABEL, TYPE_LABEL, NEXT_STATUSES, MAX_INCIDENT_PHOTOS
  strings.ts      # Toutes les chaînes UI (y compris messages d'erreur photos)
  theme.ts        # CityCareColors

hooks/
  use-user-location.ts     # Géolocalisation partagée (explore + report)
  use-incident-filters.ts  # Filtres type + statut réutilisables
  use-app-colors.ts        # Thème clair/sombre

services/
  incidents.ts   # getIncidents, createIncident, updateIncidentStatus, deleteIncident,
                 # getPhotos, uploadPhoto, deletePhoto, getStatusHistory, reverseGeocode
  users.ts       # getUserMe, getMyIncidents
  auth.ts        # login, register, refresh, logout

storage/
  tokens.ts      # Stockage sécurisé des tokens JWT (access + refresh)

types/
  incidents.ts   # IncidentResponse, PhotoResponse, StatusHistoryEntry, CreateIncidentPayload…
  users.ts       # UserMeResponse, MyIncidentItem, MyIncidentsResponse

utils/
  format-date.ts  # formatDateShort, formatDate, formatIncidentDateTime, extractCity

tests/
  unit/
    services/    # incidents, users, auth
    hooks/       # use-incident-filters, use-app-colors
    utils/       # format-date (extractCity, formatDateShort…)
    storage/     # tokens
```

---

## Configuration

La config Expo est centralisée dans `app.config.ts`. La version de l'app est lue depuis `package.json` — c'est le seul fichier à modifier pour bumper la version.

Les valeurs globales de l'application (coordonnées par défaut, deltas de carte, timings d'animation, tailles de pagination) sont centralisées dans `constants/config.ts`.

---

## Variables d'environnement

Créer un fichier `.env` à la racine pour le développement local :

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5158
```

> Utiliser l'IP locale de la machine (pas `localhost`) pour que l'app sur le téléphone puisse joindre l'API et le stockage MinIO.

La clé Google Maps (`GOOGLE_MAPS_API_KEY`) est gérée comme secret EAS — pas besoin dans `.env`.

---

## API — Endpoints utilisés

| Méthode  | Endpoint                                    | Usage                              |
| -------- | ------------------------------------------- | ---------------------------------- |
| POST     | `/auth/login`                               | Connexion                          |
| POST     | `/auth/register`                            | Inscription                        |
| POST     | `/auth/refresh`                             | Renouvellement token               |
| POST     | `/auth/logout`                              | Déconnexion                        |
| GET      | `/auth/me`                                  | Infos utilisateur connecté         |
| GET      | `/users/me`                                 | Profil DB utilisateur              |
| GET      | `/users/me/incidents`                       | Mes signalements                   |
| GET      | `/incidents`                                | Liste avec filtres & pagination    |
| POST     | `/incidents`                                | Créer un signalement               |
| PATCH    | `/incidents/{id}/status`                    | Changer le statut                  |
| DELETE   | `/incidents/{id}`                           | Supprimer (admin)                  |
| GET      | `/incidents/{id}/photos`                    | Photos d'un incident               |
| POST     | `/incidents/{id}/photos`                    | Upload photo (multipart)           |
| DELETE   | `/incidents/{id}/photos/{photoId}`          | Supprimer une photo                |
| GET      | `/incidents/{id}/status-history`            | Historique des changements statut  |
| GET      | `/geocode/reverse`                          | Géocodage inverse                  |

---

## Tests

```bash
# Lancer les tests
npm test

# Lancer les tests avec rapport de coverage
npm run test:coverage
```

120 tests unitaires couvrant les services, hooks, utilitaires et stockage.

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
eas build --profile production --platform android --clear-cache
```

---

## Licence

Projet académique — YNOV / ORT 2025-2026
