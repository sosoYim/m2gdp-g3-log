import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Auth } from '../../../core/auth/auth';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.css'
})
export class AuthModal {

  private readonly authService = inject(Auth);

  @Input() isOpen = false;

  @Output() closed = new EventEmitter<void>();

  email = '';

  loading = signal(false);
  emailSent = signal(false);
  errorMessage = signal('');


  closeModal(): void {

    this.email = '';

    this.loading.set(false);
    this.emailSent.set(false);
    this.errorMessage.set('');

    this.closed.emit();
  }


  async sendLink(): Promise<void> {

    this.errorMessage.set('');

    const cleanEmail =
      this.email.trim().toLowerCase();


    if (!cleanEmail) {

      this.errorMessage.set(
        'Veuillez saisir votre adresse e-mail.'
      );

      return;
    }


    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailRegex.test(cleanEmail)) {

      this.errorMessage.set(
        'Cette adresse e-mail semble incorrecte.'
      );

      return;
    }


    try {

      this.loading.set(true);

      await this.authService.sendMagicLink(
        cleanEmail
      );

      this.email = cleanEmail;

      this.emailSent.set(true);

    } catch (error: any) {

  console.error(
    'Erreur lors de l’envoi du lien :',
    error
  );

  if (error?.code === 'auth/quota-exceeded') {

    this.errorMessage.set(
      'Trop de demandes ont été effectuées. Veuillez réessayer plus tard.'
    );

  } else {

    this.errorMessage.set(
      'Impossible d’envoyer le lien. Réessayez.'
    );

  }

} finally {

  this.loading.set(false);
}
  }


  modifyEmail(): void {

    this.emailSent.set(false);
    this.errorMessage.set('');

  }
}