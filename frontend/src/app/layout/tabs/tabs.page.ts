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
    if (this._onboardingChecked) return;
    this._onboardingChecked = true;

    const state = history.state as { showOnboarding?: boolean };
    const pendingFlag = localStorage.getItem('onboardingPendiente') === 'true';

    if (state?.showOnboarding || pendingFlag) {
      const alreadyDismissed = localStorage.getItem('onboarding_seen') === 'true';
      if (alreadyDismissed) {
        localStorage.removeItem('onboardingPendiente');
        return;
      }

      const top = await this.modalCtrl.getTop();
      if (top) return;

      const shouldShow = await new Promise<boolean>((resolve) => {
        this.api.get('/api/preferencias/mis-preferencias').subscribe({
          next: (pref) => {
            const hasPrefs = !!(pref && Array.isArray((pref as unknown as { estilos_preferidos?: unknown[] })?.estilos_preferidos) && ((pref as unknown as { estilos_preferidos: unknown[] }).estilos_preferidos.length > 0));
            resolve(!hasPrefs);
          },
          error: (err) => resolve(err.status === 404),
        });
        setTimeout(() => resolve(true), 1200);
      });

      if (!shouldShow) {
        localStorage.removeItem('onboardingPendiente');
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
      if (role === 'confirm') {
        localStorage.removeItem('onboardingPendiente');
        localStorage.setItem('onboarding_seen', '1');
        this.toastService.success('¡Preferencias guardadas! Descubre tu Para Ti');
        this.router.navigate(['/catalogo']);
      }
    }
  }
}
