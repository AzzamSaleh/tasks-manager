import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlertType } from '../../../core/models/alert.model';
import { AlertService } from '../../../core/services/alert.service';


/*
 * Displays alerts created by AlertService.
 *
 * This component is placed once in the root App component.
 */
@Component({
  selector: 'app-alert-container',
  imports: [],
  templateUrl: './alert-container.html',
  styleUrl: './alert-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertContainer {

  readonly alertService =
    inject(AlertService);

  readonly iconByType: Record<AlertType, string> = {
    success: 'bi-check-circle-fill',
    danger: 'bi-exclamation-octagon-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill'
  };

  dismiss(alertId: number): void {
    this.alertService.dismiss(alertId);
  }
}
