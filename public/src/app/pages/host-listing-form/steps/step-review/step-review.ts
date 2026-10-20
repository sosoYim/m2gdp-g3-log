import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { ListingForm } from '../../../../core/listing/listing';

import {
  formatFrenchDate,
  getAmenityLabel,
  getAreaLabel,
  getSummaryLine
} from '../../listing-form.data';


/*
 * Étape 5 — Aperçu (annonce telle que
 * les étudiants la verront)
 */
@Component({
  selector: 'app-step-review',

  standalone: true,

  templateUrl: './step-review.html',
  styleUrl: './step-review.css'
})
export class StepReview {

  @Input({ required: true })
  form!: ListingForm;

  @Input()
  ownerName: string = '';


  /*
   * « Modifier » : retour à l'étape 1
   */
  @Output()
  edit = new EventEmitter<void>();


  readonly formatDate =
    formatFrenchDate;

  readonly amenityLabel =
    getAmenityLabel;


  get areaLabel(): string {

    return getAreaLabel(this.form.arrondissement);

  }


  get summary(): string {

    return getSummaryLine(this.form, true);

  }


  /*
   * 4 vignettes à droite de la photo principale
   */
  get thumbnails(): (string | null)[] {

    return Array.from(
      { length: 4 },
      (_, i) => this.form.photos[i + 1]?.url ?? null
    );

  }


  get rulesLine(): string {

    return [
      this.form.nonSmoking ? 'Logement non-fumeur' : 'Fumeurs acceptés',
      this.form.petsAllowed ? 'Animaux acceptés' : 'Animaux non acceptés'
    ].join(' · ');

  }

}
