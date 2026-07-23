import { Injectable, inject, signal } from "@angular/core";
import { Client, StompSubscription, IMessage } from "@stomp/stompjs";

import { environment } from '../../../../environments/environment';
import { AuthService } from "../../auth/services/auth.service";
import { TaskNotification } from "../models/notification.models";

const NOTIFICATION_DESTINATION =
  '/user/queue/notifications';

const RECONNECT_DELAY_MS =
  5000;

const HEARTBEAT_INTERVAL_MS =
  10000;

/*
 * Owns the STOMP WebSocket lifecycle.
 *
 * Responsibilities:
 * - Supplies the current JWT during STOMP CONNECT
 * - Subscribes to the authenticated private queue
 * - Reconnects automatically
 * - Parses incoming notification messages
 *
 * This service does not own notification UI state.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationSocketService {

  private readonly authService =
    inject(AuthService);

  private client:
    Client | null = null;

  private subscription:
    StompSubscription | null = null;

  private notificationHandler:
    ((notification: TaskNotification) => void) |
    null = null;

  private reconnectHandler:
    (() => void) | null = null;

  private hasConnectedBefore =
    false;

  private readonly connectedSignal =
    signal(false);

  readonly connected =
    this.connectedSignal.asReadonly();

  connect(
    onNotification:
      (notification: TaskNotification) => void,

    onReconnected?: () => void
  ): void {
    this.notificationHandler =
      onNotification;

    this.reconnectHandler =
      onReconnected ?? null;

    /*
     * Client.activate() is idempotent, but this check
     * also prevents replacing an active client.
     */
    if (
      this.client?.active
    ) {
      return;
    }

    this.client =
      new Client({
        brokerURL:
          this.resolveWebSocketUrl(
            environment.wsUrl
          ),

        reconnectDelay:
          RECONNECT_DELAY_MS,

        heartbeatIncoming:
          HEARTBEAT_INTERVAL_MS,

        heartbeatOutgoing:
          HEARTBEAT_INTERVAL_MS,

        /*
         * The newest token is read before every
         * initial connection and reconnection.
         */
        beforeConnect:
          async () => {
            const session =
              this.authService.session();

            if (!session) {
              throw new Error(
                'Cannot connect notifications without an authenticated session.'
              );
            }

            if (!this.client) {
              return;
            }

            this.client.connectHeaders = {
              Authorization:
                `${session.tokenType} ${session.accessToken}`
            };
          },

        onConnect:
          () => {
            const isReconnect =
              this.hasConnectedBefore;

            this.hasConnectedBefore =
              true;

            this.connectedSignal.set(true);

            this.subscribeToNotifications();

            /*
             * REST synchronization after reconnect
             * recovers notifications that may have
             * been created while the socket was offline.
             */
            if (isReconnect) {
              this.reconnectHandler?.();
            }
          },

        onDisconnect:
          () => {
            this.connectedSignal.set(false);
          },

        onWebSocketClose:
          () => {
            this.connectedSignal.set(false);
            this.subscription = null;
          },

        onWebSocketError:
          () => {
            this.connectedSignal.set(false);
          },

        onStompError:
          () => {
            this.connectedSignal.set(false);
          }
      });

    this.client.activate();
  }

  async disconnect(): Promise<void> {
    this.notificationHandler = null;
    this.reconnectHandler = null;
    this.subscription = null;
    this.hasConnectedBefore = false;
    this.connectedSignal.set(false);

    const activeClient =
      this.client;

    this.client = null;

    if (!activeClient) {
      return;
    }

    await activeClient.deactivate();
  }

  private subscribeToNotifications():
    void {
    if (!this.client?.connected) {
      return;
    }

    this.subscription =
      this.client.subscribe(
        NOTIFICATION_DESTINATION,
        message => {
          this.handleMessage(message);
        }
      );
  }

  private handleMessage(
    message: IMessage
  ): void {
    if (!message.body) {
      return;
    }

    try {
      const notification =
        JSON.parse(
          message.body
        ) as TaskNotification;

      if (
        !this.isValidNotification(
          notification
        )
      ) {
        return;
      }

      this.notificationHandler?.(
        notification
      );
    } catch {
      /*
       * Invalid socket payloads are ignored instead
       * of breaking the complete notification stream.
       */
    }
  }

  private isValidNotification(
    notification:
      Partial<TaskNotification>
  ): notification is TaskNotification {
    return (
      typeof notification.id ===
      'number' &&
      typeof notification.type ===
      'string' &&
      typeof notification.title ===
      'string' &&
      typeof notification.message ===
      'string' &&
      typeof notification.read ===
      'boolean' &&
      typeof notification.createdAt ===
      'string'
    );
  }
  /*
 * STOMP requires an absolute ws:// or wss:// URL.
 *
 * Local development already supplies an absolute URL.
 * A production value such as "/ws" is converted using
 * the currently opened frontend domain.
 */
private resolveWebSocketUrl(
  configuredUrl: string
): string {
  if (
    /^wss?:\/\//i.test(
      configuredUrl
    )
  ) {
    return configuredUrl;
  }

  const normalizedPath =
    configuredUrl.startsWith('/')
      ? configuredUrl
      : `/${configuredUrl}`;

  const protocol =
    window.location.protocol ===
    'https:'
      ? 'wss:'
      : 'ws:';

  return (
    `${protocol}//` +
    `${window.location.host}` +
    normalizedPath
  );
}
}