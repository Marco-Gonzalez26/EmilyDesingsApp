import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonIcon, IonRouterLink, IonRouterLinkWithHref } from '@ionic/angular/standalone';
import { Product } from '../../../shared/models/product';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, IonIcon, IonRouterLink, IonRouterLinkWithHref],
  templateUrl: './product-card.html',
})
export class ProductCardComponent {
  product = input.required<Product>();
  isFavorite = input<boolean>(false);

  favoriteToggled = output<string>();
  addToCartRequested = output<string>();

  getMainImage(): string {
    const product = this.product();
    const main = product.imagenes?.find((img) => img.es_principal);
    return main?.url_imagen ?? product.imagenes?.[0]?.url_imagen ?? 'assets/images/placeholder.jpg';
  }

  getPrice(): number {
    const product = this.product();
    const price = product.precio_descuento ?? product.precio_regular;
    return parseFloat(price as any) || 0;
  }

  hasDiscount(): boolean {
    const product = this.product();
    const regular = parseFloat(product.precio_regular as any);
    const descuento = parseFloat(product.precio_descuento as any);
    return !!product.precio_descuento && descuento < regular;
  }

  getDiscountPercent(): number {
    if (!this.hasDiscount()) return 0;
    const product = this.product();
    const regular = parseFloat(product.precio_regular as any);
    const descuento = parseFloat(product.precio_descuento as any);
    return Math.round((1 - descuento / regular) * 100);
  }

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.favoriteToggled.emit(this.product().id);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.addToCartRequested.emit(this.product().id);
  }
}
