import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AwardItem, ContentBlock, LanguageCode, SiteContent } from './models/site-content';
import { AuditEvent, AuditService } from './services/audit.service';
import { AuthService } from './services/auth.service';
import { ContentService, ContentVersion } from './services/content.service';

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
  imageSelected: string;
  videoLink: string;
  openVideo: string;
  apiError: string;
  saving: string;
  saved: string;
  saveError: string;
  sessionExpired: string;
  uploading: string;
  uploadError: string;
  loggedInAs: string;
  versionsTitle: string;
  versionsHint: string;
  auditTitle: string;
  auditHint: string;
  refresh: string;
  restore: string;
  restoreConfirm: string;
  restored: string;
  restoredFrom: string;
  current: string;
  noVersions: string;
  noEvents: string;
  loadError: string;
  newIp: string;
  events: Record<string, string>;
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
    imageSelected: 'Image selected',
    videoLink: 'Video link',
    openVideo: 'Open video',
    apiError: 'Server is unavailable. Try again later.',
    saving: 'Saving…',
    saved: 'Changes saved.',
    saveError: 'Could not save changes.',
    sessionExpired: 'Your session has expired. Log in again.',
    uploading: 'Uploading image…',
    uploadError: 'Could not upload the image (JPG, PNG, GIF or WebP, max 8 MB).',
    loggedInAs: 'Logged in as',
    versionsTitle: 'Version history',
    versionsHint: 'Every save of the edited language. Restoring creates a new version, nothing is lost.',
    auditTitle: 'Activity log',
    auditHint: 'Logins, saves, restores and uploads with the IP address they came from.',
    refresh: 'Refresh',
    restore: 'Restore',
    restoreConfirm: 'Restore the version from {date} ({user})? Unsaved changes in the editor will be lost.',
    restored: 'Version restored.',
    restoredFrom: 'restored',
    current: 'current',
    noVersions: 'No saved versions yet.',
    noEvents: 'No events yet.',
    loadError: 'Could not load data.',
    newIp: 'new IP',
    events: {
      'login.success': 'Login',
      'login.failed': 'Failed login',
      'login.blocked': 'Login blocked (too many attempts)',
      'content.save': 'Content saved',
      'content.restore': 'Version restored',
      'upload.image': 'Image uploaded',
      'alert.sent': 'Alert e-mail sent',
      'alert.failed': 'Alert e-mail failed'
    }
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
    imageSelected: 'Zdjęcie wybrane',
    videoLink: 'Link do wideo',
    openVideo: 'Otwórz wideo',
    apiError: 'Serwer jest niedostępny. Spróbuj ponownie później.',
    saving: 'Zapisywanie…',
    saved: 'Zmiany zapisane.',
    saveError: 'Nie udało się zapisać zmian.',
    sessionExpired: 'Sesja wygasła. Zaloguj się ponownie.',
    uploading: 'Wysyłanie zdjęcia…',
    uploadError: 'Nie udało się wysłać zdjęcia (JPG, PNG, GIF lub WebP, maks. 8 MB).',
    loggedInAs: 'Zalogowano jako',
    versionsTitle: 'Historia wersji',
    versionsHint: 'Każdy zapis edytowanego języka. Przywrócenie tworzy nową wersję, nic nie ginie.',
    auditTitle: 'Dziennik zdarzeń',
    auditHint: 'Logowania, zapisy, przywrócenia i uploady wraz z adresem IP, z którego przyszły.',
    refresh: 'Odśwież',
    restore: 'Przywróć',
    restoreConfirm: 'Przywrócić wersję z {date} ({user})? Niezapisane zmiany w edytorze zostaną utracone.',
    restored: 'Wersja przywrócona.',
    restoredFrom: 'przywrócenie',
    current: 'aktualna',
    noVersions: 'Brak zapisanych wersji.',
    noEvents: 'Brak zdarzeń.',
    loadError: 'Nie udało się wczytać danych.',
    newIp: 'nowe IP',
    events: {
      'login.success': 'Logowanie',
      'login.failed': 'Nieudane logowanie',
      'login.blocked': 'Logowanie zablokowane (za dużo prób)',
      'content.save': 'Zapis treści',
      'content.restore': 'Przywrócenie wersji',
      'upload.image': 'Wgranie zdjęcia',
      'alert.sent': 'Wysłano e-mail z alertem',
      'alert.failed': 'Błąd wysyłki e-maila z alertem'
    }
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
  private readonly auditService = inject(AuditService);

  isScrolled = false;
  activeSection = 'home';
  isMenuOpen = false;
  isAdminPanelOpen = false;
  loginError = '';
  isBusy = false;
  statusMessage = '';
  statusIsError = false;
  uploadingIndex: number | null = null;
  versions: ContentVersion[] = [];
  versionsError = '';
  auditEvents: AuditEvent[] = [];
  auditError = '';
  loginForm = {
    username: '',
    password: ''
  };
  activeLanguage = signal<LanguageCode>(this.readLanguage());
  editableContent: SiteContent = this.contentService.createEditableCopy(this.activeLanguage());

  readonly localizedContent = this.contentService.content;
  readonly content = computed(() => this.localizedContent()[this.activeLanguage()]);
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly username = this.authService.username;
  readonly workPreviewCount = computed(() => this.content().work.items.length);
  readonly awardPreviewCount = computed(() => this.content().awards.items.length);
  readonly ui = computed(() => UI_TEXT[this.activeLanguage()]);

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
    this.updateActiveSection();
  }

  ngOnInit() {
    this.contentService.load().then(() => {
      this.editableContent = this.contentService.createEditableCopy(this.activeLanguage());
      setTimeout(() => this.observeElements(), 50);
    });
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
    this.clearStatus();

    if (this.isAdminPanelOpen) {
      this.editableContent = this.contentService.createEditableCopy(this.activeLanguage());
      this.closeMenu();
      if (this.isLoggedIn()) {
        this.refreshHistory();
      }
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
    this.clearStatus();
    this.editableContent = this.contentService.createEditableCopy(language);
    setTimeout(() => this.observeElements(), 50);
  }

  async login() {
    if (this.isBusy) {
      return;
    }

    this.loginError = '';
    this.isBusy = true;

    try {
      const success = await this.authService.login(this.loginForm.username.trim(), this.loginForm.password);
      if (!success) {
        this.loginError = this.ui().loginError;
        return;
      }

      this.clearStatus();
      this.editableContent = this.contentService.createEditableCopy(this.activeLanguage());
      this.loginForm.password = '';
      this.refreshHistory();
    } catch (error) {
      this.loginError = (error as HttpErrorResponse).status === 429 ? this.apiMessage(error) : this.ui().apiError;
    } finally {
      this.isBusy = false;
    }
  }

  logout() {
    this.authService.logout();
    this.loginForm = { username: '', password: '' };
    this.loginError = '';
    this.clearStatus();
    this.versions = [];
    this.auditEvents = [];
  }

  async saveContent() {
    await this.runAdminAction(async () => {
      await this.contentService.save(this.activeLanguage(), this.editableContent);
      this.editableContent = this.contentService.createEditableCopy(this.activeLanguage());
    });
  }

  async resetContent() {
    await this.runAdminAction(async () => {
      this.editableContent = await this.contentService.reset(this.activeLanguage());
    });
  }

  versionsForActiveLanguage(): ContentVersion[] {
    return this.versions.filter((version) => version.language === this.activeLanguage());
  }

  async refreshHistory() {
    const [versions, events] = await Promise.allSettled([
      this.contentService.listVersions(),
      this.auditService.list(100)
    ]);

    this.versions = versions.status === 'fulfilled' ? versions.value : [];
    this.versionsError = versions.status === 'fulfilled' ? '' : this.ui().loadError;
    this.auditEvents = events.status === 'fulfilled' ? events.value : [];
    this.auditError = events.status === 'fulfilled' ? '' : this.ui().loadError;
  }

  async restoreVersion(version: ContentVersion) {
    const date = new Date(version.savedAt).toLocaleString();
    if (!window.confirm(this.ui().restoreConfirm.replace('{date}', date).replace('{user}', version.savedBy))) {
      return;
    }

    await this.runAdminAction(async () => {
      await this.contentService.restoreVersion(version.id);
      this.editableContent = this.contentService.createEditableCopy(this.activeLanguage());
    }, this.ui().restored);
  }

  eventLabel(event: AuditEvent): string {
    return this.ui().events[event.event] ?? event.event;
  }

  /** Short human-readable details of an audit event, e.g. language, attempted username or file. */
  eventDetails(event: AuditEvent): string {
    const details = event.details ?? {};
    const parts = [
      details['language'] ? String(details['language']).toUpperCase() : '',
      details['attemptedUsername'] ? `"${details['attemptedUsername']}"` : '',
      details['originalName'] ? String(details['originalName']) : '',
      details['newIp'] ? this.ui().newIp : '',
      details['error'] ? String(details['error']) : ''
    ];
    return parts.filter(Boolean).join(' · ');
  }

  /** Events worth a second look: failed or blocked logins, failed alerts, logins from a new IP. */
  isWarningEvent(event: AuditEvent): boolean {
    return ['login.failed', 'login.blocked', 'alert.failed'].includes(event.event) || event.details?.['newIp'] === true;
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

  async onWorkImageSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    const item = this.editableContent.work.items[index];
    this.uploadingIndex = index;
    this.setStatus(this.ui().uploading, false);

    try {
      item.imageUrl = await this.contentService.uploadImage(file);
      this.clearStatus();
    } catch (error) {
      this.setStatus(this.isUnauthorized(error) ? this.ui().sessionExpired : this.ui().uploadError, true);
    } finally {
      this.uploadingIndex = null;
    }
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

  private async runAdminAction(action: () => Promise<void>, successMessage = this.ui().saved) {
    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    this.setStatus(this.ui().saving, false);

    try {
      await action();
      this.setStatus(successMessage, false);
      setTimeout(() => this.observeElements(), 50);
      this.refreshHistory();
    } catch (error) {
      if (this.isUnauthorized(error)) {
        this.loginError = this.ui().sessionExpired;
        this.clearStatus();
      } else {
        this.setStatus(`${this.ui().saveError} ${this.apiMessage(error)}`.trim(), true);
      }
    } finally {
      this.isBusy = false;
    }
  }

  private isUnauthorized(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 401;
  }

  private apiMessage(error: unknown): string {
    return error instanceof HttpErrorResponse && typeof error.error?.error === 'string' ? error.error.error : '';
  }

  private setStatus(message: string, isError: boolean) {
    this.statusMessage = message;
    this.statusIsError = isError;
  }

  private clearStatus() {
    this.setStatus('', false);
  }

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
