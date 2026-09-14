# Architecture — LOG

## Règle d'or

> Le navigateur ne parle **jamais** directement à Firestore, RTDB, R2 ou D1.
> Il appelle uniquement **(a)** le SDK Firebase Auth pour la connexion et **(b)** notre Worker à `/api/*` avec un `Authorization: Bearer <Firebase ID token>`.
> Le Worker détient tous les secrets et effectue toutes les lectures/écritures.

## Diagramme

```mermaid
graph TD
    Browser["Navigateur (React PWA)"]

    subgraph Firebase
        AuthSDK["Firebase Auth SDK\n(sign-in magic link)"]
        Firestore["Firestore\n(users, listings, bookings, reviews)"]
        RTDB["Realtime Database\n(conversations, messages)"]
    end

    subgraph Cloudflare
        Worker["Worker /api/*\n(Hono — TypeScript)"]
        R2["R2\n(photos, documents)"]
        D1["D1 SQLite\n(sessions)"]
    end

    Browser -- "(a) SDK Auth only" --> AuthSDK
    Browser -- "(b) Bearer token → /api/*" --> Worker

    Worker --> Firestore
    Worker --> RTDB
    Worker --> R2
    Worker --> D1

    Browser -. "INTERDIT (direct)" -.->|X| Firestore
    Browser -. "INTERDIT (direct)" -.->|X| RTDB
    Browser -. "INTERDIT (direct)" -.->|X| R2
    Browser -. "INTERDIT (direct)" -.->|X| D1
```

## Flux d'authentification

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as Firebase Auth
    participant W as Worker
    participant F as Firestore
    participant D as D1

    B->>A: sendSignInLinkToEmail(email)
    A-->>B: (email envoyé)
    B->>A: signInWithEmailLink(email, link)
    A-->>B: ID token (JWT)
    B->>W: POST /api/auth/session<br/>Authorization: Bearer <idToken>
    W->>A: Vérification JWT (clés publiques Google)
    W->>F: GET/PUT users/{uid}
    W->>D: INSERT sessions(id, uid, expires_at)
    W-->>B: { sessionId, user }
    Note over B,W: Tous les appels suivants :<br/>Bearer <idToken> → /api/*
```
