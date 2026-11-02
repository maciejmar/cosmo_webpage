import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

const SESSION_STORAGE_KEY = 'cosmopolish-admin-session';

interface StoredSession {
  token: string;
  expiresAt: string;
  username: string;
}

interface LoginResponse {
  token: string;
  expiresAt: string;
  user: { username: string; role: string };
}

/**
 * Admin session backed by a JWT issued by cosmopolish-api.
 * The flag here only drives the UI - every write is authorized by the API.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private session: StoredSession | null = this.readSession();
  private expiryTimer?: ReturnType<typeof setTimeout>;

  readonly isLoggedIn = signal(this.session !== null);
  readonly username = signal(this.session?.username ?? '');

  constructor() {
    this.scheduleExpiry();
  }

  get token(): string | null {
    return this.session?.token ?? null;
  }

  /** Resolves `true` on success, `false` on wrong credentials; throws on other errors (e.g. API unreachable). */
  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      );
      this.setSession({ token: response.token, expiresAt: response.expiresAt, username: response.user.username });
      return true;
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 401) {
        return false;
      }
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    clearTimeout(this.expiryTimer);
    this.session = null;
    this.isLoggedIn.set(false);
    this.username.set('');
  }

  private setSession(session: StoredSession): void {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.session = session;
    this.isLoggedIn.set(true);
    this.username.set(session.username);
    this.scheduleExpiry();
  }

  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer);
    if (this.session) {
      const remaining = Date.parse(this.session.expiresAt) - Date.now();
      this.expiryTimer = setTimeout(() => this.logout(), Math.min(remaining, 2_147_483_647));
    }
  }

  private readSession(): StoredSession | null {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? 'null') as StoredSession | null;
      if (!session?.token || !(Date.parse(session.expiresAt) > Date.now())) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }
}
