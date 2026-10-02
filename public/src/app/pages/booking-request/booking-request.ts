import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';
import { Booking } from '../../core/booking/booking';


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

  private readonly authService = inject(
    Auth
  );

  private readonly bookingService = inject(
    Booking
  );


  listingId = '';

  arrivalDate = '';
  departureDate = '';

  message =
    'Bonjour Lucas, je suis intéressé(e) par votre logement.\nEst-il disponible aux dates indiquées ?';


  loading = signal(false);

  errorMessage = signal('');

  successMessage = signal('');


  listing = {
    title: 'Charmant studio-loft',
    owner: 'Lucas',
    image: '/images/rental/property-1/Umeus.png'
  };


  ngOnInit(): void {

    /*
     * ID du logement
     */
    this.listingId =
      this.route.snapshot.paramMap.get('id') ?? '';


    /*
     * Dates transmises depuis
     * la recherche / fiche logement
     */
    this.route.queryParamMap.subscribe(
      params => {

        const arrival =
          params.get('arrival');

        const departure =
          params.get('departure');


        /*
         * Cas normal :
         * les dates sont dans l'URL.
         */
        if (arrival) {
          this.arrivalDate = arrival;
        }


        if (departure) {
          this.departureDate = departure;
        }


        /*
         * Cas Magic Link :
         * après connexion, les query params
         * peuvent ne plus être présents.
         *
         * On récupère alors les dates
         * mémorisées dans localStorage.
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
         * Une fois récupérées,
         * on nettoie les valeurs temporaires.
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

  }


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
      this.departureDate <= this.arrivalDate
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


      const requestId =
        await this.bookingService.createRequest({

          listingId:
            this.listingId,

          requesterId:
            user.uid,

          ownerName:
            this.listing.owner,

          arrivalDate:
            this.arrivalDate,

          departureDate:
            this.departureDate,

          message:
            this.message

        });


      console.log(
        'Demande créée :',
        requestId
      );


      this.successMessage.set(
        'Votre demande a bien été envoyée à Lucas.'
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