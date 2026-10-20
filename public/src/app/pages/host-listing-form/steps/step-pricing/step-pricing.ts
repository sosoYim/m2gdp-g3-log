import { Component, Input } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ListingForm } from '../../../../core/listing/listing';


/*
 * Étape 4 — Dates et loyer
 *
 * TODO : mise en page provisoire (maquette non reçue),
 * champs déduits de l'étape « Aperçu ».
 */
@Component({
  selector: 'app-step-pricing',

  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl: './step-pricing.html'
})
export class StepPricing {

  @Input({ required: true })
  form!: ListingForm;


  readonly minStayOptions =
    Array.from({ length: 12 }, (_, i) => i + 1);

}
