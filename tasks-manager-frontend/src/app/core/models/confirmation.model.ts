export type ConfirmationTone =
  | 'primary'
  | 'warning'
  | 'danger';

/*
 * Options supplied by the feature requesting confirmation.
 */
export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmationTone;
}

/*
 * Complete state consumed by the dialog component.
 */
export interface ConfirmationState {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  tone: ConfirmationTone;
}