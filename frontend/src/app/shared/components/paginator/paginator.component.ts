import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.css',
})
export class PaginatorComponent {
  current = input.required<number>();
  total = input.required<number>();

  pageChange = output<number>();

  pages = computed<(number | string)[]>(() => {
    const total = this.total();
    const current = this.current();
    const list: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) list.push(i);
      return list;
    }

    list.push(1);
    if (current > 3) list.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      list.push(i);
    }
    if (current < total - 2) list.push('...');
    list.push(total);
    return list;
  });

  go(page: number | string): void {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.total() || page === this.current()) return;
    this.pageChange.emit(page);
  }

  first(): void {
    this.go(1);
  }

  last(): void {
    this.go(this.total());
  }

  prev(): void {
    this.go(this.current() - 1);
  }

  next(): void {
    this.go(this.current() + 1);
  }
}
