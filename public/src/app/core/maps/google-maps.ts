/// <reference types="google.maps" />

import { Injectable } from '@angular/core';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

import { environment } from '../../../environments/environment';


export interface AddressSuggestion {

  id: string;

  /*
   * « 12 Rue Mercière »
   */
  mainText: string;

  /*
   * « Lyon, France »
   */
  secondaryText: string;

  prediction: google.maps.places.PlacePrediction;

}


export interface AddressResult {

  address: string;

  placeId: string;

  postalCode: string;

  latitude: number | null;

  longitude: number | null;

}


/*
 * Recherche limitée à Lyon et alentours
 */
const LYON_BOUNDS: google.maps.LatLngBoundsLiteral = {
  south: 45.70,
  west: 4.77,
  north: 45.81,
  east: 4.90
};


/*
 * =========================================
 * GOOGLE MAPS (Places + carte)
 * =========================================
 *
 * Clé : environment.googleMapsApiKey
 * (fichier non versionné).
 * Sans clé, enabled = false et le
 * formulaire garde une saisie libre.
 */
@Injectable({
  providedIn: 'root'
})
export class GoogleMaps {

  private configured = false;

  /*
   * Une session = saisie + choix d'une adresse
   * (facturation Google regroupée).
   */
  private sessionToken?: google.maps.places.AutocompleteSessionToken;


  get enabled(): boolean {

    return !!environment.googleMapsApiKey;

  }


  private configure(): void {

    if (this.configured) {
      return;
    }

    setOptions({
      key: environment.googleMapsApiKey,
      v: 'weekly',
      language: 'fr',
      region: 'FR'
    });

    this.configured = true;

  }


  /*
   * Suggestions d'adresses
   */
  async searchAddresses(
    input: string
  ): Promise<AddressSuggestion[]> {

    this.configure();


    const { AutocompleteSuggestion, AutocompleteSessionToken } =
      await importLibrary('places');

    this.sessionToken ??= new AutocompleteSessionToken();


    const { suggestions } =
      await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken: this.sessionToken,
        includedRegionCodes: ['fr'],
        locationRestriction: LYON_BOUNDS,
        language: 'fr'
      });


    return suggestions.flatMap(suggestion => {

      const prediction =
        suggestion.placePrediction;

      if (!prediction) {
        return [];
      }

      return [{
        id: prediction.placeId,
        mainText: prediction.mainText?.text ?? prediction.text.text,
        secondaryText: prediction.secondaryText?.text ?? '',
        prediction
      }];

    });

  }


  /*
   * Adresse complète + position
   * de la suggestion choisie
   */
  async getAddress(
    suggestion: AddressSuggestion
  ): Promise<AddressResult> {

    const place =
      suggestion.prediction.toPlace();

    await place.fetchFields({
      fields: ['formattedAddress', 'location', 'addressComponents']
    });


    /*
     * Fin de la session de recherche
     */
    this.sessionToken = undefined;


    const postalCode =
      place.addressComponents
        ?.find(component => component.types.includes('postal_code'))
        ?.longText ?? '';


    return {
      address: place.formattedAddress ?? '',
      placeId: place.id,
      postalCode,
      latitude: place.location?.lat() ?? null,
      longitude: place.location?.lng() ?? null
    };

  }


  /*
   * Petite carte avec un marqueur.
   * Retourne une fonction pour
   * déplacer le marqueur.
   */
  async createMap(
    element: HTMLElement,
    latitude: number,
    longitude: number
  ): Promise<(latitude: number, longitude: number) => void> {

    this.configure();


    const [{ Map }, { AdvancedMarkerElement }] =
      await Promise.all([
        importLibrary('maps'),
        importLibrary('marker')
      ]);


    const position =
      { lat: latitude, lng: longitude };

    const map =
      new Map(element, {
        center: position,
        zoom: 16,
        mapId: environment.googleMapsMapId || 'DEMO_MAP_ID',
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative'
      });

    const marker =
      new AdvancedMarkerElement({ map, position });


    return (lat: number, lng: number) => {
      marker.position = { lat, lng };
      map.setCenter({ lat, lng });
    };

  }

}
