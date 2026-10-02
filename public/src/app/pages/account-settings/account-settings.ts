import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { AccountSidebar } from '../../shared/components/account-sidebar/account-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';

import {
  Profile,
  UserRole
} from '../../core/profile/profile';


@Component({
  selector: 'app-account-settings',

  standalone: true,

  imports: [
    FormsModule,
    UserNavbar,
    AccountSidebar,
    ContactSection,
    Footer
  ],

  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css'
})
export class AccountSettings implements OnInit {

  firstName = 'Alice';

  lastName = 'Martin';

  email = 'alice.martin@gmail.com';


  currentRole =
    signal<UserRole>('guest');


  notificationMessages = true;

  notificationRequests = true;

  notificationNews = false;


  saving =
    signal(false);

  successMessage =
    signal('');

  errorMessage =
    signal('');


  constructor(
    private readonly router: Router,
    private readonly authService: Auth,
    private readonly profileService: Profile
  ) {}


  async ngOnInit(): Promise<void> {

    try {

      const user =
        await this.authService.waitForAuthState();


      if (!user) {
        return;
      }


      this.email =
        user.email ?? this.email;


      const profile =
        await this.profileService.getProfile(
          user.uid
        );


      if (!profile) {
        return;
      }


      if (profile.firstName) {

        this.firstName =
          profile.firstName;

      }


      if (profile.lastName) {

        this.lastName =
          profile.lastName;

      }


      if (profile.email) {

        this.email =
          profile.email;

      }


      if (profile.role) {

        this.currentRole.set(
          profile.role
        );

      }

    } catch (error) {

      console.error(
        'Erreur chargement paramètres :',
        error
      );

    }

  }


  async savePersonalInfo(): Promise<void> {

    this.successMessage.set('');

    this.errorMessage.set('');


    if (
      !this.firstName.trim() ||
      !this.lastName.trim()
    ) {

      this.errorMessage.set(
        'Veuillez renseigner votre prénom et votre nom.'
      );

      return;

    }


    const user =
      this.authService.getCurrentUser();


    if (!user) {

      this.errorMessage.set(
        'Vous devez être connecté pour enregistrer les modifications.'
      );

      return;

    }


    try {

      this.saving.set(true);


      await this.profileService.saveProfile(
        user.uid,
        {
          firstName:
            this.firstName,

          lastName:
            this.lastName,

          email:
            user.email ?? this.email,

          role:
            this.currentRole()
        }
      );


      this.successMessage.set(
        'Vos modifications ont bien été enregistrées.'
      );

    } catch (error) {

      console.error(
        'Erreur sauvegarde profil :',
        error
      );


      this.errorMessage.set(
        'Impossible d’enregistrer vos modifications.'
      );

    } finally {

      this.saving.set(false);

    }

  }


  async selectRole(
    role: UserRole
  ): Promise<void> {

    this.currentRole.set(
      role
    );


    const user =
      this.authService.getCurrentUser();


    if (!user) {
      return;
    }


    try {

      await this.profileService.saveRole(
        user.uid,
        role
      );

    } catch (error) {

      console.error(
        'Erreur changement de rôle :',
        error
      );

    }

  }


  async logout(): Promise<void> {

    try {

      const user =
        this.authService.getCurrentUser();


      if (user) {

        await this.authService.logout();

      }


      await this.router.navigate([
        '/'
      ]);

    } catch (error) {

      console.error(
        'Erreur déconnexion :',
        error
      );

    }

  }


  deleteAccount(): void {

    console.log(
      'Suppression du compte à implémenter.'
    );

  }

}