import { Component } from '@angular/core';

interface Listing {
  city: string;
  title: string;
  owner: string;
  image: string;
}

@Component({
  selector: 'app-featured-listings',
  standalone: true,
  imports: [],
  templateUrl: './featured-listings.html',
  styleUrl: './featured-listings.css'
})
export class FeaturedListings {
  listings: Listing[] = [
    {
      city: 'LYON, ARRONDISSEMENT 2',
      title: 'Charmant studio-loft',
      owner: 'Nom de personne',
      image: '/images/landing/Umeus-Harmounikahusene.jpg'
    },
    {
      city: 'LYON, ARRONDISSEMENT 2',
      title: 'Charmant studio-loft',
      owner: 'Nom de personne',
      image: '/images/landing/Umeus-Harmounikahusene.jpg'
    },
    {
      city: 'LYON, ARRONDISSEMENT 2',
      title: 'Charmant studio-loft',
      owner: 'Nom de personne',
      image: '/images/landing/Umeus-Harmounikahusene.jpg'
    },
    {
      city: 'LYON, ARRONDISSEMENT 2',
      title: 'Charmant studio-loft',
      owner: 'Nom de personne',
      image: '/images/landing/Umeus-Harmounikahusene.jpg'
    }
  ];
}