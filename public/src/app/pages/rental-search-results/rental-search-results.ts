import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import * as L from 'leaflet';

import { Navbar } from '../../shared/components/navbar/navbar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';

import {
  Favorite,
  FavoriteListing
} from '../../core/favorite/favorite';

import {
  Listing,
  ListingDocument
} from '../../core/listing/listing';


interface RentalListing {

  id: string;

  title: string;

  location: string;

  latitude: number;

  longitude: number;

  details: string;

  price: number;

  rating: number;

  image: string;

  verified: boolean;

  favorite: boolean;

  highlighted?: boolean;

}


@Component({
  selector: 'app-rental-search-results',

  standalone: true,

  imports: [
    Navbar,
    FormsModule,
    ContactSection,
    Footer
  ],

  templateUrl: './rental-search-results.html',
  styleUrl: './rental-search-results.css'
})
export class RentalSearchResults
  implements OnInit, AfterViewInit, OnDestroy {

  arrivalDate = '';

  departureDate = '';


  /*
   * =========================================
   * LOGEMENTS
   * =========================================
   */

  listings: RentalListing[] = [];


  loadingListings = true;

  listingError = '';


  /*
   * =========================================
   * FAVORIS
   * =========================================
   */

  private readonly favoriteSaving =
    new Set<string>();


  /*
   * =========================================
   * LEAFLET
   * =========================================
   */

  private map: L.Map | null = null;

  private markersLayer:
    L.LayerGroup | null = null;

  private viewReady = false;


  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: Auth,
    private readonly favoriteService: Favorite,
    private readonly listingService: Listing,
    private readonly cdr: ChangeDetectorRef
  ) {}


  /*
   * =========================================
   * INITIALISATION
   * =========================================
   */

  ngOnInit(): void {

    this.route.queryParamMap.subscribe(
      params => {

        this.arrivalDate =
          params.get('arrival') ?? '';

        this.departureDate =
          params.get('departure') ?? '';


        void this.loadListings();

      }
    );

  }


  ngAfterViewInit(): void {

    this.viewReady = true;


    /*
     * Si les logements ont déjà été
     * chargés avant le rendu du HTML,
     * on peut maintenant dessiner la carte.
     */
    this.refreshMap();

  }


  ngOnDestroy(): void {

    if (this.map) {

      this.map.remove();

      this.map = null;

    }

  }


  /*
   * =========================================
   * CHARGEMENT FIRESTORE
   * =========================================
   */

  private async loadListings(): Promise<void> {

    this.loadingListings = true;

    this.listingError = '';


    try {

      const firestoreListings =
        await this.listingService.searchByDates(
          this.arrivalDate,
          this.departureDate
        );


      this.listings =
        firestoreListings.map(
          listing =>
            this.mapListing(
              listing
            )
        );


      const user =
        await this.authService.waitForAuthState();


      if (user) {

        const favoriteIds =
          await this.favoriteService.getFavoriteIds(
            user.uid
          );


        for (
          const listing of this.listings
        ) {

          listing.favorite =
            favoriteIds.has(
              listing.id
            );

        }

      }


    } catch (error) {

      console.error(
        'Erreur chargement logements :',
        error
      );


      this.listingError =
        'Impossible de charger les logements.';


      this.listings = [];


    } finally {

      this.loadingListings = false;

      this.cdr.detectChanges();


      this.refreshMap();

    }

  }


  /*
   * =========================================
   * CONVERSION FIRESTORE
   * =========================================
   */

  private mapListing(
    listing: ListingDocument
  ): RentalListing {

    return {

      id:
        listing.id,

      title:
        listing.title,

      location:
        listing.location,

      latitude:
        listing.latitude,

      longitude:
        listing.longitude,

      details:
        listing.details,

      price:
        listing.price,

      rating:
        listing.rating,

      image:
        listing.image,

      verified:
        listing.verified,

      favorite:
        false,

      highlighted:
        listing.highlighted

    };

  }


  /*
   * =========================================
   * CARTE LEAFLET
   * =========================================
   */

  private refreshMap(): void {

    if (!this.viewReady) {

      return;

    }


    const mapElement =
      document.getElementById(
        'listings-map'
      );


    if (!mapElement) {

      return;

    }


    /*
     * Création de la carte une seule fois.
     */
    if (!this.map) {

      this.map =
        L.map(
          mapElement,
          {
            zoomControl: true,
            scrollWheelZoom: false
          }
        );


      /*
       * OpenStreetMap
       */
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,

          attribution:
            '&copy; OpenStreetMap contributors'
        }
      ).addTo(
        this.map
      );


      this.markersLayer =
        L.layerGroup()
          .addTo(
            this.map
          );

    }


    /*
     * Supprimer les anciens marqueurs.
     */
    this.markersLayer?.clearLayers();


    /*
     * Garder uniquement les annonces
     * ayant de vraies coordonnées.
     */
    const validListings =
      this.listings.filter(
        listing =>
          Number.isFinite(
            listing.latitude
          )
          &&
          Number.isFinite(
            listing.longitude
          )
          &&
          listing.latitude !== 0
          &&
          listing.longitude !== 0
      );


    /*
     * Aucun logement géolocalisé :
     * Lyon par défaut.
     */
    if (
      validListings.length === 0
    ) {

      this.map.setView(
        [
          45.764,
          4.8357
        ],
        12
      );


      setTimeout(
        () =>
          this.map?.invalidateSize(),
        0
      );


      return;

    }


    const bounds:
      L.LatLngExpression[] = [];


    for (
      const listing of validListings
    ) {

      const coordinates:
        L.LatLngExpression = [
          listing.latitude,
          listing.longitude
        ];


      bounds.push(
        coordinates
      );


      /*
       * Marqueur BailLyon.
       */
      const markerIcon =
        L.divIcon(
          {
            className:
              'baillYon-map-marker',

            html:
              '<div class="baillYon-map-marker-dot"></div>',

            iconSize:
              [
                34,
                34
              ],

            iconAnchor:
              [
                17,
                34
              ],

            popupAnchor:
              [
                0,
                -30
              ]
          }
        );


      const marker =
        L.marker(
          coordinates,
          {
            icon:
              markerIcon
          }
        );


      /*
       * Popup sécurisée.
       */
      const popup =
        document.createElement(
          'div'
        );


      const title =
        document.createElement(
          'strong'
        );


      title.textContent =
        listing.title;


      const location =
        document.createElement(
          'div'
        );


      location.textContent =
        listing.location;


      const price =
        document.createElement(
          'div'
        );


      price.textContent =
        `${listing.price} € / mois`;


      popup.appendChild(
        title
      );

      popup.appendChild(
        location
      );

      popup.appendChild(
        price
      );


      marker.bindPopup(
        popup
      );


      marker.addTo(
        this.markersLayer!
      );

    }


    /*
     * Un seul logement.
     */
    if (
      validListings.length === 1
    ) {

      this.map.setView(
        [
          validListings[0].latitude,
          validListings[0].longitude
        ],
        15
      );

    } else {

      /*
       * Plusieurs logements.
       */
      this.map.fitBounds(
        L.latLngBounds(
          bounds
        ),
        {
          padding:
            [
              40,
              40
            ]
        }
      );

    }


    setTimeout(
      () =>
        this.map?.invalidateSize(),
      0
    );

  }


  /*
   * =========================================
   * RECHERCHE
   * =========================================
   */

  search(): void {

    if (
      !this.arrivalDate ||
      !this.departureDate
    ) {

      return;

    }


    if (
      this.departureDate <=
      this.arrivalDate
    ) {

      return;

    }


    this.router.navigate(
      [
        '/rental-search-results'
      ],
      {
        queryParams: {

          arrival:
            this.arrivalDate,

          departure:
            this.departureDate

        }
      }
    );

  }


  /*
   * =========================================
   * FAVORIS
   * =========================================
   */

  async toggleFavorite(
    listing: RentalListing
  ): Promise<void> {

    if (
      this.favoriteSaving.has(
        listing.id
      )
    ) {

      return;

    }


    const user =
      this.authService.getCurrentUser();


    if (!user) {

      console.log(
        'Connexion nécessaire pour ajouter un favori.'
      );

      return;

    }


    this.favoriteSaving.add(
      listing.id
    );


    try {

      if (
        listing.favorite
      ) {

        await this.favoriteService.removeFavorite(
          user.uid,
          listing.id
        );


        listing.favorite =
          false;


      } else {

        const favorite:
          FavoriteListing = {

          listingId:
            listing.id,

          title:
            listing.title,

          location:
            listing.location,

          details:
            listing.details,

          price:
            listing.price,

          rating:
            listing.rating,

          image:
            listing.image

        };


        await this.favoriteService.addFavorite(
          user.uid,
          favorite
        );


        listing.favorite =
          true;

      }


      this.cdr.detectChanges();


    } catch (error) {

      console.error(
        'Erreur modification favori :',
        error
      );


    } finally {

      this.favoriteSaving.delete(
        listing.id
      );

    }

  }


  /*
   * =========================================
   * OUVERTURE DU LOGEMENT
   * =========================================
   */

  openListing(
    listing: RentalListing
  ): void {

    this.router.navigate(
      [
        '/property-details',
        listing.id
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