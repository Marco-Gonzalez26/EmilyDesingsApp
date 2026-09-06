import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ProductoService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { BrandService } from '../../../../core/services/brand.service';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CloudinaryUploadResult } from '@app/shared/models/cloudinary';
import { Product, ProductImage } from '@app/shared/models/product';
import { Category } from '@app/shared/models/category';
import { Brand } from '@app/shared/models/brand';
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
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, CommonModule, ReactiveFormsModule],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.css',
})
export class AdminProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private productService = inject(ProductoService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private cloudinaryService = inject(CloudinaryService);
  private toastService = inject(ToastService);

  form: FormGroup;
  autoGenerateSku = signal(true);
  isEditMode = signal(false);
  isLoading = signal(false);
  isSubmitting = signal(false);
  isUploadingImages = signal(false);
  productId = signal<string | null>(null);

  isDragging = signal<boolean>(false);
  uploadProgress = signal<number>(0);

  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  uploadedImages = signal<ProductImage[]>([]);

  constructor() {
    this.form = this.fb.group({
      sku: [{ value: '', disabled: true }, [Validators.maxLength(100)]],
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      descripcion: [''],
      precio_regular: [0, [Validators.required, Validators.min(0.01)]],
      precio_descuento: [null, Validators.min(0)],
      categoria_id: [null],
      marca_id: [null],
      es_nuevo: [false],
      es_oferta: [false],
      es_destacado: [false],
      activo: [true],
    });

    this.form.get('precio_descuento')?.valueChanges.subscribe((descuento) => {
      const regular = this.form.get('precio_regular')?.value;
      if (descuento && regular && descuento >= regular) {
        this.form.get('precio_descuento')?.setErrors({ invalidDiscount: true });
      }
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadBrands();

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.productId.set(id);
      this.isEditMode.set(true);
      this.loadProduct(id);
    }

    this.form.get('marca_id')?.valueChanges.subscribe((marca) => {
      if (this.autoGenerateSku()) {
        this.updateSkuPreview();
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategorias(false).subscribe({
      next: (data) => this.categories.set(data),
      error: (error) => console.error('Error cargando categorías:', error),
    });
  }

  loadBrands(): void {
    this.brandService.getMarcas(false).subscribe({
      next: (data) => this.brands.set(data),
      error: (error) => console.error('Error cargando marcas:', error),
    });
  }

  loadProduct(id: string): void {
    this.isLoading.set(true);

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        console.log({ product });
        this.form.patchValue({
          sku: product.sku,
          nombre: product.nombre,
          descripcion: product.descripcion || '',
          precio_regular: product.precio_regular,
          precio_descuento: product.precio_descuento,
          categoria_id: product.categoria_id,
          marca_id: product.marca_id,
          es_nuevo: product.es_nuevo,
          es_oferta: product.es_oferta,
          es_destacado: product.es_destacado,
          activo: product.activo,
        });

        if (product.imagenes) {
          this.uploadedImages.set(product.imagenes);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando producto:', error);
        this.toastService.error('No se pudo cargar el producto');
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  toggleAutoSku(): void {
    if(this.isEditMode()) {
      return;
    }

    this.autoGenerateSku.update((v) => !v);

    const skuControl = this.form.get('sku');

    if (this.autoGenerateSku()) {
      skuControl?.disable();
      this.updateSkuPreview();
    } else {
      skuControl?.enable();
      skuControl?.setValue('');
    }
  }

  updateSkuPreview(): void {
    const marcaId = this.form.get('marca_id')?.value;
    const marca = this.brands().find((b) => b.id === marcaId);
    if(this.isEditMode()) {
      return;
    }
    if (marca) {
      const prefijo = marca.nombre.toUpperCase().replace(/\s/g, '').substring(0, 4);
      this.form.get('sku')?.setValue(`${prefijo}-####`);
    } else {
      this.form.get('sku')?.setValue('PROD-####');
    }
  }
  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    await this.uploadFiles(files);

    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;

    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    );

    if (files.length === 0) {
      this.toastService.warn('Solo puedes subir imágenes');
      return;
    }

    await this.uploadFiles(files);
  }

  private async uploadFiles(files: File[]): Promise<void> {
    const currentCount = this.uploadedImages().length;
    const remainingSlots = 5 - currentCount;

    if (files.length > remainingSlots) {
      this.toastService.warn(`Solo puedes subir ${remainingSlots} imagen(es) más`);
      files = files.slice(0, remainingSlots);
    }

    if (files.length === 0) return;

    this.isUploadingImages.set(true);
    this.uploadProgress.set(0);

    try {
      const totalFiles = files.length;
      const results: CloudinaryUploadResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          const result = await this.cloudinaryService.uploadImage(file);
          results.push(result);

          this.uploadProgress.set(Math.round(((i + 1) / totalFiles) * 100));
        } catch (error: any) {
          console.error(`Error subiendo ${file.name}:`, error);
          this.toastService.error(`Error subiendo ${file.name}: ${error.message}`);
        }
      }

      if (results.length === 0) {
        return;
      }

      if (this.isEditMode()) {
        const productId = this.productId();
        if (!productId) return;

        const imageRequests = results.map((result, index) => {
          return this.productService.addImage(productId, {
            url_imagen: result.secure_url,
            es_principal: this.uploadedImages().length === 0 && index === 0,
            orden: this.uploadedImages().length + index + 1,
          });
        });

        forkJoin(imageRequests).subscribe({
          next: () => {
            this.toastService.success(`${results.length} imagen(es) subida(s) exitosamente`);
            this.loadProduct(productId);
          },
          error: (error) => {
            console.error('Error guardando imágenes:', error);
            this.toastService.error('No se pudieron guardar las imágenes');
          },
        });
      } else {
        // Modo creación: solo almacenar temporalmente
        const newImages: ProductImage[] = results.map((result, index) => ({
          id: `temp-${Date.now()}-${index}`,
          producto_id: '',
          url_imagen: result.secure_url,
          es_principal: this.uploadedImages().length === 0 && index === 0,
          orden: this.uploadedImages().length + index + 1,
          created_at: new Date().toISOString(),
        }));

        this.uploadedImages.update((imgs) => [...imgs, ...newImages]);

        this.toastService.success(
          `${results.length} imagen(es) agregada(s). Recuerda guardar el producto.`,
        );
      }
    } catch (error: any) {
      console.error('Error al subir imágenes:', error);
      this.toastService.error(error.message || 'No se pudieron subir las imágenes');
    } finally {
      this.isUploadingImages.set(false);
      this.uploadProgress.set(0);
    }
  }

  removeImage(image: ProductImage, index: number): void {
    if (this.isEditMode()) {
      const productId = this.productId();
      if (!productId) return;

      this.productService.deleteImage(productId, image.id).subscribe({
        next: () => {
          this.uploadedImages.update((imgs) => imgs.filter((_, i) => i !== index));
          this.toastService.success('Imagen eliminada');
        },
        error: (error) => {
          console.error('Error eliminando imagen:', error);
          this.toastService.error('No se pudo eliminar la imagen');
        },
      });
    } else {
      this.uploadedImages.update((imgs) => imgs.filter((_, i) => i !== index));
    }
  }

  setMainImage(image: ProductImage, index: number): void {
    if (this.isEditMode()) {
      const productId = this.productId();
      if (!productId) return;

      this.productService.setMainImage(productId, image.id).subscribe({
        next: () => {
          this.uploadedImages.update((imgs) =>
            imgs.map((img, i) => ({
              ...img,
              es_principal: i === index,
            })),
          );
          this.toastService.success('Imagen principal actualizada');
        },
        error: (error) => {
          console.error('Error actualizando imagen principal:', error);
          this.toastService.error('No se pudo actualizar la imagen principal');
        },
      });
    } else {
      this.uploadedImages.update((imgs) =>
        imgs.map((img, i) => ({
          ...img,
          es_principal: i === index,
        })),
      );
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    // Validar que haya al menos una imagen
    if (this.uploadedImages().length === 0) {
      this.toastService.warn('Debes subir al menos una imagen del producto');
      return;
    }

    this.isSubmitting.set(true);

    const formData = this.form.getRawValue();

    if (this.autoGenerateSku()) {
      formData.sku = null;
    }

    if (this.isEditMode()) {
      this.updateProduct();
    } else {
      this.createProduct();
    }
  }

  createProduct(): void {
    const formData = this.form.value;

    this.productService.createProduct(formData).subscribe({
      next: (product) => {
        const imageRequests = this.uploadedImages().map((img, index) => {
          return this.productService.addImage(product.id, {
            url_imagen: img.url_imagen,
            es_principal: img.es_principal,
            orden: index + 1,
          });
        });

        forkJoin(imageRequests).subscribe({
          next: () => {
            this.toastService.success('Producto creado exitosamente');

            setTimeout(() => {
              this.router.navigate(['/admin/productos']);
            }, 1000);
          },
          error: (error) => {
            console.error('Error guardando imágenes:', error);
            this.toastService.error(
              'Producto creado pero hubo un error al guardar las imágenes',
            );
            this.isSubmitting.set(false);
          },
        });
      },
      error: (error) => {
        console.error('Error creando producto:', error);
        this.toastService.error(error.error?.detail || 'No se pudo crear el producto');
        this.isSubmitting.set(false);
      },
    });
  }

  updateProduct(): void {
    const id = this.productId();
    if (!id) return;

    this.productService.updateProduct(id, this.form.value).subscribe({
      next: () => {
        this.toastService.success('Producto actualizado exitosamente');

        setTimeout(() => {
          this.router.navigate(['/admin/productos']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error actualizando producto:', error);
        this.toastService.error(error.error?.detail || 'No se pudo actualizar el producto');
        this.isSubmitting.set(false);
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  cancelar(): void {
    this.router.navigate(['/admin/productos']);
  }
}
