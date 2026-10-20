import {
  Component,
  HostBinding,
  HostListener,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import { Unsubscribe } from 'firebase/auth';

import { Auth } from '../../../core/auth/auth';
import { Booking } from '../../../core/booking/booking';
import { Messaging } from '../../../core/messaging/messaging';

import {
  Profile,
  UserRole
} from '../../../core/profile/profile';

import { MobileMenu } from '../mobile-menu/mobile-menu';


@Component({
  selector: 'app-user-navbar',

  standalone: true,

  imports: [
    RouterLink,
    MobileMenu
  ],

  templateUrl: './user-navbar.html',
  styleUrl: './user-navbar.css'
})
export class UserNavbar
  implements OnInit, OnDestroy {

  userMenuOpen = signal(false);

  mobileMenuOpen = signal(false);

  switchingRole = signal(false);


  private initial = signal('');

  private email = signal('');

  private fullName = signal('');


  private unsubscribeAuth?: Unsubscribe;


  constructor(
    private readonly authService: Auth,
    private readonly profileService: Profile,
    private readonly bookingService: Booking,
    private readonly messagingService: Messaging,
    private readonly router: Router
  ) {}


  /*
   * Point violet sur l'icône Messages
   */
  get hasUnread(): boolean {

    return this.messagingService.hasUnread();

  }


  ngOnInit(): void {

    this.unsubscribeAuth =
      this.authService.observeAuthState(
        async user => {

          /*
           * Utilisateur déconnecté
           */
          if (!user) {

            this.initial.set('');

            this.email.set('');

            this.fullName.set('');

            return;
          }


          /*
           * Messages non lus (écoute partagée,
           * lancée une seule fois par compte)
           */
          this.messagingService.watchUnread(
            user.uid
          );


          /*
           * Email
           */
          this.email.set(
            user.email ?? ''
          );


          /*
           * Initiale de secours :
           * première lettre de l'email.
           */
          let initial =
            user.email
              ?.charAt(0)
              .toUpperCase() ?? '';


          try {

            /*
             * Profil Firestore
             */
            const profile =
              await this.profileService.getProfile(
                user.uid
              );


            /*
             * Profil public (nom visible par
             * les annonceurs) : créé s'il manque.
             */
            if (profile) {
              this.profileService
                .ensurePublicProfile(user.uid, profile)
                .catch(err => console.error('Erreur profil public :', err));
            }


            /*
             * Initiale du prénom
             */
            if (profile?.firstName) {

              initial =
                profile.firstName
                  .charAt(0)
                  .toUpperCase();


              this.fullName.set(
                `${profile.firstName} ${profile.lastName}`.trim()
              );

            }


            /*
             * Rôle actuel
             */
            this.profileService.setCurrentRole(
              user.uid,
              profile?.role ?? 'guest'
            );

          } catch (error) {

            console.error(
              'Erreur chargement profil navbar :',
              error
            );

          }


          this.initial.set(
            initial
          );

        }
      );

  }


  ngOnDestroy(): void {

    this.unsubscribeAuth?.();

    this.setBodyScrollLocked(false);

  }


  /*
   * Initiale affichée
   */
  get userInitial(): string {

    return this.initial();

  }


  /*
   * Email affiché dans le menu
   */
  get userEmail(): string {

    return this.email();

  }


  /*
   * Nom complet affiché dans le menu mobile
   */
  get userFullName(): string {

    return this.fullName();

  }


  /*
   * Rôle actuellement sélectionné
   */
  get currentRole(): UserRole {

    return this.profileService.currentRole();

  }


  /*
   * Changement Je viens / J'accueille
   */
  async switchRole(
    newRole: UserRole
  ): Promise<void> {

    if (this.switchingRole()) {
      return;
    }


    this.closeMobileMenu();


    const user =
      this.authService.getCurrentUser();


    /*
     * Pas connecté :
     * aucun changement possible.
     */
    if (!user) {
      return;
    }


    /*
     * Si le rôle est déjà actif,
     * on redirige simplement vers
     * l'espace correspondant.
     */
    if (
      this.currentRole === newRole
    ) {

      if (newRole === 'guest') {

        await this.router.navigate([
          '/rental-search-results'
        ]);

      }

      if (newRole === 'host') {

        await this.router.navigate([
          '/host/dashboard'
        ]);

      }

      return;

    }


    try {

      this.switchingRole.set(true);


      /*
       * Sauvegarde Firestore
       */
      await this.profileService.saveRole(
        user.uid,
        newRole
      );



      /*
       * DEMANDEUR
       */
      if (newRole === 'guest') {

        await this.router.navigate([
          '/rental-search-results'
        ]);

        return;

      }


      /*
       * ANNONCEUR
       */
      if (newRole === 'host') {

        await this.router.navigate([
          '/host/dashboard'
        ]);

      }


    } catch (error) {

      console.error(
        'Erreur changement de rôle :',
        error
      );


    } finally {

      this.switchingRole.set(false);

    }

  }


  /*
   * Menu utilisateur
   */
  toggleUserMenu(
    event: MouseEvent
  ): void {

    event.stopPropagation();


    this.userMenuOpen.update(
      current => !current
    );

  }


  closeUserMenu(): void {

    this.userMenuOpen.set(false);

  }


  /*
   * =========================================
   * MENU MOBILE
   * =========================================
   */

  /*
   * Header fixé en haut pendant que
   * le menu mobile est ouvert.
   */
  @HostBinding('class.mobile-menu-open')
  get isMobileMenuOpen(): boolean {

    return this.mobileMenuOpen();

  }


  toggleMobileMenu(): void {

    if (this.mobileMenuOpen()) {

      this.closeMobileMenu();

      return;

    }


    this.mobileMenuOpen.set(true);

    this.setBodyScrollLocked(true);

  }


  closeMobileMenu(): void {

    this.mobileMenuOpen.set(false);

    this.setBodyScrollLocked(false);

  }


  /*
   * Bloque le défilement de la page
   * derrière le menu ouvert.
   */
  private setBodyScrollLocked(
    locked: boolean
  ): void {

    document.body.style.overflow =
      locked ? 'hidden' : '';

  }


  /*
   * Passage en affichage desktop :
   * on ferme le menu mobile.
   */
  @HostListener('window:resize')
  onWindowResize(): void {

    if (
      this.mobileMenuOpen() &&
      window.innerWidth > 760
    ) {

      this.closeMobileMenu();

    }

  }


  /*
   * Déconnexion
   */
  async logout(): Promise<void> {

    try {

      await this.authService.logout();

      this.bookingService.clearPendingCount();

      this.messagingService.clearUnread();


      this.closeUserMenu();

      this.closeMobileMenu();


      await this.router.navigate([
        '/'
      ]);


    } catch (error) {

      console.error(
        'Erreur lors de la déconnexion :',
        error
      );

    }

  }


  /*
   * Fermer le menu quand on clique
   * ailleurs sur la page.
   */
  @HostListener('document:click')
  onDocumentClick(): void {

    if (
      this.userMenuOpen()
    ) {

      this.closeUserMenu();

    }

  }

}