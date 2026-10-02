import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { Navbar } from '../../shared/components/navbar/navbar';
import { AuthModal } from '../../shared/components/auth-modal/auth-modal';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';
import { Profile } from '../../core/profile/profile';


interface Equipment {
  icon: string;
  alt: string;
}


@Component({
  selector: 'app-property-details',

  standalone: true,

  imports: [
    Navbar,
    AuthModal,
    ContactSection,
    Footer
  ],

  templateUrl: './property-details.html',
  styleUrl: './property-details.css'
})
export class PropertyDetails implements OnInit {

  listingId = '';

  arrivalDate = '';
  departureDate = '';

  authModalOpen = signal(false);


  listing = {

    title: 'Charmant studio-loft',

    location: 'Lyon',

    owner: 'Lucas',

    rating: 4.9,

    reviews: 42,

    verified: true,

    images: {
      main: '/images/rental/property-1/Umeus.png',
      kitchen: '/images/rental/property-1/kitchen.png',
      window: '/images/rental/property-1/window.png',
      desk: '/images/rental/property-1/desk.png',
      bathroom: '/images/rental/property-1/bathroom.png'
    },

    price: 650,

    minimumStay: '1 mois',

    arrivalDate: '01 mai 2026',

    departureDate: '01 nov. 2026',

    bedroom: '1 chambre',

    bed: '1 lit',

    bathroom: '1 salle de bains',

    description:
      'L’appartement est idéalement situé, à proximité des transports, des commerces et de nombreux cafés et restaurants. Un logement pratique et cosy, idéal pour un étudiant ou un jeune professionnel le temps d’un séjour à Lyon.',

    equipments: [
      {
        icon: '/images/rental/equipment/Equipement-wifi.svg',
        alt: 'Wi-Fi'
      },
      {
        icon: '/images/rental/equipment/Equipement-cook.svg',
        alt: 'Cuisine entièrement équipée'
      },
      {
        icon: '/images/rental/equipment/Equipement-desk.svg',
        alt: 'Bureau dédié'
      },
      {
        icon: '/images/rental/equipment/Equipement-wash.svg',
        alt: 'Lave-linge'
      },
      {
        icon: '/images/rental/equipment/Equipement-dish.svg',
        alt: 'Lave-vaisselle'
      },
      {
        icon: '/images/rental/equipment/Equipement-lift.svg',
        alt: 'Ascenseur'
      }
    ] as Equipment[]

  };


  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: Auth,
    private readonly profileService: Profile
  ) {}


  ngOnInit(): void {

    /*
     * ID du logement
     */
    this.listingId =
      this.route.snapshot.paramMap.get('id') ?? '';


    /*
     * Dates venant de la page de recherche
     */
    this.route.queryParamMap.subscribe(
      params => {

        this.arrivalDate =
          params.get('arrival') ?? '';

        this.departureDate =
          params.get('departure') ?? '';

      }
    );

  }


  /*
   * Naviguer vers la demande
   * tout en conservant les dates.
   */
  private async goToBookingRequest(): Promise<void> {

    await this.router.navigate(
      [
        '/booking-request',
        this.listingId
      ],
      {
        queryParams: {
          arrival: this.arrivalDate || null,
          departure: this.departureDate || null
        }
      }
    );

  }


  /*
   * Bouton "Écrire à Lucas"
   */
  async contactOwner(): Promise<void> {

    /*
     * On mémorise le logement.
     */
    localStorage.setItem(
      'baillYonPendingBooking',
      this.listingId
    );


    /*
     * On mémorise également les dates.
     *
     * Elles serviront notamment après
     * une connexion par Magic Link.
     */
    if (this.arrivalDate) {

      localStorage.setItem(
        'baillYonPendingArrival',
        this.arrivalDate
      );

    } else {

      localStorage.removeItem(
        'baillYonPendingArrival'
      );

    }


    if (this.departureDate) {

      localStorage.setItem(
        'baillYonPendingDeparture',
        this.departureDate
      );

    } else {

      localStorage.removeItem(
        'baillYonPendingDeparture'
      );

    }


    /*
     * Attendre la restauration éventuelle
     * de la session Firebase.
     */
    const user =
      await this.authService.waitForAuthState();


    /*
     * PAS CONNECTÉ
     *
     * On ouvre la modale Magic Link.
     */
    if (!user) {

      this.authModalOpen.set(true);

      return;
    }


    /*
     * CONNECTÉ
     *
     * Récupération du profil Firestore.
     */
    const profile =
      await this.profileService.getProfile(
        user.uid
      );


    /*
     * Pas encore de profil.
     */
    if (!profile) {

      await this.router.navigate([
        '/complete-profile'
      ]);

      return;
    }


    /*
     * Aucun rôle choisi.
     */
    if (!profile.role) {

      await this.router.navigate([
        '/role-selection'
      ]);

      return;
    }


    /*
     * DEMANDEUR
     */
    if (profile.role === 'guest') {

      /*
       * On peut maintenant entrer
       * directement dans le parcours
       * de demande.
       */
      localStorage.removeItem(
        'baillYonPendingBooking'
      );

      localStorage.removeItem(
        'baillYonPendingArrival'
      );

      localStorage.removeItem(
        'baillYonPendingDeparture'
      );


      await this.goToBookingRequest();

      return;
    }


    /*
     * ANNONCEUR
     *
     * Il doit passer en rôle demandeur
     * pour envoyer une demande.
     */
    if (profile.role === 'host') {

      await this.router.navigate([
        '/role-selection'
      ]);

    }

  }


  closeAuthModal(): void {

    this.authModalOpen.set(false);

  }

}