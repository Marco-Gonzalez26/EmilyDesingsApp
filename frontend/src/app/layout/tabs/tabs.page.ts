import { Component, OnInit, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';
import { ModalController } from '@ionic/angular/standalone';
import { PreferenciasOnboardingModalComponent } from '../../shared/components/preferencias-onboarding/preferencias-onboarding.component';
import {
  IonBadge,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  templateUrl: './tabs.page.html',
  styleUrl: './tabs.page.css',
})
export class TabsPage implements OnInit {
  protected readonly cartCount = computed(() => this.cartService.totalItems());
  private modalCtrl = inject(ModalController);
  private api = inject(ApiService);
  private router = inject(Router);
  private _onboardingChecked = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private toastService: ToastService,
  ) {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.cartService.getCart().subscribe();
        this.checkOnboarding();
      }
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.cartService.getCart().subscribe();
      this.checkOnboarding();
    }
  }

  private async checkOnboarding(): Promise<void> {
    const state = history.state as { showOnboarding?: boolean };
    const pendingFlag = localStorage.getItem('onboardingPendiente') === 'true';

    if (!state?.showOnboarding && !pendingFlag) {
      this._onboardingChecked = false;
      return;
    }

    if (this._onboardingChecked) return;
    this._onboardingChecked = true;

    const top = await this.modalCtrl.getTop();
    if (top) return;

    const hasPrefs = await new Promise<boolean>((resolve) => {
      this.api.get('/api/preferencias/mis-preferencias').subscribe({
        next: (pref) => {
          const p = pref as { estilos_preferidos?: string[] } | null;
          resolve(!!(p?.estilos_preferidos?.length));
        },
        error: () => resolve(false),
      });
      setTimeout(() => resolve(false), 1200);
    });

    if (hasPrefs) {
      localStorage.removeItem('onboardingPendiente');
      this._onboardingChecked = false;
      return;
    }

    const modal = await this.modalCtrl.create({
      component: PreferenciasOnboardingModalComponent,
      canDismiss: async (_data, role) => role === 'confirm',
      backdropDismiss: false,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    localStorage.removeItem('onboardingPendiente');
    this._onboardingChecked = false;
    if (role === 'confirm') {
      this.toastService.success('¡Preferencias guardadas! Descubre tu Para Ti');
      this.router.navigate(['/catalogo']);
    }
  }
}
