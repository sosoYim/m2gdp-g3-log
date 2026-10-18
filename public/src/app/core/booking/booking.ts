import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';

import { firestore } from '../firebase/firebase';


export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected';


export interface CreateBookingRequest {

  listingId: string;

  requesterId: string;

  /*
   * UID Firebase du propriétaire.
   *
   * Facultatif temporairement pour rester
   * compatible avec notre annonce de démonstration.
   */
  ownerId?: string;

  ownerName: string;

  arrivalDate: string;

  departureDate: string;

  message: string;

}


export interface BookingRequest {

  id: string;

  listingId: string;

  requesterId: string;

  /*
   * UID Firebase de l'annonceur.
   */
  ownerId: string;

  ownerName: string;

  arrivalDate: string;

  departureDate: string;

  message: string;

  status: BookingStatus;

  createdAt: Timestamp | null;

  updatedAt: Timestamp | null;

}


@Injectable({
  providedIn: 'root'
})
export class Booking {


  /*
   * =========================================
   * CRÉER UNE DEMANDE
   * =========================================
   */
  async createRequest(
    request: CreateBookingRequest
  ): Promise<string> {

    const bookingRequestsRef =
      collection(
        firestore,
        'bookingRequests'
      );


    const documentReference =
      await addDoc(
        bookingRequestsRef,
        {

          listingId:
            request.listingId,

          requesterId:
            request.requesterId,

          /*
           * Pour les futures annonces réelles,
           * cette valeur contiendra l'UID Firebase
           * de l'annonceur.
           */
          ownerId:
            request.ownerId ?? '',

          ownerName:
            request.ownerName,

          arrivalDate:
            request.arrivalDate,

          departureDate:
            request.departureDate,

          message:
            request.message.trim(),

          status:
            'pending' as BookingStatus,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


    return documentReference.id;

  }


  /*
   * =========================================
   * DEMANDES DU DEMANDEUR
   * =========================================
   */
  async getRequestsForRequester(
    requesterId: string
  ): Promise<BookingRequest[]> {

    const bookingRequestsRef =
      collection(
        firestore,
        'bookingRequests'
      );


    const requesterQuery =
      query(
        bookingRequestsRef,
        where(
          'requesterId',
          '==',
          requesterId
        )
      );


    const snapshot =
      await getDocs(
        requesterQuery
      );


    const requests =
      snapshot.docs.map(
        documentSnapshot => {

          const data =
            documentSnapshot.data();


          return {

            id:
              documentSnapshot.id,

            listingId:
              data['listingId'] ?? '',

            requesterId:
              data['requesterId'] ?? '',

            /*
             * Les anciennes demandes n'ont pas
             * encore forcément ownerId.
             */
            ownerId:
              data['ownerId'] ?? '',

            ownerName:
              data['ownerName'] ?? '',

            arrivalDate:
              data['arrivalDate'] ?? '',

            departureDate:
              data['departureDate'] ?? '',

            message:
              data['message'] ?? '',

            status:
              this.normalizeStatus(
                data['status']
              ),

            createdAt:
              data['createdAt'] instanceof Timestamp
                ? data['createdAt']
                : null,

            updatedAt:
              data['updatedAt'] instanceof Timestamp
                ? data['updatedAt']
                : null

          } satisfies BookingRequest;

        }
      );


    /*
     * Plus récentes en premier.
     */
    requests.sort(
      (a, b) => {

        const dateA =
          a.createdAt?.toMillis() ?? 0;

        const dateB =
          b.createdAt?.toMillis() ?? 0;

        return dateB - dateA;

      }
    );


    return requests;

  }


  /*
   * =========================================
   * DEMANDES REÇUES PAR L'ANNONCEUR
   * =========================================
   */
  async getRequestsForOwner(
    ownerId: string
  ): Promise<BookingRequest[]> {

    const bookingRequestsRef =
      collection(
        firestore,
        'bookingRequests'
      );


    const ownerQuery =
      query(
        bookingRequestsRef,
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


    const requests =
      snapshot.docs.map(
        documentSnapshot => {

          const data =
            documentSnapshot.data();


          return {

            id:
              documentSnapshot.id,

            listingId:
              data['listingId'] ?? '',

            requesterId:
              data['requesterId'] ?? '',

            ownerId:
              data['ownerId'] ?? '',

            ownerName:
              data['ownerName'] ?? '',

            arrivalDate:
              data['arrivalDate'] ?? '',

            departureDate:
              data['departureDate'] ?? '',

            message:
              data['message'] ?? '',

            status:
              this.normalizeStatus(
                data['status']
              ),

            createdAt:
              data['createdAt'] instanceof Timestamp
                ? data['createdAt']
                : null,

            updatedAt:
              data['updatedAt'] instanceof Timestamp
                ? data['updatedAt']
                : null

          } satisfies BookingRequest;

        }
      );


    requests.sort(
      (a, b) => {

        const dateA =
          a.createdAt?.toMillis() ?? 0;

        const dateB =
          b.createdAt?.toMillis() ?? 0;

        return dateB - dateA;

      }
    );


    return requests;

  }


  /*
   * =========================================
   * RÉCUPÉRER UNE DEMANDE PAR SON ID
   * =========================================
   */
  async getRequestById(
    requestId: string
  ): Promise<BookingRequest | null> {

    const requestRef =
      doc(
        firestore,
        'bookingRequests',
        requestId
      );


    const snapshot =
      await getDoc(
        requestRef
      );


    if (!snapshot.exists()) {
      return null;
    }


    const data =
      snapshot.data();


    return {

      id:
        snapshot.id,

      listingId:
        data['listingId'] ?? '',

      requesterId:
        data['requesterId'] ?? '',

      ownerId:
        data['ownerId'] ?? '',

      ownerName:
        data['ownerName'] ?? '',

      arrivalDate:
        data['arrivalDate'] ?? '',

      departureDate:
        data['departureDate'] ?? '',

      message:
        data['message'] ?? '',

      status:
        this.normalizeStatus(
          data['status']
        ),

      createdAt:
        data['createdAt'] instanceof Timestamp
          ? data['createdAt']
          : null,

      updatedAt:
        data['updatedAt'] instanceof Timestamp
          ? data['updatedAt']
          : null

    } satisfies BookingRequest;

  }


  /*
   * =========================================
   * METTRE À JOUR LE STATUT D'UNE DEMANDE
   * =========================================
   */
  async updateRequestStatus(
    requestId: string,
    status: BookingStatus
  ): Promise<void> {

    const requestRef =
      doc(
        firestore,
        'bookingRequests',
        requestId
      );


    await updateDoc(
      requestRef,
      {
        status,
        updatedAt: serverTimestamp()
      }
    );

  }


  /*
   * =========================================
   * ANTI-DOUBLON
   * =========================================
   */
  async hasPendingRequest(
    requesterId: string,
    listingId: string,
    arrivalDate: string,
    departureDate: string
  ): Promise<boolean> {

    const requests =
      await this.getRequestsForRequester(
        requesterId
      );


    return requests.some(
      request =>
        request.listingId === listingId &&
        request.arrivalDate === arrivalDate &&
        request.departureDate === departureDate &&
        request.status === 'pending'
    );

  }


  /*
   * =========================================
   * NORMALISATION DU STATUT
   * =========================================
   */
  private normalizeStatus(
    status: unknown
  ): BookingStatus {

    if (
      status === 'accepted' ||
      status === 'rejected'
    ) {

      return status;

    }


    return 'pending';

  }

}