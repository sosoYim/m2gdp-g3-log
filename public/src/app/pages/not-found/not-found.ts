import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

import { Navbar } from '../../shared/components/navbar/navbar';

import { Footer } from '../landing/components/footer/footer';


/*
 * Page 404 : toute URL inconnue (route '**').
 */
@Component({
  selector: 'app-not-found',

  standalone: true,

  imports: [
    RouterLink,
    Navbar,
    Footer
  ],

  templateUrl: './not-found.html',
  styleUrl: './not-found.css'
})
export class NotFound {}
