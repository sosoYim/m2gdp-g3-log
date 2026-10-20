import {
  ChangeDetectorRef,
  Component,
  OnInit,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { Timestamp } from 'firebase/firestore';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { HostSidebar } from '../../shared/components/host-sidebar/host-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';
import { Profile, getDisplayName } from '../../core/profile/profile';
import { Listing, ListingDocument } from '../../core/listing/listing';
import { Booking, BookingRequest } from '../../core/booking/booking';

import { HostOnboarding } from './components/host-onboarding/host-onboarding';
import { EmptyRequests } from './components/empty-requests/empty-requests';


interface RequesterInfo {
  name: string;
  initial: string;
}


@Component({
  selector: 'app-host-dashboard',

  standalone: true,

  imports: [
    RouterLink,
    UserNavbar,
    HostSidebar,
    HostOnboarding,
    EmptyRequests,
    ContactSection,
    Footer
  ],

  templateUrl: './host-dashboard.html',
  styleUrl: './host-dashboard.css'
})
export class HostDashboard implements OnInit {

  /*
   * =========================================
   * ÉTAT GÉNÉRAL
   * =========================================
   */

  loading =
    signal(true);


  error =
    signal('');


  /*
   * =========================================
   * PROFIL
   * =========================================
   */

  firstName =
    signal('');


  /*
   * =========================================
   * ANNONCES
   * =========================================
   */

  listings =
    signal<ListingDocument[]>([]);


  /*
   * =========================================
   * DEMANDES REÇUES
   * =========================================
   */

  requests =
    signal<BookingRequest[]>([]);


  /*
   * =========================================
   * CACHE DES PROFILS DEMANDEURS
   * =========================================
   */

  private readonly requesterMap =
    new Map<string, RequesterInfo>();


  constructor(
    private readonly authService: Auth,
    private readonly profileService: Profile,
    private readonly listingService: Listing,
    private readonly bookingService: Booking,
    private readonly cdr: ChangeDetectorRef
  ) {}


  async ngOnInit(): Promise<void> {

    this.loading.set(true);

    this.error.set('');


    try {

      /*
       * On attend que Firebase
       * restaure la session utilisateur.
       */
      const user =
        await this.authService.waitForAuthState();


      if (!user) {

        this.error.set(
          'Utilisateur non connecté.'
        );

        return;

      }


      /*
       * =========================================
       * CHARGEMENT DU PROFIL
       * =========================================
       */
      const profile =
        await this.profileService.getProfile(
          user.uid
        );


      if (profile?.firstName) {

        this.firstName.set(
          profile.firstName
        );

      }


      /*
       * =========================================
       * CHARGEMENT EN PARALLÈLE
       * =========================================
       */
      const [listings, requests] =
        await Promise.all([
          this.listingService.getListingsByOwner(
            user.uid
          ),
          this.bookingService.getRequestsForOwner(
            user.uid
          )
        ]);


      this.listings.set(listings);

      this.requests.set(requests);


      /*
       * =========================================
       * CHARGEMENT DES PROFILS DEMANDEURS
       * =========================================
       *
       * On charge uniquement les demandeurs
       * des 3 premières demandes.
       */
      await this.loadRequesterProfiles(
        requests.slice(0, 3)
      );


      this.cdr.detectChanges();


    } catch (err) {

      console.error(
        'Erreur chargement tableau de bord annonceur :',
        err
      );


      this.error.set(
        'Impossible de charger le tableau de bord.'
      );


    } finally {

      this.loading.set(false);

    }

  }


  /*
   * =========================================
   * CHARGEMENT DES PROFILS DEMANDEURS
   * =========================================
   */

  private async loadRequesterProfiles(
    requests: BookingRequest[]
  ): Promise<void> {

    const requesterIds =
      [
        ...new Set(
          requests
            .map(r => r.requesterId)
            .filter(Boolean)
        )
      ];


    await Promise.all(
      requesterIds.map(
        async uid => {

          try {

            /*
             * Profil public : l'annonceur ne
             * peut pas lire users/{uid}.
             */
            const profile =
              await this.profileService.getPublicProfile(uid);


            if (!profile?.firstName) {
              return;
            }


            this.requesterMap.set(
              uid,
              {
                name:
                  getDisplayName(profile),

                initial:
                  profile.firstName
                    .charAt(0)
                    .toUpperCase() || '?'
              }
            );


          } catch (err) {

            console.error(
              `Erreur profil demandeur ${uid} :`,
              err
            );

          }

        }
      )
    );

  }


  /*
   * =========================================
   * COMPTEURS
   * =========================================
   */

  /*
   * Aucune annonce (même brouillon) :
   * écran « premiers pas »
   */
  get hasListings(): boolean {

    return this.listings().length > 0;

  }


  get onlineCount(): number {

    return this.listings().filter(
      l => l.status === 'published'
    ).length;

  }


  get pendingCount(): number {

    return this.requests().filter(
      r => r.status === 'pending'
    ).length;

  }


  /*
   * =========================================
   * DEMANDES RÉCENTES (max 3)
   * =========================================
   */

  get recentRequests(): BookingRequest[] {

    return this.requests().slice(0, 3);

  }


  /*
   * =========================================
   * INFORMATIONS DEMANDEUR
   * =========================================
   */

  getRequesterName(
    requesterId: string
  ): string {

    return (
      this.requesterMap.get(requesterId)?.name
      ??
      'Utilisateur'
    );

  }


  getRequesterInitial(
    requesterId: string
  ): string {

    return (
      this.requesterMap.get(requesterId)?.initial
      ??
      '?'
    );

  }


  /*
   * =========================================
   * TITRE D'UNE ANNONCE
   * =========================================
   */

  getListingTitle(
    listingId: string
  ): string {

    return (
      this.listings().find(
        l => l.id === listingId
      )?.title
      ??
      'Logement BailLyon'
    );

  }


  /*
   * =========================================
   * DEMANDES EN ATTENTE PAR ANNONCE
   * =========================================
   */

  getPendingCountForListing(
    listingId: string
  ): number {

    return this.requests().filter(
      r =>
        r.listingId === listingId &&
        r.status === 'pending'
    ).length;

  }


  /*
   * =========================================
   * STATUT ANNONCE
   * =========================================
   */

  getStatusLabel(
    status: string
  ): string {

    switch (status) {

      case 'published':
        return 'EN LIGNE';

      case 'draft':
        return 'BROUILLON';

      case 'inactive':
        return 'EN PAUSE';

      default:
        return 'EN LIGNE';

    }

  }


  getStatusClass(
    status: string
  ): string {

    switch (status) {

      case 'published':
        return 'status-online';

      case 'draft':
        return 'status-draft';

      case 'inactive':
        return 'status-paused';

      default:
        return 'status-online';

    }

  }


  /*
   * =========================================
   * FORMATAGE DES DATES
   * =========================================
   */

  formatDate(
    dateString: string
  ): string {

    if (!dateString) {
      return '';
    }


    const parts =
      dateString.split('-');


    if (parts.length !== 3) {
      return dateString;
    }


    const year =
      Number(parts[0]);

    const month =
      Number(parts[1]);

    const day =
      Number(parts[2]);


    const date =
      new Date(year, month - 1, day);


    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    ).format(date);

  }


  /*
   * =========================================
   * DATE RELATIVE DE RÉCEPTION
   * =========================================
   */

  getRelativeDate(
    timestamp: Timestamp | null
  ): string {

    if (!timestamp) {
      return '';
    }


    const now =
      new Date();

    const date =
      timestamp.toDate();


    const diffMs =
      now.getTime() - date.getTime();

    const diffDays =
      Math.floor(
        diffMs / (1000 * 60 * 60 * 24)
      );


    if (diffDays === 0) {
      return 'reçue aujourd\'hui';
    }

    if (diffDays === 1) {
      return 'reçue hier';
    }

    return `reçue il y a ${diffDays} jours`;

  }

}
