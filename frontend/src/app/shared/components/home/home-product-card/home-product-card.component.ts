import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-product-card.component.html',
})
export class HomeProductCardComponent {
  image = input.required<string>();
  title = input.required<string>();
  description = input<string>('');
  buttonText = input<string>('Ver más');
  link = input<string>('');
}
