/*
 * Visual types supported by the centralized alert system.
 *
 * "danger" matches Bootstrap's danger alert class.
 */
export type AlertType =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info';

export interface AppAlert {
  id: number;
  type: AlertType;
  title: string;
  message: string;

  /*
   * A value of 0 keeps the alert visible
   * until the user closes it.
   */
  durationMilliseconds: number;
}