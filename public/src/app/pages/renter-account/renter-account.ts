import {
  ChangeDetectorRef,
  Component,
  OnInit,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { AccountSidebar } from '../../shared/components/account-sidebar/account-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';

import {
  Booking,
  BookingRequest,
  BookingStatus
} from '../../core/booking/booking';

import {
  Favorite,
  FavoriteListing as FirestoreFavoriteListing
} from '../../core/favorite/favorite';

import { Listing } from '../../core/listing/listing';


interface FavoriteListing {
  id: string;

  title: string;
  location: string;
  details: string;

  price: number;
  rating: number;

  image: string;
}


@Component({
  selector: 'app-renter-account',

  standalone: true,

  imports: [
    RouterLink,
    UserNavbar,
    AccountSidebar,
    ContactSection,
    Footer
  ],

  templateUrl: './renter-account.html',
  styleUrl: './renter-account.css'
})
export class RenterAccount implements OnInit {

  /*
   * =========================================
   * RÉSERVATIONS
   * =========================================
   */

  bookings =
    signal<BookingRequest[]>([]);


  loadingBookings =
    signal(true);


  bookingError =
    signal('');


  /*
   * =========================================
   * FAVORIS
   * =========================================
   */

  favorites: FavoriteListing[] = [];


  favoriteCount = 0;


  /*
   * =========================================
   * CACHE DES LOGEMENTS FIRESTORE
   * =========================================
   *
   * Permet au HTML existant de continuer
   * à utiliser getListingTitle() et
   * getListingImage().
   */

  private readonly listingTitles =
    new Map<string, string>();


  private readonly listingImages =
    new Map<string, string>();


  constructor(
    private readonly authService: Auth,
    private readonly bookingService: Booking,
    private readonly favoriteService: Favorite,
    private readonly listingService: Listing,
    private readonly cdr: ChangeDetectorRef
  ) {}


  async ngOnInit(): Promise<void> {

    this.loadingBookings.set(true);

    this.bookingError.set('');


    try {

      /*
       * On attend que Firebase
       * restaure la session utilisateur.
       */
      const user =
        await this.authService.waitForAuthState();


      if (!user) {

        this.bookingError.set(
          'Utilisateur non connecté.'
        );

        return;

      }


      /*
       * =========================================
       * CHARGEMENT DES DEMANDES
       * =========================================
       */
      const requests =
        await this.bookingService.getRequestsForRequester(
          user.uid
        );


      this.bookings.set(
        requests
      );


      /*
       * =========================================
       * CHARGEMENT DES LOGEMENTS ASSOCIÉS
       * =========================================
       *
       * Chaque bookingRequest contient
       * un listingId.
       *
       * On récupère maintenant le vrai titre
       * et la vraie image depuis Firestore.
       */
      await this.loadBookingListings(
        requests
      );


      /*
       * =========================================
       * CHARGEMENT DES FAVORIS
       * =========================================
       */
      const firestoreFavorites =
        await this.favoriteService.getFavorites(
          user.uid
        );


      this.favoriteCount =
        firestoreFavorites.length;


      /*
       * Le tableau de bord affiche
       * seulement les 3 favoris récents.
       */
      this.favorites =
        firestoreFavorites
          .slice(0, 3)
          .map(
            (
              favorite: FirestoreFavoriteListing
            ): FavoriteListing => ({

              id:
                favorite.listingId,

              title:
                favorite.title,

              location:
                favorite.location,

              details:
                favorite.details,

              price:
                favorite.price,

              rating:
                favorite.rating,

              image:
                favorite.image

            })
          );


      this.cdr.detectChanges();


    } catch (error) {

      console.error(
        'Erreur chargement compte demandeur :',
        error
      );


      this.bookingError.set(
        'Impossible de charger vos informations.'
      );


    } finally {

      this.loadingBookings.set(false);

    }

  }


  /*
   * =========================================
   * CHARGEMENT DES LOGEMENTS DES DEMANDES
   * =========================================
   */

  private async loadBookingListings(
    requests: BookingRequest[]
  ): Promise<void> {

    /*
     * Plusieurs demandes peuvent concerner
     * le même logement.
     *
     * On évite donc de charger plusieurs fois
     * le même document Firestore.
     */
    const listingIds =
      [
        ...new Set(
          requests
            .map(
              request =>
                request.listingId
            )
            .filter(
              listingId =>
                Boolean(listingId)
            )
        )
      ];


    await Promise.all(
      listingIds.map(
        async listingId => {

          try {

            const listing =
              await this.listingService.getListingById(
                listingId
              );


            if (!listing) {

              return;

            }


            this.listingTitles.set(
              listingId,
              listing.title
            );


            this.listingImages.set(
              listingId,
              listing.image
            );


          } catch (error) {

            console.error(
              `Erreur chargement logement ${listingId} :`,
              error
            );

          }

        }
      )
    );

  }


  /*
   * =========================================
   * STATUT RÉSERVATION
   * =========================================
   */

  getStatusLabel(
    status: BookingStatus
  ): string {

    switch (status) {

      case 'accepted':
        return 'CONFIRMÉ';

      case 'rejected':
        return 'REFUSÉ';

      default:
        return 'EN ATTENTE';

    }

  }


  getStatusClass(
    status: BookingStatus
  ): string {

    switch (status) {

      case 'accepted':
        return 'confirmed-badge';

      case 'rejected':
        return 'rejected-badge';

      default:
        return 'pending-badge';

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

      return 'Date non définie';

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
      new Date(
        year,
        month - 1,
        day
      );


    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    ).format(
      date
    );

  }


  /*
   * =========================================
   * INFORMATIONS LOGEMENT
   * =========================================
   */

  getListingTitle(
    listingId: string
  ): string {

    return (
      this.listingTitles.get(
        listingId
      )
      ??
      'Logement BailLyon'
    );

  }


  getListingImage(
    listingId: string
  ): string {

    return (
      this.listingImages.get(
        listingId
      )
      ??
      '/images/rental/property-1/Umeus.png'
    );

  }

}