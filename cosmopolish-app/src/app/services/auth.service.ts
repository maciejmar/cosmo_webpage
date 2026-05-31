import { Injectable, signal } from '@angular/core';

const SESSION_STORAGE_KEY = 'cosmopolish-admin-session';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isLoggedIn = signal(this.readSession());

  login(username: string, password: string): boolean {
    const authenticated = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

    if (authenticated) {
      localStorage.setItem(SESSION_STORAGE_KEY, 'true');
      this.isLoggedIn.set(true);
    }

    return authenticated;
  }

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.isLoggedIn.set(false);
  }

  getCredentialsHint(): { username: string; password: string } {
    return {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    };
  }

  private readSession(): boolean {
    return localStorage.getItem(SESSION_STORAGE_KEY) === 'true';
  }
}
