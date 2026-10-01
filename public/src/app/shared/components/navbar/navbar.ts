import { Component, signal } from '@angular/core';

import { AuthModal } from '../auth-modal/auth-modal';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AuthModal],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

  authModalOpen = signal(false);

  openAuth(): void {
    this.authModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.authModalOpen.set(false);
  }
}