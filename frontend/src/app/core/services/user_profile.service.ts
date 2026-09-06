import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { User, UpdateProfileData, ChangePasswordData, UserStatistics } from '@shared/models/user';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private api = inject(ApiService);

  getProfile(): Observable<User> {
    return this.api.get<User>('/api/usuarios/me');
  }

  updateProfile(data: UpdateProfileData): Observable<User> {
    return this.api.put<User>('/api/usuarios/me', data);
  }

  changePassword(data: ChangePasswordData): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/api/auth/reestablecer-contraseña', data);
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/api/usuarios/me');
  }

  getStatistics(): Observable<UserStatistics> {
    return this.api.get<UserStatistics>('/api/usuarios/me/estadisticas');
  }
}
