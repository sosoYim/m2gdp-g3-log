import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { auth, firestore, realtimeDatabase } from './core/firebase/firebase';
import { ScrollTopButton } from './shared/components/scroll-top-button/scroll-top-button';

@Component({
  imports: [RouterOutlet, ScrollTopButton],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('sublyon');
}
