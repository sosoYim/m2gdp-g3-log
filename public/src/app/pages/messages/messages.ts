import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { AccountSidebar } from '../../shared/components/account-sidebar/account-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';


interface ChatMessage {
  id: number;
  text: string;
  sender: 'me' | 'other';
  time: string;
}


interface Conversation {
  id: number;
  name: string;
  initial: string;
  listingTitle: string;
  preview: string;
  time: string;
  unread: boolean;
}


@Component({
  selector: 'app-messages',

  standalone: true,

  imports: [
    FormsModule,
    UserNavbar,
    AccountSidebar,
    ContactSection,
    Footer
  ],

  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class Messages {

  searchTerm = '';

  selectedConversationId = 1;

  messageText = '';


  conversations: Conversation[] = [

    {
      id: 1,
      name: 'Lucas',
      initial: 'L',
      listingTitle: 'Charmant studio-loft',
      preview: 'Bien sûr ! Samedi 15 h, ça vous va ?',
      time: '14:45',
      unread: true
    },

    {
      id: 2,
      name: 'Camille',
      initial: 'C',
      listingTitle: 'Studio lumineux',
      preview: 'Merci pour votre message, je reviens...',
      time: 'Hier',
      unread: false
    },

    {
      id: 3,
      name: 'Thomas',
      initial: 'T',
      listingTitle: 'Appartement cosy',
      preview: 'Le logement est déjà réservé à ces...',
      time: 'Lun.',
      unread: false
    }

  ];


  messages: ChatMessage[] = [

    {
      id: 1,
      text:
        'Bonjour Lucas, je suis intéressé(e) par votre logement. Est-il disponible aux dates indiquées ?',
      sender: 'me',
      time: '10:05'
    },

    {
      id: 2,
      text:
        'Bonjour ! Oui, le studio est libre du 1er mai au 1er novembre. Voulez-vous le visiter ?',
      sender: 'other',
      time: '14:32'
    },

    {
      id: 3,
      text:
        'Avec plaisir ! Je suis disponible samedi après-midi.',
      sender: 'me',
      time: '14:40'
    },

    {
      id: 4,
      text:
        'Bien sûr ! Samedi 15 h, ça vous va ?',
      sender: 'other',
      time: '14:45'
    }

  ];


  constructor(
    private readonly router: Router
  ) {}


  get filteredConversations(): Conversation[] {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();


    if (!search) {
      return this.conversations;
    }


    return this.conversations.filter(
      conversation =>
        conversation.name
          .toLowerCase()
          .includes(search) ||

        conversation.listingTitle
          .toLowerCase()
          .includes(search)
    );

  }


  get selectedConversation(): Conversation {

    return (
      this.conversations.find(
        conversation =>
          conversation.id ===
          this.selectedConversationId
      ) ?? this.conversations[0]
    );

  }


  selectConversation(
    conversation: Conversation
  ): void {

    this.selectedConversationId =
      conversation.id;


    conversation.unread =
      false;

  }


  sendMessage(): void {

    const text =
      this.messageText.trim();


    if (!text) {
      return;
    }


    this.messages.push({

      id:
        Date.now(),

      text,

      sender:
        'me',

      time:
        new Intl.DateTimeFormat(
          'fr-FR',
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        ).format(
          new Date()
        )

    });


    this.messageText = '';

  }


  async openListing(): Promise<void> {

    await this.router.navigate([
      '/property-details',
      1
    ]);

  }

}