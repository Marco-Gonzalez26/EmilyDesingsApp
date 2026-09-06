import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  host: { class: 'ion-page' },
  selector: 'app-account',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonModal, IonRouterLink, IonRouterLinkWithHref, FormsModule, RouterLink],
  templateUrl: './account.page.html',
  styleUrl: './account.page.css',
})
export class AccountPageComponent {
  serverModalOpen = false;
  apiUrl = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    private apiService: ApiService,
    private toast: ToastService,
  ) {}

  openServerModal(): void {
    this.apiUrl = this.apiService.getApiUrl();
    this.serverModalOpen = true;
  }

  async saveServerUrl(): Promise<void> {
    if (!this.apiUrl.trim()) {
      this.toast.error('Ingresa una URL válida');
      return;
    }
    this.apiService.setApiUrl(this.apiUrl.trim());
    this.serverModalOpen = false;
    this.toast.success('URL del servidor guardada');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/cuenta']);
  }
}