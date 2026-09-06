import { Component, signal, computed, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { QuickAddData } from '@models/quick_add';

@Component({
  selector: 'app-quick-add-modal',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonFooter, IonButton, IonIcon, IonSpinner],
  templateUrl: './quick-add.component.html',
  styleUrl: './quick-add.component.css',
})
export class QuickAddModalComponent {
  private modalCtrl = inject(ModalController);
  @Input() producto: QuickAddData | null = null;


  tallaSeleccionada = signal<string | null>(null);
  colorSeleccionado = signal<string | null>(null);
  cantidad = signal<number>(1);

  tallaInfo = computed(() => {
    const tallaId = this.tallaSeleccionada();
    if (!tallaId) return null;
    return this.producto?.tallas_disponibles.find((t) => t.id === tallaId) ?? null;
  });

  stockDisponible = computed(() => {
    const talla = this.tallaInfo();
    return talla?.stock ?? 0;
  });

  puedeAgregar = computed(() => {
    return (
      this.tallaSeleccionada() !== null &&
      this.colorSeleccionado() !== null &&
      this.cantidad() > 0 &&
      this.cantidad() <= this.stockDisponible()
    );
  });

  precioFinal = computed(() => {
    const p = this.producto;
    if (!p) return 0;
    const descuento = p.precio_descuento;
    const regular = p.precio;
    if (descuento) return parseFloat(descuento);
    return parseFloat(regular);
  });

  totalPrecio = computed(() => {
    return this.precioFinal() * this.cantidad();
  });


  seleccionarTalla(tallaId: string): void {
    this.tallaSeleccionada.set(tallaId);
  }

  seleccionarColor(colorId: string): void {
    this.colorSeleccionado.set(colorId);
  }

  incrementarCantidad(): void {
    if (this.cantidad() < this.stockDisponible()) {
      this.cantidad.update((c) => c + 1);
    }
  }

  decrementarCantidad(): void {
    if (this.cantidad() > 1) {
      this.cantidad.update((c) => c - 1);
    }
  }

  agregarAlCarrito(): void {
    if (!this.puedeAgregar()) return;
    const p = this.producto;
    if (!p) return;
    this.modalCtrl.dismiss(
      {
        producto_id: p.producto_id,
        talla_id: this.tallaSeleccionada()!,
        color_id: this.colorSeleccionado()!,
        cantidad: this.cantidad(),
      },
      'confirm',
    );
  }

  cerrar(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
