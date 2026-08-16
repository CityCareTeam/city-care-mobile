# CityCare+ — Roadmap 1.6.0

> Ordre de priorité : OTA → Pagination → Hors-ligne

La 1.5 a livré les trois features de la roadmap précédente — clustering serveur
(`hooks/use-map-clusters.ts`), préférences de notifications
(`hooks/use-notification-settings.ts`) et chat SignalR
(`hooks/use-incident-chat.ts`). L'API back est désormais consommée à quelques
endpoints près : ce qui reste à gagner est du côté de la **livraison** et de la
**tenue sur le terrain**, pas des fonctionnalités manquantes.

---

## 1. 📦 Mises à jour OTA (`expo-updates`)

> La chaîne de release est soignée jusqu'à l'APK, puis s'arrête : chaque
> correctif oblige à réinstaller à la main. Avec l'OTA, une beta se pousse en
> 30 s sur les appareils déjà installés.

**Durée estimée : 1 jour — Difficulté : 🟠 Moyenne**

**Aucun bloqueur.** ✅

> Limite à connaître : l'OTA ne remplace que le bundle JS. Toute nouvelle
> dépendance native continue d'exiger un build EAS complet.

### Installation
- [ ] `npx expo install expo-updates`
- [ ] `eas update:configure`

### Configuration — `app.config.ts`
- [ ] Ajouter le bloc `updates` (`url: https://u.expo.dev/<projectId>`)
- [ ] `runtimeVersion: { policy: "fingerprint" }`
  - **Pas `appVersion`** : semantic-release bumpe la version à chaque release,
    ce qui casserait la compatibilité OTA à chaque patch. Le fingerprint ne
    change que si le natif change — exactement la règle qu'on veut.

### Configuration — `eas.json`
- [ ] Ajouter un `channel` par profil : `dev-local` → `beta`,
      `preview` → `rc`, `production` → `production`
- [ ] Vérifier que les `EXPO_PUBLIC_*` du profil sont bien repris à la
      publication : ils sont inlinés dans le bundle, un `eas update` publié avec
      la mauvaise `EXPO_PUBLIC_API_URL` enverrait les appareils sur le mauvais
      back

### Scripts & CI
- [ ] `npm run update:beta` → `eas update --branch beta --message "<sujet du commit>"`
- [ ] Décider dans `.github/workflows/ci-cd.yml` : un push sur `main` qui ne
      touche que du JS publie un update au lieu de lancer un build APK
      (~15 min économisées par correctif)

### UI
- [ ] Indiquer qu'un update est en cours d'application au démarrage
      (`useUpdates()` → bandeau discret, pas de blocage)
- [ ] Afficher l'`updateId` court dans `components/ui/AppVersion.tsx`, à côté du
      rang de build — c'est ce qui permet de savoir quel JS tourne vraiment sur
      un appareil de test

### Tests
- [ ] `tests/unit/components/app-version.test.tsx` — l'`updateId` s'affiche
      quand il diffère du build embarqué, reste absent sinon

---

## 2. 📃 Pagination serveur du fil

> Le fil plafonne à 50 incidents : au 51ᵉ, les plus anciens deviennent
> inatteignables.

**Durée estimée : 1 jour — Difficulté : 🟢 Facile**

**Aucun bloqueur.** ✅

> `services/incidents.ts:78` accepte déjà `page` / `pageSize`, et
> `IncidentListResponse` expose `pagination.total_pages`. Le back plafonne
> `pageSize` à 100 (`IncidentsController.cs:184`). Tout est là côté données —
> c'est l'écran qui ne demande jamais la page 2.

### Constat
- `app/(tabs)/index.tsx:547` charge un paquet fixe de 50 (`INCIDENTS_PAGE_SIZE.load`)
- Le bouton « Afficher 10 de plus » (`index.tsx:176`) ne fait que découper ce
  paquet côté client — il ne rappelle jamais l'API

### UI — `app/(tabs)/index.tsx`
- [ ] Passer la liste de `ScrollView` à `FlatList` + `ListHeaderComponent`
      (l'en-tête et la section « Mes signalements » deviennent le header)
- [ ] État `page` + accumulation des résultats, `onEndReached` (seuil 0.5)
- [ ] Arrêter quand `page >= pagination.total_pages` — ne pas se fier à une
      page vide
- [ ] Garder `RefreshControl` : un pull-to-refresh repart à la page 1 et
      remplace la liste (ne pas concaténer)
- [ ] Conserver le rafraîchissement silencieux de `useAutoRefresh` sur la
      **première page uniquement** — repolluer les pages suivantes toutes les
      15 s ferait sauter la position de lecture
- [ ] Réconcilier avec les filtres (`hooks/use-incident-filters.ts`) : tout
      changement de filtre remet `page` à 1

### Nettoyage
- [ ] `INCIDENTS_PAGE_SIZE.load` (50) disparaît, `list` (10) devient la taille
      de page réelle — `constants/config.ts:23`

### Tests
- [ ] `tests/unit/services/incidents.test.ts` — `page` est bien transmis en
      query string
- [ ] Test d'écran (nouveau) — `onEndReached` déclenche la page 2, et plus rien
      une fois `total_pages` atteint

---

## 3. 📴 Tenue hors-ligne

> Réseau coupé = écran vide, et un signalement à moitié rempli est perdu si
> l'app est tuée. C'est le point qui coûte le plus cher à un utilisateur de
> terrain — celui qui est dehors, avec une photo déjà prise et deux barres de
> réseau.

**Durée estimée : 2 à 3 jours — Difficulté : 🔴 Élevée**

**Aucun bloqueur.** ✅

> Aujourd'hui `storage/` ne contient que `tokens.ts` (SecureStore, réservé aux
> jetons). Il n'y a aucun stockage local pour les données.

### Installation
- [ ] `npx expo install @react-native-async-storage/async-storage`
      (SecureStore reste pour les jetons, il n'est pas fait pour du volume)

### 3.1 — Brouillon de signalement (le plus rentable)
- [ ] Créer `storage/report-draft.ts` — `save()`, `load()`, `clear()`
- [ ] `app/report.tsx` : persister le formulaire à chaque changement (debounce
      500 ms), y compris les URI de photos locales
- [ ] Restaurer au montage si un brouillon existe, avec un moyen explicite de
      le jeter
- [ ] Effacer le brouillon dès que l'envoi a réussi

### 3.2 — Cache de lecture
- [ ] Créer `storage/incidents-cache.ts` — dernière page 1 connue + horodatage
- [ ] `app/(tabs)/index.tsx` et `explore.tsx` : afficher le cache pendant le
      chargement au lieu de l'écran vide
- [ ] Réutiliser `ErrorNotice` pour dire que les données sont datées — le fil
      lui passe déjà « Les signalements affichés peuvent être obsolètes »
      (`index.tsx:609`), il suffit d'y ajouter la date du cache

### 3.3 — File d'envoi
- [ ] Créer `storage/pending-reports.ts` — file des signalements créés hors ligne
- [ ] Rejouer à la reconnexion, en s'appuyant sur le mécanisme de reprise déjà
      présent dans `hooks/use-auto-refresh.ts`
- [ ] Marquer visuellement un signalement « en attente d'envoi » dans « Mes
      signalements »
- [ ] Décider du comportement en cas d'échec définitif (409, incident refusé) :
      ne pas boucler indéfiniment, remonter l'erreur à l'utilisateur

### Tests
- [ ] `tests/unit/storage/report-draft.test.ts` — sauvegarde, restauration,
      effacement après succès
- [ ] `tests/unit/storage/pending-reports.test.ts` — mise en file, rejeu,
      abandon après échec définitif
- [ ] `tests/unit/storage/incidents-cache.test.ts` — lecture/écriture, données
      périmées

---

## Après la 1.6.0

### 🔗 Partage & deep-link d'un incident — 1 j, 🟢 Facile
`expo-linking` est installé et le scheme `citycaremobile` déclaré
(`app.config.ts:114`), mais rien ne s'en sert. La navigation interne vers un
incident existe déjà (`index.tsx:571` → `explore.tsx:199`, via `selectId`) : un
deep-link n'aurait qu'à retomber au même endroit.

Côté back, `GET /incidents/{id}/preview` est écrit, `AllowAnonymous`, renvoie
l'adresse résolue — et n'est appelé nulle part, pas même déclaré dans
`constants/api.ts`. C'est la charge utile d'un lien partagé : de quoi écrire un
message qui dit où se trouve l'incident, plutôt qu'une URL nue.

**Réserve :** sans page web de repli, un lien reçu par quelqu'un qui n'a pas
l'app ne fait rien. Utile entre utilisateurs équipés (agents, habitants du
quartier), faible en diffusion. **Si on ne le fait pas, supprimer `preview`
côté back** — un endpoint mort est une dette.

### ♿ Accessibilité — 1 à 2 j, 🟢 Facile
7 fichiers sur ~30 portent un `accessibilityLabel`. Rien sur `Button.tsx`,
`Input.tsx`, `incident-row.tsx`, ni sur le parcours de signalement. Labels,
rôles, zones tactiles ≥ 44 pt, contrastes. Travail sûr, sans risque de
régression, et défendable pour une app de service public.

### 🧪 Tests d'écrans — 2 j, 🟠 Moyenne
La suite couvre hooks, services et composants `ui/`, mais aucun écran.
`app/report.tsx` (412 lignes) est le parcours critique et n'a pas un seul test.
Prérequis implicite des points 2 et 3 ci-dessus.

### 🐞 Remontée de crashs (Sentry) — 0,5 j, 🟢 Facile
Une beta est distribuée sans aucun retour sur les plantages terrain. À
considérer si l'app sort du cercle des testeurs connus.

---

## Dépendances

```
OTA ─────────────────────────────────► indépendant, à faire en premier
                                        (les suivants se livrent alors sans rebuild)

Pagination ──┐
             ├── touchent tous deux app/(tabs)/index.tsx
Hors-ligne ──┘   → faire la pagination d'abord (FlatList),
                   le cache se branche ensuite sur la liste paginée

Partage ─────────────────────────────► indépendant
```

## Récap

| Feature | Durée | Difficulté | Bloqueur |
|---|---|---|---|
| Mises à jour OTA | 1 j | 🟠 Moyenne | Aucun ✅ |
| Pagination serveur | 1 j | 🟢 Facile | Aucun ✅ |
| Tenue hors-ligne | 2–3 j | 🔴 Élevée | Aucun ✅ |
| *Partage & deep-link* | *1 j* | *🟢 Facile* | *page web de repli* |
| *Accessibilité* | *1–2 j* | *🟢 Facile* | *Aucun* ✅ |
| *Tests d'écrans* | *2 j* | *🟠 Moyenne* | *Aucun* ✅ |
