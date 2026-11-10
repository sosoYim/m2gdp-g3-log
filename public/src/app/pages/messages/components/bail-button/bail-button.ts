import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild
} from '@angular/core';

import { Media } from '../../../../core/media/media';
import { Messaging, MessageAttachment } from '../../../../core/messaging/messaging';


/*
 * =========================================
 * BAIL ÉPINGLÉ (BOUTON ICÔNE)
 * =========================================
 *
 * À côté du statut de la demande : ne prend
 * pas de place dans le fil. Menu au clic :
 * voir le bail, le remplacer (PDF déjà envoyé
 * ou nouveau fichier), le supprimer.
 */
@Component({
  selector: 'app-bail-button',

  standalone: true,

  imports: [],

  templateUrl: './bail-button.html',
  styleUrl: './bail-button.css'
})
export class BailButton {

  @Input({ required: true })
  conversationId = '';

  @Input({ required: true })
  userId = '';

  @Input()
  pinnedFile: MessageAttachment | null = null;

  /*
   * PDF envoyés dans la conversation
   */
  @Input()
  pdfFiles: MessageAttachment[] = [];


  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;


  menuOpen = false;

  /*
   * Liste des PDF affichée (remplacer)
   */
  choosing = false;

  saving = false;

  error = '';


  constructor(
    private readonly messagingService: Messaging,
    private readonly mediaService: Media,
    private readonly host: ElementRef<HTMLElement>,
    private readonly cdr: ChangeDetectorRef
  ) {}


  /*
   * PDF proposés : sans le bail actuel
   */
  get otherPdfs(): MessageAttachment[] {

    return this.pdfFiles.filter(file => file.url !== this.pinnedFile?.url);

  }


  toggleMenu(): void {

    this.menuOpen = !this.menuOpen;

    this.choosing = !this.pinnedFile;

    this.error = '';

  }


  @HostListener('document:click', ['$event'])
  onDocumentClick(
    event: MouseEvent
  ): void {

    /*
     * composedPath : le bouton cliqué peut déjà
     * avoir disparu du menu (« Remplacer »)
     */
    if (this.menuOpen && !event.composedPath().includes(this.host.nativeElement)) {
      this.menuOpen = false;
    }

  }


  @HostListener('document:keydown.escape')
  closeMenu(): void {

    this.menuOpen = false;

  }


  /*
   * =========================================
   * VOIR
   * =========================================
   *
   * Onglet ouvert au clic (sinon bloqué par
   * le navigateur), puis fichier téléchargé
   * avec le jeton Firebase.
   */
  async openFile(): Promise<void> {

    const file = this.pinnedFile;

    if (!file) {
      return;
    }


    this.menuOpen = false;

    const tab =
      window.open('', '_blank');


    try {

      const url =
        URL.createObjectURL(await this.mediaService.fetchAttachment(file.url));

      if (tab) {
        tab.location.href = url;
      } else {
        window.location.href = url;
      }

    } catch (err) {

      console.error('Erreur ouverture du bail :', err);

      tab?.close();

      this.showError('Le bail n\'a pas pu être ouvert.');

    }

  }


  /*
   * =========================================
   * REMPLACER / SUPPRIMER
   * =========================================
   */
  async pin(
    file: MessageAttachment | null
  ): Promise<void> {

    await this.run(async () => {

      await this.messagingService.setPinnedFile(this.conversationId, file);

      this.menuOpen = false;

    }, file ? 'Le bail n\'a pas pu être épinglé.' : 'Le bail n\'a pas pu être supprimé.');

  }


  pickFile(): void {

    this.fileInput?.nativeElement.click();

  }


  /*
   * Nouveau PDF : envoyé dans la conversation
   * (l'autre personne le voit), puis épinglé.
   */
  async uploadFile(
    event: Event
  ): Promise<void> {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    input.value = '';

    if (!file) {
      return;
    }


    if (file.type !== 'application/pdf') {
      this.showError('Le bail doit être un fichier PDF.');
      return;
    }


    await this.run(async () => {

      const media =
        await this.mediaService.uploadAttachment(file, this.conversationId);

      const attachment: MessageAttachment = {
        url: media.url,
        name: file.name.slice(0, 200),
        type: media.type
      };

      await this.messagingService.sendMessage(this.conversationId, this.userId, '', attachment);

      await this.messagingService.setPinnedFile(this.conversationId, attachment);

      this.menuOpen = false;

    }, 'Le bail n\'a pas pu être envoyé.');

  }


  private async run(
    action: () => Promise<void>,
    errorMessage: string
  ): Promise<void> {

    this.saving = true;

    this.error = '';

    this.cdr.detectChanges();


    try {

      await action();

    } catch (err) {

      console.error('Erreur bail :', err);

      this.error = errorMessage;

      this.menuOpen = true;

    } finally {

      this.saving = false;

      this.cdr.detectChanges();

    }

  }


  private showError(
    message: string
  ): void {

    this.error = message;

    this.menuOpen = true;

    this.cdr.detectChanges();

  }

}
