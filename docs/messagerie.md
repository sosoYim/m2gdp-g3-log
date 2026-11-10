# Messagerie

Route : `/messages` (option `?conversationId=` pour ouvrir une conversation) — `public/src/app/pages/messages/`, service `core/messaging/messaging.ts`.

## Données (Realtime Database)

`conversations/{id}` — même ID que la demande `bookingRequests/{id}`, créée par le demandeur à l'envoi de la demande.

| Champ | Rôle |
| --- | --- |
| `requesterId`, `ownerId` | les deux participants |
| `listingId`, `listingTitle`, `ownerName` | affichage |
| `lastMessage`, `lastMessageAt`, `lastSenderId` | aperçu dans la liste, non-lus |
| `readBy/{uid}` | dernière lecture de chaque participant |
| `messages/{messageId}` | `senderId`, `text`, `createdAt`, `attachment` (optionnel : `url`, `name`, `type`), `kind` (optionnel : `'system'`) |
| `pinnedFile` | bail épinglé (`url`, `name`, `type` = PDF), absent si aucun |

## Fonctionnement

- Écoute temps réel des conversations où l'utilisateur est **demandeur** (`requesterId`) **et** **annonceur** (`ownerId`) : les deux parties voient les nouveaux messages sans recharger.
- Messages de l'utilisateur connecté à droite, ceux de l'interlocuteur à gauche, regroupés par jour (« Aujourd'hui », « Hier », date).
- Nom affiché : pour l'annonceur, profil public du demandeur (`publicProfiles`) ; pour le demandeur, `ownerName`.
- Non lu : dernier message envoyé par l'autre personne après `readBy/{moi}` → nom et aperçu en gras + pastille, compteur à côté du titre. Ouvrir la conversation la marque comme lue.
- Carte de la demande (`components/request-card`) : photo, dates, statut ; actions sans quitter la messagerie :
  - **annonceur**, demande en attente : **Accepter / Refuser** (même modale que `/host/requests/:id`, `Booking.answerRequest`). Accepter est désactivé si les dates chevauchent un séjour déjà confirmé ;
  - **demandeur**, demande en attente : **Modifier les dates** (vérifie disponibilité, séjour minimum, dates déjà réservées) et **Annuler la demande** (statut `cancelled`) ;
  - acceptée : « Séjour confirmé ».
  - La carte est rechargée à chaque nouveau message de l'autre personne (statut à jour).
- Messages système (`kind: 'system'`) : affichés au centre en notification (dates modifiées, demande annulée, logement confirmé pour un autre séjour).
- Bail épinglé : sous chaque PDF, « Épingler comme bail » → `pinnedFile` ; une ligne compacte (34 px) sous la carte de la demande l'ouvre directement, ✕ pour le retirer. Un seul bail par conversation, épinglable par les deux participants.
- Pièce jointe : bouton **+** à gauche du champ → photo (JPG/PNG/WebP, redimensionnée) ou PDF, 5 Mo max, envoyée tout de suite. Fichier stocké sur R2 via le Worker (`POST /api/media?folder=messages&conversationId=…`, clé `messages/{conversationId}/{uid}/…`), message avec `text` vide + `attachment`. Aperçu de la photo / carte PDF dans la conversation, ouverture dans un nouvel onglet. Composants `pages/messages/components/attach-button` et `message-attachment`.
  - **Accès réservé aux deux participants** : le Worker exige le jeton Firebase (upload et lecture) et vérifie la participation en lisant `conversations/{id}/requesterId` en REST avec ce jeton (les règles RTDB n'autorisent que `requesterId` / `ownerId`). Aucun secret côté Worker (`FIREBASE_DATABASE_URL` dans `wrangler.jsonc`).
  - Côté front, le fichier est téléchargé avec le jeton (`Media.fetchAttachment`) puis affiché via une URL `blob:` : un lien `/api/media/messages/…` copié ne s'ouvre pas sans être connecté avec un compte participant.
  - Règle RTDB : `attachment.url` doit contenir `/api/media/messages/{conversationId}/{auth.uid}/`.
- Mobile : liste des conversations, puis conversation en plein écran avec bouton retour.
- Menu latéral : `host-sidebar` pour un annonceur, `account-sidebar` pour un demandeur (rôle du profil).

Les demandes créées sans conversation (ex. `seedHostData()`) n'apparaissent pas dans la messagerie.


## Séjour confirmé (dates bloquées)

Accepter une demande (`Booking.answerRequest`, depuis la messagerie ou `/host/requests/:id`) :

1. statut `accepted` + message « Bonne nouvelle… » au demandeur ;
2. ajout de `{ requestId, from, to }` dans `listings/{id}.bookedPeriods` (public) : seules ces dates sont bloquées, le reste de la disponibilité reste réservable ;
3. les autres demandes **en attente** de la même annonce dont les dates chevauchent sont refusées (`already_booked`) et reçoivent une notification système dans leur conversation.

Les dates bloquées sont refusées sur la fiche logement (« Déjà réservé du … au … » + erreur au clic), dans `/booking-request` et à la modification des dates ; la recherche par dates exclut les annonces dont un séjour confirmé chevauche les dates cherchées.

Règles Firestore : le demandeur peut modifier `arrivalDate` / `departureDate` ou passer le statut à `cancelled`, uniquement si la demande est `pending`. La vérification des dates bloquées à la création d'une demande est faite côté client (prototype).
