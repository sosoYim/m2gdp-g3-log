import { Component } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [],
  templateUrl: './faq-section.html',
  styleUrl: './faq-section.css'
})
export class FaqSection {

  activeIndex: number | null = 0;

  faqs: FaqItem[] = [
    {
      question: 'Qui peut utiliser BailLyon ?',
      answer:
        'BailLyon s’adresse principalement aux étudiants et jeunes actifs qui recherchent un logement temporaire pour un stage, un échange universitaire, des études ou une autre expérience à Lyon.'
    },
    {
      question: 'Combien de temps puis-je louer un logement ?',
      answer:
        'Les logements peuvent être proposés pour des séjours temporaires jusqu’à 6 mois, selon les conditions définies dans chaque annonce.'
    },
    {
      question: 'Comment contacter un propriétaire ?',
      answer:
        'Vous pouvez contacter directement le propriétaire grâce à la messagerie intégrée de BailLyon avant d’envoyer votre demande de réservation.'
    }
  ];

  toggleFaq(index: number): void {
    this.activeIndex =
      this.activeIndex === index ? null : index;
  }
}