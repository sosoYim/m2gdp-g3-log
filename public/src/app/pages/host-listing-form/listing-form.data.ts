import {
  ListingForm,
  PropertyType
} from '../../core/listing/listing';


/*
 * =========================================
 * ÉTAPES
 * =========================================
 */

export const LISTING_STEPS = [
  'Le logement',
  'Photos',
  'Équipements',
  'Dates et loyer',
  'Aperçu'
];


/*
 * Conseil affiché à droite pour chaque étape.
 * TODO : texte de l'étape 4 à confirmer (maquette non reçue).
 */
export const LISTING_TIPS = [
  'Un titre court et précis aide les étudiants à repérer votre logement plus rapidement.',
  'Privilégiez la lumière naturelle et montrez chaque pièce : chambre, cuisine, salle de bains.',
  'Les étudiants filtrent souvent par Wi-Fi et bureau : cochez tout ce qui est disponible.',
  'Un loyer charges comprises et des dates précises rassurent les étudiants.',
  ''
];


/*
 * Nombre de photos conseillé
 * (obligatoire pour publier).
 */
export const MIN_PHOTOS_TO_PUBLISH = 5;

export const MAX_PHOTOS = 10;


/*
 * =========================================
 * LIBELLÉS
 * =========================================
 */

/*
 * Icônes des options du logement
 * (liste « Ce que le logement propose »)
 */
const OPTION_ICONS_DIR = '/images/rental/equipment';


export const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: 'studio', label: 'Studio', icon: `${OPTION_ICONS_DIR}/i-studio.svg` },
  { value: 'apartment', label: 'Appartement', icon: `${OPTION_ICONS_DIR}/i-apartment.svg` },
  { value: 'room', label: 'Chambre', icon: `${OPTION_ICONS_DIR}/i-chambre.svg` }
];


export const FURNISHED_OPTION = {
  label: 'Meublé',
  icon: `${OPTION_ICONS_DIR}/i-meuble.svg`
};


export const AMENITIES: { value: string; label: string; icon: string }[] = [
  { value: 'wifi', label: 'Wi-Fi', icon: `${OPTION_ICONS_DIR}/i-wifi.svg` },
  { value: 'kitchen', label: 'Cuisine équipée', icon: `${OPTION_ICONS_DIR}/i-cuisine.svg` },
  { value: 'desk', label: 'Bureau dédié', icon: `${OPTION_ICONS_DIR}/i-bureau.svg` },
  { value: 'washer', label: 'Lave-linge', icon: `${OPTION_ICONS_DIR}/i-lave-linge.svg` },
  { value: 'dishwasher', label: 'Lave-vaisselle', icon: `${OPTION_ICONS_DIR}/i-lave-vaisselle.svg` },
  { value: 'elevator', label: 'Ascenseur', icon: `${OPTION_ICONS_DIR}/i-ascenseur.svg` },
  { value: 'balcony', label: 'Balcon', icon: `${OPTION_ICONS_DIR}/i-balcon.svg` },
  { value: 'parking', label: 'Parking', icon: `${OPTION_ICONS_DIR}/i-parking.svg` },
  { value: 'linen', label: 'Linge de maison fourni', icon: `${OPTION_ICONS_DIR}/i-linge_de_maison_fourni.svg` }
];


/*
 * Options affichées sur l'annonce :
 * type, meublé, puis équipements
 * (mêmes choix que le formulaire).
 */
export function getListingOptions(
  form: ListingForm
): { icon: string; label: string }[] {

  const type =
    PROPERTY_TYPES.find(t => t.value === form.propertyType);

  const amenities =
    form.amenities
      .map(value => AMENITIES.find(a => a.value === value))
      .filter(amenity => !!amenity);

  return [
    ...(type ? [type] : []),
    ...(form.furnished ? [FURNISHED_OPTION] : []),
    ...amenities
  ].map(({ icon, label }) => ({ icon, label }));

}


export function getAmenityLabel(
  value: string
): string {

  return AMENITIES.find(a => a.value === value)?.label ?? value;

}


/*
 * « 3ème étage », « 1er étage », « Rez-de-chaussée »
 */
export function getFloorLabel(
  floor: number | null
): string {

  if (floor === null || floor === undefined) {
    return '';
  }

  if (floor === 0) {
    return 'Rez-de-chaussée';
  }

  return floor === 1 ? '1er étage' : `${floor}ème étage`;

}


/*
 * « LYON, ARRONDISSEMENT 2 » (en minuscules ici,
 * la mise en forme se fait en CSS).
 */
export function getAreaLabel(
  arrondissement: number | null
): string {

  return arrondissement
    ? `Lyon, arrondissement ${arrondissement}`
    : 'Lyon';

}


/*
 * « Meublé · 22 m² · 1 pièce · 3ème étage »
 * withType : « Studio meublé · … »
 */
export function getSummaryLine(
  form: ListingForm,
  withType = false
): string {

  const furnished =
    form.furnished ? 'meublé' : 'non meublé';

  const type =
    PROPERTY_TYPES.find(t => t.value === form.propertyType)?.label ?? '';

  const parts = [
    withType
      ? `${type} ${furnished}`
      : furnished.charAt(0).toUpperCase() + furnished.slice(1)
  ];


  if (form.surface) {
    parts.push(`${form.surface} m²`);
  }

  if (form.rooms) {
    parts.push(`${form.rooms} ${form.rooms > 1 ? 'pièces' : 'pièce'}`);
  }

  if (form.floor !== null) {
    parts.push(getFloorLabel(form.floor));
  }


  return parts.join(' · ');

}


/*
 * « 1er mai 2026 » / « 1er nov. 2026 » (short)
 */
export function formatFrenchDate(
  dateString: string,
  short = false
): string {

  const [year, month, day] =
    (dateString ?? '').split('-').map(Number);


  if (!year || !month || !day) {
    return '';
  }


  const monthLabel =
    new Intl.DateTimeFormat(
      'fr-FR',
      { month: short ? 'short' : 'long' }
    ).format(new Date(year, month - 1, day));


  return `${day === 1 ? '1er' : day} ${monthLabel} ${year}`;

}
