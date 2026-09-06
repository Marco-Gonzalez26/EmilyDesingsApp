import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { TallaService } from './../../../../core/services/size.service';
import { ToastService } from './../../../../core/services/toast.service';

import { Talla } from '@app/shared/models/size';
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
  selector: 'app-admin-size-form',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, CommonModule, ReactiveFormsModule],
  templateUrl: './admin-size-form.component.html',
  styleUrl: './admin-size-form.component.css',
})
export class AdminSizeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private sizeService = inject(TallaService);
  private toastService = inject(ToastService);

  form: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSubmitting = signal(false);
  sizeId = signal<string | null>(null);
  nextOrden = signal(1);

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      orden: [1, [Validators.required, Validators.min(1)]],
      activo: [true],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.sizeId.set(id);
      this.isEditMode.set(true);
      this.loadSize(id);
    } else {
      // Calcular siguiente orden automáticamente
      this.loadNextOrden();
    }
  }

  loadNextOrden(): void {
    this.sizeService.getTallas(false).subscribe({
      next: (sizes) => {
        const maxOrden = sizes.length > 0 ? Math.max(...sizes.map((s) => s.orden)) : 0;
        this.nextOrden.set(maxOrden + 1);
        this.form.patchValue({ orden: maxOrden + 1 });
      },
      error: () => {
        this.nextOrden.set(1);
      },
    });
  }

  loadSize(id: string): void {
    this.isLoading.set(true);

    this.sizeService.getTallaById(id).subscribe({
      next: (size) => {
        this.form.patchValue({
          nombre: size.nombre,
          orden: size.orden,
          activo: size.activo,
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando talla:', error);
        this.toastService.error('No se pudo cargar la talla');
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditMode()) {
      this.updateSize();
    } else {
      this.createSize();
    }
  }

  createSize(): void {
    this.sizeService.createTalla(this.form.value).subscribe({
      next: () => {
        this.toastService.success('Talla creada exitosamente');

        setTimeout(() => {
          this.router.navigate(['/admin/tallas']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error creando talla:', error);
        this.toastService.error(error.error?.detail || 'No se pudo crear la talla');
        this.isSubmitting.set(false);
      },
    });
  }

  updateSize(): void {
    const id = this.sizeId();
    if (!id) return;

    this.sizeService.updateTalla(id, this.form.value).subscribe({
      next: () => {
        this.toastService.success('Talla actualizada exitosamente');

        setTimeout(() => {
          this.router.navigate(['/admin/tallas']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error actualizando talla:', error);
        this.toastService.error(error.error?.detail || 'No se pudo actualizar la talla');
        this.isSubmitting.set(false);
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  cancelar(): void {
    this.router.navigate(['/admin/tallas']);
  }
}
