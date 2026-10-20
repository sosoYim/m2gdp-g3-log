import { Routes } from '@angular/router';

import { Landing } from './pages/landing/landing';

import { AuthCallback } from './pages/auth-callback/auth-callback';

import { CompleteProfile } from './pages/complete-profile/complete-profile';

import { RoleSelection } from './pages/role-selection/role-selection';

import { RentalSearchResults } from './pages/rental-search-results/rental-search-results';

import { PropertyDetails } from './pages/property-details/property-details';

import { BookingRequest } from './pages/booking-request/booking-request';

import { BookingConfirmation } from './pages/booking-confirmation/booking-confirmation';

import { RenterAccount } from './pages/renter-account/renter-account';

import { SavedListings } from './pages/saved-listings/saved-listings';

import { Messages } from './pages/messages/messages';

import { AccountSettings } from './pages/account-settings/account-settings';

import { HostDashboard } from './pages/host-dashboard/host-dashboard';

import { HostRequests } from './pages/host-requests/host-requests';
import { HostRequestDetail } from './pages/host-request-detail/host-request-detail';
import { HostListings } from './pages/host-listings/host-listings';

import { HostListingForm } from './pages/host-listing-form/host-listing-form';

import { HostListingPublished } from './pages/host-listing-published/host-listing-published';

import { authGuard } from './core/guards/auth.guard';


export const routes: Routes = [

  {
    path: '',
    component: Landing
  },

  {
    path: 'auth/callback',
    component: AuthCallback
  },

  /*
   * Pages publiques
   */
  {
    path: 'rental-search-results',
    component: RentalSearchResults
  },

  {
    path: 'property-details/:id',
    component: PropertyDetails
  },

  /*
   * Pages nécessitant une connexion
   */
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
    component: BookingRequest,
    canActivate: [authGuard]
  },

  {
    path: 'booking-confirmation/:id',
    component: BookingConfirmation,
    canActivate: [authGuard]
  },

  {
    path: 'renter-account',
    component: RenterAccount,
    canActivate: [authGuard]
  },

  {
    path: 'saved-listings',
    component: SavedListings,
    canActivate: [authGuard]
  },

  {
    path: 'messages',
    component: Messages,
    canActivate: [authGuard]
  },

  {
    path: 'account-settings',
    component: AccountSettings,
    canActivate: [authGuard]
  },

  /*
   * Pages Annonceur
   */
  {
    path: 'host/dashboard',
    component: HostDashboard,
    canActivate: [authGuard]
  },

  {
    path: 'host/listings',
    component: HostListings,
    canActivate: [authGuard]
  },

  {
    path: 'host/requests',
    component: HostRequests,
    canActivate: [authGuard]
  },

  {
    path: 'host/requests/:id',
    component: HostRequestDetail,
    canActivate: [authGuard]
  },

  {
    path: 'host/listings/new',
    component: HostListingForm,
    canActivate: [authGuard]
  },

  {
    path: 'host/listings/edit',
    component: HostListingForm,
    canActivate: [authGuard]
  },

  {
    path: 'host/listings/published',
    component: HostListingPublished,
    canActivate: [authGuard]
  }

];