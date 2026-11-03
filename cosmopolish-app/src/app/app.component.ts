import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AwardItem, ContentBlock, LanguageCode, NewsPost, SectionId, SiteContent } from './models/site-content';
import { AuditEvent, AuditService } from './services/audit.service';
import { AuthService } from './services/auth.service';
import { ContentService, ContentVersion } from './services/content.service';

const LANGUAGE_STORAGE_KEY = 'cosmopolish-language';
const PREVIEW_STORAGE_KEY = 'cosmopolish-preview';
/** News posts with a longer body are collapsed on the site behind "Read more". */
const NEWS_COLLAPSE_LENGTH = 600;

interface UiText {
  home: string;
  news: string;
  addPost: string;
  newPostTitle: string;
  noPosts: string;
  newsImage: string;
  imageCaption: string;
  postLead: string;
  postBody: string;
  links: string;
  showMore: string;
  showLess: string;
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
  saveChanges: string;
  preview: string;
  previewBanner: string;
  backToEditor: string;
  unsavedChanges: string;
  noChanges: string;
  discardChanges: string;
  discardConfirm: string;
  switchLanguageConfirm: string;
  draftSaving: string;
  draftSaved: string;
  draftError: string;
  draftRestored: string;
  leaveConfirm: string;
  invalidUrls: string;
  category: string;
  date: string;
  imageAlt: string;
  videoLabel: string;
  linkUrl: string;
  linkLabel: string;
  readMore: string;
  hideItem: string;
  hiddenBadge: string;
  hideSection: string;
  sectionIntro: string;
  moveUp: string;
  moveDown: string;
  phone: string;
  otherLinks: string;
  addLink: string;
  linkName: string;
  aboutImage: string;
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
    news: 'News',
    addPost: 'Add post',
    newPostTitle: 'New post',
    noPosts: 'No posts yet – the section appears on the site once the first post is published.',
    newsImage: 'Panoramic photo (best 21:9, e.g. 2100×900 px)',
    imageCaption: 'Photo caption / credit',
    postLead: 'Lead (short intro, highlighted)',
    postBody: 'Text (an empty line starts a new paragraph)',
    links: 'Links',
    showMore: 'Read more',
    showLess: 'Show less',
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
    saveChanges: 'Publish',
    preview: 'Preview',
    previewBanner: 'Preview ({lang}) – this is how the site will look. Changes are not published yet.',
    backToEditor: 'Back to editor',
    unsavedChanges: 'Unpublished changes',
    noChanges: 'Nothing to publish – no changes.',
    discardChanges: 'Discard changes',
    discardConfirm: 'Discard all unpublished changes in this language?',
    switchLanguageConfirm: 'The draft could not be saved on the server. Switching the language discards your changes. Continue?',
    draftSaving: 'Saving draft…',
    draftSaved: 'Draft saved on the server at {time}',
    draftError: 'Could not save the draft on the server – check your connection.',
    draftRestored: 'Unpublished draft loaded (saved {date} by {user}).',
    leaveConfirm: 'The latest changes have not been saved yet.',
    invalidUrls: 'Fix these links before publishing (http(s) link required):',
    category: 'Category',
    date: 'Date',
    imageAlt: 'Image description (alt text)',
    videoLabel: 'Video button text',
    linkUrl: 'Link (article, publication, book…)',
    linkLabel: 'Link button text',
    readMore: 'Read more',
    hideItem: 'Hide on the site',
    hiddenBadge: 'hidden',
    hideSection: 'Hide this section on the site',
    sectionIntro: 'Intro text under the heading',
    moveUp: 'Move up',
    moveDown: 'Move down',
    phone: 'Phone',
    otherLinks: 'Other links (Facebook, YouTube, …)',
    addLink: 'Add link',
    linkName: 'Name',
    aboutImage: 'Photo (replaces the default one)',
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
    saved: 'Changes published.',
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
    news: 'Aktualności',
    addPost: 'Dodaj wpis',
    newPostTitle: 'Nowy wpis',
    noPosts: 'Brak wpisów – sekcja pojawi się na stronie po opublikowaniu pierwszego wpisu.',
    newsImage: 'Zdjęcie panoramiczne (najlepiej 21:9, np. 2100×900 px)',
    imageCaption: 'Podpis / autor zdjęcia',
    postLead: 'Lead (krótkie wprowadzenie, wyróżnione)',
    postBody: 'Treść (pusta linia = nowy akapit)',
    links: 'Linki',
    showMore: 'Czytaj więcej',
    showLess: 'Zwiń',
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
    saveChanges: 'Opublikuj',
    preview: 'Podgląd',
    previewBanner: 'Podgląd ({lang}) – tak będzie wyglądała strona. Zmiany nie są jeszcze opublikowane.',
    backToEditor: 'Wróć do edycji',
    unsavedChanges: 'Nieopublikowane zmiany',
    noChanges: 'Nie ma czego publikować – brak zmian.',
    discardChanges: 'Odrzuć zmiany',
    discardConfirm: 'Odrzucić wszystkie nieopublikowane zmiany w tym języku?',
    switchLanguageConfirm: 'Nie udało się zapisać szkicu na serwerze. Zmiana języka odrzuci zmiany. Kontynuować?',
    draftSaving: 'Zapisywanie szkicu…',
    draftSaved: 'Szkic zapisany na serwerze o {time}',
    draftError: 'Nie udało się zapisać szkicu na serwerze – sprawdź połączenie.',
    draftRestored: 'Wczytano nieopublikowany szkic (zapisany {date}, {user}).',
    leaveConfirm: 'Ostatnie zmiany nie zostały jeszcze zapisane.',
    invalidUrls: 'Popraw linki przed publikacją (wymagany link http(s)):',
    category: 'Kategoria',
    date: 'Data',
    imageAlt: 'Opis zdjęcia (tekst alternatywny)',
    videoLabel: 'Tekst przycisku wideo',
    linkUrl: 'Link (artykuł, publikacja, książka…)',
    linkLabel: 'Tekst przycisku linku',
    readMore: 'Czytaj więcej',
    hideItem: 'Ukryj na stronie',
    hiddenBadge: 'ukryty',
    hideSection: 'Ukryj tę sekcję na stronie',
    sectionIntro: 'Tekst wprowadzenia pod nagłówkiem',
    moveUp: 'W górę',
    moveDown: 'W dół',
    phone: 'Telefon',
    otherLinks: 'Inne linki (Facebook, YouTube, …)',
    addLink: 'Dodaj link',
    linkName: 'Nazwa',
    aboutImage: 'Zdjęcie (zastępuje domyślne)',
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
    saved: 'Zmiany opublikowane.',
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
  draftState: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  draftSavedAt: string | null = null;
  draftNotice = '';
  /** JSON of the draft as the server has it (or of the published content when there is no draft). */
  private syncedDraftJson = '';
  private draftTimer?: ReturnType<typeof setTimeout>;
  private draftSync: Promise<void> | null = null;
  private readonly expandedPosts = new Set<NewsPost>();
  /** Which image field is being uploaded, e.g. "work-2" or "about". */
  uploadingKey: string | null = null;
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

  /** Draft shown on the page instead of the published content while previewing. */
  readonly previewContent = signal<SiteContent | null>(null);
  readonly isPreviewing = computed(() => this.previewContent() !== null);

  readonly localizedContent = this.contentService.content;
  readonly content = computed(() => this.previewContent() ?? this.localizedContent()[this.activeLanguage()]);
  readonly visibleNewsPosts = computed(() => (this.content().news?.items ?? []).filter((post) => !post.hidden));
  readonly visibleWorkItems = computed(() => this.content().work.items.filter((item) => !item.hidden));
  readonly visibleAwardItems = computed(() => this.content().awards.items.filter((item) => !item.hidden));
  readonly contactLinks = computed(() => (this.content().contact.links ?? []).filter((link) => link.url));
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
    this.contentService.load().then(async () => {
      this.resetEditor();
      setTimeout(() => this.observeElements(), 50);
      await this.loadDraft();
      this.resumePreviewAfterReload();
    });
    this.observeElements();
    this.updateActiveSection();
    window.addEventListener('keydown', this.onKeydown);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    clearTimeout(this.draftTimer);
    document.body.style.overflow = '';
  }

  /** Called on every input, change and click in the editor; saves the draft once editing pauses. */
  scheduleDraftSave() {
    if (!this.isLoggedIn()) {
      return;
    }
    clearTimeout(this.draftTimer);
    this.draftTimer = setTimeout(() => this.syncDraft(), 1500);
  }

  draftStatus(): string {
    switch (this.draftState) {
      case 'saving':
        return this.ui().draftSaving;
      case 'error':
        return this.ui().draftError;
      case 'saved':
        return this.draftSavedAt
          ? this.ui().draftSaved.replace('{time}', new Date(this.draftSavedAt).toLocaleTimeString())
          : '';
      default:
        return '';
    }
  }

  /**
   * Sends the editor state to the server as the language's draft (or deletes the draft when the
   * editor matches the published content again). Waits for a save already in flight first.
   */
  async syncDraft(): Promise<void> {
    clearTimeout(this.draftTimer);
    if (this.draftSync) {
      await this.draftSync;
    }
    if (!this.isLoggedIn() || !this.isDraftDirty()) {
      return;
    }

    const language = this.activeLanguage();
    const json = JSON.stringify(this.editableContent);
    const changed = this.hasUnsavedChanges();
    this.draftState = 'saving';

    this.draftSync = (async () => {
      try {
        if (changed) {
          const draft = await this.contentService.saveDraft(language, JSON.parse(json) as SiteContent);
          this.draftSavedAt = draft.savedAt;
        } else {
          await this.contentService.deleteDraft(language);
          this.draftSavedAt = null;
        }
        if (language === this.activeLanguage()) {
          this.syncedDraftJson = json;
        }
        this.draftState = changed ? 'saved' : 'idle';
      } catch {
        this.draftState = 'error';
      }
    })();

    await this.draftSync;
    this.draftSync = null;
    // Edits made while the request was running.
    if (this.isDraftDirty()) {
      this.scheduleDraftSave();
    }
  }

  scrollToSection(sectionId: string) {
    this.closeMenu();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  updateActiveSection() {
    const sections = ['home', 'news', 'about', 'work', 'awards', 'contact'];
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

  // The draft is kept while the panel is closed (e.g. during preview); it is replaced only
  // after publishing, discarding, switching the language or logging in.
  toggleAdminPanel() {
    this.isAdminPanelOpen = !this.isAdminPanelOpen;
    this.loginError = '';
    this.clearStatus();

    if (this.isAdminPanelOpen) {
      this.exitPreview();
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

  async switchLanguage(language: LanguageCode) {
    if (this.activeLanguage() === language || this.isPreviewing()) {
      return;
    }
    if (this.isLoggedIn()) {
      // The draft of the current language goes to the server first; it is loaded again when switching back.
      await this.syncDraft();
      if (this.isDraftDirty() && !window.confirm(this.ui().switchLanguageConfirm)) {
        return;
      }
    }

    this.activeLanguage.set(language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    this.loginError = '';
    this.clearStatus();
    this.resetEditor();
    setTimeout(() => this.observeElements(), 50);
    await this.loadDraft();
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
      this.resetEditor();
      this.loginForm.password = '';
      this.refreshHistory();
      await this.loadDraft();
    } catch (error) {
      this.loginError = (error as HttpErrorResponse).status === 429 ? this.apiMessage(error) : this.ui().apiError;
    } finally {
      this.isBusy = false;
    }
  }

  async logout() {
    await this.syncDraft();
    this.authService.logout();
    this.draftState = 'idle';
    this.draftNotice = '';
    this.loginForm = { username: '', password: '' };
    this.loginError = '';
    this.clearStatus();
    this.versions = [];
    this.auditEvents = [];
  }

  hasUnsavedChanges(): boolean {
    return this.contentService.isChanged(this.activeLanguage(), this.editableContent);
  }

  invalidUrls(): string[] {
    return this.contentService.findInvalidUrls(this.editableContent);
  }

  /** Shows the draft on the real page, exactly as visitors would see it after publishing. */
  openPreview() {
    if (this.invalidUrls().length) {
      return;
    }

    this.clearStatus();
    this.previewContent.set(this.contentService.clone(this.editableContent));
    this.rememberPreview(true);
    this.syncDraft();
    this.closeAdminPanel();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => this.observeElements(), 50);
  }

  backToEditor() {
    if (!this.isAdminPanelOpen) {
      this.toggleAdminPanel();
    }
  }

  async publishFromPreview() {
    if (await this.saveContent()) {
      this.exitPreview();
    }
  }

  async saveContent(): Promise<boolean> {
    if (this.invalidUrls().length) {
      return false;
    }
    if (!this.hasUnsavedChanges()) {
      this.setStatus(this.ui().noChanges, false);
      return false;
    }

    // Publishing also deletes the language's draft on the server.
    return this.runAdminAction(async () => {
      await this.contentService.save(this.activeLanguage(), this.editableContent);
      this.resetEditor();
    });
  }

  async discardChanges() {
    if (!window.confirm(this.ui().discardConfirm)) {
      return;
    }

    this.resetEditor();
    this.clearStatus();
    try {
      await this.contentService.deleteDraft(this.activeLanguage());
    } catch {
      this.draftState = 'error';
    }
  }

  async resetContent() {
    await this.runAdminAction(async () => {
      await this.contentService.reset(this.activeLanguage());
      this.resetEditor();
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
      this.resetEditor();
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

  /** Uploads the chosen file and stores its URL in `target.imageUrl` (a work item or the About section). */
  async onImageSelected(event: Event, target: { imageUrl?: string }, key: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    this.uploadingKey = key;
    this.setStatus(this.ui().uploading, false);

    try {
      target.imageUrl = await this.contentService.uploadImage(file);
      this.clearStatus();
      this.scheduleDraftSave();
    } catch (error) {
      this.setStatus(this.isUnauthorized(error) ? this.ui().sessionExpired : this.ui().uploadError, true);
    } finally {
      this.uploadingKey = null;
    }
  }

  removeImage(target: { imageUrl?: string }) {
    target.imageUrl = '';
  }

  /** Swaps an item with its neighbour; `direction` is -1 (up) or 1 (down). */
  moveItem<T>(items: T[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) {
      return;
    }
    [items[index], items[target]] = [items[target], items[index]];
  }

  /** News is shown only when it has at least one visible post. */
  isSectionVisible(section: SectionId): boolean {
    if (section === 'news') {
      return !this.content().news.hidden && this.visibleNewsPosts().length > 0;
    }
    return !this.content()[section].hidden;
  }

  addNewsPost() {
    // Newest first: a new post goes to the top of the list.
    this.editableContent.news.items.unshift(this.createNewsPost());
    this.scheduleDraftSave();
  }

  removeNewsPost(index: number) {
    this.editableContent.news.items.splice(index, 1);
  }

  addPostLink(post: NewsPost) {
    post.links = [...(post.links ?? []), { label: '', url: '' }];
  }

  removePostLink(post: NewsPost, index: number) {
    post.links?.splice(index, 1);
  }

  /** Paragraphs of a post body, split on empty lines. */
  paragraphsOf(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  /** Long posts are collapsed on the site until "Read more" is clicked. */
  isLongPost(post: NewsPost): boolean {
    return post.body.length > NEWS_COLLAPSE_LENGTH;
  }

  isPostExpanded(post: NewsPost): boolean {
    return this.expandedPosts.has(post);
  }

  togglePost(post: NewsPost) {
    if (this.expandedPosts.has(post)) {
      this.expandedPosts.delete(post);
    } else {
      this.expandedPosts.add(post);
    }
  }

  telHref(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
  }

  addContactLink() {
    const contact = this.editableContent.contact;
    contact.links = [...(contact.links ?? []), { label: '', url: '' }];
  }

  removeContactLink(index: number) {
    this.editableContent.contact.links?.splice(index, 1);
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

  private exitPreview() {
    this.rememberPreview(false);
    if (this.isPreviewing()) {
      this.previewContent.set(null);
      setTimeout(() => this.observeElements(), 50);
    }
  }

  /** Editor = published content of the active language (no draft). */
  private resetEditor() {
    this.editableContent = this.contentService.createEditableCopy(this.activeLanguage());
    this.syncedDraftJson = JSON.stringify(this.editableContent);
    this.draftSavedAt = null;
    this.draftState = 'idle';
    this.draftNotice = '';
  }

  /** Puts the server-side draft of the active language (if any) into the editor. */
  private async loadDraft() {
    if (!this.isLoggedIn()) {
      return;
    }

    const language = this.activeLanguage();
    try {
      const draft = await this.contentService.getDraft(language);
      if (!draft || language !== this.activeLanguage() || !this.contentService.isChanged(language, draft.content)) {
        return;
      }

      this.editableContent = draft.content;
      this.syncedDraftJson = JSON.stringify(draft.content);
      this.draftSavedAt = draft.savedAt;
      this.draftState = 'saved';
      this.draftNotice = this.ui()
        .draftRestored.replace('{date}', new Date(draft.savedAt).toLocaleString())
        .replace('{user}', draft.savedBy);
    } catch {
      this.draftState = 'error';
    }
  }

  private isDraftDirty(): boolean {
    return JSON.stringify(this.editableContent) !== this.syncedDraftJson;
  }

  // Preview mode survives F5: the flag lives in sessionStorage (this tab only), the content in the draft.
  private rememberPreview(on: boolean) {
    try {
      if (on) {
        sessionStorage.setItem(PREVIEW_STORAGE_KEY, this.activeLanguage());
      } else {
        sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
      }
    } catch {
      // Storage unavailable (private mode) - preview just does not survive a reload.
    }
  }

  private resumePreviewAfterReload() {
    let language: string | null = null;
    try {
      language = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    } catch {
      return;
    }

    if (language === this.activeLanguage() && this.isLoggedIn() && this.hasUnsavedChanges()) {
      this.previewContent.set(this.contentService.clone(this.editableContent));
      setTimeout(() => this.observeElements(), 50);
    } else {
      this.rememberPreview(false);
    }
  }

  /**
   * Leaving or reloading with edits not yet on the server: send them with a keepalive request
   * and let the browser ask "Leave site?".
   */
  private onBeforeUnload = (event: BeforeUnloadEvent) => {
    const token = this.authService.token;
    if (!this.isLoggedIn() || !token || !this.isDraftDirty()) {
      return;
    }

    if (this.hasUnsavedChanges()) {
      this.contentService.saveDraftOnUnload(this.activeLanguage(), this.editableContent, token);
    }
    event.preventDefault();
    event.returnValue = this.ui().leaveConfirm;
  };

  private async runAdminAction(action: () => Promise<void>, successMessage = this.ui().saved): Promise<boolean> {
    if (this.isBusy) {
      return false;
    }

    this.isBusy = true;
    this.setStatus(this.ui().saving, false);

    try {
      await action();
      this.setStatus(successMessage, false);
      setTimeout(() => this.observeElements(), 50);
      this.refreshHistory();
      return true;
    } catch (error) {
      if (this.isUnauthorized(error)) {
        // Shown on the login form and, while previewing, in the preview bar.
        this.loginError = this.ui().sessionExpired;
        this.setStatus(this.ui().sessionExpired, true);
      } else {
        this.setStatus(`${this.ui().saveError} ${this.apiMessage(error)}`.trim(), true);
      }
      return false;
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
      category: '',
      date: '',
      imageUrl: '',
      imageAlt: '',
      videoUrl: '',
      videoLabel: '',
      linkUrl: '',
      linkLabel: '',
      hidden: false
    };
  }

  private createNewsPost(): NewsPost {
    return {
      title: this.ui().newPostTitle,
      date: new Date().toLocaleDateString(this.activeLanguage() === 'pl' ? 'pl-PL' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      lead: '',
      body: '',
      imageUrl: '',
      imageAlt: '',
      imageCaption: '',
      links: [],
      hidden: false
    };
  }

  private createAwardItem(): AwardItem {
    return {
      year: '2026',
      title: 'New achievement',
      description: 'Describe the distinction, project, or milestone.',
      linkUrl: '',
      linkLabel: '',
      hidden: false
    };
  }

  private readLanguage(): LanguageCode {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === 'pl' ? 'pl' : 'en';
  }
}
