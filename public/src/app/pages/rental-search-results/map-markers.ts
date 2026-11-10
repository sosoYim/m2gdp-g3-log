import * as L from 'leaflet';


/*
 * =========================================
 * MARQUEURS DE LA CARTE (RECHERCHE)
 * =========================================
 *
 * Les marqueurs trop proches à l'écran sont
 * regroupés en une pastille avec leur nombre.
 * Clic sur un logement : photo + infos.
 * Clic sur un groupe : liste pour choisir
 * (les positions sont approximatives, plusieurs
 * logements peuvent avoir exactement le même
 * point : zoomer ne suffit pas toujours).
 *
 * Contenu construit en DOM (textContent),
 * jamais en HTML brut.
 */

export interface MapListing {

  id: string;

  title: string;

  location: string;

  latitude: number;

  longitude: number;

  price: number;

  image: string;

}


/*
 * Distance (px) en dessous de laquelle
 * deux marqueurs se chevauchent
 */
const OVERLAP_PX = 34;


export function groupOverlapping<T extends MapListing>(
  map: L.Map,
  listings: T[]
): T[][] {

  const groups: { point: L.Point; items: T[] }[] = [];


  for (const listing of listings) {

    const point =
      map.latLngToLayerPoint([listing.latitude, listing.longitude]);

    const group =
      groups.find(candidate => candidate.point.distanceTo(point) < OVERLAP_PX);

    if (group) {
      group.items.push(listing);
    } else {
      groups.push({ point, items: [listing] });
    }

  }


  return groups.map(group => group.items);

}


/*
 * Centre d'un groupe (moyenne des points)
 */
export function getGroupCenter(
  listings: MapListing[]
): L.LatLng {

  const latitude =
    listings.reduce((sum, listing) => sum + listing.latitude, 0) / listings.length;

  const longitude =
    listings.reduce((sum, listing) => sum + listing.longitude, 0) / listings.length;

  return L.latLng(latitude, longitude);

}


/*
 * Tous au même point : zoomer ne
 * les séparera pas
 */
export function isSamePoint(
  listings: MapListing[]
): boolean {

  return listings.every(listing =>
    Math.abs(listing.latitude - listings[0].latitude) < 1e-6
    && Math.abs(listing.longitude - listings[0].longitude) < 1e-6
  );

}


/*
 * =========================================
 * ICÔNES
 * =========================================
 */

export function createListingIcon(): L.DivIcon {

  return L.divIcon({
    className: 'baillYon-map-marker',
    html: '<div class="baillYon-map-marker-dot"></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30]
  });

}


export function createGroupIcon(
  count: number
): L.DivIcon {

  return L.divIcon({
    className: 'baillYon-map-marker',
    html: `<div class="baillYon-map-group" aria-label="${count} logements">${count}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -18]
  });

}


/*
 * =========================================
 * POPUPS
 * =========================================
 */

export const POPUP_OPTIONS: L.PopupOptions = {
  minWidth: 220,
  maxWidth: 260,
  className: 'baillYon-map-popup',

  /*
   * Marge en haut : la popup ne cache
   * pas les boutons de zoom (mobile)
   */
  autoPanPaddingTopLeft: [16, 84],
  autoPanPaddingBottomRight: [16, 16]
};


/*
 * Un logement : photo, titre, quartier, prix.
 * Toute la carte mène au détail.
 */
export function createListingPopup(
  listing: MapListing,
  open: () => void
): HTMLElement {

  const card =
    element('button', 'map-popup-card');

  card.type = 'button';

  card.append(
    createImage(listing, 'map-popup-image'),
    createText(listing)
  );

  card.addEventListener('click', open);

  return card;

}


/*
 * Plusieurs logements : liste à choisir
 * (+ zoom si on peut les séparer)
 */
export function createGroupPopup(
  listings: MapListing[],
  open: (listing: MapListing) => void,
  zoom: (() => void) | null
): HTMLElement {

  const container =
    element('div', 'map-popup-group');


  const header =
    element('p', 'map-popup-group-title');

  header.textContent =
    `${listings.length} logements ici`;

  container.append(header);


  const list =
    element('div', 'map-popup-list');

  for (const listing of listings) {

    const row =
      element('button', 'map-popup-row');

    row.type = 'button';

    row.append(
      createImage(listing, 'map-popup-thumb'),
      createText(listing)
    );

    row.addEventListener('click', () => open(listing));

    list.append(row);

  }

  container.append(list);


  if (zoom) {

    const zoomButton =
      element('button', 'map-popup-zoom');

    zoomButton.type = 'button';

    zoomButton.textContent = 'Zoomer sur la zone';

    zoomButton.addEventListener('click', zoom);

    container.append(zoomButton);

  }


  return container;

}


function createImage(
  listing: MapListing,
  className: string
): HTMLElement {

  if (!listing.image) {

    /*
     * Logement sans photo
     */
    const placeholder =
      element('span', `${className} map-popup-no-image`);

    placeholder.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21H3Z"/></svg>';

    return placeholder;

  }


  const image =
    element('img', className) as HTMLImageElement;

  image.src = listing.image;

  image.alt = listing.title;

  image.loading = 'lazy';

  return image;

}


function createText(
  listing: MapListing
): HTMLElement {

  const text =
    element('span', 'map-popup-text');

  const title =
    element('strong', 'map-popup-title');

  title.textContent = listing.title;

  const location =
    element('span', 'map-popup-location');

  location.textContent = listing.location;

  const price =
    element('span', 'map-popup-price');

  price.textContent = `${listing.price} € / mois`;

  text.append(title, location, price);

  return text;

}


function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string
): HTMLElementTagNameMap[K] {

  const node =
    document.createElement(tag);

  node.className = className;

  return node;

}
