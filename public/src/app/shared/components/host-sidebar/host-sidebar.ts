import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../core/auth/auth';
import { Booking } from '../../../core/booking/booking';

export type HostSection =
  | 'dashboard'
  | 'listings'
  | 'requests'
  | 'messages'
  | 'settings';


@Component({
  selector: 'app-host-sidebar',

  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl: './host-sidebar.html',
  styleUrl: './host-sidebar.css'
})
export class HostSidebar implements OnInit {

  @Input()
  active: HostSection = 'dashboard';


  /*
   * Badge « Demandes reçues » : valeur partagée
   * (Booking.pendingCount), affichée tout de suite
   * puis mise à jour en arrière-plan.
   */
  get pendingCount(): number {

    return this.bookingService.pendingCount();

  }


  constructor(
    private readonly authService: Auth,
    private readonly bookingService: Booking
  ) {}


  async ngOnInit(): Promise<void> {

    try {

      const user =
        await this.authService.waitForAuthState();

      if (user) {
        await this.bookingService.refreshPendingCount(user.uid);
      }

    } catch (err) {

      console.error('Erreur chargement demandes en attente :', err);

    }

  }

}
