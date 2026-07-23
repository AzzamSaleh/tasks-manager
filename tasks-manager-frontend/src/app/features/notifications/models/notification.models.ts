/*
 * Exact notification types currently returned
 * by the Spring Boot backend.
 */
export type NotificationType =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_STATUS_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_REASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_UPDATED'
  | 'TASK_DELETED'
  | 'COMMENT_ADDED';

export interface TaskNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;

  /*
   * User-management notifications have no related Task,
   * so this field is null for those notification types.
   */
  taskId: number | null;

  read: boolean;
  createdAt: string;
}

export interface UnreadNotificationCountResponse {
  unreadCount: number;
}