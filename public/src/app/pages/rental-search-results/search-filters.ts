import { ParamMap, Params } from '@angular/router';

import {
  ListingDocument,
  PropertyType
} from '../../core/listing/listing';


/*
 * =========================================
 * FILTRES DE RECHERCHE
 * =========================================
 *
 * Gardés dans l'URL (?budget=500-700&surface=…)
 * pour être conservés au retour de la fiche
 * logement et partageables.
 */

export interface SearchFilters {

  budget: string;

  surface: string;

  duration: string;

  types: PropertyType[];

  furnished: boolean;

  amenities: string[];

}


/*
 * Tranche : min inclus, max exclu
 * (null = pas de limite)
 */
export interface RangeOption {

  value: string;

  label: string;

  min: number | null;

  max: number | null;

}


export const BUDGET_OPTIONS: RangeOption[] = [
  { value: '0-500', label: 'Moins de 500 €', min: null, max: 500 },
  { value: '500-700', label: '500 à 700 €', min: 500, max: 700 },
  { value: '700-900', label: '700 à 900 €', min: 700, max: 900 },
  { value: '900', label: 'Plus de 900 €', min: 900, max: null }
];


export const SURFACE_OPTIONS: RangeOption[] = [
  { value: '0-15', label: 'Moins de 15 m²', min: null, max: 15 },
  { value: '15-25', label: '15 à 25 m²', min: 15, max: 25 },
  { value: '25-40', label: '25 à 40 m²', min: 25, max: 40 },
  { value: '40', label: 'Plus de 40 m²', min: 40, max: null }
];


/*
 * Durée du séjour souhaitée (en mois) :
 * stage court, stage, semestre, année.
 */
export const DURATION_OPTIONS: RangeOption[] = [
  { value: '1', label: '1 mois', min: 1, max: 1 },
  { value: '2-3', label: '2 à 3 mois', min: 2, max: 3 },
  { value: '4-6', label: '4 à 6 mois', min: 4, max: 6 },
  { value: '7', label: 'Plus de 6 mois', min: 7, max: null }
];


export const TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'studio', label: 'Studio' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'room', label: 'Chambre' }
];


export function createEmptyFilters(): SearchFilters {

  return {
    budget: '',
    surface: '',
    duration: '',
    types: [],
    furnished: false,
    amenities: []
  };

}


export function countActiveFilters(
  filters: SearchFilters
): number {

  return [
    filters.budget,
    filters.surface,
    filters.duration,
    filters.furnished
  ].filter(Boolean).length
    + filters.types.length
    + filters.amenities.length;

}


/*
 * =========================================
 * URL
 * =========================================
 */

function findOption(
  options: RangeOption[],
  value: string | null
): RangeOption | undefined {

  return options.find(option => option.value === value);

}


function splitList(
  value: string | null
): string[] {

  return (value ?? '').split(',').filter(Boolean);

}


export function filtersFromParams(
  params: ParamMap
): SearchFilters {

  return {
    budget: findOption(BUDGET_OPTIONS, params.get('budget'))?.value ?? '',
    surface: findOption(SURFACE_OPTIONS, params.get('surface'))?.value ?? '',
    duration: findOption(DURATION_OPTIONS, params.get('duree'))?.value ?? '',
    types: splitList(params.get('type'))
      .filter((type): type is PropertyType => TYPE_OPTIONS.some(option => option.value === type)),
    furnished: params.get('meuble') === '1',
    amenities: splitList(params.get('equipements'))
  };

}


/*
 * null = paramètre retiré de l'URL
 */
export function filtersToParams(
  filters: SearchFilters
): Params {

  return {
    budget: filters.budget || null,
    surface: filters.surface || null,
    duree: filters.duration || null,
    type: filters.types.join(',') || null,
    meuble: filters.furnished ? '1' : null,
    equipements: filters.amenities.join(',') || null
  };

}


/*
 * =========================================
 * CORRESPONDANCE
 * =========================================
 *
 * Une annonce sans l'information (anciennes
 * annonces) est exclue quand le filtre est actif.
 */

function inRange(
  value: number | null,
  option: RangeOption | undefined
): boolean {

  if (!option) {
    return true;
  }

  if (value === null) {
    return false;
  }

  return (option.min === null || value >= option.min)
    && (option.max === null || value < option.max);

}


/*
 * Nombre de mois entre availableFrom et availableTo
 */
function getAvailableMonths(
  listing: ListingDocument
): number | null {

  if (!listing.availableFrom || !listing.availableTo) {
    return null;
  }

  const days =
    (Date.parse(listing.availableTo) - Date.parse(listing.availableFrom)) / 86_400_000;

  return Number.isFinite(days) ? Math.floor((days + 1) / 30) : null;

}


function matchesDuration(
  listing: ListingDocument,
  option: RangeOption | undefined
): boolean {

  if (!option) {
    return true;
  }


  const months =
    getAvailableMonths(listing);


  /*
   * Le logement doit être libre assez longtemps
   * (au moins le minimum de la tranche) et accepter
   * un séjour aussi court (séjour minimum).
   */
  return months !== null
    && months >= (option.min ?? 0)
    && (option.max === null || listing.minStayMonths <= option.max);

}


export function matchesFilters(
  listing: ListingDocument,
  filters: SearchFilters
): boolean {

  return inRange(listing.price, findOption(BUDGET_OPTIONS, filters.budget))
    && inRange(listing.surface, findOption(SURFACE_OPTIONS, filters.surface))
    && matchesDuration(listing, findOption(DURATION_OPTIONS, filters.duration))
    && (filters.types.length === 0 || (!!listing.propertyType && filters.types.includes(listing.propertyType)))
    && (!filters.furnished || listing.furnished === true)
    && filters.amenities.every(amenity => listing.amenities.includes(amenity));

}
