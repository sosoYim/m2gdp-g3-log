import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { AccountSidebar } from '../../shared/components/account-sidebar/account-sidebar';
import { HostSidebar } from '../../shared/components/host-sidebar/host-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';
import { Profile, getDisplayName } from '../../core/profile/profile';
import { Listing } from '../../core/listing/listing';
import { Booking, BookingStatus } from '../../core/booking/booking';

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


/*
 * Messages regroupés par jour
 * (« Aujourd'hui », « Hier », « lundi 12 octobre »)
 */
interface MessageGroup {
  label: string;

  messages: ChatMessage[];
}


interface Conversation {
  id: string;

  listingId: string;

  /*
   * L'utilisateur connecté est l'annonceur
   */
  isOwner: boolean;

  /*
   * Nom de l'interlocuteur
   */
  name: string;

  initial: string;

  listingTitle: string;

  preview: string;

  time: string;

  unread: boolean;
}


/*
 * Demande liée à la conversation
 * (même ID) : statut + photo de l'annonce
 */
interface RequestSummary {
  status: BookingStatus;

  image: string;
}


const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'EN ATTENTE',
  accepted: 'ACCEPTÉE',
  rejected: 'REFUSÉE'
};


@Component({
  selector: 'app-messages',

  standalone: true,

  imports: [
    FormsModule,
    RouterLink,
    UserNavbar,
    AccountSidebar,
    HostSidebar,
    ContactSection,
    Footer
  ],

  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class Messages implements OnInit, OnDestroy {

  @ViewChild('chatBody')
  chatBody?: ElementRef<HTMLElement>;


  searchTerm = '';

  selectedConversationId = '';

  messageText = '';

  sending = false;

  sendError = '';

  loading = true;


  /*
   * Mobile : liste OU conversation
   */
  mobileChatOpen = false;

  /*
   * Menu latéral selon le rôle
   * (Je viens / J'accueille)
   */
  get isHost(): boolean {

    return this.profileService.currentRole() === 'host';

  }


  conversations: Conversation[] = [];

  messageGroups: MessageGroup[] = [];


  private realtimeConversations: RealtimeConversation[] = [];

  private requesterNames =
    new Map<string, string>();

  private requestSummaries =
    new Map<string, RequestSummary>();

  private unsubscribeConversations:
    (() => void) | null = null;

  private unsubscribeMessages:
    (() => void) | null = null;

  private currentUserId = '';


  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: Auth,
    private readonly profileService: Profile,
    private readonly listingService: Listing,
    private readonly bookingService: Booking,
    private readonly messagingService: Messaging,
    private readonly cdr: ChangeDetectorRef
  ) {}


  async ngOnInit(): Promise<void> {

    const user =
      await this.authService.waitForAuthState();

    if (!user) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }


    this.currentUserId =
      user.uid;


    /*
     * /messages?conversationId=... (depuis
     * une demande) : conversation ouverte.
     */
    const requestedConversationId =
      this.route.snapshot.queryParamMap.get('conversationId') ?? '';

    if (requestedConversationId) {
      this.mobileChatOpen = true;
    }


    /*
     * Écoute temps réel des conversations
     * (comme demandeur et comme annonceur)
     */
    this.unsubscribeConversations =
      this.messagingService.observeConversations(
        user.uid,

        realtimeConversations => {

          this.loading = false;

          this.realtimeConversations = realtimeConversations;

          this.refreshConversations();

          void this.loadMissingDetails();


          if (!this.conversations.length) {

            this.selectedConversationId = '';

            this.messageGroups = [];

            this.stopMessagesListener();

            this.cdr.detectChanges();

            return;

          }


          const exists = (id: string) =>
            !!id && this.conversations.some(c => c.id === id);


          if (!this.selectedConversationId && exists(requestedConversationId)) {

            this.activateConversation(requestedConversationId);

          } else if (!exists(this.selectedConversationId)) {

            this.activateConversation(this.conversations[0].id);

          } else {

            /*
             * Nouveau message dans la conversation
             * ouverte : elle reste lue.
             */
            this.markSelectedAsRead();

            this.cdr.detectChanges();

          }

        }
      );

  }


  ngOnDestroy(): void {

    this.unsubscribeConversations?.();

    this.unsubscribeConversations = null;

    this.stopMessagesListener();

  }


  /*
   * =========================================
   * LISTE DES CONVERSATIONS
   * =========================================
   */

  get filteredConversations(): Conversation[] {

    const search =
      this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.conversations;
    }

    return this.conversations.filter(conversation =>
      conversation.name.toLowerCase().includes(search)
      || conversation.listingTitle.toLowerCase().includes(search)
    );

  }


  get selectedConversation(): Conversation | null {

    return this.conversations.find(
      conversation => conversation.id === this.selectedConversationId
    ) ?? null;

  }


  get selectedSummary(): RequestSummary | null {

    return this.requestSummaries.get(this.selectedConversationId) ?? null;

  }


  get selectedStatusLabel(): string {

    const summary =
      this.selectedSummary;

    return summary ? STATUS_LABELS[summary.status] : '';

  }


  get unreadCount(): number {

    return this.conversations.filter(c => c.unread).length;

  }


  selectConversation(
    conversation: Conversation
  ): void {

    this.mobileChatOpen = true;

    this.activateConversation(conversation.id);

    this.markSelectedAsRead();

  }


  backToList(): void {

    this.mobileChatOpen = false;

  }


  private refreshConversations(): void {

    this.conversations =
      this.realtimeConversations.map(conversation =>
        this.mapConversation(conversation)
      );

  }


  /*
   * Noms des demandeurs (profil public) et
   * résumé des demandes, chargés une fois.
   */
  private async loadMissingDetails(): Promise<void> {

    const tasks: Promise<void>[] = [];


    for (const conversation of this.realtimeConversations) {

      const requesterId =
        conversation.requesterId;

      if (
        conversation.ownerId === this.currentUserId
        && requesterId
        && !this.requesterNames.has(requesterId)
      ) {

        this.requesterNames.set(requesterId, '');

        tasks.push(
          this.profileService.getPublicProfile(requesterId)
            .then(profile => {
              if (profile?.firstName) {
                this.requesterNames.set(requesterId, getDisplayName(profile));
              }
            })
            .catch(() => undefined)
        );

      }


      if (!this.requestSummaries.has(conversation.id)) {

        this.requestSummaries.set(conversation.id, { status: 'pending', image: '' });

        tasks.push(this.loadSummary(conversation));

      }

    }


    if (!tasks.length) {
      return;
    }


    await Promise.all(tasks);

    this.refreshConversations();

    this.cdr.detectChanges();

  }


  private async loadSummary(
    conversation: RealtimeConversation
  ): Promise<void> {

    try {

      const [request, listing] =
        await Promise.all([
          this.bookingService.getRequestById(conversation.bookingRequestId || conversation.id),
          conversation.listingId
            ? this.listingService.getListingById(conversation.listingId)
            : null
        ]);

      this.requestSummaries.set(conversation.id, {
        status: request?.status ?? 'pending',
        image: listing?.image ?? ''
      });

    } catch (err) {

      console.error('Erreur résumé conversation :', err);

    }

  }


  /*
   * =========================================
   * CONVERSATION OUVERTE
   * =========================================
   */

  private activateConversation(
    conversationId: string
  ): void {

    if (!conversationId) {
      return;
    }


    if (
      this.selectedConversationId === conversationId
      && this.unsubscribeMessages
    ) {
      this.cdr.detectChanges();
      return;
    }


    this.selectedConversationId = conversationId;

    this.sendError = '';

    this.stopMessagesListener();

    this.messageGroups = [];


    this.unsubscribeMessages =
      this.messagingService.observeMessages(
        conversationId,

        realtimeMessages => {

          this.messageGroups =
            this.groupByDay(realtimeMessages);

          this.cdr.detectChanges();

          this.scrollToBottom();

        }
      );


    this.markSelectedAsRead();

    this.cdr.detectChanges();

  }


  private stopMessagesListener(): void {

    this.unsubscribeMessages?.();

    this.unsubscribeMessages = null;

  }


  private markSelectedAsRead(): void {

    const conversation =
      this.selectedConversation;

    if (!conversation?.unread || !this.isChatVisible) {
      return;
    }


    conversation.unread = false;

    this.messagingService
      .markAsRead(conversation.id, this.currentUserId)
      .catch(err => console.error('Erreur lecture conversation :', err));

  }


  private scrollToBottom(): void {

    setTimeout(() => {

      const element =
        this.chatBody?.nativeElement;

      if (element) {
        element.scrollTop = element.scrollHeight;
      }

    });

  }


  /*
   * =========================================
   * ENVOYER UN MESSAGE
   * =========================================
   */

  async sendMessage(): Promise<void> {

    const text =
      this.messageText.trim();

    if (!text || this.sending || !this.currentUserId || !this.selectedConversationId) {
      return;
    }


    this.sending = true;

    this.sendError = '';


    try {

      /*
       * Le listener temps réel affiche
       * le message (chez les deux personnes).
       */
      await this.messagingService.sendMessage(
        this.selectedConversationId,
        this.currentUserId,
        text
      );

      this.messageText = '';

    } catch (error) {

      console.error('Erreur envoi message :', error);

      this.sendError = 'Message non envoyé. Réessayez.';

    } finally {

      this.sending = false;

      this.cdr.detectChanges();

    }

  }


  /*
   * =========================================
   * MAPPING FIREBASE → INTERFACE
   * =========================================
   */

  private mapConversation(
    conversation: RealtimeConversation
  ): Conversation {

    const isOwner =
      conversation.ownerId === this.currentUserId;

    const name =
      isOwner
        ? this.requesterNames.get(conversation.requesterId) || 'Demandeur'
        : conversation.ownerName || 'Annonceur';


    /*
     * Non lu : dernier message de l'autre
     * personne, plus récent que ma dernière lecture.
     */
    const unread =
      !!conversation.lastSenderId
      && conversation.lastSenderId !== this.currentUserId
      && conversation.lastMessageAt > (conversation.readBy[this.currentUserId] ?? 0);


    const previewPrefix =
      conversation.lastSenderId === this.currentUserId ? 'Vous : ' : '';


    return {
      id: conversation.id,
      listingId: conversation.listingId,
      isOwner,
      name,
      initial: name.charAt(0).toUpperCase() || '?',
      listingTitle: conversation.listingTitle || 'Logement BailLyon',
      preview: conversation.lastMessage
        ? previewPrefix + conversation.lastMessage
        : 'Nouvelle conversation',
      time: this.formatConversationTime(conversation.lastMessageAt || conversation.updatedAt),
      unread
    };

  }


  /*
   * Desktop : conversation toujours visible ;
   * mobile : seulement quand elle est ouverte.
   */
  private get isChatVisible(): boolean {

    return this.mobileChatOpen || window.innerWidth > 760;

  }


  private groupByDay(
    messages: RealtimeMessage[]
  ): MessageGroup[] {

    const groups: MessageGroup[] = [];


    for (const message of messages) {

      const label =
        this.formatDayLabel(message.createdAt || Date.now());

      let group =
        groups[groups.length - 1];

      if (!group || group.label !== label) {
        group = { label, messages: [] };
        groups.push(group);
      }


      group.messages.push({
        id: message.id,
        text: message.text,
        sender: message.senderId === this.currentUserId ? 'me' : 'other',
        time: this.formatTime(message.createdAt)
      });

    }


    return groups;

  }


  /*
   * =========================================
   * FORMATAGE DES DATES
   * =========================================
   */

  private formatTime(
    timestamp: number
  ): string {

    if (!timestamp) {
      return '';
    }

    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
      .format(new Date(timestamp));

  }


  private formatDayLabel(
    timestamp: number
  ): string {

    const date = new Date(timestamp);

    const today = new Date();

    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);


    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }


    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {})
    }).format(date);

  }


  /*
   * Liste : heure si aujourd'hui,
   * « Hier », sinon date courte.
   */
  private formatConversationTime(
    timestamp: number
  ): string {

    if (!timestamp) {
      return '';
    }


    const label =
      this.formatDayLabel(timestamp);

    if (label === 'Aujourd\'hui') {
      return this.formatTime(timestamp);
    }

    if (label === 'Hier') {
      return label;
    }


    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' })
      .format(new Date(timestamp));

  }

}
