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
  ListingDocument,
  ListingForm,
  createEmptyListingForm
} from '../../core/listing/listing';

import { getAmenityLabel } from '../host-listing-form/listing-form.data';


interface Equipment {
  /*
   * SVG (icône + texte) si disponible,
   * sinon seul le libellé est affiché.
   */
  icon: string;
  label: string;
}


interface PropertyDetailsViewModel {
  title: string;
  location: string;
  owner: string;

  rating: number;
  reviews: number;

  verified: boolean;

  /*
   * 1re photo + 4 vignettes
   * ('' = emplacement vide)
   */
  mainImage: string;
  thumbnails: string[];

  price: number;

  minimumStay: string;

  details: string;

  description: string;

  equipments: Equipment[];
}


/*
 * Icônes existantes par équipement
 * (valeurs de AMENITIES).
 */
const EQUIPMENT_ICONS: Record<string, string> = {
  wifi: 'Equipement-wifi.svg',
  kitchen: 'Equipement-cook.svg',
  desk: 'Equipement-desk.svg',
  washer: 'Equipement-wash.svg',
  dishwasher: 'Equipement-dish.svg',
  elevator: 'Equipement-lift.svg'
};


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
    mainImage: '',
    thumbnails: ['', '', '', ''],
    price: 0,
    minimumStay: '',
    details: '',
    description: '',
    equipments: []
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

      const [firestoreListing, listingForm] =
        await Promise.all([
          this.listingService.getListingById(this.listingId),
          this.listingService.getListingForm(this.listingId)
        ]);


      if (!firestoreListing) {

        this.listingError.set(
          'Ce logement est introuvable.'
        );

        return;

      }


      /*
       * On refuse d'afficher une annonce
       * non publiée côté demandeur
       * (l'annonceur peut voir la sienne).
       */
      const user =
        await this.authService.waitForAuthState();

      if (
        firestoreListing.status !==
        'published' &&
        firestoreListing.ownerId !== user?.uid
      ) {

        this.listingError.set(
          'Ce logement n’est pas disponible.'
        );

        return;

      }


      this.applyFirestoreListing(
        firestoreListing,
        listingForm?.form ?? createEmptyListingForm()
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
    firestoreListing: ListingDocument,
    form: ListingForm
  ): void {

    const photos =
      form.photos.map(photo => photo.url);

    const thumbnails =
      [1, 2, 3, 4].map(i => photos[i] ?? '');


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

      mainImage:
        photos[0] ?? firestoreListing.image,

      thumbnails,

      minimumStay:
        `${form.minStayMonths} mois`,

      details:
        firestoreListing.details,

      description:
        form.description,

      equipments:
        form.amenities.map(value => ({
          icon: EQUIPMENT_ICONS[value]
            ? `/images/rental/equipment/${EQUIPMENT_ICONS[value]}`
            : '',
          label: getAmenityLabel(value)
        }))

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