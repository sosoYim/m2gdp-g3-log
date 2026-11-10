import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { DateField } from '../../../../shared/components/date-field/date-field';
import { AnswerConfirm, AnswerModal } from '../../../host-request-detail/components/answer-modal/answer-modal';

import { Booking, BookingRequest } from '../../../../core/booking/booking';
import { ListingDocument } from '../../../../core/listing/listing';
import { Media } from '../../../../core/media/media';
import { Messaging, MessageAttachment } from '../../../../core/messaging/messaging';

import {
  findBookedOverlap,
  getMinStayError,
  getStayLimits,
  isStayInAvailability
} from '../../../../core/dates/dates';

import { STATUS_LABELS, getDateRange, withDe } from '../../../host-requests/request-utils';


/*
 * =========================================
 * DEMANDE LIÉE À LA CONVERSATION
 * =========================================
 *
 * En haut du chat : résumé de la demande et
 * actions principales sans quitter la messagerie.
 *  - annonceur : accepter / refuser
 *  - demandeur : modifier les dates / annuler
 * + bail (PDF) épinglé, sur une seule ligne.
 */
@Component({
  selector: 'app-request-card',

  standalone: true,

  imports: [
    RouterLink,
    DateField,
    AnswerModal
  ],

  templateUrl: './request-card.html',
  styleUrl: './request-card.css'
})
export class RequestCard implements OnChanges {

  @Input()
  request: BookingRequest | null = null;

  @Input()
  listing: ListingDocument | null = null;

  @Input({ required: true })
  conversationId = '';

  @Input({ required: true })
  listingTitle = '';

  /*
   * L'utilisateur connecté est l'annonceur
   */
  @Input()
  isOwner = false;

  /*
   * Nom de l'interlocuteur (« Alice M. »)
   */
  @Input()
  otherName = '';

  @Input()
  userId = '';

  @Input()
  pinnedFile: MessageAttachment | null = null;


  /*
   * Demande modifiée (statut, dates)
   */
  @Output()
  changed =
    new EventEmitter<BookingRequest>();


  /*
   * Panneau ouvert sous le résumé
   */
  panel: 'dates' | 'cancel' | null = null;

  modal: 'accept' | 'refuse' | null = null;

  saving = false;

  error = '';

  arrivalDate = '';

  departureDate = '';

  private openedFor = '';


  constructor(
    private readonly bookingService: Booking,
    private readonly messagingService: Messaging,
    private readonly mediaService: Media,
    private readonly cdr: ChangeDetectorRef
  ) {}


  /*
   * Autre conversation : panneaux fermés
   */
  ngOnChanges(): void {

    if (this.request?.id !== this.openedFor) {
      this.panel = null;
      this.error = '';
      this.openedFor = this.request?.id ?? '';
    }

  }


  /*
   * =========================================
   * AFFICHAGE
   * =========================================
   */

  get status(): string {

    return this.request ? STATUS_LABELS[this.request.status] : '';

  }


  get dateRange(): string {

    return this.request ? getDateRange(this.request) : '';

  }


  get firstName(): string {

    return this.otherName.split(' ')[0] || 'le demandeur';

  }


  readonly withDe =
    withDe;


  get isPending(): boolean {

    return this.request?.status === 'pending';

  }


  /*
   * Dates déjà confirmées pour une autre
   * demande : impossible d'accepter.
   */
  get bookedOverlap(): boolean {

    const request = this.request;

    return !!request && !!findBookedOverlap(
      (this.listing?.bookedPeriods ?? []).filter(period => period.requestId !== request.id),
      request.arrivalDate,
      request.departureDate
    );

  }


  get stayLimits() {

    return getStayLimits(
      this.listing?.availableFrom ?? '',
      this.listing?.availableTo ?? '',
      this.arrivalDate
    );

  }


  /*
   * =========================================
   * ANNONCEUR : ACCEPTER / REFUSER
   * =========================================
   */

  openModal(
    mode: 'accept' | 'refuse'
  ): void {

    if (mode === 'accept' && this.bookedOverlap) {
      return;
    }

    this.error = '';

    this.modal = mode;

  }


  closeModal(): void {

    document.body.style.overflow = '';

    this.modal = null;

  }


  async onAnswer(
    answer: AnswerConfirm
  ): Promise<void> {

    const request = this.request;

    const mode = this.modal;

    if (!request || !mode || this.saving) {
      return;
    }


    const status =
      mode === 'accept' ? 'accepted' : 'rejected';


    await this.run(async () => {

      await this.bookingService.answerRequest(
        request,
        { status, reason: answer.reason, message: answer.message },
        this.userId,
        this.listingTitle,
        this.dateRange
      );

      this.changed.emit({ ...request, status, rejectionReason: answer.reason });

      void this.bookingService.refreshPendingCount(this.userId);

    }, 'La réponse n\'a pas pu être enregistrée. Réessayez.');


    this.closeModal();

  }


  /*
   * =========================================
   * DEMANDEUR : MODIFIER LES DATES / ANNULER
   * =========================================
   */

  togglePanel(
    panel: 'dates' | 'cancel'
  ): void {

    this.error = '';

    this.panel = this.panel === panel ? null : panel;

    if (this.panel === 'dates' && this.request) {
      this.arrivalDate = this.request.arrivalDate;
      this.departureDate = this.request.departureDate;
    }

  }


  setArrivalDate(
    value: string
  ): void {

    this.arrivalDate = value;

    if (this.departureDate && this.departureDate <= value) {
      this.departureDate = '';
    }

  }


  async saveDates(): Promise<void> {

    const request = this.request;

    if (!request || this.saving) {
      return;
    }


    this.error =
      this.getDatesError();

    if (this.error) {
      return;
    }


    if (
      this.arrivalDate === request.arrivalDate
      && this.departureDate === request.departureDate
    ) {
      this.panel = null;
      return;
    }


    const arrivalDate = this.arrivalDate;

    const departureDate = this.departureDate;


    await this.run(async () => {

      await this.bookingService.changeRequestDates(request, arrivalDate, departureDate);

      this.panel = null;

      this.changed.emit({ ...request, arrivalDate, departureDate });

    }, 'Les dates n\'ont pas pu être modifiées. Réessayez.');

  }


  async cancelRequest(): Promise<void> {

    const request = this.request;

    if (!request || this.saving) {
      return;
    }


    await this.run(async () => {

      await this.bookingService.cancelRequest(request);

      this.panel = null;

      this.changed.emit({ ...request, status: 'cancelled' });

    }, 'La demande n\'a pas pu être annulée. Réessayez.');

  }


  private getDatesError(): string {

    if (!this.arrivalDate || !this.departureDate) {
      return 'Choisissez une date d’arrivée et de départ.';
    }

    if (this.departureDate <= this.arrivalDate) {
      return 'La date de départ doit être après la date d’arrivée.';
    }


    const listing = this.listing;

    if (!listing) {
      return '';
    }


    if (!isStayInAvailability(listing.availableFrom, listing.availableTo, this.arrivalDate, this.departureDate)) {
      return 'Ces dates ne sont pas dans la période de disponibilité du logement.';
    }

    if (findBookedOverlap(listing.bookedPeriods, this.arrivalDate, this.departureDate)) {
      return 'Ce logement est déjà réservé sur une partie de ces dates.';
    }

    return getMinStayError(this.arrivalDate, this.departureDate, listing.minStayMonths);

  }


  /*
   * =========================================
   * BAIL ÉPINGLÉ
   * =========================================
   *
   * Même ouverture que dans le fil :
   * onglet ouvert au clic, puis fichier
   * téléchargé avec le jeton Firebase.
   */
  async openPinnedFile(): Promise<void> {

    const file = this.pinnedFile;

    if (!file) {
      return;
    }


    const tab =
      window.open('', '_blank');


    try {

      const url =
        URL.createObjectURL(await this.mediaService.fetchAttachment(file.url));

      if (tab) {
        tab.location.href = url;
      } else {
        window.location.href = url;
      }

    } catch (err) {

      console.error('Erreur ouverture du bail :', err);

      tab?.close();

      this.error = 'Le bail n\'a pas pu être ouvert.';

      this.cdr.detectChanges();

    }

  }


  async unpinFile(): Promise<void> {

    try {

      await this.messagingService.setPinnedFile(this.conversationId, null);

    } catch (err) {

      console.error('Erreur bail épinglé :', err);

      this.error = 'Le bail n\'a pas pu être retiré.';

      this.cdr.detectChanges();

    }

  }


  private async run(
    action: () => Promise<void>,
    errorMessage: string
  ): Promise<void> {

    this.saving = true;

    this.error = '';

    this.cdr.detectChanges();


    try {

      await action();

    } catch (err) {

      console.error('Erreur demande (messagerie) :', err);

      this.error = errorMessage;

    } finally {

      this.saving = false;

      this.cdr.detectChanges();

    }

  }

}
