# CityCare+ — Roadmap 1.6.0

> Ordre de priorité : OTA → Pagination → Hors-ligne

La 1.5 a livré les trois features de la roadmap précédente — clustering serveur
(`hooks/use-map-clusters.ts`), préférences de notifications
(`hooks/use-notification-settings.ts`) et chat SignalR
(`hooks/use-incident-chat.ts`). L'API back est désormais consommée à quelques
endpoints près : ce qui reste à gagner est du côté de la **livraison** et de la
**tenue sur le terrain**, pas des fonctionnalités manquantes.

---

## 1. 📦 Mises à jour OTA (`expo-updates`) — ✅ livré

> La chaîne de release s'arrêtait à l'APK : chaque correctif obligeait à
> réinstaller à la main. Une beta se pousse désormais en 30 s sur les appareils
> déjà installés.

**Durée estimée : 1 jour — Difficulté : 🟠 Moyenne**

> Limite à connaître : l'OTA ne remplace que le bundle JS. Toute nouvelle
> dépendance native continue d'exiger un build EAS complet.

### Fait
- [x] `expo-updates` installé, bloc `updates` dans `app.config.ts`
- [x] `runtimeVersion` posée à la main (`constants/native-runtime.json`), ni
      `appVersion` ni `fingerprint` :
  - `appVersion` — semantic-release incrémente la version à chaque release, ce
    qui aurait rendu chaque APK incompatible avec ses propres mises à jour dès
    le patch suivant ;
  - `fingerprint` — essayé, **build EAS en échec** : l'empreinte inclut la
    config Expo résolue, clé Google Maps comprise. Vide en local, injectée par
    le secret pendant le build → deux empreintes pour le même code, et un
    « Runtime version mismatch ». Aucun réglage de `@expo/fingerprint` ne
    permet d'exclure une seule clé de la config.
- [x] Contrepartie assumée : la valeur est à incrémenter **à la main** dès qu'on
      touche au natif. `tests/unit/native-runtime.test.ts` compare la liste des
      dépendances natives recensées à celles réellement installées et échoue si
      elles divergent — l'oubli se voit au test, pas sur les téléphones
- [x] Un `channel` par profil dans `eas.json` : `dev-local` → `beta`,
      `preview` → `rc`, `production` → `production`
- [x] `npm run update:beta` / `update:prod` (`scripts/publish-update.mjs`) —
      message repris du dernier commit, `EXPO_PUBLIC_*` du profil réinjectés à
      la publication : ils sont inlinés dans le bundle, publier depuis le mauvais
      environnement enverrait les appareils sur le mauvais back
- [x] Bannière « Mise à jour prête » (`components/ui/UpdateBanner.tsx`),
      proposée et refusable — le bundle s'applique de toute façon au lancement
      suivant
- [x] Identifiant du bundle en troisième segment de la pastille de version,
      seulement quand du JS a remplacé celui livré avec l'APK
- [x] Tests : `use-app-update`, `update-banner`, `app-version`

### Reste à trancher
- [ ] `.github/workflows/ci-cd.yml` : un push sur `main` qui ne touche que du JS
      publie un update au lieu de lancer un build APK (~15 min économisées par
      correctif). C'est un changement de comportement du CI, pas une option —
      **décision à prendre avant de l'implémenter**
- [ ] Le premier `eas update` doit suivre un build portant déjà le `channel` :
      c'est lui qui crée le canal côté EAS

---

## 2. 📃 Pagination serveur du fil — ✅ livré

> Le fil plafonnait à 50 incidents : au 51ᵉ, les plus anciens devenaient
> inatteignables.

**Durée estimée : 1 jour — Difficulté : 🟢 Facile**

> `services/incidents.ts:78` accepte déjà `page` / `pageSize`, et
> `IncidentListResponse` expose `pagination.total_pages`. Le back plafonne
> `pageSize` à 100 (`IncidentsController.cs:184`). Tout est là côté données —
> c'est l'écran qui ne demande jamais la page 2.

### Constat
- `app/(tabs)/index.tsx:547` charge un paquet fixe de 50 (`INCIDENTS_PAGE_SIZE.load`)
- Le bouton « Afficher 10 de plus » (`index.tsx:176`) ne fait que découper ce
  paquet côté client — il ne rappelle jamais l'API

### UI — `app/(tabs)/index.tsx`
- [x] Pagination extraite dans `hooks/use-incidents-paging.ts` : accumulation
      des pages, `hasMore` depuis `pagination.total_pages`, garde par référence
      contre le double appel
- [x] Le bouton « Afficher N de plus » conduit deux gestes derrière une seule
      apparence — dérouler ce qui est en mémoire, puis aller chercher la page
      suivante (« Charger la suite »)
- [x] `RefreshControl` : le tiré-pour-rafraîchir repart à la page 1 et referme
      les pages ouvertes
- [x] Rafraîchissement silencieux sur la **première page uniquement**, fondu
      dans la liste par `mergeFreshHead` — les pages ouvertes ne se replient pas
      sous les doigts
- [x] `totalCount` remplace `incidents.length` là où l'écran annonçait un total
      (vue Admin, badge « Communauté ») — il annonçait 50 quoi qu'il arrive
- [x] Un filtre sans résultat propose de charger la suite plutôt que de conclure
      sur les seules pages ouvertes

> **Écart assumé au plan initial : pas de `FlatList`.** L'écran n'est pas une
> liste mais un tableau de bord — compteurs, pastilles de filtre, deux onglets,
> trois vues par rôle. Tout pousser dans un `ListHeaderComponent` aurait été un
> gros refactor sur un écran sans tests d'écran, pour un gain nul : le bouton
> « afficher plus » existait déjà et exprime la même intention que le défilement
> infini. `onEndReached` reste possible le jour où l'écran sera testé.

### Reste à faire
- [ ] Les compteurs de statut portent toujours sur les pages chargées, pas sur
      le jeu complet. `GET /incidents/map-summary` renvoie déjà les totaux par
      statut (`reported`, `in_progress`, `resolved`) sans bornes : une requête
      de plus rendrait le tableau de bord exact
- [ ] Les filtres restent appliqués côté client, alors que le back accepte
      `status` et `type` : filtrer côté serveur éviterait de dérouler des pages
      pour trouver trois incidents d'un type rare

### Tests
- [x] `tests/unit/hooks/use-incidents-paging.test.ts` — pages successives, arrêt
      à la dernière, double appel, échec réseau, fusion de tête, remise à zéro
- [x] `tests/unit/utils/incident-list.test.ts` — déduplication et fusion
- [x] `tests/unit/services/incidents.test.ts` — `page` transmis en query string
      (déjà couvert)

---

## 3. 📴 Tenue hors-ligne — ✅ livré

> Réseau coupé = écran vide, et un signalement à moitié rempli était perdu si
> l'app était tuée. C'est le point qui coûte le plus cher à un utilisateur de
> terrain — celui qui est dehors, avec une photo déjà prise et deux barres de
> réseau.

**Durée estimée : 2 à 3 jours — Difficulté : 🔴 Élevée**

> `@react-native-async-storage/async-storage` pour les données ; SecureStore
> reste réservé aux jetons (`storage/tokens.ts`), il n'est pas fait pour du
> volume. Toutes les lectures/écritures passent par `storage/local-store.ts`,
> qui avale ses erreurs : un disque plein ne doit jamais faire tomber un écran.

### 3.1 — Brouillon de signalement — ✅
- [x] `storage/report-draft.ts` — `saveDraft`, `loadDraft`, `clearDraft`,
      `isWorthSaving` (un formulaire vierge n'est pas un brouillon)
- [x] `app/report.tsx` persiste à chaque changement, écriture différée de 500 ms
- [x] Restauration au montage avec une barre « Brouillon repris » et un
      « Effacer ». La géolocalisation ne reprend pas la main sur un brouillon
      restauré — elle écraserait l'adresse de l'incident par celle d'ici
- [x] Brouillon effacé dès l'envoi réussi, et péremption à 3 jours
- ⚠️ Les photos ne sont pas recopiées : seules leurs URI sont retenues, et le
      système peut vider le cache d'`expo-image-picker`. Les copier demanderait
      `expo-file-system` — une dépendance de plus pour un cas de bord

### 3.2 — Cache de lecture — ✅
- [x] `storage/incidents-cache.ts` — première page + total + horodatage,
      péremption à 24 h
- [x] `app/(tabs)/index.tsx` amorce la liste avec le cache ; `seed()` est sans
      effet dès qu'une réponse du serveur est arrivée
- [x] `ErrorNotice` dit l'âge des données (« Dernières données connues, il y a
      2 h »)
- [x] Seul le fil public est mis en cache — « Mes signalements » est rattaché à
      un compte, le stockage local ne l'est pas
- [ ] `explore.tsx` n'est pas encore couvert : la carte reste vide hors ligne

### 3.3 — File d'envoi — ✅
- [x] `storage/pending-reports.ts` — file, tentatives, refusés
- [x] `hooks/use-pending-reports.ts` — rejeu séquentiel, déclenché après un
      chargement réussi du fil : une requête qui aboutit est un signal plus
      fiable qu'un indicateur de connexion, qui dit « connecté » sur un portail
      captif comme sur une vraie liaison
- [x] Bandeau « N signalements en attente d'envoi » sur l'accueil
- [x] Échec définitif tranché : requête jamais partie → on garde et on compte
      (abandon à 5) ; serveur qui répond et refuse → sortie de file et remontée
      à l'utilisateur, qui l'acquitte

### Tests — ✅
- [x] `storage/report-draft`, `incidents-cache`, `pending-reports`
- [x] `hooks/use-pending-reports` — rejeu, photo perdue, échec réseau, refus
      serveur, session absente, double rejeu
- [x] `services/api-client` — `isNetworkError`, le discriminant dont tout le
      reste dépend

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

| Feature | Durée | Difficulté | État |
|---|---|---|---|
| Mises à jour OTA | 1 j | 🟠 Moyenne | ✅ livré (reste la décision CI) |
| Pagination serveur | 1 j | 🟢 Facile | ✅ livré |
| Tenue hors-ligne | 2–3 j | 🔴 Élevée | ✅ livré (hors carte) |
| *Partage & deep-link* | *1 j* | *🟢 Facile* | *page web de repli* |
| *Accessibilité* | *1–2 j* | *🟢 Facile* | *Aucun* ✅ |
| *Tests d'écrans* | *2 j* | *🟠 Moyenne* | *Aucun* ✅ |
