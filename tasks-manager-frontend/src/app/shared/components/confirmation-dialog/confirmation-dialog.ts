import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { ConfirmationService } from '../../../core/services/confirmation.service';

/*
 * Displays the centralized application confirmation dialog.
 */
@Component({
  selector: 'app-confirmation-dialog',
  imports: [],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationDialog {

  readonly confirmationService =
    inject(ConfirmationService);

  accept(): void {
    this.confirmationService.accept();
  }

  cancel(): void {
    this.confirmationService.cancel();
  }

  /*
   * Escape is the safe cancel action.
   */
  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.confirmationService.state()) {
      this.cancel();
    }
  }
}
