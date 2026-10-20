import { Component, Input } from '@angular/core';

import { RouterLink } from '@angular/router';


export type EmptyStateIcon =
  | 'calendar'
  | 'heart';


/*
 * Encadré pointillé « rien pour l'instant » :
 * icône, titre, texte et une action
 * (bouton plein ou lien).
 */
@Component({
  selector: 'app-empty-state',

  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css'
})
export class EmptyState {

  @Input({ required: true })
  icon!: EmptyStateIcon;


  @Input({ required: true })
  title!: string;


  @Input()
  text = '';


  @Input()
  actionLabel = '';


  @Input()
  actionLink = '';


  /*
   * 'button' : bouton violet plein
   * 'link' : lien texte « … → »
   */
  @Input()
  actionStyle: 'button' | 'link' = 'button';

}
