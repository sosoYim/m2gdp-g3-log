import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';
import { Booking } from '../../core/booking/booking';
import { Messaging } from '../../core/messaging/messaging';
import { Listing } from '../../core/listing/listing';


@Component({
  selector: 'app-booking-request',

  standalone: true,

  imports: [
    FormsModule,
    RouterLink,
    UserNavbar,
    ContactSection,
    Footer
  ],

  templateUrl: './booking-request.html',
  styleUrl: './booking-request.css'
})
export class BookingRequest implements OnInit {

  private readonly route = inject(
    ActivatedRoute
  );

  private readonly router = inject(
    Router
  );

  private readonly authService = inject(
    Auth
  );

  private readonly bookingService = inject(
    Booking
  );

  private readonly messagingService = inject(
    Messaging
  );

  private readonly listingService = inject(
    Listing
  );

  private readonly cdr = inject(
    ChangeDetectorRef
  );


  listingId = '';

  arrivalDate = '';

  departureDate = '';


  message = '';


  loading = signal(false);

  loadingListing = signal(true);

  errorMessage = signal('');

  successMessage = signal('');


  /*
   * Informations du logement
   * récupérées depuis Firestore.
   */
  listing = {

    title: '',

    ownerId: '',

    owner: '',

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
     * DATES
     * =========================================
     */
    this.route.queryParamMap.subscribe(
      params => {

        const arrival =
          params.get('arrival');

        const departure =
          params.get('departure');


        if (arrival) {

          this.arrivalDate =
            arrival;

        }


        if (departure) {

          this.departureDate =
            departure;

        }


        /*
         * Retour éventuel après Magic Link.
         */
        if (!this.arrivalDate) {

          this.arrivalDate =
            localStorage.getItem(
              'baillYonPendingArrival'
            ) ?? '';

        }


        if (!this.departureDate) {

          this.departureDate =
            localStorage.getItem(
              'baillYonPendingDeparture'
            ) ?? '';

        }


        /*
         * Nettoyage du stockage temporaire.
         */
        if (this.arrivalDate) {

          localStorage.removeItem(
            'baillYonPendingArrival'
          );

        }


        if (this.departureDate) {

          localStorage.removeItem(
            'baillYonPendingDeparture'
          );

        }

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

    this.loadingListing.set(true);

    this.errorMessage.set('');


    try {

      const firestoreListing =
        await this.listingService.getListingById(
          this.listingId
        );


      if (!firestoreListing) {

        this.errorMessage.set(
          'Ce logement est introuvable.'
        );

        return;

      }


      if (
        firestoreListing.status !==
        'published'
      ) {

        this.errorMessage.set(
          'Ce logement n’est plus disponible.'
        );

        return;

      }


      /*
       * =========================================
       * DONNÉES RÉELLES DE L'ANNONCE
       * =========================================
       */
      this.listing = {

        title:
          firestoreListing.title,

        ownerId:
          firestoreListing.ownerId,

        owner:
          firestoreListing.ownerName,

        image:
          firestoreListing.image

      };


      /*
       * Message initial dynamique.
       */
      this.message =
        `Bonjour ${firestoreListing.ownerName}, je suis intéressé(e) par votre logement.\nEst-il disponible aux dates indiquées ?`;


    } catch (error) {

      console.error(
        'Erreur chargement logement :',
        error
      );


      this.errorMessage.set(
        'Impossible de charger ce logement.'
      );


    } finally {

      this.loadingListing.set(false);

      this.cdr.detectChanges();

    }

  }


  /*
   * =========================================
   * FORMATAGE DES DATES
   * =========================================
   */
  formatDate(
    date: string
  ): string {

    if (!date) {

      return 'Choisir une date';

    }


    const [
      year,
      month,
      day
    ] = date.split('-');


    return `${day}/${month}/${year}`;

  }


  /*
   * =========================================
   * ENVOYER UNE DEMANDE
   * =========================================
   */
  async sendRequest(): Promise<void> {

    this.errorMessage.set('');

    this.successMessage.set('');


    const user =
      this.authService.getCurrentUser();


    if (!user) {

      this.errorMessage.set(
        'Vous devez être connecté pour envoyer une demande.'
      );

      return;

    }


    /*
     * Vérifier que l'annonce
     * a bien été chargée.
     */
    if (
      !this.listingId ||
      !this.listing.title ||
      !this.listing.owner
    ) {

      this.errorMessage.set(
        'Impossible de récupérer les informations du logement.'
      );

      return;

    }


    if (!this.arrivalDate) {

      this.errorMessage.set(
        'Veuillez choisir une date d’arrivée.'
      );

      return;

    }


    if (!this.departureDate) {

      this.errorMessage.set(
        'Veuillez choisir une date de départ.'
      );

      return;

    }


    if (
      this.departureDate <=
      this.arrivalDate
    ) {

      this.errorMessage.set(
        'La date de départ doit être après la date d’arrivée.'
      );

      return;

    }


    if (!this.message.trim()) {

      this.errorMessage.set(
        'Veuillez saisir un message.'
      );

      return;

    }


    try {

      this.loading.set(true);


      /*
       * =========================================
       * ANTI-DOUBLON
       * =========================================
       */
      const alreadyExists =
        await this.bookingService.hasPendingRequest(
          user.uid,
          this.listingId,
          this.arrivalDate,
          this.departureDate
        );


      if (alreadyExists) {

        this.errorMessage.set(
          'Vous avez déjà une demande en attente pour ce logement à ces dates.'
        );

        return;

      }


      /*
       * =========================================
       * 1. BOOKING REQUEST FIRESTORE
       * =========================================
       */
      const requestId =
        await this.bookingService.createRequest(
          {

            listingId:
              this.listingId,

            requesterId:
              user.uid,

            /*
             * UID Firebase de l'annonceur.
             */
            ownerId:
              this.listing.ownerId,

            ownerName:
              this.listing.owner,

            arrivalDate:
              this.arrivalDate,

            departureDate:
              this.departureDate,

            message:
              this.message

          }
        );


      /*
       * =========================================
       * 2. CONVERSATION REALTIME DATABASE
       * =========================================
       */
      try {

        await this.messagingService.createConversation(
          {

            bookingRequestId:
              requestId,

            requesterId:
              user.uid,

            /*
             * IMPORTANT :
             * ownerId est aussi enregistré
             * dans la conversation.
             */
            ownerId:
              this.listing.ownerId,

            listingId:
              this.listingId,

            listingTitle:
              this.listing.title,

            ownerName:
              this.listing.owner

          }
        );


        /*
         * Premier message de la conversation.
         */
        await this.messagingService.sendMessage(
          requestId,
          user.uid,
          this.message
        );


      } catch (messagingError) {

        /*
         * Si la conversation échoue,
         * la demande Firestore existe déjà.
         */
        console.error(
          'Erreur création conversation :',
          messagingError
        );

      }


      /*
       * =========================================
       * 3. CONFIRMATION
       * =========================================
       */
      await this.router.navigate(
        [
          '/booking-confirmation',
          this.listingId
        ],
        {
          queryParams: {

            arrival:
              this.arrivalDate,

            departure:
              this.departureDate,

            requestId:
              requestId

          }
        }
      );


    } catch (error) {

      console.error(
        'Erreur envoi demande :',
        error
      );


      this.errorMessage.set(
        'Impossible d’envoyer votre demande pour le moment.'
      );


    } finally {

      this.loading.set(false);

    }

  }

}