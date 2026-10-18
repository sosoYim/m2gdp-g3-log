import {
  Component,
  Input,
  signal
} from '@angular/core';

import { ListingForm } from '../../../../core/listing/listing';

import { getAreaLabel, getSummaryLine } from '../../listing-form.data';


/*
 * Carte « Aperçu de l'annonce » (colonne de droite).
 * Sur mobile : repliée, ouverte avec « Voir ».
 */
@Component({
  selector: 'app-listing-preview',

  standalone: true,

  templateUrl: './listing-preview.html',
  styleUrl: './listing-preview.css'
})
export class ListingPreview {

  @Input({ required: true })
  form!: ListingForm;


  open =
    signal(false);


  get areaLabel(): string {

    return getAreaLabel(this.form.address);

  }


  get summary(): string {

    return getSummaryLine(this.form);

  }

}
