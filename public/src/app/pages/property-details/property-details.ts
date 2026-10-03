import {
  ChangeDetectorRef,
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

import {
  Listing,
  ListingDocument
} from '../../core/listing/listing';


interface Equipment {
  icon: string;
  alt: string;
}


interface PropertyDetailsViewModel {
  title: string;
  location: string;
  owner: string;

  rating: number;
  reviews: number;

  verified: boolean;

  images: {
    main: string;
    kitchen: string;
    window: string;
    desk: string;
    bathroom: string;
  };

  price: number;

  minimumStay: string;

  bedroom: string;
  bed: string;
  bathroom: string;

  description: string;

  equipments: Equipment[];
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

  loadingListing = signal(true);

  listingError = signal('');


  listing: PropertyDetailsViewModel = {

    title: '',

    location: '',

    owner: '',

    rating: 0,

    reviews: 42,

    verified: false,

    images: {
      main: '',
      kitchen: '/images/rental/property-1/kitchen.png',
      window: '/images/rental/property-1/window.png',
      desk: '/images/rental/property-1/desk.png',
      bathroom: '/images/rental/property-1/bathroom.png'
    },

    price: 0,

    minimumStay: '1 mois',

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
    ]

  };


  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: Auth,
    private readonly profileService: Profile,
    private readonly listingService: Listing,
    private readonly cdr: ChangeDetectorRef
  ) {}


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
     * DATES DE RECHERCHE
     * =========================================
     */
    this.route.queryParamMap.subscribe(
      params => {

        this.arrivalDate =
          params.get('arrival') ?? '';

        this.departureDate =
          params.get('departure') ?? '';

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

    this.listingError.set('');


    try {

      const firestoreListing =
        await this.listingService.getListingById(
          this.listingId
        );


      if (!firestoreListing) {

        this.listingError.set(
          'Ce logement est introuvable.'
        );

        return;

      }


      /*
       * On refuse d'afficher une annonce
       * non publiée côté demandeur.
       */
      if (
        firestoreListing.status !==
        'published'
      ) {

        this.listingError.set(
          'Ce logement n’est pas disponible.'
        );

        return;

      }


      this.applyFirestoreListing(
        firestoreListing
      );


    } catch (error) {

      console.error(
        'Erreur chargement logement :',
        error
      );


      this.listingError.set(
        'Impossible de charger ce logement.'
      );


    } finally {

      this.loadingListing.set(false);

      this.cdr.detectChanges();

    }

  }


  private applyFirestoreListing(
    firestoreListing: ListingDocument
  ): void {

    this.listing = {

      ...this.listing,

      title:
        firestoreListing.title,

      location:
        firestoreListing.location,

      owner:
        firestoreListing.ownerName,

      rating:
        firestoreListing.rating,

      verified:
        firestoreListing.verified,

      price:
        firestoreListing.price,

      images: {

        ...this.listing.images,

        main:
          firestoreListing.image

      }

    };

  }


  /*
   * =========================================
   * NAVIGATION VERS LA DEMANDE
   * =========================================
   */
  private async goToBookingRequest():
    Promise<void> {

    await this.router.navigate(
      [
        '/booking-request',
        this.listingId
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


  /*
   * =========================================
   * CONTACTER L'ANNONCEUR
   * =========================================
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
     * On mémorise les dates.
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
     * Attendre la restauration
     * éventuelle de Firebase Auth.
     */
    const user =
      await this.authService.waitForAuthState();


    /*
     * =========================================
     * UTILISATEUR NON CONNECTÉ
     * =========================================
     */
    if (!user) {

      this.authModalOpen.set(true);

      return;

    }


    /*
     * =========================================
     * UTILISATEUR CONNECTÉ
     * =========================================
     */
    const profile =
      await this.profileService.getProfile(
        user.uid
      );


    if (!profile) {

      await this.router.navigate([
        '/complete-profile'
      ]);

      return;

    }


    if (!profile.role) {

      await this.router.navigate([
        '/role-selection'
      ]);

      return;

    }


    /*
     * =========================================
     * DEMANDEUR
     * =========================================
     */
    if (profile.role === 'guest') {

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
     * =========================================
     * ANNONCEUR
     * =========================================
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