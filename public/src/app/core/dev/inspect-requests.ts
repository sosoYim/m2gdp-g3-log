import { doc, getDoc } from 'firebase/firestore';
import { equalTo, get, orderByChild, query, ref } from 'firebase/database';

import { auth, firestore, realtimeDatabase } from '../firebase/firebase';


/*
 * =========================================
 * DIAGNOSTIC DES DEMANDES REÇUES (DEV UNIQUEMENT)
 * =========================================
 *
 * TODO(dev) À SUPPRIMER (fichier + bloc dans src/main.ts).
 *
 * Pour chaque conversation où l'utilisateur connecté
 * est annonceur : valeurs brutes de la demande liée
 * (statut, ownerId, motif…) et nom du demandeur.
 *
 * Utilisation (console du navigateur, `npm run dev:front`) :
 *   await inspectRequests()
 */
export async function inspectRequests(): Promise<void> {

  const user =
    auth.currentUser;

  if (!user) {
    console.warn('Connectez-vous avant de lancer le diagnostic.');
    return;
  }


  const snapshot =
    await get(query(ref(realtimeDatabase, 'conversations'), orderByChild('ownerId'), equalTo(user.uid)));

  const rows: Record<string, unknown>[] = [];


  for (const [id, conversation] of Object.entries<Record<string, any>>(snapshot.val() ?? {})) {

    const requestId =
      conversation['bookingRequestId'] || id;

    const profile =
      await getDoc(doc(firestore, 'publicProfiles', conversation['requesterId'] ?? '')).catch(() => null);

    let request: Record<string, any> | null = null;

    let readError = '';

    try {
      const requestSnapshot = await getDoc(doc(firestore, 'bookingRequests', requestId));
      request = requestSnapshot.exists() ? requestSnapshot.data() : null;
      readError = requestSnapshot.exists() ? '' : 'introuvable';
    } catch (err: any) {
      readError = err?.code ?? String(err);
    }


    rows.push({
      demandeur: profile?.exists() ? `${profile.data()['firstName']} ${profile.data()['lastInitial'] ?? ''}` : conversation['requesterId'],
      requestId,
      annonce: conversation['listingTitle'],
      statut: request ? JSON.stringify(request['status']) : `(${readError})`,
      ownerIdDemande: request?.['ownerId'] === user.uid ? 'moi' : JSON.stringify(request?.['ownerId']),
      dates: request ? `${request['arrivalDate']} → ${request['departureDate']}` : '',
      rejectionReason: request?.['rejectionReason'] ?? '',
      cancelledBy: request?.['cancelledBy'] ?? '',
      champs: request ? Object.keys(request).sort().join(',') : ''
    });

  }


  console.table(rows);

}
