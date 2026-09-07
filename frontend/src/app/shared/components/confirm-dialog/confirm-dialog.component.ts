import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [],
  template: '', 
})
export class ConfirmDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() title = '¿Estás seguro?';
  @Input() message = '¿Deseas continuar con esta acción?';
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Input() type: 'danger' | 'warning' | 'info' = 'warning';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() isOpenChange = new EventEmitter<boolean>();

  private alertOpen = false;

  constructor(private alertController: AlertController) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.presentAlert();
    }
  }

  async presentAlert(): Promise<void> {
    if (this.alertOpen) return;
    this.alertOpen = true;
    const alert = await this.alertController.create({
      header: this.title,
      message: this.message,
      cssClass: `alert-${this.type}`,
      backdropDismiss: false,
      buttons: [
        {
          text: this.cancelText,
          role: 'cancel',
          handler: () => {
            this.cancel.emit();
          },
        },
        {
          text: this.confirmText,
          role: this.type === 'danger' ? 'destructive' : 'confirm',
          handler: () => {
            this.confirm.emit();
          },
        },
      ],
    });

    await alert.present();
    // cierre único aquí: cubre botones, ESC y hardware-back sin dobles emits
    await alert.onDidDismiss();
    this.alertOpen = false;
    this.isOpenChange.emit(false);
  }
}
