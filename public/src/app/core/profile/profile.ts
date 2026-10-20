import { Injectable, signal } from '@angular/core';

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

import { firestore } from '../firebase/firebase';

export type UserRole = 'guest' | 'host';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role?: UserRole;
}


/*
 * Profil public : publicProfiles/{uid}
 * Lisible par tout utilisateur connecté
 * (ex. l'annonceur voit le nom du demandeur).
 * Jamais d'e-mail ni de nom complet.
 */
export interface PublicProfile {
  firstName: string;
  lastInitial: string;
}


/*
 * « Alice M. »
 */
export function getDisplayName(
  profile: PublicProfile
): string {

  return profile.lastInitial
    ? `${profile.firstName} ${profile.lastInitial}.`
    : profile.firstName;

}

/*
 * Dernier rôle utilisé (Je viens / J'accueille),
 * mémorisé dans le navigateur pour afficher
 * tout de suite le bon onglet, sans attendre
 * Firestore (évite le clignotement).
 */
const ROLE_STORAGE_KEY = 'baillyon.lastRole';

interface StoredRole {
  uid: string;
  role: UserRole;
}


function readStoredRole(): StoredRole | null {

  try {

    const value =
      JSON.parse(localStorage.getItem(ROLE_STORAGE_KEY) ?? 'null');

    return value?.role === 'host' || value?.role === 'guest'
      ? value
      : null;

  } catch {

    return null;

  }

}


@Injectable({
  providedIn: 'root'
})
export class Profile {

  /*
   * Rôle affiché partout (navbar, menus).
   * Valeur initiale : dernier compte connecté
   * sur ce navigateur.
   */
  readonly currentRole =
    signal<UserRole>(readStoredRole()?.role ?? 'guest');


  /*
   * Le rôle mémorisé appartient-il
   * à ce compte ?
   */
  hasStoredRoleFor(
    uid: string
  ): boolean {

    return readStoredRole()?.uid === uid;

  }


  setCurrentRole(
    uid: string,
    role: UserRole
  ): void {

    this.currentRole.set(role);

    try {
      localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify({ uid, role }));
    } catch {
      // Stockage indisponible (navigation privée) : rôle en mémoire seulement.
    }

  }

  async saveProfile(
    uid: string,
    profile: UserProfile
  ): Promise<void> {

    const userRef = doc(
      firestore,
      'users',
      uid
    );

    await setDoc(
      userRef,
      {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        email: profile.email.trim().toLowerCase(),
        updatedAt: serverTimestamp()
      },
      {
        merge: true
      }
    );

    await this.savePublicProfile(uid, profile);
  }


  private async savePublicProfile(
    uid: string,
    profile: UserProfile
  ): Promise<void> {

    await setDoc(
      doc(firestore, 'publicProfiles', uid),
      {
        firstName: profile.firstName.trim(),
        lastInitial: profile.lastName.trim().charAt(0).toUpperCase(),
        updatedAt: serverTimestamp()
      }
    );
  }


  /*
   * Utilisateurs inscrits avant l'ajout
   * des profils publics : création au
   * prochain chargement de leur profil.
   */
  async ensurePublicProfile(
    uid: string,
    profile: UserProfile
  ): Promise<void> {

    if (!profile.firstName) {
      return;
    }

    const snapshot =
      await getDoc(doc(firestore, 'publicProfiles', uid));

    if (!snapshot.exists()) {
      await this.savePublicProfile(uid, profile);
    }
  }


  async getPublicProfile(
    uid: string
  ): Promise<PublicProfile | null> {

    const snapshot =
      await getDoc(doc(firestore, 'publicProfiles', uid));

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    return {
      firstName: data['firstName'] ?? '',
      lastInitial: data['lastInitial'] ?? ''
    };
  }


  async saveRole(
    uid: string,
    role: UserRole
  ): Promise<void> {

    const userRef = doc(
      firestore,
      'users',
      uid
    );

    await setDoc(
      userRef,
      {
        role,
        updatedAt: serverTimestamp()
      },
      {
        merge: true
      }
    );

    this.setCurrentRole(uid, role);
  }


  async getProfile(
    uid: string
  ): Promise<UserProfile | null> {

    const userRef = doc(
      firestore,
      'users',
      uid
    );

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    return {
      firstName: data['firstName'] ?? '',
      lastName: data['lastName'] ?? '',
      email: data['email'] ?? '',
      role: data['role'] ?? undefined
    };
  }
}