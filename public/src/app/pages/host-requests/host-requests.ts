import {
  ChangeDetectorRef,
  Component,
  OnInit,
  signal
} from '@angular/core';

import { NgTemplateOutlet } from '@angular/common';

import { RouterLink } from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { HostSidebar } from '../../shared/components/host-sidebar/host-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';
import { Listing } from '../../core/listing/listing';
import { Profile, getDisplayName } from '../../core/profile/profile';
import {
  Booking,
  BookingRequest,
  BookingStatus,
  REJECTION_REASON_LABELS
} from '../../core/booking/booking';

import {
  STATUS_LABELS,
  getDateRange,
  requestsOverlap,
  toMillis,
  withDe
} from './request-utils';


/*
 * Nombre de demandes traitées affichées
 * sous « Traitées récemment »
 */
const RECENT_PROCESSED_COUNT = 3;


/*
 * =========================================
 * DEMANDES REÇUES (ANNONCEUR)
 * =========================================
 *
 * /host/requests
 */
@Component({
  selector: 'app-host-requests',

  standalone: true,

  imports: [
    NgTemplateOutlet,
    RouterLink,
    UserNavbar,
    HostSidebar,
    ContactSection,
    Footer
  ],

  templateUrl: './host-requests.html',
  styleUrl: './host-requests.css'
})
export class HostRequests implements OnInit {

  loading =
    signal(true);

  error =
    signal('');

  activeTab =
    signal<BookingStatus>('pending');

  requests =
    signal<BookingRequest[]>([]);


  readonly tabs: { value: BookingStatus; label: string }[] = [
    { value: 'pending', label: 'En attente' },
    { value: 'accepted', label: 'Acceptées' },
    { value: 'rejected', label: 'Refusées' }
  ];


  private listingTitles =
    new Map<string, string>();

  /*
   * Demandeur → « Alice M. » (profil public)
   */
  private requesterNames =
    new Map<string, string>();


  constructor(
    private readonly authService: Auth,
    private readonly listingService: Listing,
    private readonly bookingService: Booking,
    private readonly profileService: Profile,
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


      const [requests, listings] =
        await Promise.all([
          this.bookingService.getRequestsForOwner(user.uid),
          this.listingService.getListingsByOwner(user.uid)
        ]);


      this.listingTitles =
        new Map(listings.map(listing => [listing.id, listing.title]));


      const requesterIds =
        [...new Set(requests.map(r => r.requesterId).filter(Boolean))];

      const profiles =
        await Promise.all(
          requesterIds.map(uid =>
            this.profileService.getPublicProfile(uid).catch(() => null)
          )
        );

      requesterIds.forEach((uid, i) => {
        const profile = profiles[i];
        if (profile?.firstName) {
          this.requesterNames.set(uid, getDisplayName(profile));
        }
      });

      this.requests.set(requests);

    } catch (err) {

      console.error('Erreur chargement demandes reçues :', err);

      this.error.set('Impossible de charger vos demandes.');

    } finally {

      this.loading.set(false);

      this.cdr.detectChanges();

    }

  }


  /*
   * =========================================
   * LISTES
   * =========================================
   */

  countFor(
    status: BookingStatus
  ): number {

    return this.requests().filter(r => r.status === status).length;

  }


  /*
   * Demandes de l'onglet actif,
   * les plus récentes d'abord
   */
  get visibleRequests(): BookingRequest[] {

    return this.requests()
      .filter(r => r.status === this.activeTab())
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

  }


  /*
   * Onglet « En attente » : dernières
   * demandes acceptées ou refusées
   */
  get recentProcessed(): BookingRequest[] {

    return this.requests()
      .filter(r => r.status !== 'pending')
      .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt))
      .slice(0, RECENT_PROCESSED_COUNT);

  }


  /*
   * « Les demandes d'Alice et de Hugo portent
   * sur des dates qui se chevauchent »
   * (demandes en attente, même annonce)
   */
  get overlapMessage(): string {

    const pending =
      this.requests().filter(r => r.status === 'pending');

    const overlapping =
      new Set<BookingRequest>();


    for (const a of pending) {

      for (const b of pending) {

        if (requestsOverlap(a, b)) {
          overlapping.add(a);
          overlapping.add(b);
        }

      }

    }


    if (!overlapping.size) {
      return '';
    }


    const names =
      [...new Set([...overlapping].map(r => this.getFirstName(r)))]
        .map(withDe);

    const list =
      names.length > 1
        ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`
        : names[0];


    return `Les demandes ${list} portent sur des dates qui se chevauchent : une seule peut être acceptée.`;

  }


  /*
   * =========================================
   * AFFICHAGE
   * =========================================
   */

  getRequesterName(
    request: BookingRequest
  ): string {

    return this.requesterNames.get(request.requesterId) ?? 'Demandeur';

  }


  getFirstName(
    request: BookingRequest
  ): string {

    return this.getRequesterName(request).split(' ')[0];

  }


  getInitial(
    request: BookingRequest
  ): string {

    return this.getRequesterName(request).charAt(0).toUpperCase();

  }


  getStatusLabel(
    request: BookingRequest
  ): string {

    return STATUS_LABELS[request.status];

  }


  getListingTitle(
    request: BookingRequest
  ): string {

    return this.listingTitles.get(request.listingId) || 'Annonce';

  }


  readonly getDateRange =
    getDateRange;


  /*
   * « reçue hier », « refusée il y a 3 jours »,
   * « déjà réservé » (motif de refus)
   */
  getTimeLabel(
    request: BookingRequest
  ): string {

    /*
     * Refusée avec motif : « dates indisponibles »
     */
    if (request.status === 'rejected' && request.rejectionReason) {
      const label = REJECTION_REASON_LABELS[request.rejectionReason];
      return label.charAt(0).toLowerCase() + label.slice(1);
    }


    const verb =
      request.status === 'pending'
        ? 'reçue'
        : request.status === 'accepted' ? 'acceptée' : 'refusée';

    const date =
      request.status === 'pending' ? request.createdAt : request.updatedAt;

    if (!date) {
      return '';
    }


    const days =
      Math.floor((Date.now() - date.toMillis()) / 86_400_000);


    if (days <= 0) {
      return `${verb} aujourd'hui`;
    }

    if (days === 1) {
      return `${verb} hier`;
    }

    return `${verb} il y a ${days} jours`;

  }

}
