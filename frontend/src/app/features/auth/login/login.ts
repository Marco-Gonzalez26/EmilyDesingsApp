import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner, IonRouterLink, IonRouterLinkWithHref, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private api: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = this.loginForm.value;

    this.api.post<any>('/api/auth/login', credentials).subscribe({
      next: (response: any) => {
        if (response.requires2FA) {
          localStorage.setItem('temp_2fa_token', response.tempToken);
          localStorage.setItem('access_token', response.tempToken);
          this.isLoading = false;
          this.router.navigate(['/verificar-2fa'], { state: { tempToken: response.tempToken } });
          return;
        }
        if (response.requiresSetup2FA) {
          localStorage.setItem('temp_2fa_token', response.tempToken);
          localStorage.setItem('access_token', response.tempToken);
          // guarda user dummy si viene
          if (response.user) localStorage.setItem('current_user', JSON.stringify(response.user));
          this.isLoading = false;
          this.router.navigate(['/admin/configuracion']);
          return;
        }
        if (response.access_token) {
          this.authService.setSession(response as any);
        }
        this.isLoading = false;
        if (response.user?.rol === 'administrador') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/catalogo']);
        }
      },
      error: (error) => {
        console.error('Error en el login:', error);
        this.isLoading = false;
        if (error.status === 401) this.errorMessage = 'Email o contraseña incorrectos';
        else if (error.status === 403) this.errorMessage = 'Tu cuenta está inactiva. Contacta al administrador.';
        else if (error.status === 428) this.errorMessage = 'Admin requiere 2FA, activa en Admin Configuración';
        else this.errorMessage = 'Error al iniciar sesión. Intenta nuevamente.';
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get emailInvalid(): boolean {
    return !!(this.email?.invalid && this.email?.touched);
  }

  get passwordInvalid(): boolean {
    return !!(this.password?.invalid && this.password?.touched);
  }
}