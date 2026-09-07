import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { SegmentValue } from '@ionic/core';
import { GeneralTabComponent } from './genera-tab/general-tab.component';
import { ProductsTabComponent } from './products-tab/products-tab.component';
import { ClientsTabComponent } from './clients-tab/clients-tab.component';
import { OrdersTabComponent } from './orders-tab/orders-tab.component';
import { AnalysisTabComponent } from './analysis-tab/analysis-tab.component';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonSegmentContent,
  IonSegmentView,
  IonLabel,
} from '@ionic/angular/standalone';

type TabId = 'general' | 'productos' | 'clientes' | 'ventas' | 'analisis';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    IonLabel,
    IonSegmentButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonIcon,
    IonSegment,
    IonSegmentContent,
    IonSegmentView,
    CommonModule,
    GeneralTabComponent,
    ProductsTabComponent,
    ClientsTabComponent,
    OrdersTabComponent,
    AnalysisTabComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class AdminDashboardComponent {
  activeTab = signal<TabId>('general');

  tabs: Tab[] = [
    { id: 'general', label: 'General', icon: 'grid-outline' },
    { id: 'productos', label: 'Productos', icon: 'cube-outline' },
    { id: 'clientes', label: 'Clientes', icon: 'people-outline' },
    { id: 'ventas', label: 'Ventas', icon: 'cash-outline' },
    {
      id: 'analisis',
      label: 'Productos Recomendados',
      icon: 'sparkles-outline',
    },
  ];

  selectTab(tabId: SegmentValue | undefined): void {
    if (tabId == null) return;
    this.activeTab.set(tabId as TabId);
  }

  onSegmentViewScroll(event: CustomEvent): void {
    // Este evento se dispara mientras el usuario hace swipe.
    // Si quieres sincronizar el segment mientras desliza (no solo al soltar):
    const { currentX, isManualScroll } = event.detail;
    // opcional: lógica adicional si la necesitas
  }
}
