# Demandes reçues (annonceur)

Route : `/host/requests` (connexion requise) — `public/src/app/pages/host-requests/`.

## Contenu

- Onglets **En attente / Acceptées / Refusées** avec le nombre de demandes.
- Onglet « En attente » : section **Traitées récemment** (3 dernières demandes acceptées ou refusées, par `updatedAt`).
- Message de chevauchement : si plusieurs demandes en attente portent sur la même annonce avec des dates qui se chevauchent (« Les demandes d'Alice et de Hugo… : une seule peut être acceptée »).
- « Voir la demande » / « Voir le détail » (et « Voir la demande » du tableau de bord) ouvrent le détail `/host/requests/:id`.

## Détail d'une demande — `/host/requests/:id`

Code : `public/src/app/pages/host-request-detail/` (outils de dates partagés : `pages/host-requests/request-utils.ts`).

- Demandeur (profil public), séjour (arrivée, départ, durée, loyer de l'annonce), message, annonce (lien « Voir l'annonce »).
- **Accepter** / **Refuser** ouvrent une modale (`components/answer-modal/`), puis `Booking.updateRequestStatus()` — uniquement une demande en attente.
  - Accepter : récapitulatif (annonce, dates, loyer) ; après confirmation, message automatique au demandeur dans la messagerie.
  - Refuser : motif obligatoire (`rejectionReason` : `dates_unavailable`, `already_booked`, `other`) et mot facultatif envoyé dans la messagerie. Sur mobile, la modale s'ouvre depuis le bas.
  - Le motif s'affiche dans la liste (« Traitées récemment », onglet « Refusées ») et sur le détail.
  - Si la conversation n'existe pas (anciennes demandes), la réponse est enregistrée sans message.
- Accepter est bloqué si une demande déjà acceptée sur la même annonce chevauche ces dates.
- « Répondre dans la messagerie » : `/messages?conversationId={id}` (la conversation a le même ID que la demande).
- Règle Firestore : l'annonceur (`ownerId`) peut passer une demande `pending` à `accepted` ou `rejected`, en ne modifiant que `status`, `updatedAt` et `rejectionReason` (seulement pour un refus).

## Données

- `bookingRequests` filtrées par `ownerId` (`Booking.getRequestsForOwner`).
- Nom du demandeur : profil public `publicProfiles/{uid}` (`firstName`, `lastInitial` → « Alice M. »), lisible par tout utilisateur connecté. `users/{uid}` (avec l'e-mail) reste lisible par son propriétaire seulement.
  - Écrit par `Profile.saveProfile()` ; pour les comptes existants, créé au chargement de la navbar (`ensurePublicProfile`).
  - Sans profil public, la ligne affiche « Demandeur ».
- Données de test : `await seedHostData()` crée deux demandes en attente qui se chevauchent ; le demandeur est l'utilisateur connecté (son propre nom s'affiche). Les demandes refusées ne peuvent pas être créées par le seed (les règles n'autorisent que `status: 'pending'` à la création).
