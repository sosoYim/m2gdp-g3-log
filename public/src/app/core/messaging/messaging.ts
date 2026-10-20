import { Injectable, signal } from '@angular/core';

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

  /*
   * Auteur du dernier message
   * ('' pour les anciennes conversations)
   */
  lastSenderId: string;

  /*
   * Dernière lecture par utilisateur :
   * { uid: timestamp }
   */
  readBy: Record<string, number>;

  updatedAt: number;

}


export interface RealtimeMessage {

  id: string;

  senderId: string;

  text: string;

  createdAt: number;

}


/*
 * Messages non lus (point violet de la barre
 * du haut), mémorisé dans le navigateur pour
 * l'afficher dès l'ouverture de chaque page.
 */
const UNREAD_STORAGE_KEY = 'baillyon.hasUnread';

function readStoredUnread(): { uid: string; unread: boolean } | null {

  try {

    const value =
      JSON.parse(localStorage.getItem(UNREAD_STORAGE_KEY) ?? 'null');

    return typeof value?.uid === 'string' && typeof value?.unread === 'boolean'
      ? value
      : null;

  } catch {

    return null;

  }

}


export function isConversationUnread(
  conversation: RealtimeConversation,
  userId: string
): boolean {

  return !!conversation.lastSenderId
    && conversation.lastSenderId !== userId
    && conversation.lastMessageAt > (conversation.readBy[userId] ?? 0);

}


@Injectable({
  providedIn: 'root'
})
export class Messaging {


  /*
   * Partagé par toutes les barres du haut :
   * une seule écoute en temps réel par compte.
   */
  readonly hasUnread =
    signal(readStoredUnread()?.unread ?? false);


  private unreadUserId = '';

  private stopUnread: (() => void) | null = null;


  watchUnread(
    userId: string
  ): void {

    if (this.unreadUserId === userId) {
      return;
    }


    this.stopWatchingUnread();

    this.unreadUserId = userId;


    /*
     * Autre compte que celui mémorisé :
     * on n'affiche pas son ancien état.
     */
    if (readStoredUnread()?.uid !== userId) {
      this.hasUnread.set(false);
    }


    this.stopUnread =
      this.observeConversations(userId, conversations => {

        const unread =
          conversations.some(c => isConversationUnread(c, userId));

        this.hasUnread.set(unread);

        try {
          localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify({ uid: userId, unread }));
        } catch {}

      });

  }


  /*
   * Déconnexion
   */
  stopWatchingUnread(): void {

    this.stopUnread?.();

    this.stopUnread = null;

    this.unreadUserId = '';

  }


  clearUnread(): void {

    this.stopWatchingUnread();

    this.hasUnread.set(false);

    try {
      localStorage.removeItem(UNREAD_STORAGE_KEY);
    } catch {}

  }


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

        [`conversations/${conversationId}/lastSenderId`]:
          senderId,

        /*
         * L'expéditeur a forcément lu
         * la conversation.
         */
        [`conversations/${conversationId}/readBy/${senderId}`]:
          serverTimestamp(),

        [`conversations/${conversationId}/updatedAt`]:
          serverTimestamp()

      }
    );

  }


  /*
   * =========================================
   * CONVERSATIONS DE L'UTILISATEUR
   * =========================================
   *
   * Deux écoutes temps réel : comme
   * demandeur (requesterId) et comme
   * annonceur (ownerId), fusionnées.
   */
  observeConversations(
    userId: string,
    callback:
      (
        conversations: RealtimeConversation[]
      ) => void
  ): () => void {

    const byRole =
      new Map<'requesterId' | 'ownerId', RealtimeConversation[]>();


    const emit = () => {

      /*
       * Attendre les deux écoutes (demandeur
       * et annonceur) : pas de liste partielle.
       */
      if (byRole.size < 2) {
        return;
      }

      const merged =
        new Map<string, RealtimeConversation>();

      for (const list of byRole.values()) {
        for (const conversation of list) {
          merged.set(conversation.id, conversation);
        }
      }


      /*
       * Plus récentes en premier.
       */
      callback(
        [...merged.values()].sort(
          (a, b) =>
            (b.lastMessageAt || b.updatedAt) -
            (a.lastMessageAt || a.updatedAt)
        )
      );

    };


    const unsubscribers =
      (['requesterId', 'ownerId'] as const).map(field =>

        onValue(
          query(
            ref(realtimeDatabase, 'conversations'),
            orderByChild(field),
            equalTo(userId)
          ),

          snapshot => {

            const conversations: RealtimeConversation[] = [];

            snapshot.forEach(childSnapshot => {

              conversations.push(
                this.mapConversation(
                  childSnapshot.key ?? '',
                  childSnapshot.val() ?? {}
                )
              );

            });

            byRole.set(field, conversations);

            emit();

          },

          error => {

            console.error(
              `Erreur écoute conversations (${field}) :`,
              error
            );

            byRole.set(field, []);

            emit();

          }
        )

      );


    return () =>
      unsubscribers.forEach(unsubscribe => unsubscribe());

  }


  /*
   * =========================================
   * MARQUER COMME LU
   * =========================================
   */
  async markAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {

    await update(
      ref(realtimeDatabase, `conversations/${conversationId}/readBy`),
      {
        [userId]: serverTimestamp()
      }
    );

  }


  private mapConversation(
    id: string,
    data: Record<string, any>
  ): RealtimeConversation {

    const readBy: Record<string, number> = {};

    for (const [uid, value] of Object.entries(data['readBy'] ?? {})) {
      if (typeof value === 'number') {
        readBy[uid] = value;
      }
    }


    return {

      id,

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

      lastSenderId:
        data['lastSenderId'] ?? '',

      readBy,

      updatedAt:
        typeof data['updatedAt'] === 'number'
          ? data['updatedAt']
          : 0

    };

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