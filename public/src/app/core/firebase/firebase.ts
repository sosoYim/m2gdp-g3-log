import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

import { environment } from '../../../environments/environment';

const firebaseApp = initializeApp(environment.firebase);

export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const realtimeDatabase = getDatabase(firebaseApp);