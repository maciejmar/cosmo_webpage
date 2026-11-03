import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { DEFAULT_SITE_CONTENT, LanguageCode, LocalizedSiteContent, SiteContent } from '../models/site-content';

interface ContentResponse {
  languages: Partial<Record<LanguageCode, Partial<SiteContent>>>;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface ContentDraft {
  content: SiteContent;
  savedAt: string;
  savedBy: string;
}

export interface ContentVersion {
  id: string;
  language: LanguageCode;
  savedAt: string;
  savedBy: string;
  ip: string | null;
  action: 'save' | 'restore';
  restoredFrom?: string;
}

/**
 * Site content comes from cosmopolish-api. Until it loads (or if the API is unreachable)
 * the built-in defaults are shown. Sections missing in stored content - e.g. ones added
 * to SiteContent later - are filled in from DEFAULT_SITE_CONTENT.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);

  readonly content = signal<LocalizedSiteContent>(this.cloneLocalized(DEFAULT_SITE_CONTENT));
  readonly loaded = signal(false);

  async load(): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<ContentResponse>(`${environment.apiUrl}/content`));
      this.content.set(this.mergeWithDefaults(response.languages));
    } catch (error) {
      console.error('Could not load site content, using defaults.', error);
    } finally {
      this.loaded.set(true);
    }
  }

  async save(language: LanguageCode, content: SiteContent): Promise<void> {
    const response = await firstValueFrom(
      this.http.put<ContentResponse>(`${environment.apiUrl}/content/${language}`, content)
    );
    this.content.set(this.mergeWithDefaults(response.languages));
  }

  async reset(language: LanguageCode): Promise<SiteContent> {
    await this.save(language, DEFAULT_SITE_CONTENT[language]);
    return this.createEditableCopy(language);
  }

  /** Saved versions of all languages, newest first. */
  async listVersions(): Promise<ContentVersion[]> {
    const response = await firstValueFrom(
      this.http.get<{ versions: ContentVersion[] }>(`${environment.apiUrl}/content/versions`)
    );
    return response.versions;
  }

  /** Makes the given version the current content of its language (recorded as a new version). */
  async restoreVersion(id: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<ContentResponse>(`${environment.apiUrl}/content/versions/${encodeURIComponent(id)}/restore`, {})
    );
    this.content.set(this.mergeWithDefaults(response.languages));
  }

  /** Unpublished draft of the language saved on the server, or null. Missing sections are filled from defaults. */
  async getDraft(language: LanguageCode): Promise<ContentDraft | null> {
    const response = await firstValueFrom(
      this.http.get<{ draft: ContentDraft | null }>(`${environment.apiUrl}/content/drafts/${language}`)
    );
    const draft = response.draft;
    return draft ? { ...draft, content: { ...this.clone(DEFAULT_SITE_CONTENT[language]), ...draft.content } } : null;
  }

  async saveDraft(language: LanguageCode, content: SiteContent): Promise<ContentDraft> {
    const response = await firstValueFrom(
      this.http.put<{ draft: ContentDraft }>(`${environment.apiUrl}/content/drafts/${language}`, content)
    );
    return response.draft;
  }

  async deleteDraft(language: LanguageCode): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/content/drafts/${language}`));
  }

  /**
   * Last-chance draft save while the page is being closed or reloaded. HttpClient requests are
   * cancelled on unload; a `keepalive` fetch is allowed to finish (body limit 64 kB).
   */
  saveDraftOnUnload(language: LanguageCode, content: SiteContent, token: string): void {
    const body = JSON.stringify(content);
    if (body.length > 60_000) {
      return;
    }
    fetch(`${environment.apiUrl}/content/drafts/${language}`, {
      method: 'PUT',
      keepalive: true,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body
    }).catch(() => undefined);
  }

  /** Uploads an image and returns its public URL (e.g. `/uploads/123-abc.jpg`). */
  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append('image', file);
    const response = await firstValueFrom(
      this.http.post<{ url: string }>(`${environment.apiUrl}/uploads/images`, form)
    );
    return response.url;
  }

  createEditableCopy(language: LanguageCode): SiteContent {
    return this.clone(this.content()[language]);
  }

  /** True when the draft differs from what is currently published for the language. */
  isChanged(language: LanguageCode, draft: SiteContent): boolean {
    return JSON.stringify(draft) !== JSON.stringify(this.content()[language]);
  }

  /**
   * Paths of "*Url" fields the API would reject (same rule as the backend: empty,
   * an /uploads/ path or an absolute http(s) link), e.g. `work.items[2].videoUrl`.
   */
  findInvalidUrls(value: unknown, path = ''): string[] {
    if (Array.isArray(value)) {
      return value.flatMap((item, index) => this.findInvalidUrls(item, `${path}[${index}]`));
    }
    if (!value || typeof value !== 'object') {
      return [];
    }

    return Object.entries(value).flatMap(([key, child]) => {
      const childPath = path ? `${path}.${key}` : key;
      if (/url$/i.test(key) && typeof child === 'string') {
        return isAllowedUrl(child.trim()) ? [] : [childPath];
      }
      return this.findInvalidUrls(child, childPath);
    });
  }

  clone(content: SiteContent): SiteContent {
    return JSON.parse(JSON.stringify(content)) as SiteContent;
  }

  private mergeWithDefaults(languages: ContentResponse['languages']): LocalizedSiteContent {
    return {
      en: { ...this.clone(DEFAULT_SITE_CONTENT.en), ...languages?.en },
      pl: { ...this.clone(DEFAULT_SITE_CONTENT.pl), ...languages?.pl }
    };
  }

  private cloneLocalized(content: LocalizedSiteContent): LocalizedSiteContent {
    return JSON.parse(JSON.stringify(content)) as LocalizedSiteContent;
  }
}

function isAllowedUrl(value: string): boolean {
  if (value === '' || /^\/uploads\/[A-Za-z0-9._-]+$/.test(value)) {
    return true;
  }
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
