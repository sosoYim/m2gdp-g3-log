import {
  Component,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';

import {
  Unsubscribe
} from 'firebase/auth';

import { AuthModal } from '../auth-modal/auth-modal';
import { UserNavbar } from '../user-navbar/user-navbar';

import { Auth } from '../../../core/auth/auth';


@Component({
  selector: 'app-navbar',

  standalone: true,

  imports: [
    AuthModal,
    UserNavbar
  ],

  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {

  authModalOpen =
    signal(false);

  isAuthenticated =
    signal(false);

  authReady =
    signal(false);


  private unsubscribeAuth:
    Unsubscribe | null = null;


  constructor(
    private readonly authService: Auth
  ) {}


  ngOnInit(): void {

    /*
     * On écoute Firebase Auth.
     *
     * Cela permet à la navbar de savoir
     * automatiquement si l'utilisateur
     * est connecté ou déconnecté.
     */
    this.unsubscribeAuth =
      this.authService.observeAuthState(
        user => {

          this.isAuthenticated.set(
            !!user
          );

          this.authReady.set(true);

        }
      );

  }


  ngOnDestroy(): void {

    /*
     * On arrête l'écoute Firebase lorsque
     * le composant est détruit.
     */
    if (this.unsubscribeAuth) {

      this.unsubscribeAuth();

    }

  }


  openAuth(): void {

    /*
     * Un utilisateur déjà connecté
     * ne doit pas pouvoir ouvrir
     * la fenêtre de connexion.
     */
    if (this.isAuthenticated()) {
      return;
    }

    this.authModalOpen.set(true);

  }


  closeAuthModal(): void {

    this.authModalOpen.set(false);

  }

}