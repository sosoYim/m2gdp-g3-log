import { Timestamp } from 'firebase/firestore';

import { BookingRequest, BookingStatus } from '../../core/booking/booking';


/*
 * =========================================
 * OUTILS PARTAGÉS : DEMANDES REÇUES
 * =========================================
 * (liste /host/requests et détail /host/requests/:id)
 */


export function toMillis(
  timestamp: Timestamp | null
): number {

  return timestamp?.toMillis() ?? 0;

}


export function parseDate(
  value: string
): Date | null {

  const [year, month, day] =
    (value ?? '').split('-').map(Number);

  return year && month && day
    ? new Date(year, month - 1, day)
    : null;

}


/*
 * « 1er mai 2026 », « 1er nov. 2026 », « 1er mai »
 */
export function formatDay(
  date: Date,
  month: 'long' | 'short',
  withYear: boolean
): string {

  const day =
    date.getDate() === 1 ? '1er' : String(date.getDate());

  const monthLabel =
    new Intl.DateTimeFormat('fr-FR', { month }).format(date);

  return `${day} ${monthLabel}${withYear ? ` ${date.getFullYear()}` : ''}`;

}


/*
 * « 1er mai – 1er nov. 2026 »
 */
export function getDateRange(
  request: BookingRequest
): string {

  const from =
    parseDate(request.arrivalDate);

  const to =
    parseDate(request.departureDate);

  if (!from || !to) {
    return '';
  }


  const sameYear =
    from.getFullYear() === to.getFullYear();

  return `${formatDay(from, 'long', !sameYear)} – ${formatDay(to, 'short', true)}`;

}


/*
 * Même annonce, dates qui se chevauchent
 */
export function requestsOverlap(
  a: BookingRequest,
  b: BookingRequest
): boolean {

  return a.id !== b.id
    && a.listingId === b.listingId
    && a.arrivalDate < b.departureDate
    && b.arrivalDate < a.departureDate;

}


/*
 * « d'Alice », « de Hugo »
 */
export function withDe(
  name: string
): string {

  return /^[aeiouyàâéèêëîïôöùûü]/i.test(name) ? `d'${name}` : `de ${name}`;

}


export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'EN ATTENTE',
  accepted: 'ACCEPTÉE',
  rejected: 'REFUSÉE'
};
