import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonIcon,
    CommonModule,
    GeneralTabComponent,
    ProductsTabComponent,
    ClientsTabComponent,
    OrdersTabComponent,
    AnalysisTabComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class AdminDashboardComponent {
  activeTab = signal<TabId>('general');

  tabs: Tab[] = [
    { id: 'general', label: 'General', icon: 'grid-outline' },
    { id: 'productos', label: 'Productos', icon: 'cube-outline' },
    { id: 'clientes', label: 'Clientes', icon: 'people-outline' },
    { id: 'ventas', label: 'Ventas', icon: 'cash-outline' },
    { id: 'analisis', label: 'Productos Recomendados', icon: 'sparkles-outline' },
  ];

  isTabActive = computed(() => (tabId: TabId) => this.activeTab() === tabId);

  selectTab(tabId: TabId): void {
    this.activeTab.set(tabId);
  }
}
