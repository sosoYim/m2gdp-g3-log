import {
  ChangeDetectorRef,
  Component,
  OnInit,
  signal
} from '@angular/core';

import { Location, NgTemplateOutlet } from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { HostSidebar } from '../../shared/components/host-sidebar/host-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Auth } from '../../core/auth/auth';
import { Profile } from '../../core/profile/profile';
import { Booking } from '../../core/booking/booking';
import {
  Listing,
  ListingDocument,
  ListingForm,
  createEmptyListingForm
} from '../../core/listing/listing';

import { ListingStepper } from './components/listing-stepper/listing-stepper';
import { ListingPreview } from './components/listing-preview/listing-preview';

import { StepHousing } from './steps/step-housing/step-housing';
import { StepPhotos } from './steps/step-photos/step-photos';
import { StepAmenities } from './steps/step-amenities/step-amenities';
import { StepPricing } from './steps/step-pricing/step-pricing';
import { StepReview } from './steps/step-review/step-review';

import {
  LISTING_STEPS,
  LISTING_TIPS,
  MIN_PHOTOS_TO_PUBLISH
} from './listing-form.data';


const LAST_STEP =
  LISTING_STEPS.length - 1;


/*
 * =========================================
 * DÉPOSER / MODIFIER UNE ANNONCE
 * =========================================
 *
 * /host/listings/new
 * /host/listings/edit?id=...&step=1..5
 *
 * Le brouillon est enregistré à chaque
 * changement d'étape.
 */
@Component({
  selector: 'app-host-listing-form',

  standalone: true,

  imports: [
    RouterLink,
    NgTemplateOutlet,
    UserNavbar,
    HostSidebar,
    ContactSection,
    Footer,
    ListingStepper,
    ListingPreview,
    StepHousing,
    StepPhotos,
    StepAmenities,
    StepPricing,
    StepReview
  ],

  templateUrl: './host-listing-form.html',
  styleUrl: './host-listing-form.css'
})
export class HostListingForm implements OnInit {

  /*
   * =========================================
   * ÉTAT
   * =========================================
   */

  loading =
    signal(true);


  loadError =
    signal('');


  saving =
    signal(false);


  /*
   * Message à côté du titre
   * (« Brouillon enregistré à 14:32 »)
   */
  saveMessage =
    signal('Brouillon enregistré automatiquement');


  /*
   * Erreurs de validation de l'étape
   */
  errors =
    signal<string[]>([]);


  step =
    signal(0);


  maxReached =
    signal(0);


  pendingCount =
    signal(0);


  ownerName =
    signal('');


  readonly tips =
    LISTING_TIPS;


  form: ListingForm =
    createEmptyListingForm();


  private listingId = '';

  private ownerId = '';

  private status: ListingDocument['status'] = 'draft';


  constructor(
    private readonly authService: Auth,
    private readonly profileService: Profile,
    private readonly listingService: Listing,
    private readonly bookingService: Booking,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly cdr: ChangeDetectorRef
  ) {}


  async ngOnInit(): Promise<void> {

    try {

      const user =
        await this.authService.waitForAuthState();


      if (!user) {

        this.loadError.set('Utilisateur non connecté.');

        return;

      }


      this.ownerId =
        user.uid;


      const params =
        this.route.snapshot.queryParamMap;

      const listingId =
        params.get('id') ?? '';


      const [profile, existing, requests] =
        await Promise.all([
          this.profileService.getProfile(user.uid),
          listingId ? this.listingService.getListingForm(listingId) : null,
          this.bookingService.getRequestsForOwner(user.uid)
        ]);


      this.ownerName.set(
        profile?.firstName || user.email?.split('@')[0] || 'Annonceur'
      );

      this.pendingCount.set(
        requests.filter(r => r.status === 'pending').length
      );


      /*
       * Modification d'une annonce existante
       */
      if (listingId) {

        if (!existing || existing.ownerId !== user.uid) {

          this.loadError.set('Annonce introuvable.');

          return;

        }


        this.listingId = existing.id;

        this.form = existing.form;

        this.status = existing.status;


        /*
         * Annonce déjà remplie :
         * toutes les étapes sont accessibles.
         */
        this.maxReached.set(LAST_STEP);


        const step =
          Number(params.get('step'));

        if (step >= 1 && step <= LISTING_STEPS.length) {
          this.step.set(step - 1);
        }

      }


    } catch (err) {

      console.error('Erreur chargement formulaire annonce :', err);

      this.loadError.set('Impossible de charger l\'annonce.');

    } finally {

      this.loading.set(false);

      this.cdr.detectChanges();

    }

  }


  /*
   * =========================================
   * NAVIGATION ENTRE ÉTAPES
   * =========================================
   */

  async goTo(
    step: number
  ): Promise<void> {

    this.errors.set([]);


    await this.save();


    this.step.set(step);

    this.maxReached.update(max => Math.max(max, step));


    window.scrollTo({ top: 0, behavior: 'smooth' });

  }


  async next(): Promise<void> {

    const errors =
      this.validateStep(this.step());


    if (errors.length) {

      this.errors.set(errors);

      return;

    }


    await this.goTo(this.step() + 1);

  }


  async previous(): Promise<void> {

    await this.goTo(this.step() - 1);

  }


  async saveDraft(): Promise<void> {

    this.errors.set([]);

    await this.save();

  }


  /*
   * =========================================
   * PUBLICATION
   * =========================================
   */

  async publish(): Promise<void> {

    const errors =
      [0, 1, 2, 3].flatMap(step => this.validateStep(step, true));


    if (errors.length) {

      this.errors.set(errors);

      return;

    }


    const previousStatus =
      this.status;

    this.status = 'published';


    const saved =
      await this.save();


    if (!saved) {

      this.status = previousStatus;

      return;

    }


    await this.router.navigate(
      ['/host/listings/published'],
      { queryParams: { id: this.listingId } }
    );

  }


  /*
   * =========================================
   * ENREGISTREMENT
   * =========================================
   *
   * Retourne false en cas d'erreur
   * (le formulaire reste en mémoire).
   */
  private async save(): Promise<boolean> {

    if (this.saving()) {
      return false;
    }


    this.saving.set(true);

    this.saveMessage.set('Enregistrement...');


    try {

      const id =
        await this.listingService.saveListingForm(
          this.listingId,
          this.form,
          { id: this.ownerId, name: this.ownerName() },
          this.status
        );


      /*
       * Première sauvegarde : l'URL devient
       * /host/listings/edit?id=... sans recharger.
       */
      if (!this.listingId) {

        this.listingId = id;

        this.location.replaceState('/host/listings/edit', `id=${id}`);

      }


      const time =
        new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
          .format(new Date());

      this.saveMessage.set(`Brouillon enregistré à ${time}`);


      return true;

    } catch (err) {

      console.error('Erreur enregistrement annonce :', err);

      this.saveMessage.set('Échec de l\'enregistrement');

      this.errors.set([
        'L\'enregistrement a échoué. Vos informations sont conservées, réessayez.'
      ]);

      return false;

    } finally {

      this.saving.set(false);

    }

  }


  /*
   * =========================================
   * VALIDATION
   * =========================================
   *
   * forPublish : règles plus strictes
   * (5 photos, accord du propriétaire).
   */
  private validateStep(
    step: number,
    forPublish = false
  ): string[] {

    const form =
      this.form;

    const errors: string[] = [];


    switch (step) {

      case 0:

        if (!form.title.trim()) {
          errors.push('Indiquez un titre.');
        }

        if (!form.address.trim()) {
          errors.push('Indiquez l\'adresse du logement.');
        }

        if (!form.surface || form.surface <= 0) {
          errors.push('Indiquez la surface.');
        }

        break;


      case 1:

        if (forPublish && form.photos.length < MIN_PHOTOS_TO_PUBLISH) {
          errors.push(`Ajoutez au moins ${MIN_PHOTOS_TO_PUBLISH} photos pour publier.`);
        } else if (form.photos.length === 0) {
          errors.push('Ajoutez au moins une photo.');
        }

        break;


      case 2:

        if (!form.ownerConsent) {
          errors.push('Indiquez si vous avez l\'accord du propriétaire.');
        } else if (forPublish && form.ownerConsent === 'no') {
          errors.push('L\'accord du propriétaire est nécessaire pour publier.');
        }

        break;


      case 3:

        if (!form.price || form.price <= 0) {
          errors.push('Indiquez le loyer mensuel.');
        }

        if (!form.availableFrom || !form.availableTo) {
          errors.push('Indiquez les dates de disponibilité.');
        } else if (form.availableFrom >= form.availableTo) {
          errors.push('La date de fin doit être après la date de début.');
        }

        break;

    }


    return errors;

  }

}
