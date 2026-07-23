import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';
/*
 * Adds JWT authentication to backend API requests.
 *
 * It also clears the shared authentication state when
 * an authenticated request receives a 401 response.
 */
export const authInterceptor:
  HttpInterceptorFn = (
    request,
    next
  ) => {
    const tokenStorage =
      inject(TokenStorageService);

    const router =
      inject(Router);

    const accessToken =
      tokenStorage.getAccessToken();

    const tokenType =
      tokenStorage.getTokenType();

    const apiRequest =
      request.url.startsWith(
        environment.apiUrl
      );

    const loginRequest =
      request.url ===
      `${environment.apiUrl}/auth/login`;

    let outgoingRequest =
      request;

    if (
      apiRequest &&
      accessToken &&
      !loginRequest
    ) {
      outgoingRequest =
        request.clone({
          setHeaders: {
            Authorization:
              `${tokenType} ${accessToken}`
          }
        });
    }

    return next(
      outgoingRequest
    ).pipe(
      catchError(
        (error: unknown) => {
          if (
            error instanceof
              HttpErrorResponse &&
            error.status === 401 &&
            accessToken &&
            !loginRequest
          ) {
            /*
             * TokenStorageService now owns the shared
             * authentication Signal, so clearing it also
             * updates AuthService and all route guards.
             */
            tokenStorage.clearSession();

            void router.navigate([
              '/login'
            ]);
          }

          return throwError(
            () => error
          );
        }
      )
    );
  };