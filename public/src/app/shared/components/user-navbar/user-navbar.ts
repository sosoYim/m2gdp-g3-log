import {
  Component,
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

import {
  Profile,
  UserRole
} from '../../../core/profile/profile';


@Component({
  selector: 'app-user-navbar',

  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl: './user-navbar.html',
  styleUrl: './user-navbar.css'
})
export class UserNavbar
  implements OnInit, OnDestroy {

  userMenuOpen = signal(false);

  role = signal<UserRole>('guest');

  switchingRole = signal(false);


  private initial = signal('');

  private email = signal('');


  private unsubscribeAuth?: Unsubscribe;


  constructor(
    private readonly authService: Auth,
    private readonly profileService: Profile,
    private readonly router: Router
  ) {}


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

            this.role.set('guest');

            return;
          }


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
             * Initiale du prénom
             */
            if (profile?.firstName) {

              initial =
                profile.firstName
                  .charAt(0)
                  .toUpperCase();

            }


            /*
             * Rôle actuel
             */
            if (profile?.role) {

              this.role.set(
                profile.role
              );

            }

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
   * Rôle actuellement sélectionné
   */
  get currentRole(): UserRole {

    return this.role();

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
      this.role() === newRole
    ) {

      if (newRole === 'guest') {

        await this.router.navigate([
          '/rental-search-results'
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
       * Mise à jour visuelle
       */
      this.role.set(
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
       *
       * L'espace annonceur n'est pas encore
       * développé par l'équipe UX.
       *
       * On revient temporairement sur
       * la sélection du rôle.
       */
      if (newRole === 'host') {

        await this.router.navigate([
          '/role-selection'
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
   * Déconnexion
   */
  async logout(): Promise<void> {

    try {

      await this.authService.logout();


      this.closeUserMenu();


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