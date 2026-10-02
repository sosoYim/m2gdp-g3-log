import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { Router } from '@angular/router';

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

  private readonly router = inject(Router);


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


      /*
       * 1. Sauvegarder le rôle dans Firestore
       */
      await this.profileService.saveRole(
        user.uid,
        this.selectedRole()
      );


      /*
       * 2. Vérifier si l'utilisateur voulait
       * contacter un logement avant sa connexion.
       */
      const pendingBooking =
        localStorage.getItem(
          'baillYonPendingBooking'
        );


      /*
       * 3. Demandeur + logement en attente
       *
       * On reprend automatiquement son parcours.
       */
      if (
        this.selectedRole() === 'guest' &&
        pendingBooking
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
       * 4. Demandeur sans réservation en attente
       *
       * On l'envoie vers la recherche.
       */
      if (
        this.selectedRole() === 'guest'
      ) {

        await this.router.navigate([
          '/rental-search-results'
        ]);


        return;
      }


      /*
       * 5. Annonceur
       *
       * Les maquettes annonceur ne sont pas encore
       * terminées. Pour l'instant, on conserve
       * simplement son rôle.
       */
      if (
        this.selectedRole() === 'host'
      ) {

        localStorage.removeItem(
          'baillYonPendingBooking'
        );


        console.log(
          'Rôle annonceur enregistré.'
        );

      }

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