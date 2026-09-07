import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TerminosModalComponent } from '../../../shared/components/terminos-modal/terminos-modal.component';
import { ModalController } from '@ionic/angular/standalone';
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
  selector: 'app-register',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner, IonRouterLink, IonRouterLinkWithHref, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  private modalCtrl = inject(ModalController);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  async abrirTerminos(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: TerminosModalComponent,
      breakpoints: [0, 0.5, 0.85],
      initialBreakpoint: 0.85,
      handle: true,
      backdropDismiss: true,
    });
    await modal.present();
  }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nombre_completo: ['', [Validators.required]],
      cedula_ruc: ['', [Validators.required, Validators.pattern(/^[0-9]{10,13}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
      direccion: ['', [Validators.required, Validators.minLength(3)]],
      ciudad: ['', [Validators.required, Validators.minLength(2)]],
      acepta_terminos: [false, [Validators.requiredTrue]],
      rol: ['cliente'],
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const v = this.registerForm.value;
    const registerData: import('../../../shared/models/auth').RegisterRequest = {
      nombre_completo: (v.nombre_completo ?? '').trim(),
      cedula_ruc: (v.cedula_ruc ?? '').trim(),
      email: (v.email ?? '').trim().toLowerCase(),
      password: (v.password ?? '').trim(),
      telefono: (v.telefono ?? '').trim(),
      direccion: (v.direccion ?? '').trim(),
      ciudad: (v.ciudad ?? '').trim(),
      acepta_terminos: !!v.acepta_terminos,
      rol: 'cliente',
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        localStorage.setItem('onboardingPendiente', 'true');
        this.router.navigate(['/inicio'], { state: { showOnboarding: true } });
      },
      error: (error) => {
        console.error('Error en registro:', error);
        this.isLoading = false;

        if (error.status === 400) {
          if (error.error.detail === 'El email ya está registrado') {
            this.errorMessage = 'El email ya está registrado';
          } else if (error.error.detail === 'Cédula o RUC inválido') {
            this.errorMessage = 'La cédula o RUC ingresado no es válido';
          } else {
            this.errorMessage = error.error.detail || 'Error al crear la cuenta';
          }
        } else {
          this.errorMessage = 'Error al crear la cuenta. Intenta nuevamente.';
        }
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get nombre_completo() {
    return this.registerForm.get('nombre_completo');
  }

  get cedula_ruc() {
    return this.registerForm.get('cedula_ruc');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get telefono() {
    return this.registerForm.get('telefono');
  }

  get direccion() {
    return this.registerForm.get('direccion');
  }

  get ciudad() {
    return this.registerForm.get('ciudad');
  }

  get acepta_terminos() {
    return this.registerForm.get('acepta_terminos');
  }
}