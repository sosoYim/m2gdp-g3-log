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

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'studio', label: 'Studio' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'room', label: 'Chambre' }
];


export const AMENITIES: { value: string; label: string }[] = [
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'kitchen', label: 'Cuisine équipée' },
  { value: 'desk', label: 'Bureau dédié' },
  { value: 'washer', label: 'Lave-linge' },
  { value: 'dishwasher', label: 'Lave-vaisselle' },
  { value: 'elevator', label: 'Ascenseur' },
  { value: 'balcony', label: 'Balcon' },
  { value: 'parking', label: 'Parking' },
  { value: 'linen', label: 'Linge de maison fourni' }
];


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
