import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { UsuarioAdminService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-admin-usuario-form',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, CommonModule, ReactiveFormsModule],
  templateUrl: './admin-user-form.component.html',
  styleUrl: './admin-user-form.component.css',
})
export class AdminUserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usuarioService = inject(UsuarioAdminService);
  private toastService = inject(ToastService);

  usuarioId = signal<string | null>(null);
  isEditMode = computed(() => this.usuarioId() !== null);
  isLoading = signal(false);
  isSubmitting = signal(false);

  form: FormGroup;
  showPassword = signal(false);

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre_completo: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      direccion: [''],
      cedula_ruc: ['', [Validators.pattern(/^[0-9]{10,13}$/)]],
      ciudad: ['', Validators.required],
      rol: ['cliente', Validators.required],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.usuarioId.set(id);

      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.loadUsuario(id);
    }
  }

  loadUsuario(id: string): void {
    this.isLoading.set(true);

    this.usuarioService.getUsuarioDetail(id).subscribe({
      next: (usuario) => {
        this.form.patchValue({
          email: usuario.email,
          nombre_completo: usuario.nombre_completo || '',
          telefono: usuario.telefono || '',
          direccion: usuario.direccion || '',
          cedula_ruc: usuario.cedula_ruc || '',
          rol: usuario.rol,
        });

        this.form.get('email')?.disable();

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando usuario:', error);
        this.toastService.error('No se pudo cargar el usuario');
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditMode()) {
      this.updateUsuario();
    } else {
      this.createUsuario();
    }
  }

  createUsuario(): void {
    const formValue = this.form.getRawValue();

    this.usuarioService.createUsuario(formValue).subscribe({
      next: (usuario) => {
        this.toastService.success('Usuario creado correctamente');

        setTimeout(() => {
          this.router.navigate(['/admin/usuarios', usuario.id]);
        }, 1500);
      },
      error: (error) => {
        console.error('Error creando usuario:', error);
        this.toastService.error(error.error?.detail || 'No se pudo crear el usuario');
        this.isSubmitting.set(false);
      },
    });
  }

  updateUsuario(): void {
    const id = this.usuarioId();
    if (!id) return;

    const formValue = this.form.value;

    if (!formValue.password) {
      delete formValue.password;
    }

    this.usuarioService.updateUsuario(id, formValue).subscribe({
      next: (usuario) => {
        this.toastService.success('Usuario actualizado correctamente');

        setTimeout(() => {
          this.router.navigate(['/admin/usuarios', usuario.id]);
        }, 1500);
      },
      error: (error) => {
        console.error('Error actualizando usuario:', error);
        this.toastService.error(error.error?.detail || 'No se pudo actualizar el usuario');
        this.isSubmitting.set(false);
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  goBack(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  getTitle(): string {
    return this.isEditMode() ? 'Editar Usuario' : 'Crear Usuario';
  }

  getSubmitLabel(): string {
    if (this.isSubmitting()) {
      return this.isEditMode() ? 'Actualizando' : 'Creando';
    }
    return this.isEditMode() ? 'Actualizar Usuario' : 'Crear Usuario';
  }
}
