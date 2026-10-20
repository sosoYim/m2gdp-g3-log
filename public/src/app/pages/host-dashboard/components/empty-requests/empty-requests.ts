import { Component, Input } from '@angular/core';


/*
 * Encadré pointillé « Aucune demande pour l'instant »
 * (tableau de bord annonceur)
 */
@Component({
  selector: 'app-empty-requests',

  standalone: true,

  template: `
    <div class="empty-requests">

      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 13.5 5.5 5h13l2.5 8.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
        <path d="M3 13.5h5l1.5 2.5h5l1.5-2.5h5" />
      </svg>

      <p>{{ message }}</p>

    </div>
  `,

  styleUrl: './empty-requests.css'
})
export class EmptyRequests {

  @Input()
  message =
    'Aucune demande pour l’instant. Elles apparaîtront ici dès que votre annonce sera en ligne.';

}
