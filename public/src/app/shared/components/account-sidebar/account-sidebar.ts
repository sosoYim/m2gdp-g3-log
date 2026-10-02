import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type AccountSection =
  | 'reservations'
  | 'saved'
  | 'messages'
  | 'settings';


@Component({
  selector: 'app-account-sidebar',

  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl: './account-sidebar.html',
  styleUrl: './account-sidebar.css'
})
export class AccountSidebar {

  @Input()
  active: AccountSection = 'reservations';

}