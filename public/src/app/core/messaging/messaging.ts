import { Injectable } from '@angular/core';

import {
  equalTo,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  serverTimestamp,
  update
} from 'firebase/database';

import { realtimeDatabase } from '../firebase/firebase';


export interface CreateConversationInput {

  bookingRequestId: string;

  requesterId: string;

  /*
   * UID Firebase de l'annonceur.
   *
   * Peut être vide pour les anciennes
   * annonces de démonstration.
   */
  ownerId: string;

  listingId: string;

  listingTitle: string;

  ownerName: string;

}


export interface RealtimeConversation {

  id: string;

  bookingRequestId: string;

  requesterId: string;

  /*
   * UID Firebase de l'annonceur.
   */
  ownerId: string;

  listingId: string;

  listingTitle: string;

  ownerName: string;

  lastMessage: string;

  lastMessageAt: number;

  updatedAt: number;

}


export interface RealtimeMessage {

  id: string;

  senderId: string;

  text: string;

  createdAt: number;

}


@Injectable({
  providedIn: 'root'
})
export class Messaging {


  /*
   * =========================================
   * CRÉER / INITIALISER UNE CONVERSATION
   * =========================================
   *
   * La conversation utilise directement
   * l'ID de la bookingRequest.
   *
   * bookingRequests/ABC123
   *
   * correspond à :
   *
   * conversations/ABC123
   */
  async createConversation(
    input: CreateConversationInput
  ): Promise<string> {

    const conversationId =
      input.bookingRequestId.trim();


    if (!conversationId) {

      throw new Error(
        'ID de demande manquant.'
      );

    }


    const conversationRef =
      ref(
        realtimeDatabase,
        `conversations/${conversationId}`
      );


    /*
     * update() permet de ne pas
     * écraser les messages existants.
     */
    await update(
      conversationRef,
      {

        bookingRequestId:
          conversationId,

        requesterId:
          input.requesterId,

        /*
         * Liaison avec le compte Firebase
         * de l'annonceur.
         */
        ownerId:
          input.ownerId,

        listingId:
          input.listingId,

        listingTitle:
          input.listingTitle,

        ownerName:
          input.ownerName,

        updatedAt:
          serverTimestamp()

      }
    );


    return conversationId;

  }


  /*
   * =========================================
   * ENVOYER UN MESSAGE
   * =========================================
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string
  ): Promise<void> {

    const cleanText =
      text.trim();


    if (!cleanText) {

      return;

    }


    const messagesRef =
      ref(
        realtimeDatabase,
        `conversations/${conversationId}/messages`
      );


    const newMessageRef =
      push(
        messagesRef
      );


    const messageId =
      newMessageRef.key;


    if (!messageId) {

      throw new Error(
        'Impossible de générer l’ID du message.'
      );

    }


    /*
     * Mise à jour atomique :
     *
     * - nouveau message
     * - dernier message
     * - date du dernier message
     * - date de modification
     */
    const databaseRoot =
      ref(
        realtimeDatabase
      );


    await update(
      databaseRoot,
      {

        [`conversations/${conversationId}/messages/${messageId}`]:
          {

            senderId:

              senderId,

            text:
              cleanText,

            createdAt:
              serverTimestamp()

          },

        [`conversations/${conversationId}/lastMessage`]:
          cleanText,

        [`conversations/${conversationId}/lastMessageAt`]:
          serverTimestamp(),

        [`conversations/${conversationId}/updatedAt`]:
          serverTimestamp()

      }
    );

  }


  /*
   * =========================================
   * CONVERSATIONS DU DEMANDEUR
   * =========================================
   */
  observeConversations(
    requesterId: string,
    callback:
      (
        conversations: RealtimeConversation[]
      ) => void
  ): () => void {

    const conversationsQuery =
      query(
        ref(
          realtimeDatabase,
          'conversations'
        ),

        orderByChild(
          'requesterId'
        ),

        equalTo(
          requesterId
        )
      );


    return onValue(
      conversationsQuery,

      snapshot => {

        const conversations:
          RealtimeConversation[] = [];


        snapshot.forEach(
          childSnapshot => {

            const data =
              childSnapshot.val() ?? {};


            conversations.push(
              {

                id:
                  childSnapshot.key ?? '',

                bookingRequestId:
                  data['bookingRequestId'] ?? '',

                requesterId:
                  data['requesterId'] ?? '',

                /*
                 * Les anciennes conversations
                 * peuvent ne pas avoir ownerId.
                 */
                ownerId:
                  data['ownerId'] ?? '',

                listingId:
                  data['listingId'] ?? '',

                listingTitle:
                  data['listingTitle'] ?? '',

                ownerName:
                  data['ownerName'] ?? '',

                lastMessage:
                  data['lastMessage'] ?? '',

                lastMessageAt:
                  typeof data['lastMessageAt'] === 'number'
                    ? data['lastMessageAt']
                    : 0,

                updatedAt:
                  typeof data['updatedAt'] === 'number'
                    ? data['updatedAt']
                    : 0

              }
            );

          }
        );


        /*
         * Plus récentes en premier.
         */
        conversations.sort(
          (a, b) =>
            b.lastMessageAt -
            a.lastMessageAt
        );


        callback(
          conversations
        );

      },

      error => {

        console.error(
          'Erreur écoute conversations :',
          error
        );


        callback([]);

      }
    );

  }


  /*
   * =========================================
   * ÉCOUTER LES MESSAGES
   * =========================================
   */
  observeMessages(
    conversationId: string,
    callback:
      (
        messages: RealtimeMessage[]
      ) => void
  ): () => void {

    const messagesRef =
      ref(
        realtimeDatabase,
        `conversations/${conversationId}/messages`
      );


    return onValue(
      messagesRef,

      snapshot => {

        const messages:
          RealtimeMessage[] = [];


        snapshot.forEach(
          childSnapshot => {

            const data =
              childSnapshot.val() ?? {};


            messages.push(
              {

                id:
                  childSnapshot.key ?? '',

                senderId:
                  data['senderId'] ?? '',

                text:
                  data['text'] ?? '',

                createdAt:
                  typeof data['createdAt'] === 'number'
                    ? data['createdAt']
                    : 0

              }
            );

          }
        );


        /*
         * Ordre chronologique.
         */
        messages.sort(
          (a, b) =>
            a.createdAt -
            b.createdAt
        );


        callback(
          messages
        );

      },

      error => {

        console.error(
          'Erreur écoute messages :',
          error
        );


        callback([]);

      }
    );

  }

}