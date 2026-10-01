import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';

import { Auth } from '../../core/auth/auth';

import {
  Profile,
  UserRole
} from '../../core/profile/profile';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [UserNavbar],
  templateUrl: './role-selection.html',
  styleUrl: './role-selection.css'
})
export class RoleSelection implements OnInit {

  private readonly authService = inject(Auth);
  private readonly profileService = inject(Profile);

  firstName = signal('');

  selectedRole = signal<UserRole>('guest');

  loading = signal(false);
  errorMessage = signal('');


  async ngOnInit(): Promise<void> {

    const user =
      this.authService.getCurrentUser();

    if (!user) {
      return;
    }

    try {

      const profile =
        await this.profileService.getProfile(
          user.uid
        );

      if (profile?.firstName) {

        this.firstName.set(
          profile.firstName
        );

      }

      if (profile?.role) {

        this.selectedRole.set(
          profile.role
        );

      }

    } catch (error) {

      console.error(
        'Erreur chargement profil :',
        error
      );

    }
  }


  selectRole(
    role: UserRole
  ): void {

    this.selectedRole.set(role);

    this.errorMessage.set('');
  }


  async continue(): Promise<void> {

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

      this.errorMessage.set('');


      await this.profileService.saveRole(
        user.uid,
        this.selectedRole()
      );


      console.log(
        'Rôle enregistré dans Firestore :',
        this.selectedRole()
      );


    } catch (error) {

      console.error(
        'Erreur enregistrement rôle :',
        error
      );

      this.errorMessage.set(
        'Impossible d’enregistrer votre choix.'
      );

    } finally {

      this.loading.set(false);
    }
  }
}