import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

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
export class HostSidebar {

  @Input()
  active: HostSection = 'dashboard';

  @Input()
  pendingCount: number = 0;

}
