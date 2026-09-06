import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductFilters,
  ProductListResponse,
  ProductImage,
} from '@app/shared/models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  constructor(private api: ApiService) {}

  getProducts(filters?: ProductFilters): Observable<ProductListResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.api.get<ProductListResponse>('/api/productos/', { params });
  }

  getProductById(id: string): Observable<Product> {
    return this.api.get<Product>(`/api/productos/${id}`);
  }

  getFeatured(limit: number = 10): Observable<Product[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.api.get<Product[]>('/api/productos/destacados', { params });
  }

  getNew(limit: number = 10): Observable<Product[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.api.get<Product[]>('/api/productos/nuevos', { params });
  }

  getOffers(limit: number = 10): Observable<Product[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.api.get<Product[]>('/api/productos/ofertas', { params });
  }

  createProduct(data: ProductCreate): Observable<Product> {
    return this.api.post<Product>('/api/productos/', data);
  }

  updateProduct(id: string, data: ProductUpdate): Observable<Product> {
    return this.api.patch<Product>(`/api/productos/${id}`, data);
  }

  deleteProduct(id: string, permanente: boolean = false): Observable<void> {
    const params = new HttpParams().set('permanente', permanente.toString());
    return this.api.delete<void>(`/api/productos/${id}`);
  }

  getProductImage(id: string): Observable<ProductImage> {
    return this.api.get<ProductImage>(`/api/productos/${id}/imagenes`);
  }

  // Imagenes de los productos
  addImage(
    productoId: string,
    imageData: { url_imagen: string; es_principal?: boolean; orden?: number },
  ): Observable<any> {
    return this.api.post(`/api/productos/${productoId}/imagenes`, imageData);
  }

  deleteImage(productoId: string, imageId: string): Observable<any> {
    return this.api.delete(`/api/productos/${productoId}/imagenes/${imageId}`);
  }

  updateImageOrder(productoId: string, imageId: string, orden: number): Observable<any> {
    return this.api.put(`/api/productos/${productoId}/imagenes/${imageId}`, { orden });
  }

  setMainImage(productoId: string, imageId: string): Observable<any> {
    return this.api.put(`/api/productos/${productoId}/imagenes/${imageId}`, { es_principal: true });
  }
}
