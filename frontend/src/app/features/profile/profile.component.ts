import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProfileService } from '@app/core/services/user_profile.service';
import { AuthService } from '@core/services/auth.service';
import { User } from '@shared/models/user';
import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';
import { ModalController } from '@ionic/angular/standalone';
import { TwofaSetupComponent } from '../../shared/components/twofa-setup/twofa-setup.component';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonRange,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonSpinner,
  IonTitle,
  IonToolbar,
  IonBackButton,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonInput,
    IonModal,
    IonRange,
    IonSpinner,
    IonRouterLink,
    IonBackButton,
    IonRouterLinkWithHref,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  user = signal<User | null>(null);
  statistics = signal<any>(null);
  isLoading = signal(true);
  isEditMode = signal(false);
  isChangingPassword = signal(false);
  isSubmitting = signal(false);

  // Preferencias
  estilos = signal<{ id: string; nombre: string }[]>([]);
  preferencias = signal<{
    estilos_preferidos: string[];
    rango_precio_min?: number;
    rango_precio_max?: number;
  } | null>(null);
  seleccionadosPrefs = signal<Set<string>>(new Set());
  precioMinPref = signal(0);
  precioMaxPref = signal(500);
  isSavingPrefs = signal(false);
  isEditPrefs = signal(false);

  // 2FA
  totpEnabled = signal<boolean | null>(null);
  private modalCtrl = inject(ModalController);

  profileForm: FormGroup;
  passwordForm: FormGroup;

  showPasswordActual = signal(false);
  showPasswordNueva = signal(false);
  showPasswordConfirmacion = signal(false);

  userInitials = computed(() => {
    const user = this.user();
    if (!user?.nombre_completo) return 'U';
    const names = user.nombre_completo.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  });

  private api = inject(ApiService);

  constructor() {
    this.profileForm = this.fb.group({
      nombre_completo: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      direccion: [''],
      cedula_ruc: ['', [Validators.pattern(/^[0-9]{10,13}$/)]],
    });

    this.passwordForm = this.fb.group(
      {
        password_actual: ['', Validators.required],
        password_nueva: ['', [Validators.required, Validators.minLength(6)]],
        password_confirmacion: ['', Validators.required],
      },
      {
        validators: this.passwordsMatchValidator,
      },
    );
  }

  passwordsMatchValidator(group: FormGroup) {
    const nueva = group.get('password_nueva')?.value;
    const confirmacion = group.get('password_confirmacion')?.value;
    return nueva === confirmacion ? null : { passwordsMismatch: true };
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadStatistics();
    this.cargarEstilos();
    this.cargarPreferencias();
    this.cargarEstado2fa();
  }

  cargarEstado2fa(): void {
    this.api.get<{ totp_enabled: boolean }>('/api/auth/2fa/status').subscribe({
      next: (res: any) => this.totpEnabled.set(!!res.totp_enabled),
      error: () => this.totpEnabled.set(false),
    });
  }

  async abrirTwofa(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: TwofaSetupComponent,
      breakpoints: [0, 0.95],
      initialBreakpoint: 0.95,
      handle: true,
      backdropDismiss: true,
    });
    await modal.present();
    await modal.onWillDismiss();
    this.cargarEstado2fa();
  }

  cargarEstilos(): void {
    this.api
      .get<{
        estilos: { id: string; nombre: string }[];
        total: number;
      }>('/api/preferencias/estilos-disponibles')
      .subscribe({
        next: (res: any) => {
          const data = res as
            | { estilos?: { id: string; nombre: string }[] }
            | { id: string; nombre: string }[];
          const estilos = Array.isArray(data)
            ? data
            : ((data as { estilos?: { id: string; nombre: string }[] })
                .estilos ?? []);
          this.estilos.set(estilos);
        },
        error: () => this.estilos.set([]),
      });
  }

  cargarPreferencias(): void {
    this.api.get('/api/preferencias/mis-preferencias').subscribe({
      next: (pref: any) => {
        const p = pref as {
          estilos_preferidos?: string[];
          rango_precio_min?: number;
          rango_precio_max?: number;
        } | null;
        if (p) {
          this.preferencias.set(
            p as {
              estilos_preferidos: string[];
              rango_precio_min?: number;
              rango_precio_max?: number;
            },
          );
          this.seleccionadosPrefs.set(new Set(p.estilos_preferidos ?? []));
          if (p.rango_precio_min !== undefined)
            this.precioMinPref.set(p.rango_precio_min);
          if (p.rango_precio_max !== undefined)
            this.precioMaxPref.set(p.rango_precio_max);
        }
      },
      error: () => {},
    });
  }

  toggleEstiloPref(id: string): void {
    if (!this.isEditPrefs()) return;
    const next = new Set(this.seleccionadosPrefs());
    if (next.has(id)) next.delete(id);
    else {
      if (next.size >= 5) return;
      next.add(id);
    }
    this.seleccionadosPrefs.set(next);
  }

  isSelectedPref(id: string): boolean {
    return this.seleccionadosPrefs().has(id);
  }

  onPrecioPrefChange(event: CustomEvent): void {
    const val = event.detail.value as { lower: number; upper: number } | number;
    if (typeof val === 'object' && 'lower' in val) {
      this.precioMinPref.set(val.lower);
      this.precioMaxPref.set(val.upper);
    }
  }

  guardarPreferencias(): void {
    if (this.seleccionadosPrefs().size < 1) {
      this.toastService.error('Elige al menos 1 estilo');
      return;
    }
    this.isSavingPrefs.set(true);
    const payload = {
      estilos_preferidos: Array.from(this.seleccionadosPrefs()),
      rango_precio_min: this.precioMinPref(),
      rango_precio_max: this.precioMaxPref(),
    };
    this.api.post('/api/preferencias/guardar', payload).subscribe({
      next: () => {
        this.isSavingPrefs.set(false);
        this.isEditPrefs.set(false);
        this.toastService.success(
          'Preferencias actualizadas — tu Para Ti mejorará',
        );
      },
      error: (err: any) => {
        this.isSavingPrefs.set(false);
        this.toastService.error(err.error?.detail || 'No se pudo guardar');
      },
    });
  }

  loadProfile(): void {
    this.isLoading.set(true);

    this.profileService.getProfile().subscribe({
      next: (user) => {
        this.user.set(user);
        this.profileForm.patchValue({
          nombre_completo: user.nombre_completo || '',
          telefono: user.telefono || '',
          direccion: user.direccion || '',
          cedula_ruc: user.cedula_ruc || '',
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando perfil:', error);
        this.toastService.error('No se pudo cargar el perfil');
        this.isLoading.set(false);
      },
    });
  }

  loadStatistics(): void {
    this.profileService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics.set(stats);
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      },
    });
  }

  enableEditMode(): void {
    this.isEditMode.set(true);
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    const user = this.user();
    if (user) {
      this.profileForm.patchValue({
        nombre_completo: user.nombre_completo || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        cedula_ruc: user.cedula_ruc || '',
      });
    }
  }

  onSubmitProfile(): void {
    if (this.profileForm.invalid || this.isSubmitting()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.profileService.updateProfile(this.profileForm.value).subscribe({
      next: (user) => {
        this.user.set(user);
        this.toastService.success('Perfil actualizado correctamente');
        this.isEditMode.set(false);
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Error:', error);
        this.toastService.error(
          error.error?.detail || 'No se pudo actualizar el perfil',
        );
        this.isSubmitting.set(false);
      },
    });
  }

  togglePasswordChange(): void {
    this.isChangingPassword.update((v) => !v);
    if (!this.isChangingPassword()) {
      this.passwordForm.reset();
    }
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid || this.isSubmitting()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.profileService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.toastService.success('Contraseña actualizada correctamente');
        this.passwordForm.reset();
        this.isChangingPassword.set(false);
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Error:', error);
        this.toastService.error(
          error.error?.detail || 'No se pudo cambiar la contraseña',
        );
        this.isSubmitting.set(false);
      },
    });
  }

  togglePasswordVisibility(field: 'actual' | 'nueva' | 'confirmacion'): void {
    if (field === 'actual') {
      this.showPasswordActual.update((v) => !v);
    } else if (field === 'nueva') {
      this.showPasswordNueva.update((v) => !v);
    } else {
      this.showPasswordConfirmacion.update((v) => !v);
    }
  }

  formatDate(date: string): string {
    if (!date) return 'No especificado';
    return new Date(date).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  getRolBadge(rol: string): string {
    return rol === 'administrador'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  }

  getRolLabel(rol: string): string {
    return rol === 'administrador' ? 'Administrador' : 'Cliente';
  }
}
