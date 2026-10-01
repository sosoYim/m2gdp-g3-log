import { Routes } from '@angular/router';

import { Landing } from './pages/landing/landing';

import { AuthCallback } from './pages/auth-callback/auth-callback';

import { CompleteProfile } from './pages/complete-profile/complete-profile';

import { RoleSelection } from './pages/role-selection/role-selection';

import { authGuard } from './core/guards/auth.guard';


export const routes: Routes = [

  /*
   * Public
   */
  {
    path: '',
    component: Landing
  },


  /*
   * Public également :
   * Firebase doit pouvoir arriver ici
   * avant que l'utilisateur soit connecté.
   */
  {
    path: 'auth/callback',
    component: AuthCallback
  },


  /*
   * Privé :
   * uniquement après authentification.
   */
  {
    path: 'complete-profile',
    component: CompleteProfile,
    canActivate: [authGuard]
  },


  /*
   * Privé :
   * uniquement après authentification.
   */
  {
    path: 'role-selection',
    component: RoleSelection,
    canActivate: [authGuard]
  }

];