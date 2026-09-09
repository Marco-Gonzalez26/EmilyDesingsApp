import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonTitle,
  IonToolbar,
  AlertController,
  ModalController,
} from '@ionic/angular/standalone';

/**
 * Flujo 2FA TOTP reutilizable (admin/configuracion + perfil/Seguridad)
 * enable -> QR 250x250 (qr_base64 img) + clave manual grande + mensaje -> confirm 6 dígitos -> recovery
 * disable con password + código vigente
 */
@Component({
  selector: 'app-twofa-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonInput],
  templateUrl: './twofa-setup.component.html',
  styleUrl: './twofa-setup.component.css',
})
export class TwofaSetupComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

  @ViewChild('qrCanvas', { static: false }) qrCanvas?: ElementRef<HTMLCanvasElement>;

  totpEnabled = signal<boolean | null>(null);
  isLoading = signal(true);
  secret = signal<string | null>(null);
  qrBase64 = signal<string | null>(null);
  recoveryCodes = signal<string[] | null>(null);
  showSetup = signal(false);
  code = signal('');
  isVerifying = signal(false);
  isGenerating = signal(false);

  ngOnInit(): void {
    this.cargarEstado();
  }

  cargarEstado(): void {
    this.isLoading.set(true);
    this.api.get<{ totp_enabled: boolean }>('/api/auth/2fa/status').subscribe({
      next: (res: any) => {
        this.totpEnabled.set(!!res.totp_enabled);
        this.isLoading.set(false);
      },
      error: () => {
        this.totpEnabled.set(false);
        this.isLoading.set(false);
      },
    });
  }

  async activar(): Promise<void> {
    if (this.isGenerating()) return;
    this.isGenerating.set(true);
    this.api
      .post<{ secret: string; otpauth_url: string; qr_base64?: string }>('/api/auth/2fa/enable', {})
      .subscribe({
        next: async (res: any) => {
          this.secret.set(res.secret);
          this.qrBase64.set(res.qr_base64 ?? null);
          this.recoveryCodes.set(null);
          this.showSetup.set(true);
          this.isGenerating.set(false);
          if (!res.qr_base64) setTimeout(() => this.renderQr(res.otpauth_url), 100);
        },
        error: (err: any) => {
          this.isGenerating.set(false);
          this.toast.error(err.error?.detail || 'No se pudo generar QR');
        },
      });
  }

  private async renderQr(otpauthUrl: string): Promise<void> {
    if (!this.qrCanvas || !otpauthUrl) return;
    try {
      // @ts-ignore qrcode se instala con npm i qrcode @types/qrcode
      const QRCode: any = await import('qrcode');
      await QRCode.toCanvas(this.qrCanvas.nativeElement, otpauthUrl, { width: 250 });
    } catch {
      this.toast.error('No se pudo dibujar el QR local, usa la clave manual');
    }
  }

  verificar(): void {
    if (this.code().length !== 6) {
      this.toast.error('Ingresa 6 dígitos');
      return;
    }
    this.isVerifying.set(true);
    this.api.post('/api/auth/2fa/confirm', { code: this.code() }).subscribe({
      next: (res: any) => {
        this.isVerifying.set(false);
        if (res.recovery_codes) this.recoveryCodes.set(res.recovery_codes);
        this.toast.success('2FA activado — guarda tus códigos de recuperación');
        this.totpEnabled.set(true);
        this.modalCtrl.dismiss(null, 'confirm');
      },
      error: (err: any) => {
        this.isVerifying.set(false);
        this.toast.error(err.error?.detail || 'Código inválido');
      },
    });
  }

  async desactivar(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Desactivar 2FA',
      message: 'Confirma tu contraseña y tu código actual para desactivar el segundo factor.',
      backdropDismiss: false,
      inputs: [
        { name: 'password', type: 'password' as const, placeholder: 'Contraseña' },
        { name: 'code', type: 'text' as const, placeholder: 'Código de 6 dígitos', attributes: { maxlength: 6, inputmode: 'numeric' } },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          handler: (data: { password?: string; code?: string }) => {
            const password = (data.password ?? '').trim();
            const code = (data.code ?? '').trim();
            if (!password || code.length !== 6) {
              this.toast.error('Contraseña y código de 6 dígitos requeridos');
              return false;
            }
            this.enviarDesactivar(password, code);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private enviarDesactivar(password: string, code: string): void {
    this.api.post('/api/auth/2fa/disable', { password, code }).subscribe({
      next: () => {
        this.toast.success('2FA desactivado');
        this.totpEnabled.set(false);
        this.secret.set(null);
        this.qrBase64.set(null);
        this.recoveryCodes.set(null);
        this.showSetup.set(false);
      },
      error: (err: any) => this.toast.error(err.error?.detail || 'No se pudo desactivar'),
    });
  }

  cerrar(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
