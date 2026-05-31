import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

const SESSION_STORAGE_KEY = 'cosmopolish-admin-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isLoggedIn = signal(this.readSession());

  login(username: string, password: string): boolean {
    const normalizedUsername = username.trim().toLowerCase();
    const configuredUsername = environment.adminUsername.trim().toLowerCase();
    const allowedUsernames = new Set([
      configuredUsername,
      configuredUsername.replace('adim', 'admin')
    ]);

    const authenticated =
      allowedUsernames.has(normalizedUsername) &&
      password === environment.adminPassword &&
      configuredUsername.length > 0 &&
      environment.adminPassword.length > 0;

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

  private readSession(): boolean {
    return localStorage.getItem(SESSION_STORAGE_KEY) === 'true';
  }
}
