import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { LISTING_STEPS } from '../../listing-form.data';


/*
 * Barre de progression des 5 étapes.
 * Les étapes déjà atteintes sont cliquables.
 */
@Component({
  selector: 'app-listing-stepper',

  standalone: true,

  templateUrl: './listing-stepper.html',
  styleUrl: './listing-stepper.css'
})
export class ListingStepper {

  /*
   * Index de l'étape affichée (0 à 4)
   */
  @Input()
  current: number = 0;


  /*
   * Étape la plus avancée déjà atteinte
   */
  @Input()
  maxReached: number = 0;


  @Output()
  stepSelect = new EventEmitter<number>();


  readonly steps =
    LISTING_STEPS;

}
