import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { Router } from '@angular/router';

import { Auth } from '../../core/auth/auth';
import { Profile } from '../../core/profile/profile';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.css'
})
export class AuthCallback implements OnInit {

  private readonly authService = inject(Auth);
  private readonly profileService = inject(Profile);
  private readonly router = inject(Router);

  loading = signal(true);
  errorMessage = signal('');


  async ngOnInit(): Promise<void> {

    try {

      /*
       * 1. Terminer la connexion Magic Link
       */
      await this.authService.completeMagicLink();


      /*
       * 2. Utilisateur Firebase
       */
      const user =
        this.authService.getCurrentUser();

      if (!user) {
        throw new Error(
          'Utilisateur connecté introuvable.'
        );
      }


      /*
       * 3. Profil BailLyon
       */
      const profile =
        await this.profileService.getProfile(
          user.uid
        );


      /*
       * 4. Logement que l'utilisateur voulait contacter
       */
      const pendingBooking =
        localStorage.getItem(
          'baillYonPendingBooking'
        );


      /*
       * 5. Nouvel utilisateur
       *
       * Il doit compléter prénom + nom.
       */
      if (
        !profile ||
        !profile.firstName ||
        !profile.lastName
      ) {

        await this.router.navigate([
          '/complete-profile'
        ]);

        return;
      }


      /*
       * 6. L'utilisateur voulait contacter
       * un logement et il est demandeur.
       */
      if (
        pendingBooking &&
        profile.role === 'guest'
      ) {

        localStorage.removeItem(
          'baillYonPendingBooking'
        );

        await this.router.navigate([
          '/booking-request',
          pendingBooking
        ]);

        return;
      }


      /*
       * 7. Aucun rôle ou utilisateur actuellement annonceur.
       *
       * On passe par la sélection du rôle.
       */
      await this.router.navigate([
        '/role-selection'
      ]);

    } catch (error) {

      console.error(
        'Erreur connexion magic link :',
        error
      );

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Impossible de terminer la connexion.'
      );

      this.loading.set(false);
    }
  }
} 