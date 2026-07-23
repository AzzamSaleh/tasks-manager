import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiErrorResponse } from '../models/api-error.model';

/*
 * Converts backend and network errors into consistent,
 * user-friendly messages for the entire application.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiErrorService {

  /*
   * Returns the main message that should be displayed
   * in an alert or toast.
   */
  getMessage(
    error: unknown,
    fallbackMessage = 'An unexpected error occurred. Please try again.'
  ): string {

    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    /*
     * Angular uses status 0 for network-level failures,
     * including an unavailable backend or blocked CORS request.
     */
    if (error.status === 0) {
      return 'Cannot connect to the server. Check that the backend is running and the connection is configured correctly.';
    }

    const apiError = this.getApiError(error);

    /*
     * Prefer the friendly message returned by Spring Boot.
     */
    if (apiError?.message?.trim()) {
      return apiError.message;
    }

    /*
     * Fallback messages in case the server did not return
     * the normal ApiErrorResponse structure.
     */
    switch (error.status) {
      case 400:
        return 'The submitted information is invalid.';

      case 401:
        return 'Invalid username or password.';

      case 403:
        return 'You do not have permission to perform this action.';

      case 404:
        return 'The requested resource was not found.';

      case 409:
        return 'The submitted information conflicts with existing data.';

      case 500:
        return 'The server encountered an error. Please try again.';

      default:
        if (error.status >= 500) {
          return 'The server encountered an error. Please try again.';
        }

        return fallbackMessage;
    }
  }

  /*
   * Returns backend validation messages such as:
   *
   * {
   *   email: "Email format is invalid",
   *   password: "Password must contain at least 8 characters"
   * }
   */
  getFieldErrors(
    error: unknown
  ): Record<string, string> {

    if (!(error instanceof HttpErrorResponse)) {
      return {};
    }

    return this.getApiError(error)?.fieldErrors ?? {};
  }

  /*
   * Returns one validation message for a specific field.
   */
  getFieldError(
    error: unknown,
    fieldName: string
  ): string | null {

    const fieldErrors = this.getFieldErrors(error);

    return fieldErrors[fieldName] ?? null;
  }

  /*
   * Checks whether the error represents a network
   * or browser-level connection failure.
   */
  isConnectionError(error: unknown): boolean {
    return (
      error instanceof HttpErrorResponse &&
      error.status === 0
    );
  }

  /*
   * Safely checks whether the response body matches
   * the Spring Boot ApiErrorResponse structure.
   */
  private getApiError(
    error: HttpErrorResponse
  ): ApiErrorResponse | null {

    if (
      !error.error ||
      typeof error.error !== 'object'
    ) {
      return null;
    }

    return error.error as ApiErrorResponse;
  }
}
