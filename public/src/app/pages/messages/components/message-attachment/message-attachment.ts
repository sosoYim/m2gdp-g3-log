import { Component, Input } from '@angular/core';

import { MessageAttachment as Attachment } from '../../../../core/messaging/messaging';


/*
 * Pièce jointe dans la conversation :
 * aperçu de la photo ou carte PDF,
 * ouverte dans un nouvel onglet.
 */
@Component({
  selector: 'app-message-attachment',

  standalone: true,

  imports: [],

  templateUrl: './message-attachment.html',

  styleUrl: './message-attachment.css'
})
export class MessageAttachment {

  @Input({ required: true })
  attachment!: Attachment;

  /*
   * Message de l'utilisateur connecté
   */
  @Input()
  mine = false;


  get isImage(): boolean {
    return this.attachment.type.startsWith('image/');
  }
}
