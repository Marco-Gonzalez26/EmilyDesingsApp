import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

/**
 * Notificaciones toast reemplazando MessageService (PrimeNG) con Ionic.
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  async show(
    message: string,
    color: string = 'medium',
    position: 'top' | 'bottom' | 'middle' = 'bottom',
    duration = 3000,
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position,
      buttons: [{ text: 'OK', role: 'cancel' }],
    });
    await toast.present();
  }

  success(message: string): Promise<void> {
    return this.show(message, 'success');
  }

  error(message: string): Promise<void> {
    return this.show(message, 'danger');
  }

  warn(message: string): Promise<void> {
    return this.show(message, 'warning');
  }

  info(message: string): Promise<void> {
    return this.show(message, 'primary');
  }
}