import { Component, Input } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ListingForm } from '../../../../core/listing/listing';

import { PROPERTY_TYPES } from '../../listing-form.data';

import { AddressField } from '../../components/address-field/address-field';


/*
 * Étape 1 — Le logement
 */
@Component({
  selector: 'app-step-housing',

  standalone: true,

  imports: [
    FormsModule,
    AddressField
  ],

  templateUrl: './step-housing.html'
})
export class StepHousing {

  @Input({ required: true })
  form!: ListingForm;


  readonly propertyTypes =
    PROPERTY_TYPES;

}
