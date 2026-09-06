import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-checkout-cancel',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonRouterLink, IonRouterLinkWithHref, RouterModule],
  templateUrl: './checkout-cancel.component.html',
})
export class CheckoutCancelComponent {}