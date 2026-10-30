# Déposer une annonce (parcours annonceur)

## Routes

| Route | Page |
| --- | --- |
| `/host/listings/new` | Formulaire en 5 étapes (nouvelle annonce) |
| `/host/listings/edit?id=…&step=1..5` | Même formulaire pour un brouillon ou une annonce existante |
| `/host/listings/published?id=…` | Confirmation « Votre annonce est en ligne ! » |

Code : `public/src/app/pages/host-listing-form/` (page, `steps/`, `components/`) et `pages/host-listing-published/`.

## Étapes

1. **Le logement** : titre, type, adresse (Google Places), complément d'adresse, surface, pièces, étage, meublé, description
2. **Photos** : envoi vers Cloudflare R2, ordre par glisser-déposer (1re photo = photo principale)
3. **Équipements** : équipements, règles du logement, accord du propriétaire
4. **Dates et loyer** : disponibilités, séjour minimum, loyer, charges comprises — *mise en page provisoire, maquette à recevoir*
5. **Aperçu** : annonce telle que les étudiants la verront, puis publication

## Enregistrement

- Le brouillon (`status: 'draft'`) est enregistré dans `listings` à chaque changement d'étape et avec « Enregistrer le brouillon ».
- À la première sauvegarde, l'URL devient `/host/listings/edit?id=…` (sans rechargement).
- `Listing.saveListingForm()` remplit aussi les champs utilisés par les autres pages : `location` (« Lyon 2e »), `details`, `image` (1re photo), `latitude` / `longitude` (position approximative, ou centre de l'arrondissement si l'adresse n'est pas géocodée).
- L'arrondissement est déduit automatiquement du code postal de l'adresse (69001 à 69009), sans champ dans le formulaire.

## Adresse (Google Maps)

- Saisie avec les suggestions Google Places (limitées à Lyon), puis petite carte avec marqueur.
- Avec une clé Google, il faut choisir une adresse dans la liste pour continuer.
- Sans clé (`googleMapsApiKey` vide), le champ reste une saisie libre.

| Où | Champs | Lecture |
| --- | --- | --- |
| `listings/{id}` | `postalCode`, `arrondissement`, `location` (« Lyon 2e »), `latitude` / `longitude` **approximatives** (décalage fixe de 100 à 300 m) | tout le monde |
| `listings/{id}/private/address` | `address`, `addressDetails`, `placeId`, `postalCode`, `latitude` / `longitude` exactes | l'annonceur seulement |

- Les anciennes annonces qui ont encore `address` dans le document public sont nettoyées au prochain enregistrement.
- Migration des annonces existantes (dev) : connecté en annonceur, dans la console du navigateur `await migrateListingAddress()`. Ajoute `postalCode` (`''` si inconnu) et `arrondissement` au document public, crée l'adresse privée (`addressDetails` / `placeId` vides) et retire l'adresse du document public. Uniquement les annonces de l'utilisateur connecté (règles Firestore) ; à lancer après le déploiement des règles.
- Suppression d'une annonce : l'adresse privée est supprimée d'abord.

### Clé Google Maps

1. Google Cloud Console, projet `m2gdp-g3-log-3963b` : activer **Maps JavaScript API** et **Places API (New)** (compte de facturation requis).
2. Identifiants → Créer une clé API → restrictions :
   - Sites web : `http://localhost:4200/*`, `http://127.0.0.1:4200/*`, `https://m2gdp-g3-log-3963b.web.app/*`, `https://m2gdp-g3-log-3963b.firebaseapp.com/*`
   - API : Maps JavaScript API, Places API (New)
3. Mettre la clé dans `googleMapsApiKey` de `public/src/environments/environment.ts` (fichier non versionné, ne jamais committer).
4. Optionnel : un Map ID (Google Maps Platform → Map management) dans `googleMapsMapId`. Vide = `DEMO_MAP_ID`.

## Validation

- Continuer : titre + adresse + surface (1), au moins 1 photo (2), réponse sur l'accord du propriétaire (3), loyer + dates (4).
- Publier : en plus, 5 photos minimum et accord du propriétaire différent de « Non ».
- « Enregistrer le brouillon » ne demande aucun champ.

## Photos — API Worker (Cloudflare)

| Méthode | Route | Accès |
| --- | --- | --- |
| `POST` | `/api/media` | Connecté (`Authorization: Bearer <idToken Firebase>`), corps = image JPG/PNG/WebP, 5 Mo max |
| `GET` | `/api/media/{key}` | Public |
| `DELETE` | `/api/media/{key}` | Propriétaire uniquement (clé `listings/{uid}/…`) |

- Le Worker vérifie le jeton Firebase avec les clés publiques Google (`FIREBASE_PROJECT_ID` dans `workers/wrangler.jsonc`).
- Origines autorisées (CORS) : `ALLOWED_ORIGINS` dans `workers/wrangler.jsonc`.
- Le front réduit les photos (1920 px max, JPEG) avant l'envoi.
- URL de l'API côté front : `apiUrl` dans `public/src/environments/environment.ts`.

### En local

```bash
npm run dev:back   # Worker sur http://127.0.0.1:8787 (R2 simulé en local)
npm run dev:front
```

En local, les photos sont stockées dans le R2 simulé par Wrangler : leurs URL (`127.0.0.1:8787`) ne sont visibles que sur la machine qui les a envoyées.

### En production (à faire)

1. `npx wrangler deploy --config workers/wrangler.jsonc`
2. Mettre l'URL du Worker déployé dans `apiUrl` pour le build de production.

## Règles Firestore

`listings` : création uniquement avec `ownerId == uid` ; modification et suppression par le propriétaire uniquement, sans changer `ownerId`.

`listings/{id}/private/{doc}` : lecture et écriture par le propriétaire de l'annonce uniquement.
