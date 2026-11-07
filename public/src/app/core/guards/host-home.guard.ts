import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { Auth } from '../auth/auth';

import { Profile } from '../profile/profile';


/*
 * Page d'accueil : un annonceur connecté
 * (« J'accueille ») va directement
 * à son tableau de bord.
 */
export const hostHomeGuard: CanActivateFn =
  async () => {

    const authService =
      inject(Auth);

    const profileService =
      inject(Profile);

    const router =
      inject(Router);


    const user =
      await authService.waitForAuthState();


    if (!user) {
      return true;
    }


    /*
     * Rôle mémorisé pour ce compte,
     * sinon lu dans Firestore.
     */
    try {

      const role =
        profileService.hasStoredRoleFor(user.uid)
          ? profileService.currentRole()
          : (await profileService.getProfile(user.uid))?.role;


      if (role === 'host') {
        return router.createUrlTree(['/host/dashboard']);
      }

    } catch (error) {

      console.error(
        'Erreur lecture du rôle :',
        error
      );

    }


    return true;
  };
