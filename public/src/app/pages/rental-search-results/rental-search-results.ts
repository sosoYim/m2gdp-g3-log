import {
  Component,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { Navbar } from '../../shared/components/navbar/navbar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';


interface RentalListing {
  id: number;
  title: string;
  location: string;
  details: string;
  price: number;
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
export class RentalSearchResults implements OnInit {

  arrivalDate = '';
  departureDate = '';


  listings: RentalListing[] = [

    {
      id: 1,

      title: 'Charmant studio-loft',

      location: 'LYON, ARRONDISSEMENT 2',

      details:
        'Meublé · 22 m² · 3ème étage · 1 pièce',

      price: 650,

      image:
        '/images/landing/Umeus-Harmounikahusene.jpg',

      verified: true,

      favorite: false,

      highlighted: true
    },


    {
      id: 2,

      title: 'Charmant studio-loft',

      location: 'LYON, ARRONDISSEMENT 2',

      details:
        'Meublé · 22 m² · 3ème étage · 1 pièce',

      price: 650,

      image:
        '/images/landing/Umeus-Harmounikahusene.jpg',

      verified: true,

      favorite: false
    },


    {
      id: 3,

      title: 'Charmant studio-loft',

      location: 'LYON, ARRONDISSEMENT 2',

      details:
        'Meublé · 22 m² · 3ème étage · 1 pièce',

      price: 650,

      image:
        '/images/landing/Umeus-Harmounikahusene.jpg',

      verified: true,

      favorite: false
    }

  ];


  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}


  ngOnInit(): void {

    this.route.queryParamMap.subscribe(
      params => {

        this.arrivalDate =
          params.get('arrival') ?? '';

        this.departureDate =
          params.get('departure') ?? '';

      }
    );

  }


  search(): void {

    if (
      !this.arrivalDate ||
      !this.departureDate
    ) {
      return;
    }


    if (
      this.departureDate <= this.arrivalDate
    ) {
      return;
    }


    this.router.navigate(
      ['/rental-search-results'],
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


  toggleFavorite(
    listing: RentalListing
  ): void {

    listing.favorite =
      !listing.favorite;

  }


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