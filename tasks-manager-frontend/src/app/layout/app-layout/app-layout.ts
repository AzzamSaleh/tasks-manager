import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { finalize } from 'rxjs';

import { NavigationItem } from '../../core/models/navigation-item.model';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { ConfirmationService } from '../../core/services/confirmation.service';

import { AuthService } from '../../features/auth/services/auth.service';
import { AppNotificationService } from '../../features/notifications/services/notification.service';
import { ProfileService } from '../../features/profile/services/profile.service';

/*
 * Shared authenticated shell used by both Admin and User.
 *
 * Responsibilities:
 * - Responsive sidebar
 * - Role-based navigation
 * - Header identity
 * - Notification dropdown presentation
 * - User dropdown
 * - Authenticated child router outlet
 *
 * REST and WebSocket notification logic remain
 * inside the Notifications feature.
 */
@Component({
  selector: 'app-app-layout',
  imports: [
    DatePipe,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl:
    './app-layout.html',
  styleUrl:
    './app-layout.css',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class AppLayout
  implements OnInit {

  readonly authService =
    inject(AuthService);

  readonly notificationService =
    inject(AppNotificationService);

  private readonly confirmationService =
    inject(ConfirmationService);

  private readonly alertService =
    inject(AlertService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  private readonly profileService =
    inject(ProfileService);

  private readonly destroyRef =
    inject(DestroyRef);

  readonly sidebarOpen =
    signal(false);

  readonly notificationPanelOpen =
    signal(false);

  readonly userMenuOpen =
    signal(false);

  readonly headerProfile =
    this.profileService.profile;

  readonly displayedFullName =
    computed(() =>
      this.headerProfile()?.fullName ??
      this.authService
        .currentUser()?.fullName ??
      'User'
    );

  readonly displayedUsername =
    computed(() =>
      this.headerProfile()?.username ??
      this.authService
        .currentUser()?.username ??
      ''
    );

  readonly displayedRole =
    computed(() => {
      const role =
        this.headerProfile()?.role ??
        this.authService
          .currentUser()?.role;

      return role === 'ADMIN'
        ? 'Administrator'
        : 'User';
    });

  readonly displayedShortRole =
    computed(() => {
      const role =
        this.headerProfile()?.role ??
        this.authService
          .currentUser()?.role;

      return role === 'ADMIN'
        ? 'Admin'
        : 'User';
    });

  readonly displayedInitials =
    computed(() =>
      this.getInitials(
        this.displayedFullName()
      )
    );

  readonly navigationItems =
    computed<NavigationItem[]>(() => {
      if (
        this.authService.isAdmin()
      ) {
        return [
          {
            label: 'Dashboard',
            icon: 'bi-grid-1x2',
            route: '/admin'
          },
          {
            label: 'Users',
            icon: 'bi-people',
            route: '/admin/users'
          },
          {
            label: 'Tasks',
            icon: 'bi-list-check',
            route: '/admin/tasks'
          },
          {
            label: 'Activity Log',
            icon: 'bi-clock-history',
            route:
              '/admin/activity-logs'
          },
          {
            label: 'Profile',
            icon: 'bi-person-circle',
            route: '/profile'
          }
        ];
      }

      return [
        {
          label: 'Dashboard',
          icon: 'bi-grid-1x2',
          route: '/user'
        },
        {
          label: 'My Tasks',
          icon: 'bi-list-check',
          route: '/user/tasks'
        },
        {
          label: 'Profile',
          icon: 'bi-person-circle',
          route: '/profile'
        }
      ];
    });

  ngOnInit(): void {
    /*
     * Loads existing persisted notifications and
     * starts private real-time delivery.
     */
    this.notificationService.initialize();

    this.loadHeaderProfile();

    /*
     * AppNotificationService is application-scoped.
     * Disconnect when this authenticated layout is
     * destroyed so it does not survive logout.
     */
    this.destroyRef.onDestroy(() => {
      this.notificationService
        .disconnectRealtime();
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(
      current => !current
    );
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleNotifications(): void {
    this.notificationPanelOpen.update(
      current => !current
    );

    this.userMenuOpen.set(false);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(
      current => !current
    );

    this.notificationPanelOpen.set(false);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  markNotificationAsRead(
    notificationId: number
  ): void {
    this.notificationService
      .markAsRead(
        notificationId
      );
  }

  async requestLogout():
    Promise<void> {
    const confirmed =
      await this.confirmationService
        .confirm({
          title: 'Sign out?',
          message:
            'You will leave the current session and return to the login page. Any unsaved information on this page will be lost.',
          confirmText:
            'Sign out',
          cancelText:
            'Stay signed in',
          tone:
            'warning'
        });

    if (!confirmed) {
      return;
    }

    this.authService
      .logout()
      .pipe(
        finalize(() => {
          /*
           * clear() also disconnects the active
           * notification WebSocket.
           */
          this.notificationService.clear();
          this.profileService.clearProfile();

          this.sidebarOpen.set(false);
          this.notificationPanelOpen.set(
            false
          );
          this.userMenuOpen.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.alertService.success(
            'You have been signed out successfully.',
            'Signed out'
          );
        },

        error: error => {
          this.alertService.warning(
            this.apiErrorService.getMessage(
              error,
              'You were signed out locally, but the logout activity could not be recorded.'
            ),
            'Signed out locally'
          );
        }
      });
  }

  private loadHeaderProfile(): void {
    this.profileService
      .getProfile()
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        error: () => {
          /*
           * AuthService login-session information
           * remains available as a header fallback.
           */
        }
      });
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

    if (
      nameParts.length === 1
    ) {
      return nameParts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      nameParts[0]
        .charAt(0) +
      nameParts[
        nameParts.length - 1
      ].charAt(0)
    ).toUpperCase();
  }
}