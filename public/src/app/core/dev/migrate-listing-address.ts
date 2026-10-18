import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';

import { auth, firestore } from '../firebase/firebase';

import { getArrondissement } from '../listing/listing';


/*
 * =========================================
 * MIGRATION ADRESSE DES ANNONCES (DEV UNIQUEMENT)
 * =========================================
 *
 * TODO(dev) À SUPPRIMER une fois les annonces
 * existantes migrées (fichier + bloc dans src/main.ts).
 *
 * Ajoute aux annonces existantes de l'utilisateur
 * connecté les nouveaux champs d'adresse :
 * - public  : postalCode (''), arrondissement (déduit ou null)
 * - privé   : listings/{id}/private/address
 *             (address, addressDetails '', placeId '',
 *              postalCode, latitude / longitude null)
 * et retire l'adresse exacte du document public.
 *
 * Les règles Firestore n'autorisent que l'annonceur :
 * chaque annonceur lance la migration pour ses annonces.
 *
 * Utilisation (console du navigateur, `npm run dev:front`) :
 *   await migrateListingAddress()
 *
 * Relancer le script ne change pas un champ déjà rempli.
 */
export async function migrateListingAddress(): Promise<void> {

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

    const data =
      listing.data();

    const address: string =
      typeof data['address'] === 'string' ? data['address'] : '';


    /*
     * Code postal : champ existant,
     * sinon tiré de l'adresse.
     */
    const postalCode: string =
      typeof data['postalCode'] === 'string'
        ? data['postalCode']
        : /\b(69\d{3})\b/.exec(address)?.[1] ?? '';


    /*
     * Arrondissement : champ existant,
     * sinon code postal, sinon « Lyon 2e » /
     * « Lyon, arrondissement 2 » dans location.
     */
    const fromLocation =
      /lyon\D*([1-9])\b/i.exec(String(data['location'] ?? ''));

    const arrondissement: number | null =
      typeof data['arrondissement'] === 'number'
        ? data['arrondissement']
        : getArrondissement(postalCode) ?? (fromLocation ? Number(fromLocation[1]) : null);


    /*
     * Adresse privée (créée si absente)
     */
    const privateRef =
      doc(firestore, 'listings', listing.id, 'private', 'address');

    const privateSnapshot =
      await getDoc(privateRef);

    if (!privateSnapshot.exists()) {

      await setDoc(privateRef, {
        address,
        addressDetails: '',
        placeId: '',
        postalCode,
        latitude: null,
        longitude: null,
        updatedAt: serverTimestamp()
      });

    }


    /*
     * Document public
     */
    await setDoc(
      listing.ref,
      {
        postalCode,
        arrondissement,
        address: deleteField(),
        addressDetails: deleteField(),
        placeId: deleteField()
      },
      { merge: true }
    );


    console.log(`✔ ${listing.id} — ${data['title'] ?? ''} (code postal : « ${postalCode} », arrondissement : ${arrondissement ?? 'aucun'})`);

  }


  console.log(`Migration terminée : ${snapshot.size} annonce(s).`);

}
