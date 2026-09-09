import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterLink,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonRouterLink,
    RouterModule,
    RouterOutlet,
  ],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  menuItems: MenuItem[] = [
    { label: 'Ir a la web', icon: 'globe-outline', route: '/catalogo' },
    { label: 'Dashboard', icon: 'grid-outline', route: '/admin' },
    { label: 'Productos', icon: 'cube-outline', route: '/admin/productos' },
    { label: 'Categorías', icon: 'bookmarks-outline', route: '/admin/categorias' },
    { label: 'Marcas', icon: 'pricetag-outline', route: '/admin/marcas' },
    { label: 'Colores', icon: 'image-outline', route: '/admin/colores' },
    { label: 'Tallas', icon: 'resize-outline', route: '/admin/tallas' },
    { label: 'Estilos', icon: 'color-palette-outline', route: '/admin/estilos' },
    {
      label: 'Inventario',
      icon: 'bag-handle-outline',
      route: '/admin/inventario',
    },
    {
      label: 'Órdenes',
      icon: 'document-text-outline',
      route: '/admin/ordenes',
    },
    { label: 'Usuarios', icon: 'people-outline', route: '/admin/usuarios' },
    {
      label: 'Reportes',
      icon: 'folder-open-outline',
      route: '/admin/reportes',
    },
    {
      label: 'Configuración',
      icon: 'settings-outline',
      route: '/admin/configuracion',
    },
  ];

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/iniciar-sesion']);
  }
}
