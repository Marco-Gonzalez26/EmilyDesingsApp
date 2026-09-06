import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { InventarioService } from './inventory.service';
import { CartService } from './cart.service';
import { ToastService } from './toast.service';
import { QuickAddData } from '../../shared/models/quick_add';
import { QuickAddModalComponent } from '../../shared/components/quick-add/quick-add.component';

@Injectable({ providedIn: 'root' })
export class QuickAddService {
  private inventarioService = inject(InventarioService);
  private modalCtrl = inject(ModalController);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  // legacy signals kept for compatibility if still used
  isOpen = { set: (_: boolean) => {}, get: () => false } as never;
  data = { set: (_: unknown) => {} } as never;

  async open(productoId: string, fallback: Pick<QuickAddData, 'producto_id' | 'nombre' | 'imagen' | 'precio' | 'precio_descuento'>): Promise<void> {
    let inv: { tallas_disponibles: QuickAddData['tallas_disponibles']; colores_disponibles: QuickAddData['colores_disponibles'] };
    try {
      inv = await firstValueFrom(this.inventarioService.obtenerInventarioQuickAdd(productoId));
    } catch {
      this.toastService.error('No se pudo cargar tallas y colores');
      return;
    }

    const producto: QuickAddData = {
      producto_id: fallback.producto_id,
      nombre: fallback.nombre,
      imagen: fallback.imagen,
      precio: fallback.precio,
      precio_descuento: fallback.precio_descuento,
      tallas_disponibles: inv.tallas_disponibles,
      colores_disponibles: inv.colores_disponibles,
    };

    const modal = await this.modalCtrl.create({
      component: QuickAddModalComponent,
      componentProps: { producto },

      initialBreakpoint: 1,
      handle: true,
      backdropDismiss: true,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.cartService
        .addItem({
          producto_id: data.producto_id,
          talla_id: data.talla_id,
          color_id: data.color_id,
          cantidad: data.cantidad,
          origen: 'catalogo',
        })
        .subscribe({
          next: () => this.toastService.success('Producto agregado al carrito'),
          error: (error) => {
            const msg = error.error?.detail || 'No se pudo agregar al carrito';
            this.toastService.error(msg);
          },
        });
    }
  }

  close(): void {}
}
