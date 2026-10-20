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
| `messages/{messageId}` | `senderId`, `text`, `createdAt` |

## Fonctionnement

- Écoute temps réel des conversations où l'utilisateur est **demandeur** (`requesterId`) **et** **annonceur** (`ownerId`) : les deux parties voient les nouveaux messages sans recharger.
- Messages de l'utilisateur connecté à droite, ceux de l'interlocuteur à gauche, regroupés par jour (« Aujourd'hui », « Hier », date).
- Nom affiché : pour l'annonceur, profil public du demandeur (`publicProfiles`) ; pour le demandeur, `ownerName`.
- Non lu : dernier message envoyé par l'autre personne après `readBy/{moi}` → nom et aperçu en gras + pastille, compteur à côté du titre. Ouvrir la conversation la marque comme lue.
- Bandeau de la demande : statut (`bookingRequests`) et photo de l'annonce ; l'annonceur a un lien vers `/host/requests/:id`.
- Mobile : liste des conversations, puis conversation en plein écran avec bouton retour.
- Menu latéral : `host-sidebar` pour un annonceur, `account-sidebar` pour un demandeur (rôle du profil).

Les demandes créées sans conversation (ex. `seedHostData()`) n'apparaissent pas dans la messagerie.
