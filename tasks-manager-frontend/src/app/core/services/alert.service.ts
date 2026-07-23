import { Injectable, signal } from '@angular/core';
import { AlertType, AppAlert } from '../models/alert.model';


/*
 * Provides centralized user feedback for the application.
 *
 * Components should use this service instead of creating
 * unrelated Bootstrap alerts in every page.
 */
@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private readonly alertsSignal =
    signal<AppAlert[]>([]);

  private nextAlertId = 1;

  /*
   * Exposes a read-only signal to presentation components.
   */
  readonly alerts =
    this.alertsSignal.asReadonly();

  success(
    message: string,
    title = 'Success'
  ): void {
    this.show(
      'success',
      title,
      message
    );
  }

  error(
    message: string,
    title = 'Action failed'
  ): void {
    this.show(
      'danger',
      title,
      message,
      6000
    );
  }

  warning(
    message: string,
    title = 'Please note'
  ): void {
    this.show(
      'warning',
      title,
      message,
      5500
    );
  }

  info(
    message: string,
    title = 'Information'
  ): void {
    this.show(
      'info',
      title,
      message
    );
  }

  /*
   * Creates a new alert and optionally removes
   * it automatically after a delay.
   */
  show(
    type: AlertType,
    title: string,
    message: string,
    durationMilliseconds = 4500
  ): void {
    const alert: AppAlert = {
      id: this.nextAlertId++,
      type,
      title,
      message,
      durationMilliseconds
    };

    this.alertsSignal.update(
      alerts => [
        ...alerts,
        alert
      ]
    );

    if (durationMilliseconds > 0) {
      setTimeout(
        () => this.dismiss(alert.id),
        durationMilliseconds
      );
    }
  }

  dismiss(alertId: number): void {
    this.alertsSignal.update(
      alerts =>
        alerts.filter(
          alert => alert.id !== alertId
        )
    );
  }

  clear(): void {
    this.alertsSignal.set([]);
  }
}
