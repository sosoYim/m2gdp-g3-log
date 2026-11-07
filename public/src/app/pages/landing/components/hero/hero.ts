import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { DateField } from '../../../../shared/components/date-field/date-field';

@Component({
  selector: 'app-hero',

  standalone: true,

  imports: [
    DateField
  ],

  styleUrl: './hero.css',
  templateUrl: './hero.html',
})
export class Hero {

  arrivalDate = '';
  departureDate = '';

  constructor(
    private readonly router: Router
  ) {}


  async search(): Promise<void> {

    if (!this.arrivalDate || !this.departureDate) {
      return;
    }


    if (this.departureDate <= this.arrivalDate) {
      return;
    }


    await this.router.navigate(
      ['/rental-search-results'],
      {
        queryParams: {
          arrival: this.arrivalDate,
          departure: this.departureDate
        }
      }
    );

  }

}