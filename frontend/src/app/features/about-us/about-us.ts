import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  Inject,
  afterNextRender,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-about-us',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, CommonModule, RouterLink],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUsComponent implements AfterViewInit {
  @ViewChild('heroSection') heroSection?: ElementRef;
  @ViewChild('founderSection') founderSection?: ElementRef;
  @ViewChild('missionSection') missionSection?: ElementRef;
  @ViewChild('visionSection') visionSection?: ElementRef;
  @ViewChild('valuesSection') valuesSection?: ElementRef;

  values = [
    {
      title: 'Autenticidad',
      description:
        'Creemos en la moda que refleja tu verdadero yo, sin seguir tendencias pasajeras sino creando un estilo atemporal.',
      icon: '',
    },
    {
      title: 'Calidad',
      description:
        'Cada prenda es seleccionada cuidadosamente, priorizando materiales nobles y confección impecable.',
      icon: '',
    },
    {
      title: 'Sostenibilidad',
      description:
        'Nos comprometemos con prácticas éticas y sostenibles, trabajando con artesanos locales de Quevedo.',
      icon: '',
    },
    {
      title: 'Inclusividad',
      description:
        'La moda es para todos. Celebramos la diversidad de cuerpos, estilos y personalidades.',
      icon: '',
    },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.initAnimations();
      });
    }
  }

  ngAfterViewInit(): void {}

  private revealOnScroll(
    targets: (string | HTMLElement)[],
    vars: gsap.TweenVars,
  ): void {
    const els: Element[] = [];
    for (const t of targets) {
      if (typeof t === 'string') {
        const found = this.heroSection?.nativeElement.querySelectorAll(t);
        if (found) {
          found.forEach((el: Element) => els.push(el));
        }
      } else {
        els.push(t);
      }
    }

    if (!els.length) {
      return;
    }

    gsap.set(els, { opacity: 0, ...vars });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const el = entry.target;
          gsap.to(el, {
            opacity: 1,
            ...vars,
            duration: 1,
            ease: 'power3.out',
            onComplete: () => io.unobserve(el),
          });
        });
      },
      { threshold: 0.15, root: null },
    );

    els.forEach((el) => io.observe(el));
  }

  private initAnimations(): void {
    if (this.heroSection) {
      gsap
        .timeline()
        .from('.hero-badge', {
          scale: 0,
          opacity: 0,
          duration: 0.6,
          ease: 'back.out(1.7)',
        })
        .from(
          '.hero-title',
          {
            y: 60,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.3',
        )
        .from(
          '.hero-subtitle',
          {
            y: 40,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.out',
          },
          '-=0.4',
        );
    }

    if (this.founderSection) {
      this.revealOnScroll(['.founder-image'], { x: -100 });
      this.revealOnScroll(['.founder-content'], { x: 100 });
    }

    if (this.missionSection) {
      this.revealOnScroll([this.missionSection.nativeElement], { y: 80 });
    }

    if (this.visionSection) {
      this.revealOnScroll([this.visionSection.nativeElement], { y: 80 });
    }
  }
}
