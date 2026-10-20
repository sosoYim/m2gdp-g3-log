import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';


/*
 * Tableau de bord sans annonce :
 * invitation à déposer la première annonce
 * + étapes « Comment ça se passe ? »
 */
@Component({
  selector: 'app-host-onboarding',

  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl: './host-onboarding.html',
  styleUrl: './host-onboarding.css'
})
export class HostOnboarding {

  readonly steps = [
    { title: 'Déposez votre annonce', text: 'Photos, dates et loyer en quelques étapes.' },
    { title: 'Recevez des demandes', text: 'Les étudiants vous écrivent via BailLyon.' },
    { title: 'Convenez ensemble', text: 'Le loyer se règle directement entre vous.' }
  ];

}
