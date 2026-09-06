import { Component, signal, AfterViewInit, PLATFORM_ID, Inject, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HomeProductCardComponent } from './../../shared/components/home/home-product-card/home-product-card.component';
import { HomeService } from '../../core/services/home.service';
import { Product } from '../../shared/models/product';
import { Categoria } from '../../shared/models/home';
import { Recommendation } from '../../shared/models/recommendation';
import { AuthService } from '../../core/services/auth.service';
import { gsap } from 'gsap';
import { RouterLink } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { IonContent, IonRouterLink, IonRouterLinkWithHref } from '@ionic/angular/standalone';

interface Card {
  image: string;
  title: string;
  description: string;
  buttonText: string;
  link?: string;
}

@Component({
  host: { class: 'ion-page' },
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, IonRouterLink, IonRouterLinkWithHref, HomeProductCardComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, AfterViewInit {
  protected readonly cards1 = signal<Card[]>([
    {
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
      title: 'Hecho en Quevedo',
      description: 'Moda sostenible con prácticas éticas y artesanos locales.',
      buttonText: 'Conocer Más',
      link: '/sobre-nosotros',
    },
    {
      image: '/Emi_ModaLos80.jpeg',
      title: 'Nuevas Llegadas',
      description: 'Explora nuestras últimas incorporaciones de moda.',
      buttonText: 'Ver Todo',
      link: '/catalogo',
    },
    {
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800',
      title: 'Ofertas Especiales',
      description: 'Descuentos exclusivos en prendas seleccionadas.',
      buttonText: 'Ver Ofertas',
      link: '/catalogo?es_oferta=true',
    },
  ]);

  protected readonly productosDestacados = signal<Product[]>([]);
  protected readonly productosNuevos = signal<Product[]>([]);
  protected readonly productosOfertas = signal<Product[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly recomendaciones = signal<Recommendation[]>([]);
  protected readonly isLoading = signal(true);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private homeService: HomeService,
    private toastService: ToastService,
    protected authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.homeService.getHomeData(8).subscribe({
      next: (data) => {
        this.productosDestacados.set(data.destacados);
        this.productosNuevos.set(data.nuevos);
        this.productosOfertas.set(data.ofertas);
        this.categorias.set(data.categorias);
        this.recomendaciones.set(data.recomendaciones || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando datos de home:', error);
        this.isLoading.set(false);
        this.toastService.error('No se pudieron cargar los productos del inicio');
      },
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initAnimations();
      }, 100);
    }
  }

  getProductImage(product: Product): string {
    const main = product.imagenes?.find((img) => img.es_principal);
    return main?.url_imagen || product.imagenes?.[0]?.url_imagen || 'assets/images/placeholder.jpg';
  }

  getProductPrice(product: Product): number {
    const price = product.precio_descuento || product.precio_regular;
    return parseFloat(price as any) || 0;
  }

  getRecommendationImage(rec: Recommendation): string {
    return rec.imagen_principal || 'assets/images/placeholder.jpg';
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get recommendationList(): Recommendation[] {
    return this.isLoggedIn && this.recomendaciones().length > 0
      ? this.recomendaciones()
      : [];
  }

  get nuevaLista(): Product[] {
    return this.recommendationList.length > 0 ? [] : this.productosNuevos();
  }

  private initAnimations(): void {
    gsap
      .timeline()
      .from('.hero-title', { y: 50, opacity: 0, duration: 1, ease: 'power3.out' })
      .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .from('.hero-button', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4');
  }
}
