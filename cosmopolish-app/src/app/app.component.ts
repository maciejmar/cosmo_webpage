import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isScrolled = false;
  activeSection = 'home';
  isMenuOpen = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
    this.updateActiveSection();
  }

  ngOnInit() {
    this.observeElements();
    window.addEventListener('keydown', this.onKeydown);
  window.addEventListener('resize', this.onResize);
  }
 

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  updateActiveSection() {
    const sections = ['home', 'about', 'work', 'awards', 'contact'];
    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          this.activeSection = section;
          break;
        }
      }
    }
  }

  observeElements() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    setTimeout(() => {
      document.querySelectorAll('.fade-in, .slide-up, .card').forEach((el) => {
        observer.observe(el);
      });
    }, 100);
  }

  toggleMenu() {
  this.isMenuOpen = !this.isMenuOpen;
  this.lockBodyScroll(this.isMenuOpen);
}

closeMenu() {
  if (!this.isMenuOpen) return;
  this.isMenuOpen = false;
  this.lockBodyScroll(false);
}

private lockBodyScroll(lock: boolean) {
  // zapobiegamy przewijaniu tła, gdy menu otwarte
  document.body.style.overflow = lock ? 'hidden' : '';
}

// Zamknij na ESC


ngOnDestroy() {
  window.removeEventListener('keydown', this.onKeydown);
  window.removeEventListener('resize', this.onResize);
}

onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') this.closeMenu();
};

onResize = () => {
  if (window.innerWidth > 768) this.closeMenu();
};
}
