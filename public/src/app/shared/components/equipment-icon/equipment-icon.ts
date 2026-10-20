import { Component, Input } from '@angular/core';


/*
 * Icône d'équipement sur fond violet clair.
 * Le libellé est affiché à côté par le parent.
 */
@Component({
  selector: 'app-equipment-icon',

  standalone: true,

  templateUrl: './equipment-icon.html',
  styleUrl: './equipment-icon.css'
})
export class EquipmentIcon {

  /*
   * Chemin du SVG ('' = fond seul)
   */
  @Input()
  icon = '';

}
