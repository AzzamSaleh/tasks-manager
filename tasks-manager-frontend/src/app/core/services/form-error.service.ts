import { inject, Injectable } from '@angular/core';
import { FormGroup, AbstractControl, FormArray } from '@angular/forms';
import { ApiErrorService } from './api-error.service';


/*
 * Centralizes backend field-error handling
 * for Angular Reactive Forms.
 *
 * ApiErrorService understands the backend response.
 * FormErrorService applies that response to form controls.
 */
@Injectable({
  providedIn: 'root'
})
export class FormErrorService {

  private readonly apiErrorService =
    inject(ApiErrorService);

  /*
   * Applies Spring Boot fieldErrors to their
   * corresponding Angular form controls.
   *
   * Example backend response:
   *
   * {
   *   "fieldErrors": {
   *     "email": "Email format is invalid"
   *   }
   * }
   */
  applyBackendErrors(
    form: FormGroup,
    error: unknown
  ): void {
    const fieldErrors =
      this.apiErrorService.getFieldErrors(error);

    Object.entries(fieldErrors)
      .forEach(([fieldName, message]) => {
        const control = form.get(fieldName);

        /*
         * Ignore fields that are not represented
         * by the current form.
         */
        if (!control) {
          return;
        }

        control.setErrors({
          ...control.errors,
          backend: message
        });

        control.markAsTouched();
      });
  }

  /*
   * Removes only backend errors while preserving
   * required, email, pattern, minlength, and other
   * client-side validation errors.
   */
  clearBackendErrors(
    control: AbstractControl
  ): void {
    if (
      control instanceof FormGroup ||
      control instanceof FormArray
    ) {
      Object.values(control.controls)
        .forEach(childControl => {
          this.clearBackendErrors(
            childControl
          );
        });

      return;
    }

    if (!control.errors?.['backend']) {
      return;
    }

    const {
      backend,
      ...remainingErrors
    } = control.errors;

    control.setErrors(
      Object.keys(remainingErrors).length > 0
        ? remainingErrors
        : null
    );
  }

  /*
   * Returns one backend error stored
   * on a form control.
   */
  getBackendError(
    control: AbstractControl | null
  ): string | null {
    const backendError =
      control?.getError('backend');

    return typeof backendError === 'string'
      ? backendError
      : null;
  }
}