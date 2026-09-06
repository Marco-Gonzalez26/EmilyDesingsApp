import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdenService } from '../../core/services/order.service';
import { Orden } from '../../shared/models/order';
import { CartService } from '../../core/services/cart.service';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonSpinner, IonRouterLink, IonRouterLinkWithHref, CommonModule, RouterModule],
  templateUrl: './checkout-success.component.html',
})
export class CheckoutSuccessComponent implements OnInit {
  isLoading = signal(true);
  orden = signal<Orden | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordenService: OrdenService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const sessionId = params['session_id'];

      if (!sessionId) {
        this.router.navigate(['/']);
        return;
      }

      this.ordenService.confirmarPago(sessionId).subscribe({
        next: (orden) => {
          this.orden.set(orden);
          this.cartService.clearCart();
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.router.navigate(['/']);
        },
      });
    });
  }
}