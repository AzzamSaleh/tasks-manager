import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiErrorService } from '../../../../core/services/api-error.service';
/*
 * Login page for Admin and User accounts.
 *
 * Uses Reactive Forms for validation and Signals
 * for loading, password visibility, and error states.
 */
@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {

  private readonly formBuilder =
    inject(NonNullableFormBuilder);

  private readonly authService =
    inject(AuthService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  /*
   * Controls the submit-button loading state.
   */
  readonly isSubmitting = signal(false);

  /*
   * Controls whether the password input displays
   * plain text or hidden characters.
   */
  readonly showPassword = signal(false);

  /*
   * Contains the user-friendly error displayed
   * above the login form.
   */
  readonly errorMessage =
    signal<string | null>(null);

  /*
   * Login form with client-side validation.
   */
  readonly loginForm = this.formBuilder.group({
    username: [
      '',
      [
        Validators.required,
        Validators.maxLength(50)
      ]
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100)
      ]
    ]
  });

  /*
   * Shows or hides the entered password.
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(
      currentValue => !currentValue
    );
  }

  /*
   * Validates the form and sends credentials
   * to the Spring Boot login endpoint.
   */
  submit(): void {
    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const loginRequest =
      this.loginForm.getRawValue();

    this.authService
      .login(loginRequest)
      .pipe(
        /*
         * Runs after success or failure so the button
         * never remains permanently disabled.
         */
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: response => {
          /*
           * Admin goes to the Admin Dashboard.
           * User goes to the User Dashboard.
           */
          this.authService.redirectByRole(
            response.role
          );
        },

        error: error => {
          /*
           * The centralized service handles backend,
           * authentication, validation, CORS, and
           * network errors consistently.
           */
          this.errorMessage.set(
            this.apiErrorService.getMessage(
              error,
              'Unable to log in. Please try again.'
            )
          );
        }
      });
  }
}