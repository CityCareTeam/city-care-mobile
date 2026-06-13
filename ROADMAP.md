# CityCare+ — Roadmap features

> Ordre de priorité : Clustering → Notifications → Chat

---

## 1. 🗺️ Clustering serveur

> Remplace `react-native-map-clustering` (cassé en build) par le clustering backend.

**Durée estimée : 2 jours — Difficulté : 🟠 Moyenne**

**Aucun bloqueur.** ✅

> Endpoint : `GET /incidents/map-summary` — `[AllowAnonymous]`, pas de token requis

### Types
- [ ] Ajouter dans `types/incidents.ts`
  ```ts
  type MapClusterDto = {
    latitude: number;
    longitude: number;
    count: number;
    reported: number;
    in_progress: number;
    resolved: number;
  }
  type MapSummaryResponse = {
    data: MapClusterDto[];
    cell_size: number;
    total: number;
  }
  ```

### Service
- [ ] Ajouter `getMapSummary(params)` dans `services/incidents.ts`
  ```ts
  // Tous les paramètres sont optionnels
  getMapSummary(params?: {
    zoom?: number;
    latMin?: number; latMax?: number;
    lngMin?: number; lngMax?: number;
    status?: string;
    type?: string;
  }): Promise<MapSummaryResponse>
  // → GET /incidents/map-summary  (AllowAnonymous)
  ```
- [ ] Ajouter l'endpoint `mapSummary` dans `constants/api.ts`

### UI — `app/(tabs)/explore.tsx`
- [ ] Supprimer `react-native-map-clustering` et ses imports
- [ ] Tracker région courante via `onRegionChangeComplete` → extraire zoom + bounds
  - Zoom calculé depuis `latitudeDelta` : `zoom = Math.round(Math.log(360 / latitudeDelta) / Math.LN2)`
- [ ] Passer les bounds (`latMin/Max`, `lngMin/Max`) + zoom au service → clusters optimisés par viewport
- [ ] Debounce le re-fetch à 300 ms (changement de région)
- [ ] Remplacer `ClusterMarker` par marqueurs manuels (cercle coloré + compteur)
  - Couleur dominante : rouge si majority `reported`, orange si `in_progress`, vert si `resolved`
- [ ] Tap cluster → zoom in → re-fetch automatique
- [ ] Zoom ≥ 15 → basculer vers les incidents individuels (markers classiques)

### Tests
- [ ] Ajouter tests `services/incidents.test.ts` pour `getMapClusters`

### Finalisation
- [ ] Supprimer `react-native-map-clustering` de `package.json`
- [ ] Vérifier le build Android
- [ ] Mettre à jour `README.md` (retirer la lib de la stack)

---

## 2. 🔔 Préférences de notifications

> Écran de préférences dans le profil. Pas de push réel — uniquement les préférences stockées.

**Durée estimée : 1 jour — Difficulté : 🟢 Facile**

**Aucun bloqueur.**

### Types
- [ ] Créer `types/notifications.ts`
  ```ts
  type NotificationSettingsResponse = {
    email_enabled: boolean;
    push_enabled: boolean;
    followed_incident_types: string[]; // ["road", "waste", ...]
    updated_at: string;
  }
  type UpdateNotificationSettingsRequest = {
    email_enabled?: boolean;
    push_enabled?: boolean;
    followed_incident_types?: string[]; // remplace la liste entière
  }
  ```

### Service
- [ ] Créer `services/notifications.ts`
  - [ ] `getNotificationSettings(token)` → `GET /users/me/notification-settings`
  - [ ] `updateNotificationSettings(token, payload)` → `PATCH /users/me/notification-settings`
- [ ] Ajouter les endpoints dans `constants/api.ts`

### UI — `app/(tabs)/profile.tsx`
- [ ] Ajouter section "Notifications" (entre "Mon compte" et "Session")
- [ ] Toggle — Notifications email (on/off)
- [ ] Toggle — Notifications push (on/off)
- [ ] `GlassPillSelector` multi-choix — Types d'incidents suivis
  - Options : Voirie, Éclairage, Déchets, Graffiti, Sécurité, Autre
- [ ] Feedback Toast au save

### Tests
- [ ] `tests/unit/services/notifications.test.ts`
  - GET retourne les préférences
  - PATCH met à jour (email, push, types)
  - Gestion erreur réseau

---

## 3. 💬 Chat incident (SignalR)

> Fil de discussion en temps réel lié à un incident, intégré dans le bottom sheet détail.

**Durée estimée : 3 jours — Difficulté : 🔴 Élevée**

**Aucun bloqueur.** ✅

> Hub : `wss://<host>/hubs/incident-chat`
> Auth : token JWT en query string `?access_token=...` (WebSocket ne supporte pas les headers)
> Endpoints REST : `GET/POST /incidents/{id}/messages`

### Installation
- [ ] `npm install @microsoft/signalr`

### Types
- [ ] Créer `types/messages.ts`
  ```ts
  type MessageResponse = {
    id: string;
    incident_id: string;
    author_user_id: string;
    author_role: "admin" | "agent" | "citizen" | null;
    content: string;
    created_at: string; // ISO 8601, UTC+2
  }
  // POST body — content max 2000 caractères
  type CreateMessageRequest = { content: string }
  ```

### Service REST
- [ ] Créer `services/messages.ts`
  - [ ] `getMessages(incidentId, token)` → `GET /incidents/{id}/messages`
  - [ ] `sendMessage(incidentId, content, token)` → `POST /incidents/{id}/messages`
- [ ] Ajouter les endpoints dans `constants/api.ts`
  ```ts
  incidentMessages: (id: string) => `${API_BASE_URL}/incidents/${id}/messages`,
  incidentChatHub: `${API_BASE_URL}/hubs/incident-chat`,
  ```

### Hook temps réel
- [ ] Créer `hooks/use-incident-chat.ts`
  - [ ] Connexion SignalR avec `accessTokenFactory(() => token)`
  - [ ] Transport : `HttpTransportType.WebSockets`
  - [ ] `JoinIncident(incidentId)` après connexion établie
  - [ ] `LeaveIncident(incidentId)` + `.stop()` au cleanup (useEffect return)
  - [ ] Écoute `ReceiveMessage` → append au state sans doublon (dédoublonnage par `id`)
  - [ ] Chargement initial des messages REST au mount
  - [ ] Exposer : `messages`, `send(content)`, `connected`, `loading`

### UI — `app/(tabs)/explore.tsx` (bottom sheet détail)
- [ ] Ajouter section "Discussion" sous les infos incident
- [ ] Liste des messages
  - Bulle droite = message de l'utilisateur courant
  - Bulle gauche = message des autres
  - Afficher : nom auteur, badge rôle coloré (agent/admin), heure
- [ ] Input texte + bouton Envoyer
  - Désactivé si `!connected`
- [ ] Indicateur connexion WS (point vert / rouge)
- [ ] Scroll automatique au dernier message à la réception

### Tests
- [ ] `tests/unit/services/messages.test.ts`
  - GET messages, POST message, erreur réseau, 404 incident
- [ ] `tests/unit/hooks/use-incident-chat.test.ts`
  - Mock `@microsoft/signalr`
  - Join au mount, Leave au unmount
  - Réception `ReceiveMessage` → ajout au state
  - Pas de doublon si même message reçu deux fois

### Finalisation
- [ ] Mettre à jour `README.md` (nouveaux endpoints, `@microsoft/signalr` dans la stack)

---

## Dépendances

```
Clustering ──────────────────────────────────► débloque le build
    │
    └── Chat (explore.tsx modifié dans les deux)
            │
            └── attendre clustering mergé avant d'intégrer le chat dans explore.tsx

Notifs ──────────────────────────────────────► indépendant, faisable en parallèle
```

## Récap

| Feature | Durée | Difficulté | Bloqueur |
|---|---|---|---|
| Clustering serveur | 2 j | 🟠 Moyenne | Aucun ✅ |
| Préférences notifs | 1 j | 🟢 Facile | Aucun ✅ |
| Chat SignalR | 3 j | 🔴 Élevée | Aucun ✅ |
