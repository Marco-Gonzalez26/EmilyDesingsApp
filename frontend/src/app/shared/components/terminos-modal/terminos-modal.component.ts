import { Component, inject } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-terminos-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon],
  templateUrl: './terminos-modal.component.html',
  styleUrl: './terminos-modal.component.css',
})
export class TerminosModalComponent {
  private modalCtrl = inject(ModalController);
  cerrar(): void {
    this.modalCtrl.dismiss();
  }
}
