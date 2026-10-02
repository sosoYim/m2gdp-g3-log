import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { AccountSidebar } from '../../shared/components/account-sidebar/account-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';


interface FavoriteListing {
  id: number;
  title: string;
  location: string;
  details: string;
  price: number;
  rating: number;
  image: string;
}


@Component({
  selector: 'app-renter-account',

  standalone: true,

  imports: [
    RouterLink,
    UserNavbar,
    AccountSidebar,
    ContactSection,
    Footer
  ],

  templateUrl: './renter-account.html',
  styleUrl: './renter-account.css'
})
export class RenterAccount {

  favorites: FavoriteListing[] = [

    {
      id: 1,
      title: 'Charmant studio-loft',
      location: 'LYON, ARRONDISSEMENT 2',
      details: 'Meublé · 22 m² · 1 pièce',
      price: 650,
      rating: 4.9,
      image: '/images/rental/property-1/Umeus.png'
    },

    {
      id: 2,
      title: 'Charmant studio-loft',
      location: 'LYON, ARRONDISSEMENT 2',
      details: 'Meublé · 22 m² · 1 pièce',
      price: 650,
      rating: 4.9,
      image: '/images/rental/property-1/Umeus.png'
    },

    {
      id: 3,
      title: 'Charmant studio-loft',
      location: 'LYON, ARRONDISSEMENT 2',
      details: 'Meublé · 22 m² · 1 pièce',
      price: 650,
      rating: 4.9,
      image: '/images/rental/property-1/Umeus.png'
    }

  ];

}