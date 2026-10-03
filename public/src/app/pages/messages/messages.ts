import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { AccountSidebar } from '../../shared/components/account-sidebar/account-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';

import {
  Messaging,
  RealtimeConversation,
  RealtimeMessage
} from '../../core/messaging/messaging';


interface ChatMessage {
  id: string;

  text: string;

  sender:
    | 'me'
    | 'other';

  time: string;
}


interface Conversation {
  id: string;

  bookingRequestId: string;

  listingId: string;

  name: string;

  initial: string;

  listingTitle: string;

  preview: string;

  time: string;

  unread: boolean;
}


@Component({
  selector: 'app-messages',

  standalone: true,

  imports: [
    FormsModule,
    UserNavbar,
    AccountSidebar,
    ContactSection,
    Footer
  ],

  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class Messages implements OnInit, OnDestroy {

  searchTerm = '';

  selectedConversationId = '';

  messageText = '';


  conversations: Conversation[] = [];

  messages: ChatMessage[] = [];


  /*
   * Utilisé lorsque l'utilisateur
   * ne possède encore aucune conversation.
   *
   * Cela évite une erreur dans le template.
   */
  private readonly emptyConversation: Conversation = {

    id: '',

    bookingRequestId: '',

    listingId: '',

    name: 'Conversation',

    initial: '?',

    listingTitle: '',

    preview: '',

    time: '',

    unread: false

  };


  /*
   * Fonctions permettant d'arrêter
   * les listeners Firebase.
   */
  private unsubscribeConversations:
    (() => void) | null = null;

  private unsubscribeMessages:
    (() => void) | null = null;


  /*
   * UID de l'utilisateur connecté.
   */
  private currentUserId = '';


  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: Auth,
    private readonly messagingService: Messaging,
    private readonly cdr: ChangeDetectorRef
  ) {}


  async ngOnInit(): Promise<void> {

    /*
     * On attend la restauration
     * de Firebase Auth.
     */
    const user =
      await this.authService.waitForAuthState();


    if (!user) {
      return;
    }


    this.currentUserId =
      user.uid;


    /*
     * Si on arrive depuis :
     *
     * /booking-confirmation
     *
     * on reçoit :
     *
     * /messages?conversationId=...
     */
    const requestedConversationId =
      this.route.snapshot.queryParamMap.get(
        'conversationId'
      ) ?? '';


    /*
     * Écoute en temps réel des conversations.
     */
    this.unsubscribeConversations =
      this.messagingService.observeConversations(
        user.uid,

        realtimeConversations => {

          this.conversations =
            realtimeConversations.map(
              conversation =>
                this.mapConversation(
                  conversation
                )
            );


          /*
           * Aucune conversation.
           */
          if (
            this.conversations.length === 0
          ) {

            this.selectedConversationId =
              '';

            this.messages =
              [];

            this.stopMessagesListener();

            this.cdr.detectChanges();

            return;

          }


          /*
           * Priorité à la conversation
           * demandée dans l'URL.
           */
          const requestedExists =
            requestedConversationId &&
            this.conversations.some(
              conversation =>
                conversation.id ===
                requestedConversationId
            );


          if (requestedExists) {

            this.activateConversation(
              requestedConversationId
            );

            return;

          }


          /*
           * Si la conversation actuellement
           * sélectionnée existe toujours,
           * on la conserve.
           */
          const currentExists =
            this.selectedConversationId &&
            this.conversations.some(
              conversation =>
                conversation.id ===
                this.selectedConversationId
            );


          if (currentExists) {

            this.cdr.detectChanges();

            return;

          }


          /*
           * Sinon on ouvre automatiquement
           * la conversation la plus récente.
           */
          this.activateConversation(
            this.conversations[0].id
          );

        }
      );

  }


  ngOnDestroy(): void {

    if (
      this.unsubscribeConversations
    ) {

      this.unsubscribeConversations();

      this.unsubscribeConversations =
        null;

    }


    this.stopMessagesListener();

  }


  /*
   * =========================================
   * RECHERCHE
   * =========================================
   */

  get filteredConversations(): Conversation[] {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();


    if (!search) {

      return this.conversations;

    }


    return this.conversations.filter(
      conversation =>

        conversation.name
          .toLowerCase()
          .includes(search)

        ||

        conversation.listingTitle
          .toLowerCase()
          .includes(search)
    );

  }


  /*
   * =========================================
   * CONVERSATION SÉLECTIONNÉE
   * =========================================
   */

  get selectedConversation(): Conversation {

    return (
      this.conversations.find(
        conversation =>
          conversation.id ===
          this.selectedConversationId
      )

      ??

      this.conversations[0]

      ??

      this.emptyConversation
    );

  }


  get hasConversations(): boolean {

    return this.conversations.length > 0;

  }


  selectConversation(
    conversation: Conversation
  ): void {

    this.activateConversation(
      conversation.id
    );


    /*
     * Pour le moment, unread reste local.
     *
     * On pourra ajouter plus tard un vrai
     * système de messages lus/non lus.
     */
    conversation.unread =
      false;

  }


  /*
   * =========================================
   * ACTIVER UNE CONVERSATION
   * =========================================
   */

  private activateConversation(
    conversationId: string
  ): void {

    if (!conversationId) {
      return;
    }


    /*
     * Si on écoute déjà exactement
     * cette conversation, inutile
     * de recréer le listener.
     */
    if (
      this.selectedConversationId ===
        conversationId
      &&
      this.unsubscribeMessages
    ) {

      this.cdr.detectChanges();

      return;

    }


    this.selectedConversationId =
      conversationId;


    /*
     * Arrêt de l'ancienne conversation.
     */
    this.stopMessagesListener();


    /*
     * Évite d'afficher pendant quelques
     * millisecondes les messages
     * de l'ancienne conversation.
     */
    this.messages =
      [];


    /*
     * Écoute temps réel des vrais messages.
     */
    this.unsubscribeMessages =
      this.messagingService.observeMessages(
        conversationId,

        realtimeMessages => {

          this.messages =
            realtimeMessages.map(
              message =>
                this.mapMessage(
                  message
                )
            );


          this.cdr.detectChanges();

        }
      );


    this.cdr.detectChanges();

  }


  private stopMessagesListener(): void {

    if (
      this.unsubscribeMessages
    ) {

      this.unsubscribeMessages();

      this.unsubscribeMessages =
        null;

    }

  }


  /*
   * =========================================
   * ENVOYER UN MESSAGE
   * =========================================
   */

  async sendMessage(): Promise<void> {

    const text =
      this.messageText.trim();


    if (!text) {
      return;
    }


    if (
      !this.currentUserId ||
      !this.selectedConversationId
    ) {
      return;
    }


    try {

      /*
       * Écriture réelle dans
       * Firebase Realtime Database.
       */
      await this.messagingService.sendMessage(
        this.selectedConversationId,
        this.currentUserId,
        text
      );


      /*
       * On ne push PAS manuellement
       * dans this.messages.
       *
       * Le listener Firebase reçoit
       * automatiquement le nouveau message.
       */
      this.messageText =
        '';


      this.cdr.detectChanges();


    } catch (error) {

      console.error(
        'Erreur envoi message :',
        error
      );

    }

  }


  /*
   * =========================================
   * OUVRIR LE LOGEMENT
   * =========================================
   */

  async openListing(): Promise<void> {

    const listingId =
      this.selectedConversation.listingId;


    if (!listingId) {
      return;
    }


    await this.router.navigate([
      '/property-details',
      listingId
    ]);

  }


  /*
   * =========================================
   * MAPPING FIREBASE → INTERFACE
   * =========================================
   */

  private mapConversation(
    conversation: RealtimeConversation
  ): Conversation {

    const ownerName =
      conversation.ownerName ||
      'Annonceur';


    return {

      id:
        conversation.id,

      bookingRequestId:
        conversation.bookingRequestId,

      listingId:
        conversation.listingId,

      name:
        ownerName,

      initial:
        ownerName
          .charAt(0)
          .toUpperCase() || '?',

      listingTitle:
        conversation.listingTitle ||
        'Logement BailLyon',

      preview:
        conversation.lastMessage ||
        'Nouvelle conversation',

      time:
        this.formatConversationTime(
          conversation.lastMessageAt ||
          conversation.updatedAt
        ),

      unread:
        false

    };

  }


  private mapMessage(
    message: RealtimeMessage
  ): ChatMessage {

    return {

      id:
        message.id,

      text:
        message.text,

      sender:
        message.senderId ===
        this.currentUserId
          ? 'me'
          : 'other',

      time:
        this.formatMessageTime(
          message.createdAt
        )

    };

  }


  /*
   * =========================================
   * FORMATAGE DES HEURES
   * =========================================
   */

  private formatMessageTime(
    timestamp: number
  ): string {

    if (!timestamp) {
      return '';
    }


    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        hour:
          '2-digit',

        minute:
          '2-digit'
      }
    ).format(
      new Date(timestamp)
    );

  }


  private formatConversationTime(
    timestamp: number
  ): string {

    if (!timestamp) {
      return '';
    }


    const date =
      new Date(timestamp);

    const today =
      new Date();


    const sameDay =
      date.getFullYear() ===
        today.getFullYear()

      &&

      date.getMonth() ===
        today.getMonth()

      &&

      date.getDate() ===
        today.getDate();


    if (sameDay) {

      return this.formatMessageTime(
        timestamp
      );

    }


    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day:
          '2-digit',

        month:
          '2-digit'
      }
    ).format(
      date
    );

  }

}