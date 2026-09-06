import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../../environments/environment';

/**
 * Servicio base para peticiones HTTP a la API
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  static readonly API_URL_KEY = 'API_URL';

  constructor(private http: HttpClient) {}

  private isEmulator(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes('sdk_gphone') ||
      ua.includes('emulator') ||
      ua.includes('generic') ||
      ua.includes('google_sdk')
    );
  }

  /**
   * Resuelve la URL base de la API según plataforma:
   * - Override manual (ajustes) tiene prioridad.
   * - En Android emulador usa 10.0.2.2, en dispositivo físico usa la LAN.
   */
  private resolveApiUrl(): string {
    const saved = localStorage.getItem(ApiService.API_URL_KEY);
    if (saved) {
      return saved.replace(/\/+$/, '');
    }
    if (Capacitor.getPlatform() === 'android') {
      return this.isEmulator()
        ? 'http://10.0.2.2:8000'
        : 'http://192.168.100.208:8000';
    }
    return environment.apiUrl.replace(/\/+$/, '');
  }

  getApiUrl(): string {
    return this.resolveApiUrl();
  }

  setApiUrl(url: string): void {
    localStorage.setItem(ApiService.API_URL_KEY, url.replace(/\/+$/, ''));
  }

  /**
   * GET request
   */

  // Sobrecarga para blob
  get(endpoint: string, options: { responseType: 'blob' }): Observable<Blob>;

  // Sobrecarga para JSON
  get<T>(
    endpoint: string,
    options?: {
      params?: HttpParams;
      headers?: HttpHeaders;
    },
  ): Observable<T>;

  get<T>(
    endpoint: string,
    options?: {
      params?: HttpParams;
      headers?: HttpHeaders;
      responseType?: 'json' | 'blob';
    },
  ): Observable<T> | Observable<Blob> {
    return this.http.get(`${this.resolveApiUrl()}${endpoint}`, {
      headers: options?.headers,
      params: options?.params,
      responseType: (options?.responseType as any) || 'json',
    }) as any;
  }
  /**
   * POST request
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.resolveApiUrl()}${endpoint}`, body);
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.resolveApiUrl()}${endpoint}`, body);
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.resolveApiUrl()}${endpoint}`);
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.resolveApiUrl()}${endpoint}`, body);
  }
}
