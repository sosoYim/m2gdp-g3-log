# Recherche de logements — filtres

Page : `/rental-search-results` (`public/src/app/pages/rental-search-results/`).

## Filtres

| Bouton | Choix (un seul) | Champ utilisé |
| --- | --- | --- |
| Budget | Moins de 500 € · 500 à 700 € · 700 à 900 € · Plus de 900 € | `price` |
| Surface | Moins de 15 m² · 15 à 25 m² · 25 à 40 m² · Plus de 40 m² | `surface` (sinon lu dans `details`, ex. « 22 m² ») |
| Disponibilités (durée du séjour) | 1 mois · 2 à 3 mois · 4 à 6 mois · Plus de 6 mois | `availableFrom` → `availableTo` assez long, et `minStayMonths` ≤ durée max |
| Plus de filtres | Type (Studio, Appartement, Chambre), Meublé, Équipements (plusieurs choix) | `propertyType`, `furnished`, `amenities` |

- Tranches : minimum inclus, maximum exclu (700 € est dans « 700 à 900 € »).
- Une annonce sans l'information (anciennes annonces) est exclue quand le filtre est actif.
- Chaque choix s'applique tout de suite ; un 2e clic sur le choix en cours le retire.
- Desktop : menu déroulant. Mobile (≤ 760 px) : panneau en bas de l'écran.
- Les filtres sont triés côté navigateur, sur les résultats des dates (pas de requête Firestore en plus).

## URL

Les filtres sont dans l'URL pour être conservés au retour de la fiche logement et lors d'une nouvelle recherche par dates :

`?arrival=…&departure=…&budget=500-700&surface=15-25&duree=2-3&type=studio,room&meuble=1&equipements=wifi,desk`

Code : `search-filters.ts` (choix, lecture/écriture de l'URL, correspondance) et `components/filter-bar/`.

## Carte des résultats

Code : `pages/rental-search-results/map-markers.ts` (styles globaux dans `src/styles.css`, section « CARTE DE RECHERCHE », car les popups Leaflet sont hors du composant).

- **Clic sur un marqueur** : popup avec la photo de l'annonce (icône si aucune photo), titre, quartier, prix ; toute la popup ouvre le détail.
- **Marqueurs superposés** (moins de 34 px à l'écran, recalculé à chaque zoom) : une pastille violette avec le nombre de logements. Clic → liste à choisir (miniature, titre, prix ; défilante au-delà de ~4). « Zoomer sur la zone » n'apparaît que si les logements peuvent être séparés en zoomant : les positions sont approximatives et plusieurs annonces peuvent avoir exactement le même point.
- La popup garde une marge en haut pour ne pas cacher les boutons de zoom sur mobile.
- Contenu des popups construit en DOM (`textContent`), jamais en HTML brut.
