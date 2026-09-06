import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  Cart,
  CartItem,
  CartTotal,
  AddItemRequest,
  UpdateItemRequest,
} from '../../shared/models/cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cart = signal<Cart | null>(null);

  items = computed(() => this.cart()?.items ?? []);
  totalItems = computed(() => this.items().reduce((acc, item) => acc + item.cantidad, 0));
  subtotal = computed(() =>
    this.items().reduce(
      (acc, item) => acc + parseFloat(item.precio_unitario as any) * item.cantidad,
      0,
    ),
  );
  envio = computed(() => (this.subtotal() >= 50 ? 0 : 5));
  total = computed(() => this.subtotal() + this.envio());
  isEmpty = computed(() => this.items().length === 0);

  constructor(private api: ApiService) {}

  getCart(): Observable<Cart> {
    return this.api.get<Cart>('/api/carrito/').pipe(tap((cart) => this.cart.set(cart)));
  }

  addItem(data: AddItemRequest): Observable<Cart> {
    return this.api.post<Cart>('/api/carrito/items', data).pipe(tap((cart) => this.cart.set(cart)));
  }

  updateItem(itemId: string, data: UpdateItemRequest): Observable<Cart> {
    return this.api
      .patch<Cart>(`/api/carrito/items/${itemId}`, data)
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  removeItem(itemId: string): Observable<Cart> {
    return this.api
      .delete<Cart>(`/api/carrito/items/${itemId}`)
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  clearCart(): Observable<Cart> {
    this.cart.set(null);
    return this.api.delete<Cart>('/api/carrito/').pipe(tap((cart) => this.cart.set(cart)));
  }

  getProductImage(item: CartItem): string {
    const main = item.producto?.imagenes?.find((img) => img.es_principal);
    return (
      main?.url_imagen ??
      item.producto?.imagenes?.[0]?.url_imagen ??
      'assets/images/placeholder.jpg'
    );
  }

  getItemTotal(item: CartItem): number {
    return parseFloat(item.precio_unitario as any) * item.cantidad;
  }

  getItemPrice(item: CartItem): number {
    return parseFloat(item.precio_unitario as any) || 0;
  }
}
