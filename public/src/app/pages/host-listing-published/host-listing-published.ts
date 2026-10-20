import {
  ChangeDetectorRef,
  Component,
  OnInit,
  signal
} from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { UserNavbar } from '../../shared/components/user-navbar/user-navbar';
import { HostSidebar } from '../../shared/components/host-sidebar/host-sidebar';

import { ContactSection } from '../landing/components/contact-section/contact-section';
import { Footer } from '../landing/components/footer/footer';

import { Listing, ListingDocument } from '../../core/listing/listing';

import { formatFrenchDate } from '../host-listing-form/listing-form.data';


/*
 * =========================================
 * ANNONCE PUBLIÉE (CONFIRMATION)
 * =========================================
 *
 * /host/listings/published?id=...
 */
@Component({
  selector: 'app-host-listing-published',

  standalone: true,

  imports: [
    RouterLink,
    UserNavbar,
    HostSidebar,
    ContactSection,
    Footer
  ],

  templateUrl: './host-listing-published.html',
  styleUrl: './host-listing-published.css'
})
export class HostListingPublished implements OnInit {

  loading =
    signal(true);


  listing =
    signal<ListingDocument | null>(null);


  readonly formatDate =
    formatFrenchDate;


  constructor(
    private readonly listingService: Listing,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}


  async ngOnInit(): Promise<void> {

    const id =
      this.route.snapshot.queryParamMap.get('id') ?? '';


    try {

      if (id) {

        this.listing.set(
          await this.listingService.getListingById(id)
        );

      }

    } catch (err) {

      console.error('Erreur chargement annonce publiée :', err);

    } finally {

      this.loading.set(false);

      this.cdr.detectChanges();

    }

  }

}
