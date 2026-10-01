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
import { Profile } from '../../../core/profile/profile';

@Component({
  selector: 'app-user-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './user-navbar.html',
  styleUrl: './user-navbar.css'
})
export class UserNavbar
  implements OnInit, OnDestroy {

  userMenuOpen = signal(false);

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

          if (!user) {

            this.initial.set('');
            this.email.set('');

            return;
          }


          this.email.set(
            user.email ?? ''
          );


          /*
           * Valeur de secours :
           * première lettre de l'e-mail.
           */
          let initial =
            user.email
              ?.charAt(0)
              .toUpperCase() ?? '';


          /*
           * Priorité au vrai prénom
           * enregistré dans Firestore.
           */
          try {

            const profile =
              await this.profileService.getProfile(
                user.uid
              );


            if (profile?.firstName) {

              initial =
                profile.firstName
                  .charAt(0)
                  .toUpperCase();

            }

          } catch (error) {

            console.error(
              'Erreur chargement profil navbar :',
              error
            );

          }


          this.initial.set(initial);

        }
      );
  }


  ngOnDestroy(): void {

    this.unsubscribeAuth?.();

  }


  get userInitial(): string {
    return this.initial();
  }


  get userEmail(): string {
    return this.email();
  }


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


  async logout(): Promise<void> {

    try {

      await this.authService.logout();

      this.closeUserMenu();

      await this.router.navigate(['/']);

    } catch (error) {

      console.error(
        'Erreur lors de la déconnexion :',
        error
      );

    }
  }


  @HostListener('document:click')
  onDocumentClick(): void {

    if (this.userMenuOpen()) {

      this.closeUserMenu();

    }
  }
}