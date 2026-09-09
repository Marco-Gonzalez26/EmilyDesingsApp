import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { TallaService } from '../../../core/services/size.service';
import { ColorService } from '../../../core/services/color.service';
import { Talla } from '../../../shared/models/size';
import { Color } from '../../../shared/models/color';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonRange,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';

interface Estilo {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

@Component({
  selector: 'app-preferencias-onboarding-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonRange, IonSpinner],
  templateUrl: './preferencias-onboarding.component.html',
  styleUrl: './preferencias-onboarding.component.css',
})
export class PreferenciasOnboardingModalComponent implements OnInit {
  private api = inject(ApiService);
  private modalCtrl = inject(ModalController);
  private tallaService = inject(TallaService);
  private colorService = inject(ColorService);

  estilos = signal<Estilo[]>([]);
  isLoadingEstilos = signal(true);
  estilosError = signal(false);

  seleccionados = signal<Set<string>>(new Set());
  tallas = signal<Talla[]>([]);
  colores = signal<Color[]>([]);
  tallasSel = signal<Set<string>>(new Set());
  coloresSel = signal<Set<string>>(new Set());
  showTallas = signal(false);
  showColores = signal(false);
  precioMin = signal(0);
  precioMax = signal(200);
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  puedeContinuar = computed(() => this.seleccionados().size >= 1 && !this.isSaving());

  ngOnInit(): void {
    this.cargarEstilos();
    this.tallaService.getTallas(true).subscribe({
      next: (t) => this.tallas.set(t.filter((x) => x.activo !== false)),
      error: () => {},
    });
    this.colorService.getColores(true).subscribe({
      next: (c) => this.colores.set(c.filter((x) => x.activo !== false)),
      error: () => {},
    });
  }

  cargarEstilos(): void {
    this.isLoadingEstilos.set(true);
    this.estilosError.set(false);
    this.api.get<{ estilos: Estilo[]; total: number }>('/api/preferencias/estilos-disponibles').subscribe({
      next: (res: unknown) => {
        const data = res as { estilos?: Estilo[]; total?: number } | Estilo[];
        const estilos = Array.isArray(data) ? data : (data as { estilos?: Estilo[] }).estilos ?? [];
        this.estilos.set(estilos);
        this.isLoadingEstilos.set(false);
        this.estilosError.set(estilos.length === 0);
      },
      error: () => {
        this.isLoadingEstilos.set(false);
        this.estilosError.set(true);
      },
    });
  }

  toggleEstilo(id: string): void {
    const next = new Set(this.seleccionados());
    if (next.has(id)) next.delete(id);
    else {
      if (next.size >= 5) return;
      next.add(id);
    }
    this.seleccionados.set(next);
  }

  isSelected(id: string): boolean {
    return this.seleccionados().has(id);
  }

  toggleTalla(id: string): void {
    const next = new Set(this.tallasSel());
    if (next.has(id)) next.delete(id);
    else {
      if (next.size >= 10) return;
      next.add(id);
    }
    this.tallasSel.set(next);
  }

  toggleColor(id: string): void {
    const next = new Set(this.coloresSel());
    if (next.has(id)) next.delete(id);
    else {
      if (next.size >= 10) return;
      next.add(id);
    }
    this.coloresSel.set(next);
  }

  onPrecioChange(event: CustomEvent): void {
    const val = event.detail.value as { lower: number; upper: number } | number;
    if (typeof val === 'object' && 'lower' in val) {
      this.precioMin.set(val.lower);
      this.precioMax.set(val.upper);
    }
  }

  guardar(): void {
    if (!this.puedeContinuar()) return;
    this.isSaving.set(true);
    this.saveError.set(null);

    const payload = {
      estilos_preferidos: Array.from(this.seleccionados()),
      tallas_preferidas: Array.from(this.tallasSel()),
      colores_preferidos: Array.from(this.coloresSel()),
      rango_precio_min: this.precioMin(),
      rango_precio_max: this.precioMax(),
    };

    this.api.post('/api/preferencias/guardar', payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.modalCtrl.dismiss(null, 'confirm');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(err.error?.detail || 'No se pudo guardar. Intenta nuevamente.');
      },
    });
  }
}
