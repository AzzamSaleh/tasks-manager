import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { LoginRequest, LoginResponse, UserRole } from '../models/auth.models';
/*
 * Manages authentication API operations.
 *
 * Authentication state is owned by TokenStorageService
 * so the interceptor, guards, and this service always
 * observe the same session.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http =
    inject(HttpClient);

  private readonly router =
    inject(Router);

  private readonly tokenStorage =
    inject(TokenStorageService);

  readonly session =
    this.tokenStorage.session;

  readonly currentUser =
    computed(() => {
      const session =
        this.session();

      if (!session) {
        return null;
      }

      return {
        username:
          session.username,

        fullName:
          session.fullName,

        role:
          session.role
      };
    });

  readonly isAuthenticated =
    computed(
      () => this.session() !== null
    );

  readonly isAdmin =
    computed(
      () =>
        this.session()?.role ===
        'ADMIN'
    );

  readonly isUser =
    computed(
      () =>
        this.session()?.role ===
        'USER'
    );

  /*
   * Sends credentials to the login endpoint and stores
   * the returned JWT session.
   */
  login(
    request: LoginRequest
  ): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${environment.apiUrl}/auth/login`,
        request
      )
      .pipe(
        tap(response => {
          this.tokenStorage
            .setSession(response);
        })
      );
  }

  /*
   * Calls the backend so logout can be recorded.
   *
   * Local authentication is cleared even when the backend
   * request fails or the JWT has already expired.
   */
  logout(): Observable<void> {
    return this.http
      .post<void>(
        `${environment.apiUrl}/auth/logout`,
        {}
      )
      .pipe(
        finalize(() => {
          this.clearSession();

          void this.router.navigate([
            '/login'
          ]);
        })
      );
  }

  /*
   * Used when an authenticated API request returns 401.
   */
  forceLogout(): void {
    this.clearSession();

    void this.router.navigate([
      '/login'
    ]);
  }

  /*
   * Redirects the authenticated user to the dashboard
   * associated with their role.
   */
  redirectByRole(
    role?: UserRole
  ): void {
    const currentRole =
      role ?? this.session()?.role;

    if (currentRole === 'ADMIN') {
      void this.router.navigate([
        '/admin'
      ]);

      return;
    }

    if (currentRole === 'USER') {
      void this.router.navigate([
        '/user'
      ]);

      return;
    }

    void this.router.navigate([
      '/login'
    ]);
  }

  private clearSession(): void {
    this.tokenStorage.clearSession();
  }
}