import { Injectable } from '@angular/core';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
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


@Injectable({
  providedIn: 'root'
})
export class Listing {


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