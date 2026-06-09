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

| Rôle        | Accès                                                                                  |
| ----------- | -------------------------------------------------------------------------------------- |
| **Citoyen** | Déclare des incidents, consulte ses signalements et tous ceux de la ville avec filtres |
| **Agent**   | Voit sa file de travail (déclarés + en cours), filtre par catégorie et statut          |
| **Admin**   | Vue globale — statistiques, filtres type & statut, gestion complète                    |

---

## Stack technique

| Technologie                 | Version  |
| --------------------------- | -------- |
| Expo SDK                    | ~54.0.35 |
| expo-router                 | ~6.0.24  |
| React Native                | 0.81.5   |
| React                       | 19.1.0   |
| TypeScript                  | 5        |
| expo-maps                   | ~0.12.10 |
| expo-secure-store           | ~15.0.8  |
| react-native-map-clustering | latest   |

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
    explore.tsx      # Carte plein écran + clustering + filtres overlay + bottom sheet
    profile.tsx      # Profil utilisateur & déconnexion
  login.tsx          # Authentification (Keycloak)
  register.tsx       # Création de compte
  report.tsx         # Formulaire de signalement avec géolocalisation

components/
  incident-filter-bar.tsx  # Barre de filtres chips (overlay carte)
  incident-row.tsx         # Ligne d'incident réutilisable (type, statut, date, adresse)
  ui/                      # Button, Card, Input, Logo, Toast…

constants/
  incidents.ts   # STATUS_COLOR, STATUS_LABEL, TYPE_LABEL, NEXT_STATUSES
  strings.ts     # Toutes les chaînes UI centralisées
  theme.ts       # CityCareColors

hooks/
  use-user-location.ts     # Géolocalisation partagée (explore + report)
  use-incident-filters.ts  # Filtres type + statut réutilisables
  use-app-colors.ts        # Thème clair/sombre
  use-color-scheme.ts

services/          # Appels API REST (auth, incidents, users)
storage/           # Tokens JWT (expo-secure-store)
types/             # Types TypeScript (incidents, auth, users)
utils/             # format-date (formatDateShort, formatIncidentDateTime…)
```

---

## Configuration

La config Expo est centralisée dans `app.config.ts`. La version de l'app est lue depuis `package.json` — c'est le seul fichier à modifier pour bumper la version.

---

## Variables d'environnement

Créer un fichier `.env` à la racine pour le développement local :

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

La clé Google Maps (`GOOGLE_MAPS_API_KEY`) est gérée comme secret EAS — pas besoin dans `.env`.

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

## Tests

```bash
# Lancer les tests
npm test

# Lancer les tests avec rapport de coverage
npm run test:coverage
```

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
