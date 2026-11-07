import { ViewportScroller } from '@angular/common';
import { Component, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { auth, firestore, realtimeDatabase } from './core/firebase/firebase';
import { ScrollTopButton } from './shared/components/scroll-top-button/scroll-top-button';

@Component({
  imports: [RouterOutlet, ScrollTopButton],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('sublyon');

  /* Chemin affiché (sans ?query ni #ancre) */
  private currentPath = '';

  /* Position de défilement de chaque navigation (pour le retour arrière) */
  private readonly positions = new Map<number, [number, number]>();

  private currentNavigationId = 0;

  private restoredNavigationId = 0;


  /*
   * Défilement entre les pages :
   * - nouvelle page → en haut
   * - retour / avance du navigateur → position précédente
   * - même page, autres paramètres (filtres de recherche) → pas de saut
   * - lien vers une ancre (#apropos) → géré par anchorScrolling
   */
  constructor(
    private readonly router: Router,
    private readonly viewportScroller: ViewportScroller
  ) {
    try {
      history.scrollRestoration = 'manual';
    } catch {
      // Navigateur sans support : défilement par défaut.
    }

    this.router.events.subscribe(event => {

      if (event instanceof NavigationStart) {
        this.positions.set(this.currentNavigationId, this.viewportScroller.getScrollPosition());
        this.restoredNavigationId = event.restoredState?.navigationId ?? 0;
        return;
      }

      if (!(event instanceof NavigationEnd)) {
        return;
      }

      this.currentNavigationId = event.id;

      const [path, fragment] =
        event.urlAfterRedirects.split('#');

      const pagePath =
        path.split('?')[0];

      const pageChanged =
        pagePath !== this.currentPath;

      this.currentPath = pagePath;

      const saved =
        this.positions.get(this.restoredNavigationId);

      if (this.restoredNavigationId && saved) {
        this.restorePosition(saved);
        return;
      }

      if (fragment === undefined && pageChanged) {
        this.viewportScroller.scrollToPosition([0, 0]);
      }

    });
  }


  /*
   * Retour arrière : le contenu (logements…) se charge
   * après la navigation, la page est d'abord trop courte.
   * On réessaie pendant ~1,5 s jusqu'à atteindre la position.
   */
  private restorePosition(
    position: [number, number],
    attempt = 0
  ): void {

    this.viewportScroller.scrollToPosition(position);

    const reached =
      Math.abs(this.viewportScroller.getScrollPosition()[1] - position[1]) < 2;

    if (!reached && attempt < 15) {
      setTimeout(() => this.restorePosition(position, attempt + 1), 100);
    }

  }
}
