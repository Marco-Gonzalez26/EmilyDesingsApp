import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { CartService } from '../../core/services/cart.service';
import { OrdenService } from '../../core/services/order.service';
import { OrdenCreate, OrdenItem } from '../../shared/models/order';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-checkout',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonItem, IonItemDivider, IonLabel, IonInput, IonButton, IonIcon, IonSpinner, IonRouterLink, IonRouterLinkWithHref, CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnInit {
  step = signal(1);
  isProcessing = signal(false);
  shippingForm!: FormGroup;
  private pendingSessionId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public cartService: CartService,
    private ordenService: OrdenService,
    private toastService: ToastService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.cartService.getCart().subscribe();

    if (this.cartService.isEmpty()) {
      this.router.navigate(['/carrito']);
      return;
    }

    const currentUser = this.authService.currentUser();

    this.shippingForm = this.fb.group({
      nombre: [currentUser?.nombre_completo || '', Validators.required],
      cedula: [
        currentUser?.cedula_ruc || '',
        [Validators.required, Validators.pattern(/^[0-9]{10,13}$/)],
      ],
      telefono: [
        currentUser?.telefono || '',
        [Validators.required, Validators.pattern(/^[0-9]{10}$/)],
      ],
      direccion: [currentUser?.direccion || '', Validators.required],
      ciudad: [currentUser?.ciudad || '', Validators.required],
      provincia: ['', Validators.required],
      codigoPostal: ['', Validators.required],
    });
  }

  get impuestos(): number {
    return Math.round(this.cartService.subtotal() * 0.12 * 100) / 100;
  }

  get total(): number {
    return (
      Math.round((this.cartService.subtotal() + this.impuestos + this.cartService.envio()) * 100) /
      100
    );
  }

  nextStep(): void {
    if (this.step() === 1) {
      if (this.shippingForm.invalid) {
        this.shippingForm.markAllAsTouched();
        this.toastService.warn('Por favor completa todos los campos requeridos');
        return;
      }
      this.step.set(2);
    }
  }

  prevStep(): void {
    if (this.step() > 1) {
      this.step.update((s) => s - 1);
    }
  }

  procesarPago(): void {
    if (this.shippingForm.invalid) {
      this.toastService.error('Los datos de envío son inválidos');
      return;
    }

    this.isProcessing.set(true);

    const formValues = this.shippingForm.value;
    const direccionCompleta = `${formValues.direccion}, ${formValues.ciudad}, ${formValues.provincia}, ${formValues.codigoPostal}`;

    const items: OrdenItem[] = this.cartService.items().map((item) => ({
      producto_id: item.producto_id,
      nombre_producto: item.producto?.nombre || 'Producto',
      talla_id: item.talla_id,
      color_id: item.color_id,
      cantidad: item.cantidad,
      precio_unitario: this.cartService.getItemPrice(item),
      subtotal: this.cartService.getItemTotal(item),
      origen: item.origen,
    }));

    const ordenData: OrdenCreate = {
      direccion_envio: direccionCompleta,
      subtotal: this.cartService.subtotal(),
      costo_envio: this.cartService.envio(),
      impuestos: this.impuestos,
      total: this.total,
      metodo_pago: 'stripe',
      items: items,
    };

    this.ordenService.crearOrden(ordenData).subscribe({
      next: (orden) => {
        const baseUrl = window.location.origin;
        const checkoutRequest = {
          success_url: `${baseUrl}/checkout/success`,
          cancel_url: `${baseUrl}/checkout/cancel`,
        };

        this.ordenService.crearCheckoutSession(orden.id, checkoutRequest).subscribe({
          next: (response) => {
            this.pendingSessionId = response.session_id;
            if (Capacitor.isNativePlatform()) {
              this.abrirCheckoutNativo(response.checkout_url);
            } else {
              window.location.href = response.checkout_url;
            }
          },
          error: () => {
            this.isProcessing.set(false);
            this.toastService.error('No se pudo iniciar el proceso de pago');
          },
        });
      },
      error: () => {
        this.isProcessing.set(false);
        this.toastService.error('No se pudo crear la orden');
      },
    });
  }

  private async abrirCheckoutNativo(url: string): Promise<void> {
    try {
      await Browser.open({ url });

      Browser.addListener('browserFinished', async () => {
        Browser.removeAllListeners();
        await this.confirmarPagoPendiente();
      });
    } catch (error) {
      console.error('Error al abrir Stripe:', error);
      this.isProcessing.set(false);
      this.toastService.error('No se pudo abrir el proceso de pago');
    }
  }

  private async confirmarPagoPendiente(): Promise<void> {
    const sessionId = this.pendingSessionId;
    if (!sessionId) {
      this.isProcessing.set(false);
      this.router.navigate(['/checkout/cancel']);
      return;
    }

    this.ordenService.confirmarPago(sessionId).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.router.navigate(['/checkout/success']);
      },
      error: () => {
        this.isProcessing.set(false);
        this.router.navigate(['/checkout/cancel']);
      },
    });
  }
}