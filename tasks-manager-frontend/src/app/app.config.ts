import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';

/*
 * Global Angular application configuration.
 *
 * Registers:
 * - Application routes
 * - HttpClient
 * - JWT authentication interceptor
 * - Global browser error listeners
 */
export const appConfig:
  ApplicationConfig = {
    providers: [
      provideBrowserGlobalErrorListeners(),

      provideRouter(routes),

      provideHttpClient(
        withInterceptors([
          authInterceptor
        ])
      )
    ]
  };
