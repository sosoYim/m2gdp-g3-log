import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  ListingForm,
  getArrondissement
} from '../../../../core/listing/listing';

import {
  AddressSuggestion,
  GoogleMaps
} from '../../../../core/maps/google-maps';


/*
 * =========================================
 * ADRESSE DU LOGEMENT (étape 1)
 * =========================================
 *
 * Avec clé Google : suggestions Places,
 * carte avec marqueur, position exacte.
 * Sans clé : saisie libre.
 * L'arrondissement est toujours déduit
 * du code postal de l'adresse.
 */
@Component({
  selector: 'app-address-field',

  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl: './address-field.html',
  styleUrl: './address-field.css'
})
export class AddressField implements OnInit, OnDestroy {

  @Input({ required: true })
  form!: ListingForm;


  @ViewChild('map')
  set mapElement(element: ElementRef<HTMLElement> | undefined) {
    this.mapRef = element;
    void this.showMap();
  }


  suggestions =
    signal<AddressSuggestion[]>([]);

  searchError =
    signal('');


  private mapRef?: ElementRef<HTMLElement>;

  private moveMarker?: (latitude: number, longitude: number) => void;

  private searchTimer?: ReturnType<typeof setTimeout>;

  private searchId = 0;


  constructor(
    readonly maps: GoogleMaps,
    private readonly cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {

    if (!this.form.arrondissement) {
      this.form.arrondissement = getArrondissement(this.form.address);
    }

  }


  ngOnDestroy(): void {

    clearTimeout(this.searchTimer);

  }


  get hasPosition(): boolean {

    return this.maps.enabled
      && this.form.latitude !== null
      && this.form.longitude !== null;

  }


  /*
   * =========================================
   * SAISIE
   * =========================================
   */
  onAddressInput(): void {

    /*
     * L'adresse choisie est modifiée :
     * elle n'est plus géocodée.
     */
    this.form.placeId = '';
    this.form.latitude = null;
    this.form.longitude = null;


    if (!this.maps.enabled) {
      this.updatePostalCode(this.form.address);
      return;
    }


    clearTimeout(this.searchTimer);

    const input =
      this.form.address.trim();

    if (input.length < 3) {
      this.suggestions.set([]);
      return;
    }


    this.searchTimer =
      setTimeout(() => void this.search(input), 250);

  }


  private async search(
    input: string
  ): Promise<void> {

    const id =
      ++this.searchId;

    try {

      const results =
        await this.maps.searchAddresses(input);

      /*
       * Ignorer une réponse plus ancienne
       */
      if (id === this.searchId) {
        this.suggestions.set(results);
        this.searchError.set('');
      }

    } catch (err) {

      console.error('Erreur recherche adresse :', err);

      this.searchError.set('Recherche d\'adresse indisponible.');

    }

    this.cdr.markForCheck();

  }


  async choose(
    suggestion: AddressSuggestion
  ): Promise<void> {

    this.suggestions.set([]);

    this.form.address =
      `${suggestion.mainText}, ${suggestion.secondaryText}`;


    try {

      const result =
        await this.maps.getAddress(suggestion);

      this.form.address = result.address;
      this.form.placeId = result.placeId;
      this.form.latitude = result.latitude;
      this.form.longitude = result.longitude;

      this.updatePostalCode(result.postalCode);

      void this.showMap();

    } catch (err) {

      console.error('Erreur détail adresse :', err);

      this.searchError.set('Impossible de récupérer cette adresse.');

    }

    this.cdr.markForCheck();

  }


  closeSuggestions(): void {

    /*
     * Laisser le clic sur une suggestion
     * se faire avant de fermer la liste
     */
    setTimeout(() => {
      this.suggestions.set([]);
      this.cdr.markForCheck();
    }, 150);

  }


  /*
   * Code postal → arrondissement (69001 → 1)
   */
  private updatePostalCode(
    text: string
  ): void {

    const match =
      /\b(69\d{3})\b/.exec(text);

    this.form.postalCode =
      match ? match[1] : '';

    this.form.arrondissement =
      getArrondissement(this.form.postalCode);

  }


  /*
   * =========================================
   * CARTE
   * =========================================
   */
  private async showMap(): Promise<void> {

    const element =
      this.mapRef?.nativeElement;

    const { latitude, longitude } =
      this.form;

    if (!element || latitude === null || longitude === null) {
      return;
    }


    try {

      if (this.moveMarker) {
        this.moveMarker(latitude, longitude);
      } else {
        this.moveMarker = await this.maps.createMap(element, latitude, longitude);
      }

    } catch (err) {

      console.error('Erreur carte :', err);

    }

  }

}
