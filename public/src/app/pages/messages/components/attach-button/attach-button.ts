import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';


/*
 * Bouton « + » de la messagerie :
 * ouvre le sélecteur de fichiers
 * (photo ou PDF).
 */
@Component({
  selector: 'app-attach-button',

  standalone: true,

  imports: [],

  templateUrl: './attach-button.html',

  styleUrl: './attach-button.css'
})
export class AttachButton {

  @Input()
  disabled = false;

  @Output()
  fileSelected = new EventEmitter<File>();


  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;


  openPicker(): void {

    this.fileInput?.nativeElement.click();

  }


  onFileChange(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];


    /*
     * Réinitialiser : permet de
     * renvoyer le même fichier.
     */
    input.value = '';


    if (file) {
      this.fileSelected.emit(file);
    }

  }
}
