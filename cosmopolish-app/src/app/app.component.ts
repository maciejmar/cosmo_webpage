import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AwardItem, ContentBlock, SiteContent } from './models/site-content';
import { AuthService } from './services/auth.service';
import { ContentService } from './services/content.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  readonly title = 'cosmopolish-app';
  private readonly authService = inject(AuthService);
  private readonly contentService = inject(ContentService);

  isScrolled = false;
  activeSection = 'home';
  isMenuOpen = false;
  isAdminPanelOpen = false;
  loginError = '';
  loginForm = {
    username: '',
    password: ''
  };
  editableContent: SiteContent = this.contentService.createEditableCopy();

  readonly content = this.contentService.content;
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly adminCredentials = this.authService.getCredentialsHint();
  readonly workPreviewCount = computed(() => this.content().work.items.length);
  readonly awardPreviewCount = computed(() => this.content().awards.items.length);

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
    this.updateActiveSection();
  }

  ngOnInit() {
    this.observeElements();
    this.updateActiveSection();
    window.addEventListener('keydown', this.onKeydown);
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('resize', this.onResize);
    document.body.style.overflow = '';
  }

  scrollToSection(sectionId: string) {
    this.closeMenu();
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
        if (rect.top <= 140 && rect.bottom >= 140) {
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
      { threshold: 0.15 }
    );

    setTimeout(() => {
      document.querySelectorAll('.fade-in, .slide-up, .card, .timeline-item').forEach((el) => {
        observer.observe(el);
      });
    }, 100);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.lockBodyScroll(this.isMenuOpen || this.isAdminPanelOpen);
  }

  closeMenu() {
    if (!this.isMenuOpen) {
      return;
    }

    this.isMenuOpen = false;
    this.lockBodyScroll(this.isAdminPanelOpen);
  }

  toggleAdminPanel() {
    this.isAdminPanelOpen = !this.isAdminPanelOpen;
    this.loginError = '';

    if (this.isAdminPanelOpen) {
      this.editableContent = this.contentService.createEditableCopy();
      this.closeMenu();
    }

    this.lockBodyScroll(this.isMenuOpen || this.isAdminPanelOpen);
  }

  closeAdminPanel() {
    if (!this.isAdminPanelOpen) {
      return;
    }

    this.isAdminPanelOpen = false;
    this.lockBodyScroll(this.isMenuOpen);
  }

  login() {
    this.loginError = '';
    const success = this.authService.login(this.loginForm.username.trim(), this.loginForm.password);

    if (!success) {
      this.loginError = 'Nieprawidłowy login lub hasło.';
      return;
    }

    this.editableContent = this.contentService.createEditableCopy();
    this.loginForm.password = '';
  }

  logout() {
    this.authService.logout();
    this.loginForm = { username: '', password: '' };
    this.loginError = '';
  }

  saveContent() {
    this.contentService.save(this.editableContent);
    this.editableContent = this.contentService.createEditableCopy();
    setTimeout(() => this.observeElements(), 50);
  }

  resetContent() {
    this.editableContent = this.contentService.reset();
    setTimeout(() => this.observeElements(), 50);
  }

  addAboutParagraph() {
    this.editableContent.about.paragraphs.push('');
  }

  removeAboutParagraph(index: number) {
    this.editableContent.about.paragraphs.splice(index, 1);
  }

  addWorkItem() {
    this.editableContent.work.items.push(this.createWorkItem());
  }

  removeWorkItem(index: number) {
    this.editableContent.work.items.splice(index, 1);
  }

  addAwardItem() {
    this.editableContent.awards.items.push(this.createAwardItem());
  }

  removeAwardItem(index: number) {
    this.editableContent.awards.items.splice(index, 1);
  }

  trackByIndex(index: number): number {
    return index;
  }

  heroTitleLine(index: number): string {
    const parts = this.content().hero.title.trim().split(/\s+/).filter(Boolean);

    if (parts.length <= 1) {
      return index === 0 ? this.content().hero.title : '';
    }

    return index === 0 ? parts[0] : parts.slice(1).join(' ');
  }

  onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.closeMenu();
      this.closeAdminPanel();
    }
  };

  onResize = () => {
    if (window.innerWidth > 768) {
      this.closeMenu();
    }
  };

  private lockBodyScroll(lock: boolean) {
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  private createWorkItem(): ContentBlock {
    return {
      title: 'New material',
      description: 'Add a new description for this section.',
      icon: '📰'
    };
  }

  private createAwardItem(): AwardItem {
    return {
      year: '2026',
      title: 'New achievement',
      description: 'Describe the distinction, project, or milestone.'
    };
  }
}
