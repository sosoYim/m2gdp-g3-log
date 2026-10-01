import { Injectable } from '@angular/core';

import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  Unsubscribe
} from 'firebase/auth';

import { auth } from '../firebase/firebase';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private readonly emailStorageKey =
    'baillYonMagicLinkEmail';


  async sendMagicLink(
    email: string
  ): Promise<void> {

    const cleanEmail =
      email.trim().toLowerCase();

    const actionCodeSettings = {
      url: `${window.location.origin}/auth/callback`,
      handleCodeInApp: true
    };

    await sendSignInLinkToEmail(
      auth,
      cleanEmail,
      actionCodeSettings
    );

    localStorage.setItem(
      this.emailStorageKey,
      cleanEmail
    );
  }


  isMagicLink(
    url: string = window.location.href
  ): boolean {

    return isSignInWithEmailLink(
      auth,
      url
    );
  }


  async completeMagicLink(
    url: string = window.location.href
  ): Promise<UserCredential> {

    if (!this.isMagicLink(url)) {

      throw new Error(
        'Le lien de connexion est invalide.'
      );
    }

    let email =
      localStorage.getItem(
        this.emailStorageKey
      );


    if (!email) {

      email = window.prompt(
        'Confirmez votre adresse e-mail pour terminer la connexion :'
      );
    }


    if (!email) {

      throw new Error(
        'Adresse e-mail nécessaire pour terminer la connexion.'
      );
    }


    const credential =
      await signInWithEmailLink(
        auth,
        email,
        url
      );


    localStorage.removeItem(
      this.emailStorageKey
    );


    return credential;
  }


  getCurrentUser(): User | null {
    return auth.currentUser;
  }


  observeAuthState(
    callback: (user: User | null) => void
  ): Unsubscribe {

    return onAuthStateChanged(
      auth,
      callback
    );
  }


  /*
   * Attend que Firebase ait fini
   * de restaurer la session utilisateur.
   *
   * Très important pour les guards :
   * auth.currentUser peut être null
   * pendant quelques millisecondes
   * au rechargement de la page.
   */
  waitForAuthState(): Promise<User | null> {

    return new Promise(
      resolve => {

        const unsubscribe =
          onAuthStateChanged(
            auth,
            user => {

              unsubscribe();

              resolve(user);
            }
          );
      }
    );
  }


  async logout(): Promise<void> {

    await signOut(auth);

  }
}