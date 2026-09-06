import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BrandService } from '../../../../core/services/brand.service';
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
  selector: 'app-admin-brand-form',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, CommonModule, ReactiveFormsModule],
  templateUrl: './admin-brand-form.component.html',
  styleUrl: './admin-brand-form.component.css',
})
export class AdminBrandFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private brandService = inject(BrandService);
  private toastService = inject(ToastService);

  form: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSubmitting = signal(false);
  brandId = signal<string | null>(null);

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      activo: [true],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.brandId.set(id);
      this.isEditMode.set(true);
      this.loadBrand(id);
    }
  }

  loadBrand(id: string): void {
    this.isLoading.set(true);

    this.brandService.getMarcaById(id).subscribe({
      next: (brand) => {
        this.form.patchValue({
          nombre: brand.nombre,
          descripcion: brand.descripcion || '',
          activo: brand.activo,
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando marca:', error);
        this.toastService.error('No se pudo cargar la marca');
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
      this.updateBrand();
    } else {
      this.createBrand();
    }
  }

  createBrand(): void {
    this.brandService.createMarca(this.form.value).subscribe({
      next: () => {
        this.toastService.success('Marca creada exitosamente');

        setTimeout(() => {
          this.router.navigate(['/admin/marcas']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error creando marca:', error);
        this.toastService.error(error.error?.detail || 'No se pudo crear la marca');
        this.isSubmitting.set(false);
      },
    });
  }

  updateBrand(): void {
    const id = this.brandId();
    if (!id) return;

    this.brandService.updateMarca(id, this.form.value).subscribe({
      next: () => {
        this.toastService.success('Marca actualizada exitosamente');

        setTimeout(() => {
          this.router.navigate(['/admin/marcas']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error actualizando marca:', error);
        this.toastService.error(error.error?.detail || 'No se pudo actualizar la marca');
        this.isSubmitting.set(false);
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  cancelar(): void {
    this.router.navigate(['/admin/marcas']);
  }
}
