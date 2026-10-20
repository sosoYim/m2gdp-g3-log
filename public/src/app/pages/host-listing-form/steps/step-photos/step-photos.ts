import {
  ChangeDetectorRef,
  Component,
  Input,
  signal
} from '@angular/core';

import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray
} from '@angular/cdk/drag-drop';

import { ListingForm } from '../../../../core/listing/listing';
import { Media } from '../../../../core/media/media';

import { MAX_PHOTOS, MIN_PHOTOS_TO_PUBLISH } from '../../listing-form.data';


/*
 * Étape 2 — Photos
 */
@Component({
  selector: 'app-step-photos',

  standalone: true,

  imports: [
    CdkDropList,
    CdkDrag
  ],

  templateUrl: './step-photos.html',
  styleUrl: './step-photos.css'
})
export class StepPhotos {

  @Input({ required: true })
  form!: ListingForm;


  readonly minPhotos =
    MIN_PHOTOS_TO_PUBLISH;


  /*
   * Nombre de photos en cours d'envoi
   */
  uploading =
    signal(0);


  error =
    signal('');


  dragOver =
    signal(false);


  constructor(
    private readonly mediaService: Media,
    private readonly cdr: ChangeDetectorRef
  ) {}


  get uploadingSlots(): number[] {

    return Array.from({ length: this.uploading() });

  }


  /*
   * Cases « Ajouter » : on complète
   * jusqu'à 4 cases, puis une seule.
   */
  get addSlots(): number[] {

    const used =
      this.form.photos.length + this.uploading();


    if (used >= MAX_PHOTOS) {
      return [];
    }


    return Array.from({ length: used < 4 ? 4 - used : 1 });

  }


  /*
   * =========================================
   * AJOUT
   * =========================================
   */

  onFileInput(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    if (input.files) {
      this.addFiles(Array.from(input.files));
    }


    input.value = '';

  }


  onDrop(
    event: DragEvent
  ): void {

    event.preventDefault();

    this.dragOver.set(false);


    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }

  }


  onDragOver(
    event: DragEvent
  ): void {

    event.preventDefault();

    this.dragOver.set(true);

  }


  private async addFiles(
    files: File[]
  ): Promise<void> {

    this.error.set('');


    const available =
      MAX_PHOTOS - this.form.photos.length - this.uploading();

    const selected =
      files.slice(0, Math.max(available, 0));


    if (files.length > selected.length) {

      this.error.set(
        `${MAX_PHOTOS} photos maximum.`
      );

    }


    /*
     * Envoi une par une pour garder
     * l'ordre choisi par l'utilisateur.
     */
    for (const file of selected) {

      this.uploading.update(n => n + 1);


      try {

        const photo =
          await this.mediaService.uploadPhoto(file);

        this.form.photos.push(photo);

      } catch (err) {

        console.error('Erreur envoi photo :', err);

        this.error.set(
          err instanceof Error ? err.message : 'Impossible d\'envoyer la photo.'
        );

      } finally {

        this.uploading.update(n => n - 1);

        this.cdr.markForCheck();

      }

    }

  }


  /*
   * =========================================
   * SUPPRESSION / ORDRE
   * =========================================
   */

  async removePhoto(
    index: number
  ): Promise<void> {

    const [photo] =
      this.form.photos.splice(index, 1);


    /*
     * Anciennes annonces : image sans clé R2,
     * rien à supprimer côté stockage.
     */
    if (!photo?.key) {
      return;
    }


    try {

      await this.mediaService.deletePhoto(photo.key);

    } catch (err) {

      console.error('Erreur suppression photo :', err);

    }

  }


  reorder(
    event: CdkDragDrop<unknown>
  ): void {

    moveItemInArray(
      this.form.photos,
      event.previousIndex,
      event.currentIndex
    );

  }

}
