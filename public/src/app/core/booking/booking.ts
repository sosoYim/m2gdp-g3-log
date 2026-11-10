import { Injectable, signal } from '@angular/core';

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
import { formatIsoDate } from '../dates/dates';
import { Listing } from '../listing/listing';
import { Messaging } from '../messaging/messaging';


export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  /*
   * Retirée par le demandeur
   * (seulement en attente)
   */
  | 'cancelled';


/*
 * Motif de refus choisi par l'annonceur
 */
export type RejectionReason =
  | 'dates_unavailable'
  | 'already_booked'
  | 'other';


export type CancelledBy =
  | 'requester'
  | 'owner';


export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  dates_unavailable: 'Dates indisponibles',
  already_booked: 'Déjà réservé',
  other: 'Autre raison'
};


/*
 * Réponse de l'annonceur
 * (modale accepter / refuser)
 */
export interface BookingAnswer {

  status: 'accepted' | 'rejected';

  reason: RejectionReason | '';

  /*
   * Mot du refus (facultatif)
   */
  message: string;

}


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

  /*
   * '' si non refusée ou sans motif
   */
  rejectionReason: RejectionReason | '';

  /*
   * Annulation : par le demandeur ou
   * l'annonceur ('' si non annulée)
   */
  cancelledBy: CancelledBy | '';

  createdAt: Timestamp | null;

  updatedAt: Timestamp | null;

}


/*
 * Nombre de demandes en attente (badge du menu
 * annonceur), mémorisé dans le navigateur pour
 * l'afficher dès l'ouverture de chaque page.
 */
const PENDING_STORAGE_KEY = 'baillyon.pendingCount';

interface StoredPendingCount {
  uid: string;
  count: number;
}

function readStoredPendingCount(): StoredPendingCount | null {

  try {

    const value =
      JSON.parse(localStorage.getItem(PENDING_STORAGE_KEY) ?? 'null');

    return typeof value?.uid === 'string' && typeof value?.count === 'number'
      ? value
      : null;

  } catch {

    return null;

  }

}


@Injectable({
  providedIn: 'root'
})
export class Booking {


  constructor(
    private readonly listingService: Listing,
    private readonly messagingService: Messaging
  ) {}


  /*
   * Partagé par tous les menus annonceur :
   * pas de retour à 0 entre deux pages.
   */
  readonly pendingCount =
    signal(readStoredPendingCount()?.count ?? 0);


  setPendingCount(
    uid: string,
    count: number
  ): void {

    this.pendingCount.set(count);

    try {
      localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify({ uid, count }));
    } catch {}

  }


  /*
   * Déconnexion : le prochain compte connecté
   * ne voit pas le nombre de l'ancien.
   */
  clearPendingCount(): void {

    this.pendingCount.set(0);

    try {
      localStorage.removeItem(PENDING_STORAGE_KEY);
    } catch {}

  }


  async refreshPendingCount(
    uid: string
  ): Promise<void> {

    /*
     * Autre compte que celui mémorisé :
     * on n'affiche pas son ancien nombre.
     */
    if (readStoredPendingCount()?.uid !== uid) {
      this.pendingCount.set(0);
    }

    const requests =
      await this.getRequestsForOwner(uid);

    this.setPendingCount(
      uid,
      requests.filter(r => r.status === 'pending').length
    );

  }


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


            rejectionReason:

              this.normalizeReason(data['rejectionReason']),



            cancelledBy:


              data['cancelledBy'] === 'requester' || data['cancelledBy'] === 'owner' ? data['cancelledBy'] : '',

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


            rejectionReason:

              this.normalizeReason(data['rejectionReason']),



            cancelledBy:


              data['cancelledBy'] === 'requester' || data['cancelledBy'] === 'owner' ? data['cancelledBy'] : '',

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


      rejectionReason:

        this.normalizeReason(data['rejectionReason']),



      cancelledBy:


        data['cancelledBy'] === 'requester' || data['cancelledBy'] === 'owner' ? data['cancelledBy'] : '',

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
    status: BookingStatus,
    rejectionReason: RejectionReason | '' = ''
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
        ...(status === 'rejected' && rejectionReason ? { rejectionReason } : {}),
        updatedAt: serverTimestamp()
      }
    );

  }


  /*
   * =========================================
   * RÉPONSE DE L'ANNONCEUR
   * =========================================
   *
   * Accepter : les dates sont bloquées sur
   * l'annonce, et les autres demandes en
   * attente qui chevauchent sont refusées
   * (« Déjà réservé ») avec une notification
   * dans leur conversation.
   *
   * Retourne les demandes refusées
   * automatiquement.
   */
  async answerRequest(
    request: BookingRequest,
    answer: BookingAnswer,
    hostId: string,
    listingTitle: string,
    dateRange: string
  ): Promise<BookingRequest[]> {

    await this.updateRequestStatus(request.id, answer.status, answer.reason);


    const text =
      answer.status === 'accepted'
        ? `Bonne nouvelle : j'ai accepté votre demande pour « ${listingTitle} » (${dateRange}).`
        : answer.message;

    if (text) {
      await this.messagingService
        .sendMessage(request.id, hostId, text)
        .catch(err => console.error('Message au demandeur non envoyé :', err));
    }


    if (answer.status !== 'accepted') {
      return [];
    }


    try {

      await this.listingService.addBookedPeriod(request);

    } catch (err) {

      /*
       * Anciennes annonces de démonstration
       * (sans ownerId) : la demande reste acceptée.
       */
      console.error('Dates non bloquées sur l\'annonce :', err);

    }


    const overlapping =
      (await this.getRequestsForOwner(hostId)).filter(other =>
        other.id !== request.id
        && other.status === 'pending'
        && other.listingId === request.listingId
        && other.arrivalDate < request.departureDate
        && request.arrivalDate < other.departureDate
      );


    await Promise.all(
      overlapping.map(async other => {

        await this.updateRequestStatus(other.id, 'rejected', 'already_booked');

        await this.messagingService
          .sendMessage(
            other.id,
            hostId,
            `« ${listingTitle} » vient d'être confirmé pour un autre séjour sur ces dates. Votre demande a été refusée automatiquement.`,
            null,
            'system'
          )
          .catch(err => console.error('Notification non envoyée :', err));

      })
    );


    return overlapping.map(other => ({
      ...other,
      status: 'rejected',
      rejectionReason: 'already_booked'
    }));

  }


  /*
   * =========================================
   * MODIFIER LES DATES (DEMANDEUR)
   * =========================================
   *
   * Seulement en attente. L'annonceur est
   * prévenu dans la conversation.
   */
  async changeRequestDates(
    request: BookingRequest,
    arrivalDate: string,
    departureDate: string
  ): Promise<void> {

    await updateDoc(
      doc(firestore, 'bookingRequests', request.id),
      {
        arrivalDate,
        departureDate,
        updatedAt: serverTimestamp()
      }
    );

    await this.messagingService
      .sendMessage(
        request.id,
        request.requesterId,
        `Dates modifiées : du ${formatIsoDate(arrivalDate)} au ${formatIsoDate(departureDate)}.`,
        null,
        'system'
      )
      .catch(err => console.error('Notification non envoyée :', err));

  }


  /*
   * Séjour confirmé annulé par l'annonceur :
   * les dates redeviennent disponibles et le
   * demandeur est prévenu. (Le demandeur ne
   * peut pas annuler.)
   */
  async cancelRequest(
    request: BookingRequest,
    userId: string
  ): Promise<void> {

    await updateDoc(
      doc(firestore, 'bookingRequests', request.id),
      {
        status: 'cancelled',
        cancelledBy: 'owner',
        updatedAt: serverTimestamp()
      }
    );


    await this.listingService
      .removeBookedPeriod(request.id)
      .catch(err => console.error('Dates non libérées :', err));


    await this.messagingService
      .sendMessage(request.id, userId, 'Séjour annulé par l\'annonceur. Les dates sont de nouveau disponibles.', null, 'system')
      .catch(err => console.error('Notification non envoyée :', err));

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
  private normalizeReason(
    reason: unknown
  ): RejectionReason | '' {

    return reason === 'dates_unavailable'
      || reason === 'already_booked'
      || reason === 'other'
      ? reason
      : '';

  }


  private normalizeStatus(
    status: unknown
  ): BookingStatus {

    if (
      status === 'accepted' ||
      status === 'rejected' ||
      status === 'cancelled'
    ) {

      return status;

    }


    return 'pending';

  }

}
