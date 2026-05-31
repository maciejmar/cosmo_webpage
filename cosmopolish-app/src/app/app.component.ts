import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AwardItem, ContentBlock, LanguageCode, SiteContent } from './models/site-content';
import { AuthService } from './services/auth.service';
import { ContentService } from './services/content.service';

const LANGUAGE_STORAGE_KEY = 'cosmopolish-language';

interface UiText {
  home: string;
  about: string;
  work: string;
  awards: string;
  contact: string;
  adminPanel: string;
  adminLogin: string;
  footerAdmin: string;
  adminHint: string;
  loginError: string;
  userPanel: string;
  manageContent: string;
  adminSignIn: string;
  password: string;
  testCredentials: string;
  saveChanges: string;
  resetDefault: string;
  logout: string;
  addParagraph: string;
  addMaterial: string;
  addEntry: string;
  remove: string;
  sectionHeading: string;
  mainButton: string;
  secondaryButton: string;
  materialTitle: string;
  quote: string;
  icon: string;
  year: string;
  title: string;
  description: string;
  lead: string;
  language: string;
  currentEditor: string;
  workItems: string;
  awardItems: string;
  hero: string;
  email: string;
  twitterLabel: string;
  twitterUrl: string;
  image: string;
  imageUpload: string;
  imageRemove: string;
  videoLink: string;
  openVideo: string;
}

const UI_TEXT: Record<LanguageCode, UiText> = {
  en: {
    home: 'Home',
    about: 'About',
    work: 'Work',
    awards: 'Awards',
    contact: 'Contact',
    adminPanel: 'Admin Panel',
    adminLogin: 'Admin Login',
    footerAdmin: 'Open admin panel',
    adminHint: 'Log in as administrator to add materials and edit the content of this website.',
    loginError: 'Invalid username or password.',
    userPanel: 'User panel',
    manageContent: 'Content management',
    adminSignIn: 'Administrator sign in',
    password: 'Password',
    testCredentials: 'Test credentials:',
    saveChanges: 'Save changes',
    resetDefault: 'Reset current language',
    logout: 'Log out',
    addParagraph: 'Add paragraph',
    addMaterial: 'Add material',
    addEntry: 'Add entry',
    remove: 'Remove',
    sectionHeading: 'Section heading',
    mainButton: 'Primary button',
    secondaryButton: 'Secondary button',
    materialTitle: 'Material title',
    quote: 'Quote',
    icon: 'Icon',
    year: 'Year',
    title: 'Title',
    description: 'Description',
    lead: 'Lead',
    language: 'Language',
    currentEditor: 'Editing language',
    workItems: 'items in Work',
    awardItems: 'entries in Awards',
    hero: 'Hero',
    email: 'Email',
    twitterLabel: 'X / Twitter label',
    twitterUrl: 'X / Twitter URL',
    image: 'Image',
    imageUpload: 'Upload image',
    imageRemove: 'Remove image',
    videoLink: 'Video link',
    openVideo: 'Open video'
  },
  pl: {
    home: 'Start',
    about: 'O mnie',
    work: 'Działalność',
    awards: 'Nagrody',
    contact: 'Kontakt',
    adminPanel: 'Panel admina',
    adminLogin: 'Logowanie',
    footerAdmin: 'Otwórz panel admina',
    adminHint: 'Zaloguj się jako administrator, aby dodawać materiały i edytować treści tej strony.',
    loginError: 'Nieprawidłowy login lub hasło.',
    userPanel: 'Panel użytkownika',
    manageContent: 'Zarządzanie treścią',
    adminSignIn: 'Logowanie administratora',
    password: 'Hasło',
    testCredentials: 'Dane testowe:',
    saveChanges: 'Zapisz zmiany',
    resetDefault: 'Przywróć bieżący język',
    logout: 'Wyloguj',
    addParagraph: 'Dodaj akapit',
    addMaterial: 'Dodaj materiał',
    addEntry: 'Dodaj wpis',
    remove: 'Usuń',
    sectionHeading: 'Nagłówek sekcji',
    mainButton: 'Przycisk główny',
    secondaryButton: 'Przycisk poboczny',
    materialTitle: 'Tytuł materiału',
    quote: 'Cytat',
    icon: 'Ikona',
    year: 'Rok',
    title: 'Tytuł',
    description: 'Opis',
    lead: 'Lead',
    language: 'Język',
    currentEditor: 'Edytowany język',
    workItems: 'materiały w sekcji Work',
    awardItems: 'wpisy w sekcji Awards',
    hero: 'Hero',
    email: 'Email',
    twitterLabel: 'Etykieta X / Twitter',
    twitterUrl: 'Link X / Twitter',
    image: 'Zdjęcie',
    imageUpload: 'Dodaj zdjęcie',
    imageRemove: 'Usuń zdjęcie',
    videoLink: 'Link do wideo',
    openVideo: 'Otwórz wideo'
  }
};

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
  activeLanguage = signal<LanguageCode>(this.readLanguage());
  editableContent: SiteContent = this.contentService.createEditableCopy(this.activeLanguage());

  readonly localizedContent = this.contentService.content;
  readonly content = computed(() => this.localizedContent()[this.activeLanguage()]);
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly workPreviewCount = computed(() => this.content().work.items.length);
  readonly awardPreviewCount = computed(() => this.content().awards.items.length);
  readonly ui = computed(() => UI_TEXT[this.activeLanguage()]);

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
      this.editableContent = this.contentService.createEditableCopy(this.activeLanguage());
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

  switchLanguage(language: LanguageCode) {
    if (this.activeLanguage() === language) {
      return;
    }

    this.activeLanguage.set(language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    this.loginError = '';
    this.editableContent = this.contentService.createEditableCopy(language);
    setTimeout(() => this.observeElements(), 50);
  }

  login() {
    this.loginError = '';
    const success = this.authService.login(this.loginForm.username.trim(), this.loginForm.password);

    if (!success) {
      this.loginError = this.ui().loginError;
      return;
    }

    this.editableContent = this.contentService.createEditableCopy(this.activeLanguage());
    this.loginForm.password = '';
  }

  logout() {
    this.authService.logout();
    this.loginForm = { username: '', password: '' };
    this.loginError = '';
  }

  saveContent() {
    this.contentService.save(this.activeLanguage(), this.editableContent);
    this.editableContent = this.contentService.createEditableCopy(this.activeLanguage());
    setTimeout(() => this.observeElements(), 50);
  }

  resetContent() {
    this.editableContent = this.contentService.reset(this.activeLanguage());
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

  onWorkImageSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      this.editableContent.work.items[index].imageUrl = result;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeWorkImage(index: number) {
    this.editableContent.work.items[index].imageUrl = '';
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
      icon: '📰',
      imageUrl: '',
      videoUrl: ''
    };
  }

  private createAwardItem(): AwardItem {
    return {
      year: '2026',
      title: 'New achievement',
      description: 'Describe the distinction, project, or milestone.'
    };
  }

  private readLanguage(): LanguageCode {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === 'pl' ? 'pl' : 'en';
  }
}
