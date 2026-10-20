import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  REJECTION_REASON_LABELS,
  RejectionReason
} from '../../../../core/booking/booking';


export interface AnswerConfirm {

  reason: RejectionReason | '';

  /*
   * Mot facultatif envoyé dans la messagerie
   */
  message: string;

}


/*
 * =========================================
 * MODALE ACCEPTER / REFUSER UNE DEMANDE
 * =========================================
 *
 * Mobile : la modale « refuser » s'ouvre
 * en panneau depuis le bas de l'écran.
 */
@Component({
  selector: 'app-answer-modal',

  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl: './answer-modal.html',
  styleUrl: './answer-modal.css'
})
export class AnswerModal implements OnInit {

  @Input({ required: true })
  mode!: 'accept' | 'refuse';

  /*
   * « Alice », « d'Alice »
   */
  @Input({ required: true })
  firstName = '';

  @Input({ required: true })
  ofFirstName = '';

  @Input()
  listingTitle = '';

  @Input()
  dateRange = '';

  @Input()
  price: number | null = null;

  @Input()
  saving = false;


  @Output()
  confirmed =
    new EventEmitter<AnswerConfirm>();

  @Output()
  closed =
    new EventEmitter<void>();


  readonly reasons =
    (Object.keys(REJECTION_REASON_LABELS) as RejectionReason[])
      .map(value => ({ value, label: REJECTION_REASON_LABELS[value] }));


  reason: RejectionReason = 'dates_unavailable';

  message = '';


  ngOnInit(): void {

    document.body.style.overflow = 'hidden';

  }


  close(): void {

    if (this.saving) {
      return;
    }

    document.body.style.overflow = '';

    this.closed.emit();

  }


  @HostListener('document:keydown.escape')
  onEscape(): void {

    this.close();

  }


  confirm(): void {

    this.confirmed.emit({
      reason: this.mode === 'refuse' ? this.reason : '',
      message: this.mode === 'refuse' ? this.message.trim() : ''
    });

  }

}
