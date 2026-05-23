# CityCare+ Mobile

> Application mobile citoyenne de signalement d'incidents urbains — voirie, éclairage, déchets, graffiti et plus.

[![Version](https://img.shields.io/badge/version-1.0.0-f6aa54?style=flat-square)](https://github.com/CityCareTeam/city-care-mobile/releases)
[![Last Commit](https://img.shields.io/github/last-commit/CityCareTeam/city-care-mobile?style=flat-square)](https://github.com/CityCareTeam/city-care-mobile/commits)
[![Issues](https://img.shields.io/github/issues/CityCareTeam/city-care-mobile?style=flat-square)](https://github.com/CityCareTeam/city-care-mobile/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/CityCareTeam/city-care-mobile?style=flat-square)](https://github.com/CityCareTeam/city-care-mobile/pulls)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white&style=flat-square)](https://expo.dev)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey?style=flat-square)](#)
[![CI/CD](https://img.shields.io/github/actions/workflow/status/CityCareTeam/city-care-mobile/ci.yml?style=flat-square&label=CI/CD)](https://github.com/CityCareTeam/city-care-mobile/actions)

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

| Technologie       | Version  |
| ----------------- | -------- |
| Expo SDK          | ~54.0.33 |
| expo-router       | ~6.0.23  |
| React Native      | 0.81.5   |
| React             | 19.1.0   |
| TypeScript        | 5        |
| expo-maps         | ~0.12.10 |
| expo-secure-store | ~15.0.8  |

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
    explore.tsx      # Carte plein écran + filtres overlay + bottom sheet
    profile.tsx      # Profil utilisateur & déconnexion
  login.tsx          # Authentification (Keycloak)
  register.tsx       # Création de compte
  report.tsx         # Formulaire de signalement

components/
  incident-filter-bar.tsx  # Barre de filtres chips (overlay carte)
  incident-row.tsx         # Ligne d'incident réutilisable
  ui/                      # Button, Card, Input, Logo, Toast…

constants/
  incidents.ts   # STATUS_COLOR, STATUS_LABEL, TYPE_LABEL, NEXT_STATUSES
  theme.ts       # CityCareColors

hooks/
  use-role.ts                 # Rôle utilisateur (Admin / Agent / Citizen)
  use-incident-filters.ts     # Filtres type + statut réutilisables
  use-color-scheme.ts

services/          # Appels API REST (auth, incidents, users)
storage/           # Tokens JWT (expo-secure-store)
types/             # Types TypeScript (incidents, auth, users)
```

---

## Variables d'environnement

Créer un fichier `.env` à la racine :

```env
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

---

## Build EAS

```bash
# Build preview (TestFlight / APK interne)
eas build --profile preview --platform ios

# Build production
eas build --profile production --platform all
```

---

## Licence

Projet académique — YNOV / ORT 2025-2026
