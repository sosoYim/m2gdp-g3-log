import { Injectable } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp
} from 'firebase/firestore';

import { firestore } from '../firebase/firebase';


export interface FavoriteListing {
  listingId: string;

  title: string;
  location: string;
  details: string;

  price: number;
  rating: number;

  image: string;

  createdAt?: Timestamp | null;
}


@Injectable({
  providedIn: 'root'
})
export class Favorite {

  /*
   * Ajouter ou mettre à jour
   * un logement dans les favoris.
   */
  async addFavorite(
    userId: string,
    listing: FavoriteListing
  ): Promise<void> {

    const favoriteRef =
      doc(
        firestore,
        'users',
        userId,
        'favorites',
        listing.listingId
      );


    await setDoc(
      favoriteRef,
      {
        listingId:
          listing.listingId,

        title:
          listing.title,

        location:
          listing.location,

        details:
          listing.details,

        price:
          listing.price,

        rating:
          listing.rating,

        image:
          listing.image,

        createdAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

  }


  /*
   * Supprimer un logement
   * des favoris.
   */
  async removeFavorite(
    userId: string,
    listingId: string
  ): Promise<void> {

    const favoriteRef =
      doc(
        firestore,
        'users',
        userId,
        'favorites',
        listingId
      );


    await deleteDoc(
      favoriteRef
    );

  }


  /*
   * Récupérer tous les favoris
   * de l'utilisateur connecté.
   */
  async getFavorites(
    userId: string
  ): Promise<FavoriteListing[]> {

    const favoritesRef =
      collection(
        firestore,
        'users',
        userId,
        'favorites'
      );


    const snapshot =
      await getDocs(
        favoritesRef
      );


    const favorites =
      snapshot.docs.map(
        documentSnapshot => {

          const data =
            documentSnapshot.data();


          return {
            listingId:
              data['listingId'] ??
              documentSnapshot.id,

            title:
              data['title'] ?? '',

            location:
              data['location'] ?? '',

            details:
              data['details'] ?? '',

            price:
              data['price'] ?? 0,

            rating:
              data['rating'] ?? 0,

            image:
              data['image'] ?? '',

            createdAt:
              data['createdAt'] instanceof Timestamp
                ? data['createdAt']
                : null

          } satisfies FavoriteListing;

        }
      );


    /*
     * Les favoris les plus récemment
     * ajoutés apparaissent en premier.
     */
    favorites.sort(
      (a, b) => {

        const dateA =
          a.createdAt?.toMillis() ?? 0;

        const dateB =
          b.createdAt?.toMillis() ?? 0;

        return dateB - dateA;

      }
    );


    return favorites;

  }


  /*
   * Récupérer seulement les IDs.
   *
   * Utile sur la page de recherche
   * pour savoir quels cœurs afficher
   * comme déjà sélectionnés.
   */
  async getFavoriteIds(
    userId: string
  ): Promise<Set<string>> {

    const favorites =
      await this.getFavorites(
        userId
      );


    return new Set(
      favorites.map(
        favorite =>
          favorite.listingId
      )
    );

  }

}