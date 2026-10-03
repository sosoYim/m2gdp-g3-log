import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Listing } from '../../core/listing/listing';


@Component({
  selector: 'app-booking-confirmation',

  standalone: true,

  imports: [
    UserNavbar,
    ContactSection,
    Footer
  ],

  templateUrl: './booking-confirmation.html',
  styleUrl: './booking-confirmation.css'
})
export class BookingConfirmation implements OnInit {

  private readonly route = inject(
    ActivatedRoute
  );

  private readonly router = inject(
    Router
  );

  private readonly listingService = inject(
    Listing
  );

  private readonly cdr = inject(
    ChangeDetectorRef
  );


  listingId = '';

  requestId = '';

  arrivalDate = '';

  departureDate = '';


  /*
   * Plus aucune donnée logement
   * codée en dur ici.
   */
  listing = {

    title: '',

    location: '',

    details: '',

    owner: '',

    price: 0,

    image: ''

  };


  async ngOnInit(): Promise<void> {

    /*
     * =========================================
     * ID DU LOGEMENT
     * =========================================
     */
    this.listingId =
      this.route.snapshot.paramMap.get('id') ?? '';


    /*
     * =========================================
     * PARAMÈTRES DE LA DEMANDE
     * =========================================
     */
    this.route.queryParamMap.subscribe(
      params => {

        this.arrivalDate =
          params.get('arrival') ?? '';

        this.departureDate =
          params.get('departure') ?? '';


        /*
         * ID réel de la bookingRequest.
         *
         * Il correspond également
         * à l'ID de la conversation RTDB.
         */
        this.requestId =
          params.get('requestId') ?? '';

      }
    );


    /*
     * =========================================
     * CHARGEMENT DU LOGEMENT FIRESTORE
     * =========================================
     */
    await this.loadListing();

  }


  private async loadListing(): Promise<void> {

    if (!this.listingId) {

      return;

    }


    try {

      const firestoreListing =
        await this.listingService.getListingById(
          this.listingId
        );


      if (!firestoreListing) {

        console.error(
          'Logement introuvable :',
          this.listingId
        );

        return;

      }


      /*
       * Toutes les informations principales
       * viennent maintenant de Firestore.
       */
      this.listing = {

        title:
          firestoreListing.title,

        location:
          firestoreListing.location,

        details:
          firestoreListing.details,

        owner:
          firestoreListing.ownerName,

        price:
          firestoreListing.price,

        image:
          firestoreListing.image

      };


      this.cdr.detectChanges();


    } catch (error) {

      console.error(
        'Erreur chargement logement :',
        error
      );

    }

  }


  formatDate(
    date: string
  ): string {

    if (!date) {

      return 'Non définie';

    }


    const parsedDate =
      new Date(
        `${date}T00:00:00`
      );


    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    ).format(
      parsedDate
    );

  }


  async openConversation(): Promise<void> {

    /*
     * Si on possède l'ID réel
     * de la demande, on ouvre directement
     * la bonne conversation.
     */
    if (this.requestId) {

      await this.router.navigate(
        [
          '/messages'
        ],
        {
          queryParams: {

            conversationId:
              this.requestId

          }
        }
      );

      return;

    }


    /*
     * Compatibilité avec les anciennes
     * demandes sans requestId.
     */
    await this.router.navigate([
      '/messages'
    ]);

  }


  async backToListings(): Promise<void> {

    await this.router.navigate(
      [
        '/rental-search-results'
      ],
      {
        queryParams: {

          arrival:
            this.arrivalDate || null,

          departure:
            this.departureDate || null

        }
      }
    );

  }

}