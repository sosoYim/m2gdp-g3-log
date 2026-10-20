import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  signal
} from '@angular/core';


/*
 * =========================================
 * GALERIE DU LOGEMENT
 * =========================================
 *
 * Desktop : grande photo + 4 vignettes (fixe).
 * Mobile : photo choisie en grand (n / total)
 * + carrousel de vignettes, balayage gauche / droite.
 *
 * Le contenu projeté (bouton favori)
 * est placé sur la grande photo.
 */
@Component({
  selector: 'app-property-gallery',

  standalone: true,

  templateUrl: './property-gallery.html',
  styleUrl: './property-gallery.css'
})
export class PropertyGallery {

  @Input()
  set photos(value: string[]) {
    this.photoList = value;
    this.selected.set(0);
  }

  @Input()
  title = '';


  photoList: string[] = [];

  selected =
    signal(0);

  @ViewChild('strip')
  strip?: ElementRef<HTMLElement>;


  private touchStartX = 0;

  private touchStartY = 0;


  /*
   * Desktop : 4 emplacements après la 1re photo
   */
  get desktopThumbnails(): string[] {
    return [1, 2, 3, 4].map(i => this.photoList[i] ?? '');
  }


  select(
    index: number
  ): void {

    const total =
      this.photoList.length;

    if (total) {
      this.selected.set((index + total) % total);
      this.scrollStripToSelected();
    }

  }


  /*
   * Carrousel mobile : la vignette choisie
   * reste visible (centrée si possible),
   * sans faire défiler la page.
   */
  private scrollStripToSelected(): void {

    const strip =
      this.strip?.nativeElement;

    const item =
      strip?.children[this.selected()] as HTMLElement | undefined;

    if (!strip || !item) {
      return;
    }


    strip.scrollTo({
      left: item.offsetLeft - (strip.clientWidth - item.offsetWidth) / 2,
      behavior: 'smooth'
    });

  }


  onTouchStart(
    event: TouchEvent
  ): void {

    this.touchStartX =
      event.changedTouches[0].clientX;

    this.touchStartY =
      event.changedTouches[0].clientY;

  }


  onTouchEnd(
    event: TouchEvent
  ): void {

    const delta =
      event.changedTouches[0].clientX - this.touchStartX;

    const deltaY =
      event.changedTouches[0].clientY - this.touchStartY;


    /*
     * Geste horizontal uniquement
     * (le défilement vertical reste libre)
     */
    if (Math.abs(delta) > 40 && Math.abs(delta) > Math.abs(deltaY)) {
      this.select(this.selected() + (delta < 0 ? 1 : -1));
    }

  }

}
