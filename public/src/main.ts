import { isDevMode } from '@angular/core'; // TODO(dev) À SUPPRIMER (utilisé uniquement par seedHostData / migrateListingAddress / migrateBookedPeriods)
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
// TODO(dev) À SUPPRIMER en fin de développement : import des données fictives
import { seedHostData } from './app/core/dev/seed-host-data';
import { migrateListingAddress } from './app/core/dev/migrate-listing-address';
import { migrateBookedPeriods } from './app/core/dev/migrate-booked-periods';
import { inspectRequests } from './app/core/dev/inspect-requests';

/*
 * TODO(dev) À SUPPRIMER en fin de développement — début
 *
 * Données fictives : disponible uniquement en dev
 * via la console (await seedHostData()).
 * Migration des adresses : await migrateListingAddress().
 * Migration des séjours confirmés : await migrateBookedPeriods().
 * Diagnostic des demandes reçues : await inspectRequests().
 * Supprimer aussi l'import de isDevMode ci-dessus
 * et le dossier app/core/dev/.
 */
if (isDevMode()) {
  (window as any).seedHostData = seedHostData;
  (window as any).migrateListingAddress = migrateListingAddress;
  (window as any).migrateBookedPeriods = migrateBookedPeriods;
  (window as any).inspectRequests = inspectRequests;
}
// TODO(dev) À SUPPRIMER en fin de développement — fin

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
