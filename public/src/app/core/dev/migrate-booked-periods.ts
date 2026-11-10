import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';

import { auth, firestore } from '../firebase/firebase';


/*
 * =========================================
 * MIGRATION SÉJOURS CONFIRMÉS (DEV UNIQUEMENT)
 * =========================================
 *
 * TODO(dev) À SUPPRIMER une fois les annonces
 * migrées (fichier + bloc dans src/main.ts).
 *
 * Anciennes annonces : séjours confirmés stockés
 * en tableau dans listings/{id}.bookedPeriods.
 * Pour chaque séjour dont la demande est encore
 * acceptée → bookedPeriods/{requestId} (collection).
 * Puis le tableau est retiré de l'annonce.
 *
 * Les règles n'autorisent que l'annonceur :
 * chaque annonceur lance la migration.
 *
 * Utilisation (console du navigateur, `npm run dev:front`) :
 *   await migrateBookedPeriods()
 */
export async function migrateBookedPeriods(): Promise<void> {

  const user =
    auth.currentUser;

  if (!user) {
    console.warn('Connectez-vous avant de lancer la migration.');
    return;
  }


  const snapshot =
    await getDocs(
      query(
        collection(firestore, 'listings'),
        where('ownerId', '==', user.uid)
      )
    );


  for (const listing of snapshot.docs) {

    const periods =
      listing.data()['bookedPeriods'];

    if (!Array.isArray(periods)) {
      continue;
    }


    for (const period of periods) {

      const requestId =
        typeof period?.requestId === 'string' ? period.requestId : '';

      const request =
        requestId
          ? await getDoc(doc(firestore, 'bookingRequests', requestId))
          : null;

      const data =
        request?.exists() ? request.data() : null;


      if (data?.['status'] !== 'accepted') {
        console.info(`Séjour ignoré (demande ${requestId || '?'} non acceptée) : ${listing.id}`);
        continue;
      }


      await setDoc(
        doc(firestore, 'bookedPeriods', requestId),
        {
          listingId: listing.id,
          ownerId: user.uid,
          requesterId: data['requesterId'],
          from: data['arrivalDate'],
          to: data['departureDate'],
          createdAt: serverTimestamp()
        }
      );

      console.info(`Séjour migré : ${listing.id} / ${requestId} (${data['arrivalDate']} → ${data['departureDate']})`);

    }


    await updateDoc(
      doc(firestore, 'listings', listing.id),
      { bookedPeriods: deleteField() }
    );

    console.info(`Ancien tableau retiré : ${listing.id}`);

  }


  console.info('Migration des séjours confirmés terminée.');

}
