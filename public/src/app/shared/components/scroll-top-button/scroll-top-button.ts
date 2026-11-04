import { Component, HostListener, signal } from '@angular/core';


/*
 * Bouton flottant en bas à droite :
 * apparaît après un défilement
 * et ramène en haut de la page.
 */
@Component({
  selector: 'app-scroll-top-button',

  standalone: true,

  imports: [],

  templateUrl: './scroll-top-button.html',

  styleUrl: './scroll-top-button.css'
})
export class ScrollTopButton {

  /* Défilement (px) à partir duquel le bouton s'affiche */
  private readonly showAfter = 400;

  visible = signal(false);


  @HostListener('window:scroll')
  onWindowScroll(): void {

    this.visible.set(
      window.scrollY > this.showAfter
    );

  }


  scrollToTop(): void {

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }
}
