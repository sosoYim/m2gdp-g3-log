import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { Auth } from '../auth/auth';


export const authGuard: CanActivateFn =
  async () => {

    const authService =
      inject(Auth);

    const router =
      inject(Router);


    /*
     * On attend Firebase.
     *
     * Cela évite de considérer l'utilisateur
     * comme déconnecté pendant le chargement
     * initial de Firebase Auth.
     */
    const user =
      await authService.waitForAuthState();


    /*
     * Utilisateur connecté :
     * accès autorisé.
     */
    if (user) {
      return true;
    }


    /*
     * Utilisateur non connecté :
     * retour landing.
     */
    return router.createUrlTree(['/']);
  };