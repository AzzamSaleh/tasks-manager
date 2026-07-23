import { Injectable, signal } from '@angular/core';
import { AuthSession, LoginResponse } from '../../features/auth/models/auth.models';
/*
 * Centralizes authentication session storage.
 *
 * The shared Signal ensures AuthService, guards,
 * interceptors, and layout components use the same session.
 */
@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  private readonly storageKey = 'tasks-manager-auth-session';

  private readonly sessionSignal = signal<AuthSession | null>(this.readStoredSession());

  readonly session = this.sessionSignal.asReadonly();

  /*
   * Stores the successful login response.
   */
  setSession(response: LoginResponse): void {
    const session: AuthSession = {
      accessToken: response.accessToken,
      tokenType: response.tokenType,
      username: response.username,
      fullName: response.fullName,
      role: response.role
    };

    this.saveSession(session);
  }

  /*
   * Updates the stored identity after the user
   * changes their profile information.
   */
  updateProfileIdentity(username: string, fullName: string): void {
    const currentSession = this.sessionSignal();

    if (!currentSession) {
      return;
    }

    const updatedSession: AuthSession = {
      ...currentSession,
      username,
      fullName
    };

    this.saveSession(updatedSession);
  }

  getSession(): AuthSession | null {
    return this.sessionSignal();
  }

  getAccessToken(): string | null {
    return this.sessionSignal()?.accessToken ?? null;
  }

  getTokenType(): string {
    return this.sessionSignal()?.tokenType ?? 'Bearer';
  }

  hasSession(): boolean {
    return this.sessionSignal() !== null;
  }

  /*
   * Removes the persisted and in-memory session.
   */
  clearSession(): void {
    localStorage.removeItem(this.storageKey);
    this.sessionSignal.set(null);
  }

  /*
   * Saves the session and immediately updates
   * all components reading the shared Signal.
   */
  private saveSession(session: AuthSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.sessionSignal.set(session);
  }

  /*
   * Restores the session after browser refresh.
   */
  private readStoredSession(): AuthSession | null {
    const storedValue = localStorage.getItem(this.storageKey);

    if (!storedValue) {
      return null;
    }

    try {
      const parsedValue: unknown = JSON.parse(storedValue);

      if (!this.isValidSession(parsedValue)) {
        localStorage.removeItem(this.storageKey);
        return null;
      }

      return parsedValue;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private isValidSession(value: unknown): value is AuthSession {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const session = value as Partial<AuthSession>;
    const validRole = session.role === 'ADMIN' || session.role === 'USER';

    return (
      typeof session.accessToken === 'string' &&
      session.accessToken.length > 0 &&
      typeof session.tokenType === 'string' &&
      session.tokenType.length > 0 &&
      typeof session.username === 'string' &&
      session.username.length > 0 &&
      typeof session.fullName === 'string' &&
      validRole
    );
  }
}