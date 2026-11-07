import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal
} from '@angular/core';


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

    if (!this.value) {
      return 'jj/mm/aaaa';
    }

    const [year, month, day] = this.value.split('-');

    return `${day}/${month}/${year}`;

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
  get days(): ({ day: number; iso: string } | null)[] {

    const month = this.viewMonth();

    const offset = (month.getDay() + 6) % 7;

    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

    const cells: ({ day: number; iso: string } | null)[] = Array(offset).fill(null);

    for (let day = 1; day <= count; day++) {
      cells.push({
        day,
        iso: this.toIso(new Date(month.getFullYear(), month.getMonth(), day))
      });
    }

    return cells;

  }


  get today(): string {

    return this.toIso(new Date());

  }


  toggle(): void {

    if (this.open()) {
      this.open.set(false);
      return;
    }

    const [year, month] = this.value.split('-').map(Number);

    this.viewMonth.set(
      year && month
        ? new Date(year, month - 1, 1)
        : this.firstOfMonth(new Date())
    );

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


  private firstOfMonth(
    date: Date
  ): Date {

    return new Date(date.getFullYear(), date.getMonth(), 1);

  }


  private toIso(
    date: Date
  ): string {

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;

  }

}
