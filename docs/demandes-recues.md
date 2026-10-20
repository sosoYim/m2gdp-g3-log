# Demandes reçues (annonceur)

Route : `/host/requests` (connexion requise) — `public/src/app/pages/host-requests/`.

## Contenu

- Onglets **En attente / Acceptées / Refusées** avec le nombre de demandes.
- Onglet « En attente » : section **Traitées récemment** (3 dernières demandes acceptées ou refusées, par `updatedAt`).
- Message de chevauchement : si plusieurs demandes en attente portent sur la même annonce avec des dates qui se chevauchent (« Les demandes d'Alice et de Hugo… : une seule peut être acceptée »).
- « Voir la demande » / « Voir le détail » mènent pour l'instant à `/messages` (comme le tableau de bord), en attendant l'écran de détail d'une demande.

## Données

- `bookingRequests` filtrées par `ownerId` (`Booking.getRequestsForOwner`).
- Nom du demandeur : profil public `publicProfiles/{uid}` (`firstName`, `lastInitial` → « Alice M. »), lisible par tout utilisateur connecté. `users/{uid}` (avec l'e-mail) reste lisible par son propriétaire seulement.
  - Écrit par `Profile.saveProfile()` ; pour les comptes existants, créé au chargement de la navbar (`ensurePublicProfile`).
  - Sans profil public, la ligne affiche « Demandeur ».
- Données de test : `await seedHostData()` crée deux demandes en attente qui se chevauchent ; le demandeur est l'utilisateur connecté (son propre nom s'affiche). Les demandes refusées ne peuvent pas être créées par le seed (les règles n'autorisent que `status: 'pending'` à la création).
