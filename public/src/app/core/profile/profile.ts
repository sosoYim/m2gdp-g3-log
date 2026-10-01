import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class Profile {

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