import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { IonBackButton, IonButtons, IonButton, IonContent, IonHeader, IonInput, IonTitle, IonToolbar, IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-verify-2fa',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonBackButton, IonInput, IonSpinner, FormsModule],
  templateUrl: './verify-2fa.component.html',
})
export class Verify2faComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  code = signal('');
  isVerifying = signal(false);

  async verificar(): Promise<void> {
    if (this.code().length !== 6) {
      this.toast.error('Ingresa 6 dígitos');
      return;
    }
    this.isVerifying.set(true);
    const tempToken = history.state?.tempToken || localStorage.getItem('temp_2fa_token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${tempToken}` });
    this.http.post(`${environment.apiUrl}/api/auth/2fa/verify-login`, { code: this.code() }, { headers }).subscribe({
      next: (res: any) => {
        this.isVerifying.set(false);
        if (res.access_token) {
          this.authService.setSession(res);
          localStorage.removeItem('temp_2fa_token');
          this.toast.success('2FA verificado');
          if (res.user?.rol === 'administrador') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/catalogo']);
          }
        }
      },
      error: (err: any) => {
        this.isVerifying.set(false);
        this.toast.error(err.error?.detail || 'Código inválido');
      },
    });
  }
}
