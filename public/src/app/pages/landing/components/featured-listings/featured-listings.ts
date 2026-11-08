import { Component } from '@angular/core';

interface Listing {
  city: string;
  title: string;
  details: string;
  price: string;
  rating: number;
  image: string;
  verified: boolean;
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
      city: 'LYON, 2e Arrondissement',
      title: 'Appartement T2 neuf',
      details: 'Meublé · 40 m² · 2 pièces',
      price: '600 € / mois',
      rating: 4.9,
      image: '/images/landing/listing-1.jpg',
      verified: true
    },
    {
      city: 'LYON, 9e Arrondissement',
      title: 'Studio charmant',
      details: 'Meublé · 14 m² · 1 pièce',
      price: '325 € / mois',
      rating: 4.0,
      image: '/images/landing/listing-2.jpg',
      verified: true
    },
    {
      city: 'LYON, 3e Arrondissement',
      title: 'Studio proche du centre',
      details: 'Meublé · 20 m² · 1 pièce',
      price: '390 € / mois',
      rating: 5.0,
      image: '/images/landing/listing-3.jpg',
      verified: true
    },
    {
      city: 'LYON, 7e Arrondissement',
      title: 'Appartement T1 rénové',
      details: 'Meublé · 25 m² · 1 pièce',
      price: '450 € / mois',
      rating: 3.9,
      image: '/images/landing/listing-4.jpg',
      verified: true
    }
  ];
}