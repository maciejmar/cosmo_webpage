import { Injectable, signal } from '@angular/core';
import { DEFAULT_SITE_CONTENT, LanguageCode, LocalizedSiteContent, SiteContent } from '../models/site-content';

const CONTENT_STORAGE_KEY = 'cosmopolish-site-content';

@Injectable({ providedIn: 'root' })
export class ContentService {
  readonly content = signal<LocalizedSiteContent>(this.readContent());

  save(language: LanguageCode, content: SiteContent): void {
    const snapshot = this.cloneLocalized(this.content());
    snapshot[language] = this.clone(content);
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(snapshot));
    this.content.set(snapshot);
  }

  reset(language: LanguageCode): SiteContent {
    const snapshot = this.cloneLocalized(this.content());
    snapshot[language] = this.clone(DEFAULT_SITE_CONTENT[language]);
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(snapshot));
    this.content.set(snapshot);
    return this.clone(snapshot[language]);
  }

  createEditableCopy(language: LanguageCode): SiteContent {
    return this.clone(this.content()[language]);
  }

  private readContent(): LocalizedSiteContent {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (!raw) {
      return this.cloneLocalized(DEFAULT_SITE_CONTENT);
    }

    try {
      const parsed = JSON.parse(raw) as Partial<LocalizedSiteContent | SiteContent>;

      if ('hero' in parsed) {
        return {
          en: this.clone(parsed as SiteContent),
          pl: this.clone(DEFAULT_SITE_CONTENT.pl)
        };
      }

      const localized = parsed as Partial<LocalizedSiteContent>;
      return {
        en: {
          ...this.clone(DEFAULT_SITE_CONTENT.en),
          ...localized.en
        },
        pl: {
          ...this.clone(DEFAULT_SITE_CONTENT.pl),
          ...localized.pl
        }
      };
    } catch {
      return this.cloneLocalized(DEFAULT_SITE_CONTENT);
    }
  }

  private clone(content: SiteContent): SiteContent {
    return JSON.parse(JSON.stringify(content)) as SiteContent;
  }

  private cloneLocalized(content: LocalizedSiteContent): LocalizedSiteContent {
    return JSON.parse(JSON.stringify(content)) as LocalizedSiteContent;
  }
}
