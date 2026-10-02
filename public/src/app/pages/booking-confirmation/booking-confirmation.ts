import {
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


  listingId = '1';

  arrivalDate = '';
  departureDate = '';


  listing = {

    title: 'Charmant studio-loft',

    location: 'Lyon 2e',

    details: 'Meublé · 22 m²',

    owner: 'Lucas',

    price: 650,

    image:
      '/images/rental/property-1/Umeus.png'

  };


  ngOnInit(): void {

    this.listingId =
      this.route.snapshot.paramMap.get('id') ?? '1';


    this.route.queryParamMap.subscribe(
      params => {

        this.arrivalDate =
          params.get('arrival') ?? '';

        this.departureDate =
          params.get('departure') ?? '';

      }
    );

  }


  formatDate(
    date: string
  ): string {

    if (!date) {
      return 'Non définie';
    }


    const parsedDate =
      new Date(`${date}T00:00:00`);


    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    ).format(parsedDate);

  }


  async openConversation(): Promise<void> {

    /*
     * La vraie messagerie
     * sera branchée plus tard.
     */
    console.log(
      'Ouvrir conversation avec',
      this.listing.owner
    );

  }


  async backToListings(): Promise<void> {

    await this.router.navigate(
      ['/rental-search-results'],
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