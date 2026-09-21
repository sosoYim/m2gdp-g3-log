import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { auth, firestore, realtimeDatabase } from './core/firebase/firebase';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('sublyon');
}
