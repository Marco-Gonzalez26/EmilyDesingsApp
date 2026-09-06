import { Component } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-admin-inventory-form.component',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon],
  templateUrl: './admin-inventory-form.component.html',
  styleUrl: './admin-inventory-form.component.css',
})
export class AdminInventoryFormComponent {

}
