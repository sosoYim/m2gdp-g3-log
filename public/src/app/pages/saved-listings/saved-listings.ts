import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { AccountSidebar } from '../../shared/components/account-sidebar/account-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';


interface SavedListing {
  id: number;
  title: string;
  location: string;
  details: string;
  price: number;
  rating: number;
  image: string;
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
export class SavedListings {

  sortOption = 'recent';

  visibleCount = 6;


  savedListings: SavedListing[] =
    Array.from(
      { length: 12 },
      (_, index) => ({
        id: index + 1,

        title:
          'Charmant studio-loft',

        location:
          'LYON, ARRONDISSEMENT 2',

        details:
          'Meublé · 22 m² · 1 pièce',

        price:
          650 + (index % 3) * 20,

        rating:
          4.9,

        image:
          '/images/landing/Umeus-Harmounikahusene.jpg'
      })
    );


  constructor(
    private readonly router: Router
  ) {}


  get visibleListings(): SavedListing[] {

    const listings =
      [...this.savedListings];


    if (
      this.sortOption === 'price-low'
    ) {

      listings.sort(
        (a, b) =>
          a.price - b.price
      );

    }


    if (
      this.sortOption === 'price-high'
    ) {

      listings.sort(
        (a, b) =>
          b.price - a.price
      );

    }


    if (
      this.sortOption === 'recent'
    ) {

      listings.sort(
        (a, b) =>
          b.id - a.id
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


  removeFavorite(
    event: MouseEvent,
    listingId: number
  ): void {

    event.stopPropagation();


    this.savedListings =
      this.savedListings.filter(
        listing =>
          listing.id !== listingId
      );

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