import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AlertService } from '../../../core/services/alert.service';
import { ApiErrorService } from '../../../core/services/api-error.service';

import { AuthService } from '../../auth/services/auth.service';
import { ProfileService } from '../../profile/services/profile.service';

import { NotificationType, TaskNotification } from '../models/notification.models';

import { NotificationApiService } from './notification-api.service';
import { NotificationSocketService } from './notification-socket.service';
const RECENT_NOTIFICATION_LIMIT = 8;

/*
 * User-management notifications are sent to all active
 * Admins, including the Admin who performed the action.
 *
 * The notification remains in the bell dropdown, but the
 * acting Admin does not need a second real-time toast.
 */
const USER_MANAGEMENT_NOTIFICATION_TYPES:
  ReadonlySet<NotificationType> =
    new Set<NotificationType>([
      'USER_CREATED',
      'USER_UPDATED',
      'USER_STATUS_CHANGED'
    ]);

/*
 * Owns shared notification application state.
 *
 * Responsibilities:
 * - Loads persisted notifications through REST
 * - Starts and stops real-time delivery
 * - Prevents duplicate notifications
 * - Maintains unread count
 * - Synchronizes after WebSocket reconnection
 * - Suppresses duplicate self-action toasts
 *
 * REST and STOMP implementation details remain
 * inside their dedicated services.
 */
@Injectable({
  providedIn: 'root'
})
export class AppNotificationService {

  private readonly apiService =
    inject(NotificationApiService);

  private readonly socketService =
    inject(NotificationSocketService);

  private readonly alertService =
    inject(AlertService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  private readonly authService =
    inject(AuthService);

  private readonly profileService =
    inject(ProfileService);

  private readonly notificationsSignal =
    signal<TaskNotification[]>([]);

  private readonly unreadCountSignal =
    signal(0);

  private readonly isLoadingSignal =
    signal(false);

  /*
   * Prevents an older unread-count response from
   * overwriting newer WebSocket changes.
   */
  private unreadMutationVersion = 0;

  readonly notifications =
    this.notificationsSignal.asReadonly();

  readonly unreadCount =
    this.unreadCountSignal.asReadonly();

  readonly isLoading =
    this.isLoadingSignal.asReadonly();

  readonly realtimeConnected =
    this.socketService.connected;

  /*
   * Called when the authenticated application
   * layout starts.
   */
  initialize(): void {
    this.connectRealtime();
    this.refresh();
  }

  refresh(): void {
    this.loadRecentNotifications();
    this.loadUnreadCount();
  }

  loadRecentNotifications(): void {
    this.isLoadingSignal.set(true);

    this.apiService
      .getNotifications(
        0,
        RECENT_NOTIFICATION_LIMIT
      )
      .pipe(
        finalize(() => {
          this.isLoadingSignal.set(false);
        })
      )
      .subscribe({
        next: response => {
          /*
           * Merge rather than replace so a live notification
           * received during the HTTP request is not lost.
           */
          this.notificationsSignal.update(
            existingNotifications =>
              this.mergeNotifications(
                response.content,
                existingNotifications
              )
          );
        },

        error: () => {
          /*
           * Notification loading should not block the
           * authenticated application layout.
           *
           * Keep any notifications already received
           * through WebSocket.
           */
        }
      });
  }

  loadUnreadCount(): void {
    const requestVersion =
      this.unreadMutationVersion;

    this.apiService
      .getUnreadCount()
      .subscribe({
        next: response => {
          /*
           * Ignore a stale response when a notification
           * was received or marked as read after this
           * request started.
           */
          if (
            requestVersion !==
            this.unreadMutationVersion
          ) {
            return;
          }

          this.unreadCountSignal.set(
            response.unreadCount
          );
        },

        error: () => {
          /*
           * Preserve the existing count because it may
           * already contain WebSocket updates.
           */
        }
      });
  }

  markAsRead(
    notificationId: number
  ): void {
    const existingNotification =
      this.notificationsSignal()
        .find(
          notification =>
            notification.id ===
            notificationId
        );

    if (
      !existingNotification ||
      existingNotification.read
    ) {
      return;
    }

    this.apiService
      .markAsRead(notificationId)
      .subscribe({
        next: updatedNotification => {
          this.unreadMutationVersion++;

          this.notificationsSignal.update(
            notifications =>
              notifications.map(
                notification =>
                  notification.id ===
                  updatedNotification.id
                    ? updatedNotification
                    : notification
              )
          );

          this.unreadCountSignal.update(
            count =>
              Math.max(
                0,
                count - 1
              )
          );
        },

        error: error => {
          this.alertService.error(
            this.apiErrorService.getMessage(
              error,
              'Unable to mark the notification as read.'
            )
          );
        }
      });
  }

  /*
   * Adds a notification received through WebSocket.
   *
   * Every notification remains in the dropdown and
   * contributes to the unread count.
   *
   * Only the duplicate toast for an Admin's own
   * user-management action is suppressed.
   */
  addReceivedNotification(
    notification: TaskNotification
  ): void {
    const alreadyExists =
      this.notificationsSignal()
        .some(
          existingNotification =>
            existingNotification.id ===
            notification.id
        );

    if (alreadyExists) {
      return;
    }

    this.unreadMutationVersion++;

    this.notificationsSignal.update(
      existingNotifications =>
        this.mergeNotifications(
          [notification],
          existingNotifications
        )
    );

    if (!notification.read) {
      this.unreadCountSignal.update(
        count => count + 1
      );
    }

    if (
      this.shouldShowRealtimeToast(
        notification
      )
    ) {
      this.alertService.info(
        notification.message,
        notification.title
      );
    }
  }

  connectRealtime(): void {
    this.socketService.connect(
      notification => {
        this.addReceivedNotification(
          notification
        );
      },

      () => {
        /*
         * Recover notifications created while the
         * WebSocket connection was unavailable.
         */
        this.refresh();
      }
    );
  }

  disconnectRealtime(): void {
    void this.socketService.disconnect();
  }

  clear(): void {
    this.disconnectRealtime();

    this.notificationsSignal.set([]);
    this.unreadCountSignal.set(0);
    this.isLoadingSignal.set(false);

    this.unreadMutationVersion = 0;
  }

  /*
   * Returns false only when:
   *
   * 1. The notification is a user-management event.
   * 2. Its message begins with the currently signed-in
   *    Admin's full name.
   *
   * Examples:
   * "System Administrator updated user 'rami.user'."
   * "System Administrator changed user 'rami.user'..."
   *
   * Other Admins have different names, so they continue
   * receiving the real-time toast.
   */
  private shouldShowRealtimeToast(
    notification: TaskNotification
  ): boolean {
    if (
      !USER_MANAGEMENT_NOTIFICATION_TYPES.has(
        notification.type
      )
    ) {
      return true;
    }

    const currentFullName =
      this.profileService.profile()
        ?.fullName ??
      this.authService.currentUser()
        ?.fullName ??
      '';

    const normalizedCurrentName =
      currentFullName
        .trim()
        .toLowerCase();

    if (!normalizedCurrentName) {
      return true;
    }

    const normalizedMessage =
      notification.message
        .trim()
        .toLowerCase();

    const notificationWasCreatedByCurrentUser =
      normalizedMessage.startsWith(
        `${normalizedCurrentName} `
      );

    return !notificationWasCreatedByCurrentUser;
  }

  private mergeNotifications(
    first:
      readonly TaskNotification[],

    second:
      readonly TaskNotification[]
  ): TaskNotification[] {
    const notificationsById =
      new Map<
        number,
        TaskNotification
      >();

    for (
      const notification of [
        ...first,
        ...second
      ]
    ) {
      /*
       * The first occurrence is authoritative.
       *
       * REST results are passed first during refresh,
       * allowing persisted read states to replace
       * older local values.
       */
      if (
        !notificationsById.has(
          notification.id
        )
      ) {
        notificationsById.set(
          notification.id,
          notification
        );
      }
    }

    return [
      ...notificationsById.values()
    ]
      .sort(
        (
          firstNotification,
          secondNotification
        ) =>
          new Date(
            secondNotification.createdAt
          ).getTime() -
          new Date(
            firstNotification.createdAt
          ).getTime()
      )
      .slice(
        0,
        RECENT_NOTIFICATION_LIMIT
      );
  }
}