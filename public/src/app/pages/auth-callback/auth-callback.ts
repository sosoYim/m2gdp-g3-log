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
       * 1. Firebase valide le lien magique.
       */
      await this.authService.completeMagicLink();


      /*
       * 2. Récupérer l'utilisateur Firebase connecté.
       */
      const user =
        this.authService.getCurrentUser();

      if (!user) {
        throw new Error(
          'Utilisateur connecté introuvable.'
        );
      }


      /*
       * 3. Chercher son profil BailLyon dans Firestore.
       */
      const profile =
        await this.profileService.getProfile(
          user.uid
        );


      /*
       * 4. Utilisateur déjà inscrit.
       *
       * Son profil existe :
       * → on continue vers BailLyon.
       */
      if (
        profile &&
        profile.firstName &&
        profile.lastName
      ) {

        await this.router.navigate([
          '/role-selection'
        ]);

        return;
      }


      /*
       * 5. Nouvel utilisateur.
       *
       * Firebase l'a authentifié,
       * mais aucun profil BailLyon n'existe encore.
       *
       * → prénom + nom
       */
      await this.router.navigate([
        '/complete-profile'
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