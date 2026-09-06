import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { LoginRequest, RegisterRequest, AuthResponse, TokenData } from '../../shared/models/auth';
import { User } from '../../shared/models/user';

/**
 * Servicio de autenticación
 * Maneja login, registro, logout y estado del usuario
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Señales para estado reactivo (Angular 21+)
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'current_user';

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {
    // Cargar usuario desde localStorage al iniciar
    this.loadUserFromStorage();
  }

  /**
   * Login de usuario
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap((response) => {
        this.handleAuthSuccess(response);
      }),
    );
  }

  /**
   * Registro de nuevo usuario
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/api/auth/register', data).pipe(
      tap((response) => {
        this.handleAuthSuccess(response);
      }),
    );
  }

  /**
   * Logout - cerrar sesión
   */
  logout(): void {
    // Limpiar localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    // Limpiar estado
    this.currentUser.set(null);
    this.isAuthenticated.set(false);

    // Redirigir al login
    this.router.navigate(['/']);
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Verificar si el token ha expirado
    const tokenData = this.decodeToken(token);
    if (!tokenData) {
      return false;
    }

    const now = Date.now() / 1000;
    if (tokenData.exp < now) {
      // Token expirado
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Verificar si el usuario es administrador
   */
  isAdmin(): boolean {
    const user = this.currentUser();
    if (user?.rol === 'administrador') {
      return true;
    }

    const token = this.getToken();
    if (!token) {
      return false;
    }

    const tokenData = this.decodeToken(token);
    return tokenData?.rol === 'administrador';
  }

  /**
   * Obtener información del usuario actual
   */
  getCurrentUser(): Observable<User> {
    return this.apiService.get<User>('/api/auth/me').pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.saveUserToStorage(user);
      }),
    );
  }

  setSession(response: AuthResponse): void {
    this.handleAuthSuccess(response);
  }

  /**
   * Manejar respuesta exitosa de autenticación
   */
  private handleAuthSuccess(response: AuthResponse): void {
    // Guardar token
    localStorage.setItem(this.TOKEN_KEY, response.access_token);

    // Guardar usuario
    this.saveUserToStorage(response.user);

    // Actualizar estado
    this.currentUser.set(response.user);
    this.isAuthenticated.set(true);
  }

  /**
   * Guardar usuario en localStorage
   */
  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Cargar usuario desde localStorage
   */
  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson && this.isLoggedIn()) {
      try {
        const user = JSON.parse(userJson) as User;
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        this.logout();
      }
    }
  }

  /**
   * Decodificar token JWT
   */
  private decodeToken(token: string): TokenData | null {
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const decoded = atob(padded);
      return JSON.parse(decoded) as TokenData;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  }
  changePassword(data: {
    email: string;
    password_actual: string;
    password_nueva: string;
    password_confirmacion: string;
  }): Observable<any> {
    return this.apiService.post('/api/auth/reestablecer-contraseña', data);
  }
}
