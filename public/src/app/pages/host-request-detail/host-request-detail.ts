import {
  ChangeDetectorRef,
  Component,
  OnInit,
  signal
} from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { HostSidebar } from '../../shared/components/host-sidebar/host-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';
import { Listing, ListingDocument } from '../../core/listing/listing';
import { Profile, getDisplayName } from '../../core/profile/profile';
import {
  Booking,
  BookingRequest,
  BookingStatus,
  REJECTION_REASON_LABELS
} from '../../core/booking/booking';
import { Messaging } from '../../core/messaging/messaging';

import { AnswerConfirm, AnswerModal } from './components/answer-modal/answer-modal';

import { getAreaLabel } from '../host-listing-form/listing-form.data';

import {
  formatDay,
  getDateRange,
  parseDate,
  requestsOverlap,
  withDe
} from '../host-requests/request-utils';


const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'EN ATTENTE DE VOTRE RÉPONSE',
  accepted: 'ACCEPTÉE',
  rejected: 'REFUSÉE'
};


/*
 * =========================================
 * DÉTAIL D'UNE DEMANDE REÇUE (ANNONCEUR)
 * =========================================
 *
 * /host/requests/:id
 * Accepter / refuser (demande en attente),
 * répondre dans la messagerie
 * (conversation = même ID que la demande).
 */
@Component({
  selector: 'app-host-request-detail',

  standalone: true,

  imports: [
    RouterLink,
    UserNavbar,
    HostSidebar,
    ContactSection,
    Footer,
    AnswerModal
  ],

  templateUrl: './host-request-detail.html',
  styleUrl: './host-request-detail.css'
})
export class HostRequestDetail implements OnInit {

  loading =
    signal(true);

  error =
    signal('');

  saving =
    signal(false);

  actionError =
    signal('');


  request =
    signal<BookingRequest | null>(null);

  listing =
    signal<ListingDocument | null>(null);

  requesterName =
    signal('Demandeur');

  /*
   * Modale ouverte (accepter / refuser)
   */
  modal =
    signal<'accept' | 'refuse' | null>(null);

  private userId = '';


  /*
   * Autres demandes de l'annonceur
   * (chevauchement avec une demande acceptée)
   */
  private ownerRequests: BookingRequest[] = [];


  constructor(
    private readonly authService: Auth,
    private readonly bookingService: Booking,
    private readonly listingService: Listing,
    private readonly profileService: Profile,
    private readonly messagingService: Messaging,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}


  async ngOnInit(): Promise<void> {

    this.loading.set(true);

    this.error.set('');


    try {

      const user =
        await this.authService.waitForAuthState();

      if (!user) {
        this.error.set('Utilisateur non connecté.');
        return;
      }


      this.userId =
        user.uid;

      const id =
        this.route.snapshot.paramMap.get('id') ?? '';

      const [request, ownerRequests] =
        await Promise.all([
          this.bookingService.getRequestById(id),
          this.bookingService.getRequestsForOwner(user.uid)
        ]);


      if (!request || request.ownerId !== user.uid) {
        this.error.set('Demande introuvable.');
        return;
      }


      const [listing, profile] =
        await Promise.all([
          this.listingService.getListingById(request.listingId),
          this.profileService.getPublicProfile(request.requesterId).catch(() => null)
        ]);


      this.request.set(request);
      this.listing.set(listing);
      this.ownerRequests = ownerRequests;

      if (profile?.firstName) {
        this.requesterName.set(getDisplayName(profile));
      }

      this.updatePendingCount();

    } catch (err) {

      console.error('Erreur chargement demande :', err);

      this.error.set('Impossible de charger cette demande.');

    } finally {

      this.loading.set(false);

      this.cdr.detectChanges();

    }

  }


  /*
   * =========================================
   * AFFICHAGE
   * =========================================
   */

  get firstName(): string {

    return this.requesterName().split(' ')[0];

  }


  get initial(): string {

    return this.requesterName().charAt(0).toUpperCase();

  }


  get statusLabel(): string {

    const request = this.request();

    return request ? STATUS_LABELS[request.status] : '';

  }


  /*
   * « Reçue aujourd'hui à 10:05 »
   */
  get receivedLabel(): string {

    const date =
      this.request()?.createdAt?.toDate();

    if (!date) {
      return '';
    }


    const time =
      new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date);

    const today =
      new Date();

    const yesterday =
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);


    let day =
      `le ${formatDay(date, 'long', date.getFullYear() !== today.getFullYear())}`;

    if (date.toDateString() === today.toDateString()) {
      day = 'aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      day = 'hier';
    }


    return `Reçue ${day} à ${time}`;

  }


  get dateRange(): string {

    const request = this.request();

    return request ? getDateRange(request) : '';

  }


  formatDate(
    value: string
  ): string {

    const date =
      parseDate(value);

    return date ? formatDay(date, 'short', true) : '';

  }


  /*
   * « 6 mois », « 14 jours »
   */
  get duration(): string {

    const request =
      this.request();

    const from =
      parseDate(request?.arrivalDate ?? '');

    const to =
      parseDate(request?.departureDate ?? '');

    if (!from || !to) {
      return '';
    }


    const days =
      Math.round((to.getTime() - from.getTime()) / 86_400_000);

    if (days < 28) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    }

    return `${Math.round(days / 30.44)} mois`;

  }


  /*
   * « LYON, ARRONDISSEMENT 2 » (location « Lyon 2e »)
   */
  get areaLabel(): string {

    const match =
      /([1-9])/.exec(this.listing()?.location ?? '');

    return getAreaLabel(match ? Number(match[1]) : null);

  }


  /*
   * Une demande déjà acceptée chevauche
   * celle-ci : impossible d'accepter.
   */
  get acceptedOverlap(): BookingRequest | null {

    const request =
      this.request();

    if (!request) {
      return null;
    }

    return this.ownerRequests.find(other =>
      other.status === 'accepted' && requestsOverlap(request, other)
    ) ?? null;

  }


  readonly withDe =
    withDe;


  get rejectionLabel(): string {

    const reason =
      this.request()?.rejectionReason;

    return reason ? REJECTION_REASON_LABELS[reason] : '';

  }


  get acceptNote(): string {

    return `En acceptant, vous confirmez le séjour ${withDe(this.firstName)} aux dates indiquées.`;

  }


  /*
   * =========================================
   * RÉPONSE
   * =========================================
   */

  openModal(
    mode: 'accept' | 'refuse'
  ): void {

    if (mode === 'accept' && this.acceptedOverlap) {
      return;
    }

    this.actionError.set('');

    this.modal.set(mode);

  }


  closeModal(): void {

    document.body.style.overflow = '';

    this.modal.set(null);

  }


  /*
   * Enregistre la réponse, puis prévient
   * le demandeur dans la messagerie.
   */
  async onConfirm(
    answer: AnswerConfirm
  ): Promise<void> {

    const request =
      this.request();

    const mode =
      this.modal();

    if (!request || !mode || this.saving()) {
      return;
    }


    const status: BookingStatus =
      mode === 'accept' ? 'accepted' : 'rejected';


    this.saving.set(true);

    this.actionError.set('');


    try {

      await this.bookingService.updateRequestStatus(request.id, status, answer.reason);

      const updated: BookingRequest =
        { ...request, status, rejectionReason: answer.reason };

      this.request.set(updated);

      this.ownerRequests =
        this.ownerRequests.map(other => (other.id === request.id ? updated : other));

      this.updatePendingCount();

      this.closeModal();


      await this.notifyRequester(request, status, answer.message);

    } catch (err) {

      console.error('Erreur réponse demande :', err);

      this.actionError.set('La réponse n\'a pas pu être enregistrée. Réessayez.');

      this.closeModal();

    } finally {

      this.saving.set(false);

      this.cdr.detectChanges();

    }

  }


  /*
   * Message dans la conversation de la demande
   * (même ID). Sans conversation (anciennes
   * demandes), la réponse reste enregistrée.
   */
  private async notifyRequester(
    request: BookingRequest,
    status: BookingStatus,
    message: string
  ): Promise<void> {

    const listingTitle =
      this.listing()?.title ?? 'le logement';

    const text =
      status === 'accepted'
        ? `Bonne nouvelle : j'ai accepté votre demande pour « ${listingTitle} » (${getDateRange(request)}).`
        : message;

    if (!text) {
      return;
    }


    try {

      await this.messagingService.sendMessage(request.id, this.userId, text);

    } catch (err) {

      console.error('Message au demandeur non envoyé :', err);

    }

  }


  private updatePendingCount(): void {

    this.bookingService.setPendingCount(
      this.userId,
      this.ownerRequests.filter(r => r.status === 'pending').length
    );

  }

}
