import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

const SESSION_STORAGE_KEY = 'cosmopolish-admin-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isLoggedIn = signal(this.readSession());

  login(username: string, password: string): boolean {
    const normalizedUsername = username.trim().toLowerCase();
    const credentials = [
      {
        username: environment.adminUsername.trim().toLowerCase(),
        password: environment.adminPassword
      },
      {
        username: environment.adminUsername2.trim().toLowerCase(),
        password: environment.adminPassword2
      }
    ].filter((credential) => credential.username.length > 0 && credential.password.length > 0);

    const authenticated = credentials.some(
      (credential) =>
        credential.username === normalizedUsername && credential.password === password
    );

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
