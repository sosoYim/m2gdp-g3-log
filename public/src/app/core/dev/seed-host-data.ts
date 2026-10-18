import {
  doc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

import { auth, firestore } from '../firebase/firebase';

import { Booking } from '../booking/booking';


/*
 * =========================================
 * DONNÉES FICTIVES ANNONCEUR (DEV UNIQUEMENT)
 * =========================================
 *
 * TODO(dev) À SUPPRIMER en fin de développement :
 * supprimer tout le dossier app/core/dev/
 * et le bloc correspondant dans src/main.ts.
 * Penser aussi à supprimer dans Firestore les
 * documents de test (annonces dont l'ID commence
 * par « seed- » et leurs demandes associées).
 *
 * Crée, pour l'utilisateur connecté :
 * - 1 annonce en ligne
 * - 1 brouillon (sans photo, complété à 57 %)
 * - 1 annonce en pause
 * - 2 demandes en attente sur l'annonce en ligne
 *
 * Utilisation (console du navigateur, `npm run dev:front`) :
 *   await seedHostData()
 *
 * Les identifiants sont fixes : relancer
 * le script met à jour les mêmes annonces.
 */
export async function seedHostData(): Promise<void> {

  const user =
    auth.currentUser;


  if (!user) {

    throw new Error(
      'Connectez-vous avant de lancer seedHostData().'
    );

  }


  const ownerName =
    user.email?.split('@')[0] ?? 'Annonceur';


  const listings = [

    {
      id: `seed-${user.uid}-studio-loft`,
      title: 'Charmant studio-loft',
      location: 'Lyon 2e',
      details: 'Meublé · 22 m² · 1 pièce',
      price: 650,
      image: '/images/rental/property-1/Umeus.png',
      availableFrom: '2026-05-01',
      availableTo: '2026-11-01',
      status: 'published'
    },

    {
      id: `seed-${user.uid}-croix-rousse`,
      title: 'Studio Croix-Rousse',
      location: 'Lyon 4e',
      details: 'Meublé · 18 m² · 1 pièce',
      price: 520,
      image: '',
      availableFrom: '',
      availableTo: '',
      status: 'draft'
    },

    {
      id: `seed-${user.uid}-part-dieu`,
      title: 'Chambre lumineuse Part-Dieu',
      location: 'Lyon 3e',
      details: 'Meublé · 14 m² · 1 pièce',
      price: 480,
      image: '/images/rental/property-1/desk.png',
      availableFrom: '2026-09-01',
      availableTo: '2026-12-31',
      status: 'inactive'
    }

  ];


  for (const { id, ...listing } of listings) {

    await setDoc(
      doc(firestore, 'listings', id),
      {
        ...listing,
        latitude: 45.7578,
        longitude: 4.832,
        rating: 4.8,
        verified: true,
        highlighted: false,
        ownerId: user.uid,
        ownerName,
        updatedAt: serverTimestamp()
      }
    );

  }


  /*
   * Demandes en attente.
   *
   * Les règles imposent requesterId == uid :
   * l'utilisateur est donc aussi le demandeur.
   */
  const bookingService =
    new Booking();


  const requests = [
    { arrivalDate: '2026-05-01', departureDate: '2026-11-01' },
    { arrivalDate: '2026-09-01', departureDate: '2026-12-31' }
  ];


  for (const request of requests) {

    const exists =
      await bookingService.hasPendingRequest(
        user.uid,
        listings[0].id,
        request.arrivalDate,
        request.departureDate
      );


    if (exists) {
      continue;
    }


    await bookingService.createRequest({
      listingId: listings[0].id,
      requesterId: user.uid,
      ownerId: user.uid,
      ownerName,
      ...request,
      message: 'Bonjour, je serai à Lyon pour mon stage. Le logement est-il toujours disponible ?'
    });

  }


  console.log(
    'Données fictives créées : 3 annonces, 2 demandes en attente.'
  );

}
