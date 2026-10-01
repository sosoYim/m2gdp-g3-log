import {
  Component,
  inject,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '../../core/auth/auth';
import { Profile } from '../../core/profile/profile';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './complete-profile.html',
  styleUrl: './complete-profile.css'
})
export class CompleteProfile {

  private readonly authService = inject(Auth);
  private readonly profileService = inject(Profile);
  private readonly router = inject(Router);

  firstName = '';
  lastName = '';

  loading = signal(false);
  errorMessage = signal('');


  async saveProfile(): Promise<void> {

    this.errorMessage.set('');

    const firstName =
      this.firstName.trim();

    const lastName =
      this.lastName.trim();

    if (!firstName) {
      this.errorMessage.set(
        'Veuillez saisir votre prénom.'
      );
      return;
    }

    if (!lastName) {
      this.errorMessage.set(
        'Veuillez saisir votre nom.'
      );
      return;
    }

    const user =
      this.authService.getCurrentUser();

    if (!user) {
      this.errorMessage.set(
        'Utilisateur non connecté.'
      );
      return;
    }

    try {

      this.loading.set(true);

      await this.profileService.saveProfile(
        user.uid,
        {
          firstName,
          lastName,
          email: user.email ?? ''
        }
      );

      await this.router.navigate([
        '/role-selection'
      ]);

    } catch (error) {

      console.error(
        'Erreur sauvegarde profil :',
        error
      );

      this.errorMessage.set(
        'Impossible d’enregistrer votre profil.'
      );

    } finally {

      this.loading.set(false);
    }
  }
}