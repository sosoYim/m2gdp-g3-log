import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { AccountSidebar } from '../../shared/components/account-sidebar/account-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';

import {
  Favorite,
  FavoriteListing
} from '../../core/favorite/favorite';


interface SavedListing {
  id: string;

  title: string;
  location: string;
  details: string;

  price: number;
  rating: number;

  image: string;

  createdAt: number;
}


@Component({
  selector: 'app-saved-listings',

  standalone: true,

  imports: [
    FormsModule,
    UserNavbar,
    AccountSidebar,
    ContactSection,
    Footer
  ],

  templateUrl: './saved-listings.html',
  styleUrl: './saved-listings.css'
})
export class SavedListings implements OnInit {

  sortOption = 'recent';

  visibleCount = 6;


  savedListings: SavedListing[] = [];


  constructor(
    private readonly router: Router,
    private readonly authService: Auth,
    private readonly favoriteService: Favorite,
    private readonly cdr: ChangeDetectorRef
  ) {}


  async ngOnInit(): Promise<void> {

    try {

      /*
       * On attend Firebase Auth.
       */
      const user =
        await this.authService.waitForAuthState();


      if (!user) {

        this.savedListings = [];

        return;

      }


      /*
       * Lecture des vrais favoris Firestore.
       */
      const favorites =
        await this.favoriteService.getFavorites(
          user.uid
        );


      /*
       * Transformation pour garder
       * exactement le format utilisé
       * par cette page.
       */
      this.savedListings =
        favorites.map(
          (
            favorite: FavoriteListing
          ): SavedListing => ({

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
              favorite.image,

            createdAt:
              favorite.createdAt?.toMillis() ?? 0

          })
        );


      this.cdr.detectChanges();


    } catch (error) {

      console.error(
        'Erreur chargement favoris :',
        error
      );


      this.savedListings = [];

    }

  }


  get visibleListings(): SavedListing[] {

    const listings =
      [...this.savedListings];


    /*
     * Prix croissant
     */
    if (
      this.sortOption === 'price-low'
    ) {

      listings.sort(
        (a, b) =>
          a.price - b.price
      );

    }


    /*
     * Prix décroissant
     */
    if (
      this.sortOption === 'price-high'
    ) {

      listings.sort(
        (a, b) =>
          b.price - a.price
      );

    }


    /*
     * Ajout récent
     */
    if (
      this.sortOption === 'recent'
    ) {

      listings.sort(
        (a, b) =>
          b.createdAt - a.createdAt
      );

    }


    return listings.slice(
      0,
      this.visibleCount
    );

  }


  get hasMoreListings(): boolean {

    return (
      this.visibleCount <
      this.savedListings.length
    );

  }


  showMore(): void {

    this.visibleCount += 3;

  }


  async removeFavorite(
    event: MouseEvent,
    listingId: string
  ): Promise<void> {

    event.stopPropagation();


    const user =
      this.authService.getCurrentUser();


    if (!user) {
      return;
    }


    try {

      /*
       * Suppression réelle Firestore.
       */
      await this.favoriteService.removeFavorite(
        user.uid,
        listingId
      );


      /*
       * Suppression immédiate
       * dans l'interface.
       */
      this.savedListings =
        this.savedListings.filter(
          listing =>
            listing.id !== listingId
        );


      this.cdr.detectChanges();


    } catch (error) {

      console.error(
        'Erreur suppression favori :',
        error
      );

    }

  }


  async openListing(
    listing: SavedListing
  ): Promise<void> {

    await this.router.navigate([
      '/property-details',
      listing.id
    ]);

  }

}