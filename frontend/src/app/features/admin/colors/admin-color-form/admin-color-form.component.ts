import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ColorService } from '../../../../core/services/color.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Color } from '@app/shared/models/color';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';


function hexColorValidator(control: any) {
  const value = control.value;
  if (!value) return null;

  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexPattern.test(value) ? null : { invalidHex: true };
}

@Component({
  selector: 'app-admin-color-form',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, CommonModule, ReactiveFormsModule],
  templateUrl: './admin-color-form.component.html',
  styleUrl: './admin-color-form.component.css',
})
export class AdminColorFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private colorService = inject(ColorService);
  private toastService = inject(ToastService);

  form: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSubmitting = signal(false);
  colorId = signal<string | null>(null);


  suggestedColors = [
    { nombre: 'Rojo', hex: '#FF0000' },
    { nombre: 'Azul', hex: '#0000FF' },
    { nombre: 'Verde', hex: '#00FF00' },
    { nombre: 'Amarillo', hex: '#FFFF00' },
    { nombre: 'Negro', hex: '#000000' },
    { nombre: 'Blanco', hex: '#FFFFFF' },
    { nombre: 'Rosa', hex: '#FFC0CB' },
    { nombre: 'Morado', hex: '#800080' },
    { nombre: 'Naranja', hex: '#FFA500' },
    { nombre: 'Gris', hex: '#808080' },
    { nombre: 'Beige', hex: '#F5F5DC' },
    { nombre: 'Marrón', hex: '#8B4513' },
  ];

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      codigo_hexadecimal: ['#000000', [Validators.required, hexColorValidator]],
      activo: [true],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.colorId.set(id);
      this.isEditMode.set(true);
      this.loadColor(id);
    }
  }

  loadColor(id: string): void {
    this.isLoading.set(true);

    this.colorService.getColorById(id).subscribe({
      next: (color) => {
        this.form.patchValue({
          nombre: color.nombre,
          codigo_hexadecimal: color.codigo_hexadecimal || '#000000',
          activo: color.activo,
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando color:', error);
        this.toastService.error('No se pudo cargar el color');
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  onColorPickerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.patchValue({ codigo_hexadecimal: input.value });
  }

  onHexInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.trim();

    // Agregar # si falta
    if (value && !value.startsWith('#')) {
      value = '#' + value;
    }

    this.form.patchValue({ codigo_hexadecimal: value });
  }

  selectSuggestedColor(hex: string, nombre: string): void {
    this.form.patchValue({
      codigo_hexadecimal: hex,
      nombre: this.form.get('nombre')?.value || nombre,
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditMode()) {
      this.updateColor();
    } else {
      this.createColor();
    }
  }

  createColor(): void {
    this.colorService.createColor(this.form.value).subscribe({
      next: () => {
        this.toastService.success('Color creado exitosamente');

        setTimeout(() => {
          this.router.navigate(['/admin/colores']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error creando color:', error);
        this.toastService.error(error.error?.detail || 'No se pudo crear el color');
        this.isSubmitting.set(false);
      },
    });
  }

  updateColor(): void {
    const id = this.colorId();
    if (!id) return;

    this.colorService.updateColor(id, this.form.value).subscribe({
      next: () => {
        this.toastService.success('Color actualizado exitosamente');

        setTimeout(() => {
          this.router.navigate(['/admin/colores']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error actualizando color:', error);
        this.toastService.error(error.error?.detail || 'No se pudo actualizar el color');
        this.isSubmitting.set(false);
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  cancelar(): void {
    this.router.navigate(['/admin/colores']);
  }
}
