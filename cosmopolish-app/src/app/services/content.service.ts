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

  private mergeWithDefaults(languages: ContentResponse['languages']): LocalizedSiteContent {
    return {
      en: { ...this.clone(DEFAULT_SITE_CONTENT.en), ...languages?.en },
      pl: { ...this.clone(DEFAULT_SITE_CONTENT.pl), ...languages?.pl }
    };
  }

  private clone(content: SiteContent): SiteContent {
    return JSON.parse(JSON.stringify(content)) as SiteContent;
  }

  private cloneLocalized(content: LocalizedSiteContent): LocalizedSiteContent {
    return JSON.parse(JSON.stringify(content)) as LocalizedSiteContent;
  }
}
