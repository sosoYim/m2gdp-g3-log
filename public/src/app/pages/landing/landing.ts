import { Component } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Hero } from './components/hero/hero';
import { TrustFeatures } from './components/trust-features/trust-features';
import { AboutSection } from './components/about-section/about-section';
import { FeaturedListings } from './components/featured-listings/featured-listings';
import { WhyUs } from './components/why-us/why-us';
import { HowItWorks } from './components/how-it-works/how-it-works';
import { FaqSection } from './components/faq-section/faq-section';
import { ContactSection } from './components/contact-section/contact-section';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-landing',
  imports: [Navbar, Hero,TrustFeatures,AboutSection,FeaturedListings,WhyUs,HowItWorks,FaqSection,ContactSection,Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing {}