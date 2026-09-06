import { User } from './user';

/**
 * Request para login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Request para registro
 */
export interface RegisterRequest {
  email: string;
  password: string;
  nombre_completo?: string;
  cedula_ruc: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  acepta_terminos: boolean;
  rol?: 'cliente' | 'administrador';
}

/**
 * Response de login/register (con token)
 */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * Datos decodificados del JWT token
 */
export interface TokenData {
  sub: string; // user_id
  email: string;
  rol: string;
  exp: number; // expiration timestamp
}
