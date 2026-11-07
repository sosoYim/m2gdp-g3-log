import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal
} from '@angular/core';

import {
  formatIsoDate,
  toIsoDate
} from '../../../core/dates/dates';


/* Taille du calendrier, pour le placer dans l'écran */
const CALENDAR_WIDTH = 296;
const CALENDAR_HEIGHT = 340;
const GAP = 6;


/*
 * Champ de date : toute la zone ouvre
 * un calendrier en français (le calendrier
 * natif suit la langue du navigateur).
 * Valeur au format 'YYYY-MM-DD',
 * affichée en JJ/MM/AAAA.
 * Utilisation : <app-date-field label="Arrivée" [(value)]="arrivalDate" />
 * [min] / [max] : seules ces dates sont sélectionnables.
 * Contenu projeté (ex. icône) : affiché à gauche du texte.
 */
@Component({
  selector: 'app-date-field',

  standalone: true,

  templateUrl: './date-field.html',
  styleUrl: './date-field.css'
})
export class DateField {

  @Input({ required: true })
  label = '';


  @Input()
  value = '';


  /* Première / dernière date possible ('' = pas de limite) */
  @Input()
  min = '';


  @Input()
  max = '';


  @Output()
  valueChange = new EventEmitter<string>();


  readonly weekDays =
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'];


  open =
    signal(false);


  /* Premier jour du mois affiché */
  viewMonth =
    signal(this.firstOfMonth(new Date()));


  position =
    signal({ top: 0, left: 0 });


  constructor(
    private readonly elementRef: ElementRef<HTMLElement>
  ) {}


  get displayValue(): string {

    return this.value
      ? formatIsoDate(this.value)
      : 'jj/mm/aaaa';

  }


  /* « Juillet 2027 » */
  get monthTitle(): string {

    const title = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
      .format(this.viewMonth());

    return title.charAt(0).toUpperCase() + title.slice(1);

  }


  /*
   * Cases du mois (semaine du lundi au dimanche) :
   * null = case vide avant le 1er.
   */
  get days(): ({ day: number; iso: string; disabled: boolean } | null)[] {

    const month = this.viewMonth();

    const offset = (month.getDay() + 6) % 7;

    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

    const cells: ({ day: number; iso: string; disabled: boolean } | null)[] = Array(offset).fill(null);

    for (let day = 1; day <= count; day++) {
      const iso = toIsoDate(new Date(month.getFullYear(), month.getMonth(), day));

      cells.push({ day, iso, disabled: !this.isAllowed(iso) });
    }

    return cells;

  }


  get today(): string {

    return toIsoDate(new Date());

  }


  /* Pas de navigation vers un mois sans date possible */
  get canGoPrevious(): boolean {

    return !this.min || toIsoDate(this.viewMonth()) > this.min;

  }


  get canGoNext(): boolean {

    const month = this.viewMonth();

    return !this.max
      || toIsoDate(new Date(month.getFullYear(), month.getMonth() + 1, 1)) <= this.max;

  }


  toggle(): void {

    if (this.open()) {
      this.open.set(false);
      return;
    }

    /*
     * Mois affiché : la valeur, sinon aujourd'hui
     * ramené dans la période possible.
     */
    let start = this.value || this.today;

    if (this.min && start < this.min) {
      start = this.min;
    }

    if (this.max && start > this.max) {
      start = this.max;
    }

    const [year, month] = start.split('-').map(Number);

    this.viewMonth.set(new Date(year, month - 1, 1));

    this.updatePosition();

    this.open.set(true);

  }


  changeMonth(
    step: number
  ): void {

    const month = this.viewMonth();

    this.viewMonth.set(new Date(month.getFullYear(), month.getMonth() + step, 1));

  }


  select(
    iso: string
  ): void {

    if (!this.isAllowed(iso)) {
      return;
    }

    this.value = iso;

    this.valueChange.emit(iso);

    this.open.set(false);

  }


  /*
   * Calendrier sous le champ, gardé dans l'écran
   * (au-dessus du champ s'il n'y a pas la place en dessous).
   */
  @HostListener('window:scroll')
  @HostListener('window:resize')
  updatePosition(): void {

    const rect = this.elementRef.nativeElement.getBoundingClientRect();

    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - CALENDAR_WIDTH - 8)
    );

    const below = rect.bottom + GAP;

    const top = below + CALENDAR_HEIGHT > window.innerHeight && rect.top - CALENDAR_HEIGHT - GAP > 0
      ? rect.top - CALENDAR_HEIGHT - GAP
      : below;

    this.position.set({ top, left });

  }


  /*
   * Fermeture : clic en dehors, Échap
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(
    event: MouseEvent
  ): void {

    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }

  }


  @HostListener('document:keydown.escape')
  onEscape(): void {

    this.open.set(false);

  }


  private isAllowed(
    iso: string
  ): boolean {

    return (!this.min || iso >= this.min)
      && (!this.max || iso <= this.max);

  }


  private firstOfMonth(
    date: Date
  ): Date {

    return new Date(date.getFullYear(), date.getMonth(), 1);

  }



}
