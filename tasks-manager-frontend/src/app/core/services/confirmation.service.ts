import {
  Injectable,
  signal
} from '@angular/core';

import {
  ConfirmationOptions,
  ConfirmationState
} from '../models/confirmation.model';

/*
 * Provides one reusable confirmation dialog for
 * logout, deletion, deactivation, reassignment,
 * and other important operations.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {

  private readonly stateSignal =
    signal<ConfirmationState | null>(null);

  private resolver:
    ((confirmed: boolean) => void) | null = null;

  readonly state =
    this.stateSignal.asReadonly();

  /*
   * Opens the dialog and returns a Promise.
   *
   * The calling feature can use:
   *
   * const confirmed = await confirmationService.confirm(...);
   */
  confirm(
    options: ConfirmationOptions
  ): Promise<boolean> {

    /*
     * Safely cancel an older dialog if another
     * confirmation request is opened.
     */
    this.resolve(false);

    this.stateSignal.set({
      title: options.title,
      message: options.message,
      confirmText:
        options.confirmText ?? 'Confirm',
      cancelText:
        options.cancelText ?? 'Cancel',
      tone:
        options.tone ?? 'primary'
    });

    return new Promise<boolean>(
      resolve => {
        this.resolver = resolve;
      }
    );
  }

  accept(): void {
    this.resolve(true);
  }

  cancel(): void {
    this.resolve(false);
  }

  private resolve(
    confirmed: boolean
  ): void {
    if (this.resolver) {
      this.resolver(confirmed);
    }

    this.resolver = null;
    this.stateSignal.set(null);
  }
}