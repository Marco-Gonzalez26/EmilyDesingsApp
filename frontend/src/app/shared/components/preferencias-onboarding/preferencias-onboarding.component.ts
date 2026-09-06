import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
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

  private readonly FALLBACK_ESTILOS: Estilo[] = [
    { id: '6dfb6d7f-15ba-4927-9f87-02d1a8ee9fd2', nombre: 'Casual' },
    { id: '78ae6dd9-fc9a-462b-8867-b93e0c39550a', nombre: 'Formal' },
    { id: '029226e4-d83f-45bc-b219-7c7f92480fd9', nombre: 'Deportivo' },
    { id: '3d1bea2f-1cc9-4370-9ae4-94125be37871', nombre: 'Elegante' },
    { id: '7743a700-5925-4d1d-99bc-bbfd9339c3a7', nombre: 'Boho' },
    { id: 'f4f4052e-0f63-4ce5-a4d7-1a4ab53fccd1', nombre: 'Minimalista' },
    { id: '1d48e279-f399-40fb-a97e-720105a6f64f', nombre: 'Rockero' },
    { id: '7acd8710-c3a8-4a98-a303-d5431ee0a685', nombre: 'Vintage' },
    { id: '75571356-5375-4ca0-8f44-63598f5177fc', nombre: 'Urbano' },
    { id: '7b4175be-f99d-4189-8766-899ade5f30b8', nombre: 'Clasico' },
    { id: 'a04932d7-1f26-476b-98c4-8117144f243f', nombre: 'Romantico' },
    { id: '606b457b-39f4-4e92-aa6b-90d9066b7850', nombre: 'Moderno' },
  ];

  estilos = signal<Estilo[]>([...this.FALLBACK_ESTILOS]);
  isLoadingEstilos = signal(false);
  estilosError = signal(false);

  seleccionados = signal<Set<string>>(new Set());
  precioMin = signal(0);
  precioMax = signal(200);
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  puedeContinuar = computed(() => this.seleccionados().size >= 1 && !this.isSaving());

  ngOnInit(): void {
    this.cargarEstilos();
  }

  cargarEstilos(): void {
    // ya hay fallback, no mostramos spinner; solo intentamos refrescar desde API
    this.api.get<{ estilos: Estilo[]; total: number }>('/api/preferencias/estilos-disponibles').subscribe({
      next: (res: unknown) => {
        const data = res as { estilos?: Estilo[]; total?: number } | Estilo[];
        const estilos = Array.isArray(data) ? data : (data as { estilos?: Estilo[] }).estilos ?? [];
        if (estilos.length > 0) {
          this.estilos.set(estilos);
        }
        this.isLoadingEstilos.set(false);
        this.estilosError.set(false);
      },
      error: () => {
        // mantenemos fallback silencioso, no mostramos error bloqueante
        this.isLoadingEstilos.set(false);
        this.estilosError.set(false);
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
