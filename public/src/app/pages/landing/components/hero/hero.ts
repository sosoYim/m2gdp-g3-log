import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hero',

  standalone: true,

  imports: [
    FormsModule
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