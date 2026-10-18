import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { UserRole } from '../../../core/profile/profile';


@Component({
  selector: 'app-mobile-menu',

  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl: './mobile-menu.html',
  styleUrl: './mobile-menu.css'
})
export class MobileMenu {

  @Input()
  fullName: string = '';

  @Input()
  email: string = '';

  @Input()
  initial: string = '';

  @Input()
  role: UserRole = 'guest';

  @Input()
  switchingRole: boolean = false;


  @Output()
  closed = new EventEmitter<void>();

  @Output()
  roleChange = new EventEmitter<UserRole>();

  @Output()
  logout = new EventEmitter<void>();

}
