import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ValidatorFn, AbstractControl, ValidationErrors, ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AlertService } from '../../../../core/services/alert.service';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { FormErrorService } from '../../../../core/services/form-error.service';
import { ProfileResponse, UpdateProfileRequest, ChangePasswordRequest } from '../../models/profile.models';
import { ProfileService } from '../../services/profile.service';
const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,100}$/;

type ProfileField =
  | 'fullName'
  | 'email';

type PasswordField =
  | 'currentPassword'
  | 'newPassword'
  | 'confirmPassword';

type ProfileTab =
  | 'personal'
  | 'security';

interface PasswordVisibility {
  currentPassword: boolean;
  newPassword: boolean;
  confirmPassword: boolean;
}

/*
 * Handles validation between related password fields.
 */
const passwordFormValidator:
  ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {

    const currentPassword =
      control.get('currentPassword')
        ?.value as string;

    const newPassword =
      control.get('newPassword')
        ?.value as string;

    const confirmPassword =
      control.get('confirmPassword')
        ?.value as string;

    const errors:
      ValidationErrors = {};

    if (
      newPassword &&
      confirmPassword &&
      newPassword !== confirmPassword
    ) {
      errors['passwordMismatch'] = true;
    }

    if (
      currentPassword &&
      newPassword &&
      currentPassword === newPassword
    ) {
      errors['sameAsCurrent'] = true;
    }

    return Object.keys(errors).length > 0
      ? errors
      : null;
  };

/*
 * Profile page available to Admin and User roles.
 *
 * The page uses one visible settings form at a time:
 * - Personal information
 * - Account security
 */
@Component({
  selector: 'app-profile-page',
  imports: [
    DatePipe,
    ReactiveFormsModule
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ProfilePage
  implements OnInit {

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly formBuilder =
    inject(NonNullableFormBuilder);

  private readonly profileService =
    inject(ProfileService);

  private readonly alertService =
    inject(AlertService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  private readonly formErrorService =
    inject(FormErrorService);

  readonly profile =
    signal<ProfileResponse | null>(null);

  readonly activeTab =
    signal<ProfileTab>('personal');

  readonly isLoading =
    signal(false);

  readonly loadError =
    signal<string | null>(null);

  readonly isSavingProfile =
    signal(false);

  readonly isChangingPassword =
    signal(false);

  readonly profileFormError =
    signal<string | null>(null);

  readonly passwordFormError =
    signal<string | null>(null);

  readonly passwordVisibility =
    signal<PasswordVisibility>({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    });

  readonly initials =
    computed(() =>
      this.getInitials(
        this.profile()?.fullName ?? ''
      )
    );

  readonly roleLabel =
    computed(() =>
      this.profile()?.role === 'ADMIN'
        ? 'Administrator'
        : 'Team member'
    );

  readonly statusLabel =
    computed(() =>
      this.profile()?.status === 'ACTIVE'
        ? 'Active'
        : 'Inactive'
    );

  readonly profileForm =
    this.formBuilder.group({
      fullName: [
        '',
        [
          Validators.required,
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
      ]
    });

  readonly passwordForm =
    this.formBuilder.group(
      {
        currentPassword: [
          '',
          [
            Validators.required,
            Validators.maxLength(100)
          ]
        ],

        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(100),
            Validators.pattern(
              STRONG_PASSWORD_PATTERN
            )
          ]
        ],

        confirmPassword: [
          '',
          [
            Validators.required,
            Validators.maxLength(100)
          ]
        ]
      },
      {
        validators:
          passwordFormValidator
      }
    );

  ngOnInit(): void {
    this.loadProfile();
  }

  selectTab(
    tab: ProfileTab
  ): void {
    this.activeTab.set(tab);
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.profileService
      .getProfile()
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        ),

        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: profile => {
          this.profile.set(profile);

          this.profileForm.reset({
            fullName:
              profile.fullName,

            email:
              profile.email
          });

          this.profileForm.markAsPristine();
        },

        error: error => {
          this.profile.set(null);

          this.loadError.set(
            this.apiErrorService.getMessage(
              error,
              'Unable to load your profile.'
            )
          );
        }
      });
  }

  submitProfile(): void {
    this.profileFormError.set(null);

    this.formErrorService
      .clearBackendErrors(
        this.profileForm
      );

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.profileForm.getRawValue();

    const request:
      UpdateProfileRequest = {
        fullName:
          formValue.fullName.trim(),

        email:
          formValue.email
            .trim()
            .toLowerCase()
      };

    this.isSavingProfile.set(true);

    this.profileService
      .updateProfile(request)
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        ),

        finalize(() => {
          this.isSavingProfile.set(false);
        })
      )
      .subscribe({
        next: updatedProfile => {
          this.profile.set(
            updatedProfile
          );

          this.profileForm.reset({
            fullName:
              updatedProfile.fullName,

            email:
              updatedProfile.email
          });

          this.profileForm.markAsPristine();

          this.alertService.success(
            'Your personal information was updated successfully.',
            'Profile updated'
          );
        },

        error: error => {
          this.formErrorService
            .applyBackendErrors(
              this.profileForm,
              error
            );

          this.profileFormError.set(
            this.apiErrorService.getMessage(
              error,
              'Unable to update your profile.'
            )
          );
        }
      });
  }

  submitPassword(): void {
    this.passwordFormError.set(null);

    this.formErrorService
      .clearBackendErrors(
        this.passwordForm
      );

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.passwordForm.getRawValue();

    const request:
      ChangePasswordRequest = {
        currentPassword:
          formValue.currentPassword,

        newPassword:
          formValue.newPassword,

        confirmPassword:
          formValue.confirmPassword
      };

    this.isChangingPassword.set(true);

    this.profileService
      .changePassword(request)
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        ),

        finalize(() => {
          this.isChangingPassword.set(
            false
          );
        })
      )
      .subscribe({
        next: () => {
          this.passwordForm.reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });

          this.passwordForm.markAsPristine();

          this.passwordVisibility.set({
            currentPassword: false,
            newPassword: false,
            confirmPassword: false
          });

          this.alertService.success(
            'Your password was changed successfully.',
            'Password changed'
          );
        },

        error: error => {
          this.formErrorService
            .applyBackendErrors(
              this.passwordForm,
              error
            );

          this.passwordFormError.set(
            this.apiErrorService.getMessage(
              error,
              'Unable to change your password.'
            )
          );
        }
      });
  }

  resetProfileForm(): void {
    const currentProfile =
      this.profile();

    if (!currentProfile) {
      return;
    }

    this.profileFormError.set(null);

    this.formErrorService
      .clearBackendErrors(
        this.profileForm
      );

    this.profileForm.reset({
      fullName:
        currentProfile.fullName,

      email:
        currentProfile.email
    });

    this.profileForm.markAsPristine();
  }

  resetPasswordForm(): void {
    this.passwordFormError.set(null);

    this.formErrorService
      .clearBackendErrors(
        this.passwordForm
      );

    this.passwordForm.reset({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    this.passwordForm.markAsPristine();

    this.passwordVisibility.set({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    });
  }

  togglePasswordVisibility(
    field: PasswordField
  ): void {
    this.passwordVisibility.update(
      visibility => ({
        ...visibility,
        [field]: !visibility[field]
      })
    );
  }

  isPasswordVisible(
    field: PasswordField
  ): boolean {
    return this.passwordVisibility()[
      field
    ];
  }

  profileBackendError(
    field: ProfileField
  ): string | null {
    return this.formErrorService
      .getBackendError(
        this.profileForm.controls[
          field
        ]
      );
  }

  passwordBackendError(
    field: PasswordField
  ): string | null {
    return this.formErrorService
      .getBackendError(
        this.passwordForm.controls[
          field
        ]
      );
  }

  hasLowercase(): boolean {
    return /[a-z]/.test(
      this.passwordForm.controls
        .newPassword.value
    );
  }

  hasUppercase(): boolean {
    return /[A-Z]/.test(
      this.passwordForm.controls
        .newPassword.value
    );
  }

  hasNumber(): boolean {
    return /\d/.test(
      this.passwordForm.controls
        .newPassword.value
    );
  }

  hasSpecialCharacter(): boolean {
    return /[^A-Za-z0-9\s]/.test(
      this.passwordForm.controls
        .newPassword.value
    );
  }

  hasMinimumLength(): boolean {
    return (
      this.passwordForm.controls
        .newPassword.value.length >= 8
    );
  }

  private getInitials(
    fullName: string
  ): string {
    const nameParts =
      fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (nameParts.length === 0) {
      return '?';
    }

    if (nameParts.length === 1) {
      return nameParts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      nameParts[0].charAt(0) +
      nameParts[
        nameParts.length - 1
      ].charAt(0)
    ).toUpperCase();
  }
}