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
| `messages/{messageId}` | `senderId`, `text`, `createdAt`, `attachment` (optionnel : `url`, `name`, `type`) |

## Fonctionnement

- Écoute temps réel des conversations où l'utilisateur est **demandeur** (`requesterId`) **et** **annonceur** (`ownerId`) : les deux parties voient les nouveaux messages sans recharger.
- Messages de l'utilisateur connecté à droite, ceux de l'interlocuteur à gauche, regroupés par jour (« Aujourd'hui », « Hier », date).
- Nom affiché : pour l'annonceur, profil public du demandeur (`publicProfiles`) ; pour le demandeur, `ownerName`.
- Non lu : dernier message envoyé par l'autre personne après `readBy/{moi}` → nom et aperçu en gras + pastille, compteur à côté du titre. Ouvrir la conversation la marque comme lue.
- Bandeau de la demande : statut (`bookingRequests`) et photo de l'annonce ; l'annonceur a un lien vers `/host/requests/:id`.
- Pièce jointe : bouton **+** à gauche du champ → photo (JPG/PNG/WebP, redimensionnée) ou PDF, 5 Mo max, envoyée tout de suite. Fichier stocké sur R2 via le Worker (`POST /api/media?folder=messages&conversationId=…`, clé `messages/{conversationId}/{uid}/…`), message avec `text` vide + `attachment`. Aperçu de la photo / carte PDF dans la conversation, ouverture dans un nouvel onglet. Composants `pages/messages/components/attach-button` et `message-attachment`.
  - **Accès réservé aux deux participants** : le Worker exige le jeton Firebase (upload et lecture) et vérifie la participation en lisant `conversations/{id}/requesterId` en REST avec ce jeton (les règles RTDB n'autorisent que `requesterId` / `ownerId`). Aucun secret côté Worker (`FIREBASE_DATABASE_URL` dans `wrangler.jsonc`).
  - Côté front, le fichier est téléchargé avec le jeton (`Media.fetchAttachment`) puis affiché via une URL `blob:` : un lien `/api/media/messages/…` copié ne s'ouvre pas sans être connecté avec un compte participant.
  - Règle RTDB : `attachment.url` doit contenir `/api/media/messages/{conversationId}/{auth.uid}/`.
- Mobile : liste des conversations, puis conversation en plein écran avec bouton retour.
- Menu latéral : `host-sidebar` pour un annonceur, `account-sidebar` pour un demandeur (rôle du profil).

Les demandes créées sans conversation (ex. `seedHostData()`) n'apparaissent pas dans la messagerie.
