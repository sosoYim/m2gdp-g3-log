import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';


/*
 * =========================================
 * RÉSUMÉ DE LA RECHERCHE (ZONE REPLIÉE)
 * =========================================
 *
 * Écran étroit : la zone dates + filtres se
 * replie après une recherche pour laisser
 * la place aux résultats (surtout la carte).
 *  - repliée : une ligne « dates · filtres »,
 *    clic pour modifier ;
 *  - dépliée : poignée « Réduire ».
 */
@Component({
  selector: 'app-search-summary',

  standalone: true,

  imports: [],

  templateUrl: './search-summary.html',
  styleUrl: './search-summary.css'
})
export class SearchSummary {

  @Input()
  collapsed = false;

  @Input()
  arrivalDate = '';

  @Input()
  departureDate = '';

  @Input()
  filterCount = 0;


  @Output()
  collapsedChange =
    new EventEmitter<boolean>();


  /*
   * « 12 juil. → 30 sept. »
   */
  get datesLabel(): string {

    if (!this.arrivalDate || !this.departureDate) {
      return 'Choisir des dates';
    }

    return `${formatShort(this.arrivalDate)} → ${formatShort(this.departureDate)}`;

  }


  get filtersLabel(): string {

    if (!this.filterCount) {
      return '';
    }

    return `${this.filterCount} filtre${this.filterCount > 1 ? 's' : ''}`;

  }


  toggle(): void {

    this.collapsedChange.emit(!this.collapsed);

  }

}


function formatShort(
  iso: string
): string {

  const [year, month, day] =
    iso.split('-').map(Number);

  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
    .format(new Date(year, month - 1, day));

}
