import { Injectable } from '@angular/core';

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';

import { firestore } from '../firebase/firebase';


export interface ListingDocument {

  id: string;

  title: string;

  location: string;

  latitude: number;

  longitude: number;

  details: string;

  price: number;

  rating: number;

  image: string;

  verified: boolean;

  highlighted: boolean;

  /*
   * UID Firebase de l'annonceur.
   *
   * Pour les anciennes annonces,
   * il peut être vide.
   */
  ownerId: string;

  ownerName: string;

  availableFrom: string;

  availableTo: string;

  status:
    | 'published'
    | 'draft'
    | 'inactive';

}


/*
 * =========================================
 * FORMULAIRE « DÉPOSER UNE ANNONCE »
 * =========================================
 */

export type PropertyType =
  | 'studio'
  | 'apartment'
  | 'room';


/*
 * Accord du propriétaire pour sous-louer.
 * '' = pas encore répondu.
 */
export type OwnerConsent =
  | 'yes'
  | 'no'
  | 'owner'
  | '';


export interface ListingPhoto {

  /*
   * Clé R2 (pour la suppression)
   */
  key: string;

  url: string;

}


export interface ListingForm {

  title: string;

  propertyType: PropertyType;

  /*
   * Adresse complète (Google Places).
   * Privée : listings/{id}/private/address
   */
  address: string;

  /*
   * Bâtiment, n° d'appartement… (privé)
   */
  addressDetails: string;

  /*
   * Identifiant Google Places (privé)
   */
  placeId: string;

  /*
   * Public : seul l'arrondissement
   * est affiché sur l'annonce.
   */
  postalCode: string;

  arrondissement: number | null;

  /*
   * Position exacte (privée).
   * L'annonce publique reçoit une
   * position approximative (~100-300 m).
   */
  latitude: number | null;

  longitude: number | null;

  surface: number | null;

  rooms: number | null;

  floor: number | null;

  furnished: boolean;

  description: string;

  photos: ListingPhoto[];

  amenities: string[];

  nonSmoking: boolean;

  petsAllowed: boolean;

  ownerConsent: OwnerConsent;

  price: number | null;

  chargesIncluded: boolean;

  minStayMonths: number;

  availableFrom: string;

  availableTo: string;

}


export interface ListingFormDocument {

  id: string;

  form: ListingForm;

  status: ListingDocument['status'];

  ownerId: string;

  ownerName: string;

}


export function createEmptyListingForm(): ListingForm {

  return {
    title: '',
    propertyType: 'studio',
    address: '',
    addressDetails: '',
    placeId: '',
    postalCode: '',
    arrondissement: null,
    latitude: null,
    longitude: null,
    surface: null,
    rooms: null,
    floor: null,
    furnished: true,
    description: '',
    photos: [],
    amenities: [],
    nonSmoking: true,
    petsAllowed: false,
    ownerConsent: '',
    price: null,
    chargesIncluded: true,
    minStayMonths: 1,
    availableFrom: '',
    availableTo: ''
  };

}


/*
 * Centre approximatif de chaque arrondissement :
 * utilisé pour la carte tant que l'adresse
 * n'est pas géocodée (Google Places).
 */
const ARRONDISSEMENT_CENTERS: Record<number, [number, number]> = {
  1: [45.7676, 4.8344],
  2: [45.7485, 4.8270],
  3: [45.7597, 4.8606],
  4: [45.7793, 4.8272],
  5: [45.7580, 4.8100],
  6: [45.7720, 4.8520],
  7: [45.7334, 4.8402],
  8: [45.7342, 4.8696],
  9: [45.7740, 4.8050]
};

const LYON_CENTER: [number, number] = [45.7578, 4.832];


/*
 * Champs d'adresse jamais écrits
 * dans le document public.
 */
const PRIVATE_ADDRESS_FIELDS = [
  'address',
  'addressDetails',
  'placeId'
] as const;


/*
 * Position publique approximative :
 * décalage fixe de 100 à 300 m,
 * calculé à partir de l'ID de l'annonce
 * (toujours le même pour une annonce).
 */
function approximateCoordinates(
  latitude: number,
  longitude: number,
  seed: string
): [number, number] {

  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }


  const angle =
    (hash % 360) * Math.PI / 180;

  const meters =
    100 + (hash % 200);


  return [
    latitude + meters * Math.cos(angle) / 111320,
    longitude + meters * Math.sin(angle) / (111320 * Math.cos(latitude * Math.PI / 180))
  ];

}


/*
 * « Lyon 2e », « Lyon 1er », « Lyon »
 */
export function getLocationLabel(
  arrondissement: number | null
): string {

  if (!arrondissement) {
    return 'Lyon';
  }

  return `Lyon ${arrondissement}${arrondissement === 1 ? 'er' : 'e'}`;

}


/*
 * Arrondissement déduit du code postal
 * (69001 → 1). null si hors Lyon.
 */
export function getArrondissement(
  address: string
): number | null {

  const match =
    /\b6900([1-9])\b/.exec(address);

  return match ? Number(match[1]) : null;

}


/*
 * Ligne « Meublé · 22 m² · 1 pièce »
 */
export function getListingDetails(
  form: ListingForm
): string {

  const parts =
    [form.furnished ? 'Meublé' : 'Non meublé'];


  if (form.surface) {
    parts.push(`${form.surface} m²`);
  }


  if (form.rooms) {
    parts.push(`${form.rooms} ${form.rooms > 1 ? 'pièces' : 'pièce'}`);
  }


  return parts.join(' · ');

}


@Injectable({
  providedIn: 'root'
})
export class Listing {


  /*
   * =========================================
   * CHARGER UNE ANNONCE POUR LE FORMULAIRE
   * =========================================
   */
  async getListingForm(
    listingId: string,
    includePrivate = false
  ): Promise<ListingFormDocument | null> {

    const snapshot =
      await getDoc(
        doc(firestore, 'listings', listingId)
      );


    if (!snapshot.exists()) {
      return null;
    }


    const data =
      snapshot.data();

    const empty =
      createEmptyListingForm();


    /*
     * Les champs absents (anciennes annonces)
     * gardent leur valeur par défaut.
     */
    const form =
      { ...empty } as ListingForm;

    for (const key of Object.keys(empty) as (keyof ListingForm)[]) {

      if (data[key] !== undefined && data[key] !== null) {
        (form as unknown as Record<string, unknown>)[key] = data[key];
      }

    }


    /*
     * Les coordonnées publiques sont
     * approximatives : jamais reprises
     * dans le formulaire.
     */
    form.latitude = null;
    form.longitude = null;


    /*
     * Adresse privée (annonceur uniquement)
     */
    if (includePrivate) {

      const privateSnapshot =
        await getDoc(
          doc(firestore, 'listings', listingId, 'private', 'address')
        );

      const privateData =
        privateSnapshot.exists() ? privateSnapshot.data() : {};


      form.address = privateData['address'] ?? form.address;
      form.addressDetails = privateData['addressDetails'] ?? '';
      form.placeId = privateData['placeId'] ?? '';

      if (typeof privateData['latitude'] === 'number') {
        form.latitude = privateData['latitude'];
        form.longitude = privateData['longitude'];
      }

    }


    /*
     * Anciennes annonces : arrondissement
     * déduit de l'adresse.
     */
    if (!form.arrondissement) {
      form.arrondissement = getArrondissement(form.address);
    }


    /*
     * Anciennes annonces : une seule image.
     */
    if (form.photos.length === 0 && data['image']) {
      form.photos = [{ key: '', url: data['image'] }];
    }


    return {
      id: snapshot.id,
      form,
      status: data['status'] === 'published' || data['status'] === 'inactive'
        ? data['status']
        : 'draft',
      ownerId: data['ownerId'] ?? '',
      ownerName: data['ownerName'] ?? ''
    };

  }


  /*
   * =========================================
   * ENREGISTRER LE FORMULAIRE
   * =========================================
   *
   * Crée l'annonce si listingId est vide.
   * Remplit aussi les champs lus par les
   * autres pages (location, details, image,
   * latitude, longitude).
   * Retourne l'ID de l'annonce.
   */
  async saveListingForm(
    listingId: string,
    form: ListingForm,
    owner: { id: string; name: string },
    status: ListingDocument['status']
  ): Promise<string> {

    const listingRef =
      listingId
        ? doc(firestore, 'listings', listingId)
        : doc(collection(firestore, 'listings'));


    const arrondissement =
      form.arrondissement ?? getArrondissement(form.address);


    /*
     * Position publique : approximative si
     * l'adresse est géocodée, sinon centre
     * de l'arrondissement.
     */
    const [latitude, longitude] =
      form.latitude !== null && form.longitude !== null
        ? approximateCoordinates(form.latitude, form.longitude, listingRef.id)
        : arrondissement
          ? ARRONDISSEMENT_CENTERS[arrondissement]
          : LYON_CENTER;


    const publicForm: Record<string, unknown> =
      { ...form };

    for (const field of PRIVATE_ADDRESS_FIELDS) {
      publicForm[field] = deleteField();
    }


    await setDoc(
      listingRef,
      {
        ...publicForm,

        title: form.title.trim(),
        description: form.description.trim(),

        arrondissement,
        location: getLocationLabel(arrondissement),
        details: getListingDetails(form),
        image: form.photos[0]?.url ?? '',
        price: form.price ?? 0,
        latitude,
        longitude,

        status,
        ownerId: owner.id,
        ownerName: owner.name,
        verified: true,
        highlighted: false,

        ...(listingId ? {} : { rating: 0, createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp()
      },
      {
        merge: true
      }
    );


    /*
     * Adresse exacte : lisible uniquement
     * par l'annonceur (règles Firestore).
     */
    await setDoc(
      doc(listingRef, 'private', 'address'),
      {
        address: form.address.trim(),
        addressDetails: form.addressDetails.trim(),
        placeId: form.placeId,
        postalCode: form.postalCode,
        latitude: form.latitude,
        longitude: form.longitude,
        updatedAt: serverTimestamp()
      }
    );


    return listingRef.id;

  }



  /*
   * =========================================
   * RÉCUPÉRER UN LOGEMENT PAR SON ID
   * =========================================
   */
  async getListingById(
    listingId: string
  ): Promise<ListingDocument | null> {

    const listingRef =
      doc(
        firestore,
        'listings',
        listingId
      );


    const snapshot =
      await getDoc(
        listingRef
      );


    if (!snapshot.exists()) {

      return null;

    }


    const data =
      snapshot.data();


    return {

      id:
        snapshot.id,

      title:
        data['title'] ?? '',

      location:
        data['location'] ?? '',

      latitude:
        typeof data['latitude'] === 'number'
          ? data['latitude']
          : 0,

      longitude:
        typeof data['longitude'] === 'number'
          ? data['longitude']
          : 0,

      details:
        data['details'] ?? '',

      price:
        typeof data['price'] === 'number'
          ? data['price']
          : 0,

      rating:
        typeof data['rating'] === 'number'
          ? data['rating']
          : 0,

      image:
        data['image'] ?? '',

      verified:
        data['verified'] === true,

      highlighted:
        data['highlighted'] === true,

      ownerId:
        data['ownerId'] ?? '',

      ownerName:
        data['ownerName'] ?? '',

      availableFrom:
        data['availableFrom'] ?? '',

      availableTo:
        data['availableTo'] ?? '',

      status:
        data['status'] === 'draft'
          ? 'draft'
          : data['status'] === 'inactive'
            ? 'inactive'
            : 'published'

    };

  }


  /*
   * =========================================
   * RÉCUPÉRER LES LOGEMENTS PUBLIÉS
   * =========================================
   */
  async getPublishedListings():
    Promise<ListingDocument[]> {

    const listingsRef =
      collection(
        firestore,
        'listings'
      );


    const listingsQuery =
      query(
        listingsRef,
        where(
          'status',
          '==',
          'published'
        )
      );


    const snapshot =
      await getDocs(
        listingsQuery
      );


    return snapshot.docs.map(
      documentSnapshot => {

        const data =
          documentSnapshot.data();


        return {

          id:
            documentSnapshot.id,

          title:
            data['title'] ?? '',

          location:
            data['location'] ?? '',

          latitude:
            typeof data['latitude'] === 'number'
              ? data['latitude']
              : 0,

          longitude:
            typeof data['longitude'] === 'number'
              ? data['longitude']
              : 0,

          details:
            data['details'] ?? '',

          price:
            typeof data['price'] === 'number'
              ? data['price']
              : 0,

          rating:
            typeof data['rating'] === 'number'
              ? data['rating']
              : 0,

          image:
            data['image'] ?? '',

          verified:
            data['verified'] === true,

          highlighted:
            data['highlighted'] === true,

          ownerId:
            data['ownerId'] ?? '',

          ownerName:
            data['ownerName'] ?? '',

          availableFrom:
            data['availableFrom'] ?? '',

          availableTo:
            data['availableTo'] ?? '',

          status:
            data['status'] === 'draft'
              ? 'draft'
              : data['status'] === 'inactive'
                ? 'inactive'
                : 'published'

        } satisfies ListingDocument;

      }
    );

  }


  /*
   * =========================================
   * LOGEMENTS PAR ANNONCEUR
   * =========================================
   */
  async getListingsByOwner(
    ownerId: string
  ): Promise<ListingDocument[]> {

    const listingsRef =
      collection(
        firestore,
        'listings'
      );


    const ownerQuery =
      query(
        listingsRef,
        where(
          'ownerId',
          '==',
          ownerId
        )
      );


    const snapshot =
      await getDocs(
        ownerQuery
      );


    return snapshot.docs.map(
      documentSnapshot => {

        const data =
          documentSnapshot.data();


        return {

          id:
            documentSnapshot.id,

          title:
            data['title'] ?? '',

          location:
            data['location'] ?? '',

          latitude:
            typeof data['latitude'] === 'number'
              ? data['latitude']
              : 0,

          longitude:
            typeof data['longitude'] === 'number'
              ? data['longitude']
              : 0,

          details:
            data['details'] ?? '',

          price:
            typeof data['price'] === 'number'
              ? data['price']
              : 0,

          rating:
            typeof data['rating'] === 'number'
              ? data['rating']
              : 0,

          image:
            data['image'] ?? '',

          verified:
            data['verified'] === true,

          highlighted:
            data['highlighted'] === true,

          ownerId:
            data['ownerId'] ?? '',

          ownerName:
            data['ownerName'] ?? '',

          availableFrom:
            data['availableFrom'] ?? '',

          availableTo:
            data['availableTo'] ?? '',

          status:
            data['status'] === 'draft'
              ? 'draft'
              : data['status'] === 'inactive'
                ? 'inactive'
                : 'published'

        } satisfies ListingDocument;

      }
    );

  }


  /*
   * =========================================
   * METTRE EN PAUSE / REMETTRE EN LIGNE
   * =========================================
   */
  async updateListingStatus(
    listingId: string,
    status: ListingDocument['status']
  ): Promise<void> {

    const listingRef =
      doc(
        firestore,
        'listings',
        listingId
      );


    await updateDoc(
      listingRef,
      {
        status,
        updatedAt: serverTimestamp()
      }
    );

  }


  /*
   * =========================================
   * SUPPRIMER UNE ANNONCE
   * =========================================
   */
  async deleteListing(
    listingId: string
  ): Promise<void> {

    const listingRef =
      doc(
        firestore,
        'listings',
        listingId
      );


    /*
     * L'adresse privée d'abord : la règle
     * vérifie le propriétaire de l'annonce.
     */
    await deleteDoc(
      doc(listingRef, 'private', 'address')
    );

    await deleteDoc(
      listingRef
    );

  }


  /*
   * =========================================
   * FILTRER PAR DATES
   * =========================================
   */
  async searchByDates(
    arrivalDate: string,
    departureDate: string
  ): Promise<ListingDocument[]> {

    const listings =
      await this.getPublishedListings();


    if (
      !arrivalDate ||
      !departureDate
    ) {

      return listings;

    }


    return listings.filter(
      listing => {

        if (
          !listing.availableFrom ||
          !listing.availableTo
        ) {

          return false;

        }


        return (
          listing.availableFrom <= arrivalDate
          &&
          listing.availableTo >= departureDate
        );

      }
    );

  }

}