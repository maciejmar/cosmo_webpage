import { Injectable, signal } from '@angular/core';
import { DEFAULT_SITE_CONTENT, SiteContent } from '../models/site-content';

const CONTENT_STORAGE_KEY = 'cosmopolish-site-content';

@Injectable({ providedIn: 'root' })
export class ContentService {
  readonly content = signal<SiteContent>(this.readContent());

  save(content: SiteContent): void {
    const snapshot = this.clone(content);
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(snapshot));
    this.content.set(snapshot);
  }

  reset(): SiteContent {
    const snapshot = this.clone(DEFAULT_SITE_CONTENT);
    localStorage.removeItem(CONTENT_STORAGE_KEY);
    this.content.set(snapshot);
    return snapshot;
  }

  createEditableCopy(): SiteContent {
    return this.clone(this.content());
  }

  private readContent(): SiteContent {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (!raw) {
      return this.clone(DEFAULT_SITE_CONTENT);
    }

    try {
      return {
        ...this.clone(DEFAULT_SITE_CONTENT),
        ...JSON.parse(raw)
      } as SiteContent;
    } catch {
      return this.clone(DEFAULT_SITE_CONTENT);
    }
  }

  private clone(content: SiteContent): SiteContent {
    return JSON.parse(JSON.stringify(content)) as SiteContent;
  }
}
