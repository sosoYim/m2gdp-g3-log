import {
  ChangeDetectorRef,
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

  firstName = '';

  lastName = '';

  email = '';


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
    private readonly profileService: Profile,
    private readonly cdr: ChangeDetectorRef
  ) {}


  async ngOnInit(): Promise<void> {

    try {

      /*
       * On attend que Firebase ait terminé
       * la restauration de la session.
       */
      const user =
        await this.authService.waitForAuthState();


      /*
       * Aucun utilisateur connecté.
       */
      if (!user) {
        return;
      }


      /*
       * L'adresse e-mail officielle vient
       * toujours de Firebase Authentication.
       */
      this.email =
        user.email ?? '';


      /*
       * Firebase fonctionne en dehors du cycle
       * de détection Angular dans notre configuration.
       * On force donc immédiatement l'affichage
       * de l'adresse e-mail.
       */
      this.cdr.detectChanges();


      /*
       * Chargement des informations complémentaires
       * depuis Firestore.
       */
      const profile =
        await this.profileService.getProfile(
          user.uid
        );


      /*
       * Le compte Firebase peut exister sans
       * document de profil Firestore.
       */
      if (!profile) {

        this.cdr.detectChanges();

        return;

      }


      /*
       * Prénom
       */
      if (profile.firstName) {

        this.firstName =
          profile.firstName;

      }


      /*
       * Nom
       */
      if (profile.lastName) {

        this.lastName =
          profile.lastName;

      }


      /*
       * Rôle
       */
      if (profile.role) {

        this.currentRole.set(
          profile.role
        );

      }


      /*
       * Actualisation de l'interface après
       * le chargement asynchrone Firestore.
       */
      this.cdr.detectChanges();


    } catch (error) {

      console.error(
        'Erreur chargement paramètres :',
        error
      );


      /*
       * Permet également d'afficher l'e-mail
       * Firebase si Firestore rencontre une erreur.
       */
      this.cdr.detectChanges();

    }

  }


  async savePersonalInfo(): Promise<void> {

    this.successMessage.set('');

    this.errorMessage.set('');


    const firstName =
      this.firstName.trim();

    const lastName =
      this.lastName.trim();


    if (!firstName) {

      this.errorMessage.set(
        'Veuillez renseigner votre prénom.'
      );

      return;

    }


    if (!lastName) {

      this.errorMessage.set(
        'Veuillez renseigner votre nom.'
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
          firstName,
          lastName,

          /*
           * L'e-mail sauvegardé reste synchronisé
           * avec Firebase Authentication.
           */
          email:
            user.email ?? '',

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

    this.errorMessage.set('');


    /*
     * Mise à jour immédiate de l'interface.
     */
    this.currentRole.set(
      role
    );


    const user =
      this.authService.getCurrentUser();


    if (!user) {

      this.errorMessage.set(
        'Vous devez être connecté pour changer de rôle.'
      );

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


      this.errorMessage.set(
        'Impossible de modifier votre rôle.'
      );

    }

  }


  async logout(): Promise<void> {

    try {

      await this.authService.logout();


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

    /*
     * Fonctionnalité à implémenter plus tard.
     */
    console.log(
      'Suppression du compte à implémenter.'
    );

  }

}