import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertContainer } from './shared/components/alert-container/alert-container';
import { ConfirmationDialog } from './shared/components/confirmation-dialog/confirmation-dialog';

/*
 * Root application component.
 *
 * Global alerts and confirmations are mounted here
 * so they remain available during route changes.
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AlertContainer,
    ConfirmationDialog
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
}