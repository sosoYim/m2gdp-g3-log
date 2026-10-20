import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal
} from '@angular/core';

import { PropertyType } from '../../../../core/listing/listing';

import { AMENITIES } from '../../../host-listing-form/listing-form.data';

import {
  BUDGET_OPTIONS,
  DURATION_OPTIONS,
  RangeOption,
  SURFACE_OPTIONS,
  SearchFilters,
  TYPE_OPTIONS,
  countActiveFilters,
  createEmptyFilters
} from '../../search-filters';


type RangeFilter =
  | 'budget'
  | 'surface'
  | 'duration';

type OpenPanel =
  | RangeFilter
  | 'more'
  | '';


/*
 * Boutons de filtres de la recherche :
 * menu déroulant sur desktop, panneau
 * en bas de l'écran sur mobile.
 * Chaque choix s'applique tout de suite.
 */
@Component({
  selector: 'app-filter-bar',

  standalone: true,

  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.css'
})
export class FilterBar {

  @Input({ required: true })
  filters!: SearchFilters;


  @Output()
  filtersChange = new EventEmitter<SearchFilters>();


  readonly rangeFilters: { key: RangeFilter; label: string; title: string; options: RangeOption[] }[] = [
    { key: 'budget', label: 'Budget', title: 'Loyer mensuel', options: BUDGET_OPTIONS },
    { key: 'surface', label: 'Surface', title: 'Surface', options: SURFACE_OPTIONS },
    { key: 'duration', label: 'Disponibilités', title: 'Durée du séjour', options: DURATION_OPTIONS }
  ];


  readonly typeOptions =
    TYPE_OPTIONS;


  readonly amenityOptions =
    AMENITIES;


  openPanel =
    signal<OpenPanel>('');


  constructor(
    private readonly elementRef: ElementRef<HTMLElement>
  ) {}


  get moreCount(): number {

    return this.filters.types.length
      + this.filters.amenities.length
      + (this.filters.furnished ? 1 : 0);

  }


  get hasActiveFilters(): boolean {

    return countActiveFilters(this.filters) > 0;

  }


  /*
   * Libellé du bouton : choix en cours
   * (« 500 à 700 € ») ou nom du filtre.
   */
  buttonLabel(
    filter: { key: RangeFilter; label: string; options: RangeOption[] }
  ): string {

    return filter.options.find(o => o.value === this.filters[filter.key])?.label
      ?? filter.label;

  }


  toggle(
    panel: OpenPanel
  ): void {

    this.openPanel.update(open => (open === panel ? '' : panel));

  }


  close(): void {

    this.openPanel.set('');

  }


  /*
   * Tranche : un 2e clic sur le choix
   * en cours le retire.
   */
  selectRange(
    key: RangeFilter,
    value: string
  ): void {

    this.emit({
      ...this.filters,
      [key]: this.filters[key] === value ? '' : value
    });

    this.close();

  }


  toggleType(
    type: PropertyType
  ): void {

    const types =
      this.filters.types.includes(type)
        ? this.filters.types.filter(t => t !== type)
        : [...this.filters.types, type];

    this.emit({ ...this.filters, types });

  }


  toggleAmenity(
    amenity: string
  ): void {

    const amenities =
      this.filters.amenities.includes(amenity)
        ? this.filters.amenities.filter(a => a !== amenity)
        : [...this.filters.amenities, amenity];

    this.emit({ ...this.filters, amenities });

  }


  toggleFurnished(): void {

    this.emit({ ...this.filters, furnished: !this.filters.furnished });

  }


  clearRange(
    key: RangeFilter
  ): void {

    this.emit({ ...this.filters, [key]: '' });

    this.close();

  }


  clearMore(): void {

    this.emit({ ...this.filters, types: [], furnished: false, amenities: [] });

  }


  clearAll(): void {

    this.emit(createEmptyFilters());

    this.close();

  }


  /*
   * Fermeture : clic en dehors, Échap
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(
    event: MouseEvent
  ): void {

    if (this.openPanel() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }

  }


  @HostListener('document:keydown.escape')
  onEscape(): void {

    this.close();

  }


  private emit(
    filters: SearchFilters
  ): void {

    this.filtersChange.emit(filters);

  }

}
