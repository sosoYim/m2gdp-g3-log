import { Component, Input } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ListingForm, OwnerConsent } from '../../../../core/listing/listing';

import { AMENITIES } from '../../listing-form.data';


/*
 * Étape 3 — Équipements
 */
@Component({
  selector: 'app-step-amenities',

  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl: './step-amenities.html',
  styleUrl: './step-amenities.css'
})
export class StepAmenities {

  @Input({ required: true })
  form!: ListingForm;


  readonly amenities =
    AMENITIES;


  readonly consentOptions: { value: OwnerConsent; label: string }[] = [
    { value: 'yes', label: 'Oui, j\'ai son accord' },
    { value: 'no', label: 'Non' },
    { value: 'owner', label: 'Je suis propriétaire du logement' }
  ];


  isSelected(
    value: string
  ): boolean {

    return this.form.amenities.includes(value);

  }


  toggleAmenity(
    value: string
  ): void {

    this.form.amenities =
      this.isSelected(value)
        ? this.form.amenities.filter(a => a !== value)
        : [...this.form.amenities, value];

  }

}
