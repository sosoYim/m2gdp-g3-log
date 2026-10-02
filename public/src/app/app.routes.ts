import { Routes } from '@angular/router';

import { Landing } from './pages/landing/landing';

import { AuthCallback } from './pages/auth-callback/auth-callback';

import { CompleteProfile } from './pages/complete-profile/complete-profile';

import { RoleSelection } from './pages/role-selection/role-selection';

import { RentalSearchResults } from './pages/rental-search-results/rental-search-results';

import { PropertyDetails } from './pages/property-details/property-details';

import { BookingRequest } from './pages/booking-request/booking-request';

import { BookingConfirmation } from './pages/booking-confirmation/booking-confirmation';

import { authGuard } from './core/guards/auth.guard';

import { RenterAccount } from './pages/renter-account/renter-account';

import { SavedListings } from './pages/saved-listings/saved-listings';

import { Messages } from './pages/messages/messages';

import { AccountSettings } from './pages/account-settings/account-settings';


export const routes: Routes = [

  {
    path: '',
    component: Landing
  },

  {
    path: 'auth/callback',
    component: AuthCallback
  },

  {
    path: 'rental-search-results',
    component: RentalSearchResults
  },

  {
    path: 'property-details/:id',
    component: PropertyDetails
  },

  {
    path: 'complete-profile',
    component: CompleteProfile,
    canActivate: [authGuard]
  },

  {
    path: 'role-selection',
    component: RoleSelection,
    canActivate: [authGuard]
  },

  {
    path: 'booking-request/:id',
    component: BookingRequest
  },

  {
    path: 'booking-confirmation/:id',
    component: BookingConfirmation
  },
  {
  path: 'renter-account',
  component: RenterAccount
  },
  {
  path: 'saved-listings',
  component: SavedListings
  },
  {
  path: 'messages',
  component: Messages
  },
  {
  path: 'account-settings',
  component: AccountSettings
 }

];