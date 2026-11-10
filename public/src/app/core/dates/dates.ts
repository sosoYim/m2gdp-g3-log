/*
 * Outils dates 'YYYY-MM-DD'
 * (comparables comme des chaînes)
 */
export function toIsoDate(
  date: Date
): string {

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;

}


export function addDays(
  iso: string,
  days: number
): string {

  const [year, month, day] = iso.split('-').map(Number);

  return toIsoDate(new Date(year, month - 1, day + days));

}


/* '2027-07-12' → '12/07/2027' */
export function formatIsoDate(
  iso: string
): string {

  const [year, month, day] = iso.split('-');

  return `${day}/${month}/${year}`;

}


/*
 * =========================================
 * PÉRIODE DE DISPONIBILITÉ D'UN LOGEMENT
 * =========================================
 *
 * availableFrom / availableTo : 'YYYY-MM-DD'
 * ('' = pas de limite). On ne propose pas
 * de date passée, et le départ est au moins
 * le lendemain de l'arrivée.
 */

export interface StayLimits {

  arrivalMin: string;

  arrivalMax: string;

  departureMin: string;

  departureMax: string;

}


export function getStayLimits(
  availableFrom: string,
  availableTo: string,
  arrivalDate: string
): StayLimits {

  const today =
    toIsoDate(new Date());

  const start =
    availableFrom && availableFrom > today ? availableFrom : today;

  return {
    arrivalMin: start,
    arrivalMax: availableTo ? addDays(availableTo, -1) : '',
    departureMin: addDays(arrivalDate || start, 1),
    departureMax: availableTo
  };

}


export function isStayInAvailability(
  availableFrom: string,
  availableTo: string,
  arrivalDate: string,
  departureDate: string
): boolean {

  const limits =
    getStayLimits(availableFrom, availableTo, arrivalDate);

  return arrivalDate >= limits.arrivalMin
    && (!limits.arrivalMax || arrivalDate <= limits.arrivalMax)
    && departureDate >= limits.departureMin
    && (!limits.departureMax || departureDate <= limits.departureMax);

}


/*
 * Date + n mois (31/01 + 1 mois → 28 ou 29/02 :
 * on reste dans le mois visé).
 */
export function addMonths(
  iso: string,
  months: number
): string {

  const [year, month, day] = iso.split('-').map(Number);

  const lastDay = new Date(year, month - 1 + months + 1, 0).getDate();

  return toIsoDate(new Date(year, month - 1 + months, Math.min(day, lastDay)));

}


/*
 * Séjour minimum (en mois) : message d'erreur,
 * ou '' si le séjour est assez long.
 */
export function getMinStayError(
  arrivalDate: string,
  departureDate: string,
  minStayMonths: number
): string {

  if (!arrivalDate || !departureDate || minStayMonths <= 0) {
    return '';
  }

  const minDeparture =
    addMonths(arrivalDate, minStayMonths);

  return departureDate < minDeparture
    ? `Le séjour minimum est de ${minStayMonths} mois : choisissez un départ à partir du ${formatIsoDate(minDeparture)}.`
    : '';

}


/*
 * =========================================
 * PÉRIODES DÉJÀ RÉSERVÉES
 * =========================================
 *
 * Une demande acceptée bloque ses dates
 * (listings/{id}.bookedPeriods) : le reste
 * de la disponibilité reste réservable.
 */
export interface BookedPeriod {

  requestId: string;

  from: string;

  to: string;

}


/*
 * Le départ d'un séjour peut être le jour
 * d'arrivée du suivant (bornes exclusives).
 */
export function findBookedOverlap(
  periods: BookedPeriod[],
  arrivalDate: string,
  departureDate: string
): BookedPeriod | null {

  if (!arrivalDate || !departureDate) {
    return null;
  }

  return periods.find(period =>
    period.from < departureDate && arrivalDate < period.to
  ) ?? null;

}
