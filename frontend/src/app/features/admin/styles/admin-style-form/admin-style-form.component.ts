import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { StyleService } from '../../../../core/services/style.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Estilo } from '@app/shared/models/style';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-admin-style-form',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon, CommonModule, FormsModule],
  templateUrl: './admin-style-form.component.html',
  styleUrl: './admin-style-form.component.css',
})
export class AdminStyleFormComponent implements OnInit {
  private styleService = inject(StyleService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  estiloId = signal<string | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);

  nombre = signal('');
  descripcion = signal('');
  activo = signal(true);
  orden = signal(0);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.estiloId.set(id);
      this.loadEstilo(id);
    }
  }

  loadEstilo(id: string): void {
    this.isLoading.set(true);
    this.styleService.getEstilo(id).subscribe({
      next: (estilo) => {
        this.nombre.set(estilo.nombre);
        this.descripcion.set(estilo.descripcion || '');
        this.activo.set(estilo.activo);
        this.orden.set(estilo.orden);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('No se pudo cargar el estilo');
        this.router.navigate(['/admin/estilos']);
      },
    });
  }

  save(): void {
    if (!this.nombre().trim()) {
      this.toastService.error('El nombre es obligatorio');
      return;
    }
    this.isSaving.set(true);
    const data: Partial<Estilo> = {
      nombre: this.nombre().trim(),
      descripcion: this.descripcion().trim() || null,
      activo: this.activo(),
      orden: this.orden(),
    };

    const obs = this.isEdit()
      ? this.styleService.updateEstilo(this.estiloId()!, data)
      : this.styleService.createEstilo(data);

    obs.subscribe({
      next: () => {
        this.toastService.success(this.isEdit() ? 'Estilo actualizado' : 'Estilo creado');
        this.router.navigate(['/admin/estilos']);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toastService.error(err?.error?.detail || 'No se pudo guardar');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/estilos']);
  }
}
