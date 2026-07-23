import { Component, ChangeDetectionStrategy, OnInit, input, output, inject, signal, computed, HostListener } from "@angular/core";
import { ValidatorFn, AbstractControl, ReactiveFormsModule, NonNullableFormBuilder, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import { AlertService } from "../../../../core/services/alert.service";
import { ApiErrorService } from "../../../../core/services/api-error.service";
import { FormErrorService } from "../../../../core/services/form-error.service";
import { UserResponse, UserRole, UserStatus, CreateUserRequest, UpdateUserRequest } from "../../models/user.models";
import { UserService } from "../../services/user.service";


const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,100}$/;

/*
 * Validates password confirmation at form-group level.
 */
const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl
) => {
  const password =
    control.get('password')?.value as string;

  const confirmation =
    control.get('confirmPassword')
      ?.value as string;

  if (!password && !confirmation) {
    return null;
  }

  return password === confirmation
    ? null
    : {
        passwordMismatch: true
      };
};

/*
 * Reusable user form for create and edit operations.
 *
 * Responsibilities:
 * - Form construction
 * - Client-side validation
 * - Submission coordination
 * - Dialog interaction
 *
 * HTTP calls remain in UserService.
 * Backend field mapping remains in FormErrorService.
 */
@Component({
  selector: 'app-user-form-dialog',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl:
    './user-form-dialog.html',
  styleUrl:
    './user-form-dialog.css',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class UserFormDialog
  implements OnInit {

  readonly user =
    input<UserResponse | null>(null);

  readonly closed =
    output<void>();

  readonly saved =
    output<void>();

  private readonly formBuilder =
    inject(NonNullableFormBuilder);

  private readonly userService =
    inject(UserService);

  private readonly alertService =
    inject(AlertService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  private readonly formErrorService =
    inject(FormErrorService);

  readonly isSubmitting =
    signal(false);

  readonly showPassword =
    signal(false);

  readonly showConfirmation =
    signal(false);

  readonly formError =
    signal<string | null>(null);

  readonly roles: readonly UserRole[] = [
    'ADMIN',
    'USER'
  ];

  readonly statuses:
    readonly UserStatus[] = [
      'ACTIVE',
      'INACTIVE'
    ];

  readonly isEditMode =
    computed(() => this.user() !== null);

  readonly userForm =
    this.formBuilder.group(
      {
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(50),
            Validators.pattern(
              /^[A-Za-z0-9._-]+$/
            )
          ]
        ],

        fullName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100)
          ]
        ],

        email: [
          '',
          [
            Validators.required,
            Validators.email,
            Validators.maxLength(150)
          ]
        ],

        password: [
          '',
          [
            Validators.maxLength(100),
            Validators.pattern(
              STRONG_PASSWORD_PATTERN
            )
          ]
        ],

        confirmPassword: [
          '',
          [
            Validators.maxLength(100)
          ]
        ],

        role: [
          'USER' as UserRole,
          [
            Validators.required
          ]
        ],

        status: [
          'ACTIVE' as UserStatus,
          [
            Validators.required
          ]
        ]
      },
      {
        validators:
          passwordsMatchValidator
      }
    );

  ngOnInit(): void {
    this.initializeForm();
  }

  @HostListener(
    'document:keydown.escape'
  )
  handleEscape(): void {
    this.close();
  }

  togglePassword(): void {
    this.showPassword.update(
      visible => !visible
    );
  }

  toggleConfirmation(): void {
    this.showConfirmation.update(
      visible => !visible
    );
  }

  close(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.closed.emit();
  }

  submit(): void {
    this.formError.set(null);

    this.formErrorService
      .clearBackendErrors(
        this.userForm
      );

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue =
      this.userForm.getRawValue();

    const existingUser =
      this.user();

    if (existingUser) {
      this.updateExistingUser(
        existingUser,
        formValue
      );

      return;
    }

    this.createNewUser(formValue);
  }

  getBackendError(
    fieldName: string
  ): string | null {
    return this.formErrorService
      .getBackendError(
        this.userForm.get(fieldName)
      );
  }

  private initializeForm(): void {
    const existingUser =
      this.user();

    if (existingUser) {
      this.configurePasswordRequirement(
        false
      );

      this.userForm.reset({
        username:
          existingUser.username,
        fullName:
          existingUser.fullName,
        email:
          existingUser.email,
        password: '',
        confirmPassword: '',
        role:
          existingUser.role,
        status:
          existingUser.status
      });

      return;
    }

    this.configurePasswordRequirement(
      true
    );

    this.userForm.reset({
      username: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'USER',
      status: 'ACTIVE'
    });
  }

  /*
   * Password is mandatory when creating,
   * but optional when editing.
   */
  private configurePasswordRequirement(
    required: boolean
  ): void {
    const passwordControl =
      this.userForm.controls.password;

    const confirmationControl =
      this.userForm.controls
        .confirmPassword;

    const passwordValidators = [
      Validators.maxLength(100),
      Validators.pattern(
        STRONG_PASSWORD_PATTERN
      )
    ];

    const confirmationValidators = [
      Validators.maxLength(100)
    ];

    if (required) {
      passwordValidators.unshift(
        Validators.required
      );

      confirmationValidators.unshift(
        Validators.required
      );
    }

    passwordControl.setValidators(
      passwordValidators
    );

    confirmationControl.setValidators(
      confirmationValidators
    );

    passwordControl
      .updateValueAndValidity({
        emitEvent: false
      });

    confirmationControl
      .updateValueAndValidity({
        emitEvent: false
      });
  }

  private createNewUser(
    formValue: ReturnType<
      typeof this.userForm.getRawValue
    >
  ): void {
    const request:
      CreateUserRequest = {
        username:
          formValue.username.trim(),
        fullName:
          formValue.fullName.trim(),
        email:
          formValue.email
            .trim()
            .toLowerCase(),
        password:
          formValue.password,
        role:
          formValue.role,
        status:
          formValue.status
      };

    this.userService
      .createUser(request)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: createdUser => {
          this.alertService.success(
            `User '${createdUser.username}' was created successfully.`,
            'User created'
          );

          this.saved.emit();
        },

        error: error => {
          this.handleSubmissionError(
            error,
            'Unable to create the user.'
          );
        }
      });
  }

  private updateExistingUser(
    existingUser: UserResponse,
    formValue: ReturnType<
      typeof this.userForm.getRawValue
    >
  ): void {
    const request:
      UpdateUserRequest = {
        username:
          formValue.username.trim(),
        fullName:
          formValue.fullName.trim(),
        email:
          formValue.email
            .trim()
            .toLowerCase(),
        role:
          formValue.role,
        status:
          formValue.status
      };

    /*
     * Blank means preserve the current password.
     */
    if (formValue.password) {
      request.password =
        formValue.password;
    }

    this.userService
      .updateUser(
        existingUser.id,
        request
      )
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: updatedUser => {
          this.alertService.success(
            `User '${updatedUser.username}' was updated successfully.`,
            'User updated'
          );

          this.saved.emit();
        },

        error: error => {
          this.handleSubmissionError(
            error,
            'Unable to update the user.'
          );
        }
      });
  }

  private handleSubmissionError(
    error: unknown,
    fallbackMessage: string
  ): void {
    this.formErrorService
      .applyBackendErrors(
        this.userForm,
        error
      );

    this.formError.set(
      this.apiErrorService.getMessage(
        error,
        fallbackMessage
      )
    );
  }
}