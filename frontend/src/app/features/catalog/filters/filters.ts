import { Component, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';

import { BrandService } from './../../../core/services/brand.service';

import { Brand } from './../../../shared/models/brand';
import { Category } from '@app/shared/models/category';
import { ProductFilters } from '../../../shared/models/product';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [IonIcon, CommonModule, FormsModule],
  templateUrl: './filters.html',
  styleUrl: './filters.css',
})
export class FiltersComponent implements OnInit {
  filtersChanged = output<Partial<ProductFilters>>();
  filtersCleared = output<void>();

  categorias = signal<Category[]>([]);
  marcas = signal<Brand[]>([]);

  sections = signal({
    categoria: true,
    marca: true,
    precio: true,
  });

  selectedCategoria = signal<string | null>(null);
  selectedMarcas = signal<Set<string>>(new Set());
  precioMin = signal<number>(0);
  precioMax = signal<number>(500);
  soloNuevos = signal<boolean>(false);
  soloOfertas = signal<boolean>(false);

  readonly PRECIO_MIN = 0;
  readonly PRECIO_MAX = 500;

  constructor(
    private categoriaService: CategoryService,
    private marcaService: BrandService,
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
    this.loadMarcas();
  }

  loadCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.error('Error cargando categorías:', err),
    });
  }

  loadMarcas(): void {
    this.marcaService.getMarcas().subscribe({
      next: (data) => this.marcas.set(data),
      error: (err) => console.error('Error cargando marcas:', err),
    });
  }

  toggleSection(section: keyof ReturnType<typeof this.sections>): void {
    this.sections.update((s) => ({ ...s, [section]: !s[section] }));
  }

  selectCategoria(id: string): void {
    if (this.selectedCategoria() === id) {
      this.selectedCategoria.set(null);
    } else {
      this.selectedCategoria.set(id);
    }
    this.emitFilters();
  }

  toggleMarca(id: string): void {
    const marcas = new Set(this.selectedMarcas());
    if (marcas.has(id)) {
      marcas.delete(id);
    } else {
      marcas.add(id);
    }
    this.selectedMarcas.set(marcas);
    this.emitFilters();
  }

  onPrecioMaxChange(value: number): void {
    this.precioMax.set(value);
    this.emitFilters();
  }

  onPrecioMinChange(value: number): void {
    this.precioMin.set(value);
    this.emitFilters();
  }

  toggleNuevos(): void {
    this.soloNuevos.update((v) => !v);
    this.emitFilters();
  }

  toggleOfertas(): void {
    this.soloOfertas.update((v) => !v);
    this.emitFilters();
  }

  emitFilters(): void {
    const filters: Partial<ProductFilters> = {};

    if (this.selectedCategoria()) {
      filters['categoria_id'] = this.selectedCategoria()!;
    }

    if (this.selectedMarcas().size > 0) {
      filters['marca_id'] = Array.from(this.selectedMarcas()).join(',');
    }

    if (this.precioMin() > this.PRECIO_MIN) {
      filters['precio_min'] = this.precioMin();
    }

    if (this.precioMax() < this.PRECIO_MAX) {
      filters['precio_max'] = this.precioMax();
    }

    if (this.soloNuevos()) {
      filters['es_nuevo'] = true;
    }

    if (this.soloOfertas()) {
      filters['es_oferta'] = true;
    }

    this.filtersChanged.emit(filters);
  }

  clearFilters(): void {
    this.selectedCategoria.set(null);
    this.selectedMarcas.set(new Set());
    this.precioMin.set(this.PRECIO_MIN);
    this.precioMax.set(this.PRECIO_MAX);
    this.soloNuevos.set(false);
    this.soloOfertas.set(false);
    this.filtersCleared.emit();
  }

  isCategoriaSelected(id: string): boolean {
    return this.selectedCategoria() === id;
  }

  isMarcaSelected(id: string): boolean {
    return this.selectedMarcas().has(id);
  }

  hasActiveFilters(): boolean {
    return (
      !!this.selectedCategoria() ||
      this.selectedMarcas().size > 0 ||
      this.precioMin() > this.PRECIO_MIN ||
      this.precioMax() < this.PRECIO_MAX ||
      this.soloNuevos() ||
      this.soloOfertas()
    );
  }
}
