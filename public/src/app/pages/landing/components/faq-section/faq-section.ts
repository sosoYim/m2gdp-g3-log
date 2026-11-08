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

  activeIndex: number | null = null;

  faqs: FaqItem[] = [
    {
      question: 'Qui peut utiliser BailLyon ?',
      answer:
        'BailLyon s’adresse principalement aux étudiants et jeunes actifs qui recherchent un logement temporaire pour un stage, un échange universitaire, des études ou une autre expérience à Lyon.'
    },
    {
      question: 'Combien de temps puis-je louer mon logement ?',
      answer:
        'Les logements peuvent être proposés pour des séjours temporaires de 1 mois minimum jusqu’à 6 mois, selon les conditions définies dans chaque annonce.'
    },
    {
      question: 'Comment contacter un propriétaire ?',
      answer:
        'Vous pouvez contacter directement le propriétaire grâce à la messagerie intégrée de BailLyon avant d’envoyer votre demande de réservation.'
    },
    {
      question: 'Puis-je arriver avant la date prévue ?',
      answer:
        'Non, vous ne pouvez pas arriver avant la date inscrite dans votre demande de réservation.'
    },
    {
      question: 'Comment payer mon premier loyer ?',
      answer:
        'BailLyon ne propose pas de service de paiement. Le paiement du loyer se fait directement entre les utilisateurs.'
    },
    {
      question: 'Puis-je rompre mon bail immédiatement et sans délai ?',
      answer:
        'La loi n’impose pas de délai de préavis légal spécifique entre le locataire principal et le sous-locataire, mais il est préférable de prévoir un préavis amiable raisonnable d’un mois.'
    },
    {
      question: 'Mon compte est un compte demandeur, puis-je le passer en compte annonceur ?',
      answer:
        'Vous pouvez basculer votre compte en annonceur en utilisant le bouton « J’accueille ».'
    }
  ];

  toggleFaq(index: number): void {
    this.activeIndex =
      this.activeIndex === index ? null : index;
  }
}