// src/app/features/admin/categories/admin-category-form/admin-category-form.component.ts

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CategoryService } from '../../../../core/services/category.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Category } from '@app/shared/models/category';
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
  selector: 'app-admin-category-form',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, CommonModule, ReactiveFormsModule],
  templateUrl: './admin-category-form.component.html',
  styleUrl: './admin-category-form.component.css',
})
export class AdminCategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);

  form: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSubmitting = signal(false);
  categoryId = signal<string | null>(null);

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
      this.categoryId.set(id);
      this.isEditMode.set(true);
      this.loadCategory(id);
    }
  }

  loadCategory(id: string): void {
    this.isLoading.set(true);

    this.categoryService.getCategoriaById(id).subscribe({
      next: (category) => {
        this.form.patchValue({
          nombre: category.nombre,
          descripcion: category.descripcion || '',
          activo: category.activo,
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando categoría:', error);
        this.toastService.error('No se pudo cargar la categoría');
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
      this.updateCategory();
    } else {
      this.createCategory();
    }
  }

  createCategory(): void {
    this.categoryService.createCategoria(this.form.value).subscribe({
      next: () => {
        this.toastService.success('Categoría creada exitosamente');

        setTimeout(() => {
          this.router.navigate(['/admin/categorias']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error creando categoría:', error);
        this.toastService.error(error.error?.detail || 'No se pudo crear la categoría');
        this.isSubmitting.set(false);
      },
    });
  }

  updateCategory(): void {
    const id = this.categoryId();
    if (!id) return;

    this.categoryService.updateCategoria(id, this.form.value).subscribe({
      next: () => {
        this.toastService.success('Categoría actualizada exitosamente');

        setTimeout(() => {
          this.router.navigate(['/admin/categorias']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error actualizando categoría:', error);
        this.toastService.error(error.error?.detail || 'No se pudo actualizar la categoría');
        this.isSubmitting.set(false);
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  cancelar(): void {
    this.router.navigate(['/admin/categorias']);
  }
}
