import {
  ChangeDetectorRef,
  Component,
  OnInit,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { HostSidebar } from '../../shared/components/host-sidebar/host-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';
import { Listing, ListingDocument } from '../../core/listing/listing';
import { Booking, BookingRequest } from '../../core/booking/booking';


type ListingTab =
  | 'all'
  | 'published'
  | 'draft';


@Component({
  selector: 'app-host-listings',

  standalone: true,

  imports: [
    RouterLink,
    UserNavbar,
    HostSidebar,
    ContactSection,
    Footer
  ],

  templateUrl: './host-listings.html',
  styleUrl: './host-listings.css'
})
export class HostListings implements OnInit {

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
   * Annonce en cours de mise à jour
   * (pause / suppression).
   */
  updatingId =
    signal('');


  /*
   * =========================================
   * DONNÉES
   * =========================================
   */

  listings =
    signal<ListingDocument[]>([]);


  requests =
    signal<BookingRequest[]>([]);


  activeTab =
    signal<ListingTab>('all');


  constructor(
    private readonly authService: Auth,
    private readonly listingService: Listing,
    private readonly bookingService: Booking,
    private readonly cdr: ChangeDetectorRef
  ) {}


  async ngOnInit(): Promise<void> {

    this.loading.set(true);

    this.error.set('');


    try {

      const user =
        await this.authService.waitForAuthState();


      if (!user) {

        this.error.set(
          'Utilisateur non connecté.'
        );

        return;

      }


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


      this.cdr.detectChanges();


    } catch (err) {

      console.error(
        'Erreur chargement mes annonces :',
        err
      );


      this.error.set(
        'Impossible de charger vos annonces.'
      );


    } finally {

      this.loading.set(false);

    }

  }


  /*
   * =========================================
   * ONGLETS
   * =========================================
   */

  get publishedCount(): number {

    return this.listings().filter(
      l => l.status === 'published'
    ).length;

  }


  get draftCount(): number {

    return this.listings().filter(
      l => l.status === 'draft'
    ).length;

  }


  get visibleListings(): ListingDocument[] {

    const tab =
      this.activeTab();


    if (tab === 'all') {
      return this.listings();
    }


    return this.listings().filter(
      l => l.status === tab
    );

  }


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
   * PROGRESSION D'UN BROUILLON
   * =========================================
   *
   * Pourcentage des champs principaux
   * déjà renseignés.
   */

  getCompletion(
    listing: ListingDocument
  ): number {

    const fields = [
      listing.title,
      listing.location,
      listing.details,
      listing.price > 0,
      listing.image,
      listing.availableFrom,
      listing.availableTo
    ];


    const filled =
      fields.filter(Boolean).length;


    return Math.round(
      (filled / fields.length) * 100
    );

  }


  /*
   * =========================================
   * METTRE EN PAUSE / REMETTRE EN LIGNE
   * =========================================
   */

  async toggleListingStatus(
    listing: ListingDocument
  ): Promise<void> {

    if (this.updatingId()) {
      return;
    }


    const newStatus =
      listing.status === 'inactive'
        ? 'published'
        : 'inactive';


    try {

      this.updatingId.set(listing.id);


      await this.listingService.updateListingStatus(
        listing.id,
        newStatus
      );


      this.listings.update(
        listings => listings.map(
          l => l.id === listing.id
            ? { ...l, status: newStatus }
            : l
        )
      );


    } catch (err) {

      console.error(
        'Erreur changement statut annonce :',
        err
      );


      this.error.set(
        'Impossible de modifier le statut de l\'annonce.'
      );


    } finally {

      this.updatingId.set('');

    }

  }


  /*
   * =========================================
   * SUPPRIMER UN BROUILLON
   * =========================================
   */

  async deleteListing(
    listing: ListingDocument
  ): Promise<void> {

    if (this.updatingId()) {
      return;
    }


    const confirmed =
      window.confirm(
        `Supprimer le brouillon « ${listing.title || 'Sans titre'} » ?`
      );


    if (!confirmed) {
      return;
    }


    try {

      this.updatingId.set(listing.id);


      await this.listingService.deleteListing(
        listing.id
      );


      this.listings.update(
        listings => listings.filter(
          l => l.id !== listing.id
        )
      );


    } catch (err) {

      console.error(
        'Erreur suppression annonce :',
        err
      );


      this.error.set(
        'Impossible de supprimer l\'annonce.'
      );


    } finally {

      this.updatingId.set('');

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


    const [year, month, day] =
      dateString.split('-').map(Number);


    if (!year || !month || !day) {
      return dateString;
    }


    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    ).format(
      new Date(year, month - 1, day)
    );

  }

}
