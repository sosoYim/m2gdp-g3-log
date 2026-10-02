import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';

import { firestore } from '../firebase/firebase';


export type BookingStatus = 'pending' | 'accepted' | 'rejected';


export interface CreateBookingRequest {
  listingId: string;
  requesterId: string;
  ownerName: string;

  arrivalDate: string;
  departureDate: string;

  message: string;
}


@Injectable({
  providedIn: 'root'
})
export class Booking {

  async createRequest(
    request: CreateBookingRequest
  ): Promise<string> {

    const bookingRequestsRef = collection(
      firestore,
      'bookingRequests'
    );


    const documentReference = await addDoc(
      bookingRequestsRef,
      {
        listingId: request.listingId,

        requesterId: request.requesterId,

        ownerName: request.ownerName,

        arrivalDate: request.arrivalDate,

        departureDate: request.departureDate,

        message: request.message.trim(),

        status: 'pending' as BookingStatus,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );


    return documentReference.id;
  }

}