import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';

import { Media } from '../../../../core/media/media';
import { MessageAttachment as Attachment } from '../../../../core/messaging/messaging';


/*
 * Pièce jointe dans la conversation :
 * aperçu de la photo (agrandie dans une
 * fenêtre au clic) ou carte PDF (ouverte
 * dans un nouvel onglet).
 *
 * Le fichier n'est lisible qu'avec le jeton
 * Firebase d'un participant : il est
 * téléchargé puis affiché en URL locale (blob:).
 */
@Component({
  selector: 'app-message-attachment',

  standalone: true,

  imports: [],

  templateUrl: './message-attachment.html',

  styleUrl: './message-attachment.css'
})
export class MessageAttachment implements OnInit, OnDestroy {

  @Input({ required: true })
  attachment!: Attachment;

  /*
   * Message de l'utilisateur connecté
   */
  @Input()
  mine = false;


  /*
   * URL locale de la photo
   */
  imageUrl = '';

  error = false;

  /*
   * Photo affichée en grand
   */
  previewOpen = false;

  private objectUrls: string[] = [];


  constructor(
    private readonly mediaService: Media,
    private readonly cdr: ChangeDetectorRef
  ) {}


  get isImage(): boolean {
    return this.attachment.type.startsWith('image/');
  }


  async ngOnInit(): Promise<void> {

    if (!this.isImage) {
      return;
    }


    try {

      this.imageUrl =
        await this.loadObjectUrl();

    } catch (err) {

      console.error('Erreur chargement pièce jointe :', err);

      this.error = true;

    } finally {

      this.cdr.detectChanges();

    }

  }


  openPreview(): void {

    if (this.imageUrl) {
      this.previewOpen = true;
    }

  }


  @HostListener('document:keydown.escape')
  closePreview(): void {

    this.previewOpen = false;

  }


  ngOnDestroy(): void {

    this.objectUrls.forEach(url => URL.revokeObjectURL(url));

  }


  /*
   * PDF : ouverture dans un nouvel onglet.
   *
   * L'onglet est ouvert tout de suite (au clic)
   * pour ne pas être bloqué par le navigateur,
   * puis reçoit le fichier une fois téléchargé.
   */
  async openFile(): Promise<void> {

    const tab =
      window.open('', '_blank');


    try {

      const url =
        await this.loadObjectUrl();

      if (tab) {
        tab.location.href = url;
      } else {
        window.location.href = url;
      }

    } catch (err) {

      console.error('Erreur ouverture pièce jointe :', err);

      tab?.close();

      this.error = true;

      this.cdr.detectChanges();

    }

  }


  private async loadObjectUrl(): Promise<string> {

    const url =
      URL.createObjectURL(
        await this.mediaService.fetchAttachment(this.attachment.url)
      );

    this.objectUrls.push(url);

    return url;

  }
}
