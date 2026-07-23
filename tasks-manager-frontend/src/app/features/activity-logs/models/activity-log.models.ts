/*
 * Exact values supported by ActivityActionEnum
 * in the Spring Boot backend.
 */
export type ActivityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_UPDATED'
  | 'TASK_DELETED'
  | 'COMMENT_CREATED'
  | 'COMMENT_UPDATED'
  | 'COMMENT_DELETED'
  | 'PROFILE_UPDATED'
  | 'PASSWORD_CHANGED';

export type ActivityActorRole =
  | 'ADMIN'
  | 'USER';

/*
 * Matches ActivityLogResponse returned by Spring Boot.
 */
export interface ActivityLogResponse {
  id: number;
  actorUsername: string;
  actorRole: ActivityActorRole;
  action: ActivityAction;
  entityType: string;
  entityId: number | null;
  description: string;
  createdAt: string;
}

/*
 * Query supported by GET /api/activity-logs.
 *
 * The backend always applies createdAt DESC sorting.
 */
export interface ActivityLogSearchRequest {
  search?: string;
  action?: ActivityAction | null;
  page: number;
  size: number;
}