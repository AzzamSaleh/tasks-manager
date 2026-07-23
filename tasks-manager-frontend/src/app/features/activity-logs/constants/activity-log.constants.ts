import {
  ActivityAction
} from '../models/activity-log.models';

export interface ActivityActionMetadata {
  label: string;
  icon: string;
  cssClass: string;
}

export interface ActivityActionOption
  extends ActivityActionMetadata {

  value: ActivityAction;
}

/*
 * Used by the filter dropdown.
 */
export const ACTIVITY_ACTION_OPTIONS:
  readonly ActivityActionOption[] = [
    {
      value: 'LOGIN',
      label: 'Login',
      icon: 'bi-box-arrow-in-right',
      cssClass: 'action-authentication'
    },
    {
      value: 'LOGOUT',
      label: 'Logout',
      icon: 'bi-box-arrow-right',
      cssClass: 'action-authentication'
    },
    {
      value: 'USER_CREATED',
      label: 'User created',
      icon: 'bi-person-plus',
      cssClass: 'action-user'
    },
    {
      value: 'USER_UPDATED',
      label: 'User updated',
      icon: 'bi-person-gear',
      cssClass: 'action-user'
    },
    {
      value: 'USER_DELETED',
      label: 'User deleted',
      icon: 'bi-person-x',
      cssClass: 'action-danger'
    },
    {
      value: 'TASK_CREATED',
      label: 'Task created',
      icon: 'bi-plus-square',
      cssClass: 'action-task'
    },
    {
      value: 'TASK_UPDATED',
      label: 'Task updated',
      icon: 'bi-pencil-square',
      cssClass: 'action-task'
    },
    {
      value: 'TASK_STATUS_UPDATED',
      label: 'Task status updated',
      icon: 'bi-arrow-repeat',
      cssClass: 'action-task'
    },
    {
      value: 'TASK_DELETED',
      label: 'Task deleted',
      icon: 'bi-trash3',
      cssClass: 'action-danger'
    },
    {
      value: 'COMMENT_CREATED',
      label: 'Comment created',
      icon: 'bi-chat-left-text',
      cssClass: 'action-comment'
    },
    {
      value: 'COMMENT_UPDATED',
      label: 'Comment updated',
      icon: 'bi-chat-left-dots',
      cssClass: 'action-comment'
    },
    {
      value: 'COMMENT_DELETED',
      label: 'Comment deleted',
      icon: 'bi-chat-left-x',
      cssClass: 'action-danger'
    },
    {
      value: 'PROFILE_UPDATED',
      label: 'Profile updated',
      icon: 'bi-person-badge',
      cssClass: 'action-profile'
    },
    {
      value: 'PASSWORD_CHANGED',
      label: 'Password changed',
      icon: 'bi-shield-lock',
      cssClass: 'action-security'
    }
  ];

export const ACTIVITY_ACTIONS:
  readonly ActivityAction[] =
    ACTIVITY_ACTION_OPTIONS.map(
      option => option.value
    );

/*
 * Constant-time lookup used by the template.
 */
export const ACTIVITY_ACTION_META:
  Readonly<
    Record<
      ActivityAction,
      ActivityActionMetadata
    >
  > = {
    LOGIN: {
      label: 'Login',
      icon: 'bi-box-arrow-in-right',
      cssClass: 'action-authentication'
    },

    LOGOUT: {
      label: 'Logout',
      icon: 'bi-box-arrow-right',
      cssClass: 'action-authentication'
    },

    USER_CREATED: {
      label: 'User created',
      icon: 'bi-person-plus',
      cssClass: 'action-user'
    },

    USER_UPDATED: {
      label: 'User updated',
      icon: 'bi-person-gear',
      cssClass: 'action-user'
    },

    USER_DELETED: {
      label: 'User deleted',
      icon: 'bi-person-x',
      cssClass: 'action-danger'
    },

    TASK_CREATED: {
      label: 'Task created',
      icon: 'bi-plus-square',
      cssClass: 'action-task'
    },

    TASK_UPDATED: {
      label: 'Task updated',
      icon: 'bi-pencil-square',
      cssClass: 'action-task'
    },

    TASK_STATUS_UPDATED: {
      label: 'Task status updated',
      icon: 'bi-arrow-repeat',
      cssClass: 'action-task'
    },

    TASK_DELETED: {
      label: 'Task deleted',
      icon: 'bi-trash3',
      cssClass: 'action-danger'
    },

    COMMENT_CREATED: {
      label: 'Comment created',
      icon: 'bi-chat-left-text',
      cssClass: 'action-comment'
    },

    COMMENT_UPDATED: {
      label: 'Comment updated',
      icon: 'bi-chat-left-dots',
      cssClass: 'action-comment'
    },

    COMMENT_DELETED: {
      label: 'Comment deleted',
      icon: 'bi-chat-left-x',
      cssClass: 'action-danger'
    },

    PROFILE_UPDATED: {
      label: 'Profile updated',
      icon: 'bi-person-badge',
      cssClass: 'action-profile'
    },

    PASSWORD_CHANGED: {
      label: 'Password changed',
      icon: 'bi-shield-lock',
      cssClass: 'action-security'
    }
  };

/*
 * Converts values such as AUTHENTICATION and
 * TASK_STATUS into readable labels.
 */
export function formatActivityValue(
  value: string
): string {

  if (!value) {
    return 'Unknown';
  }

  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(word =>
      word.charAt(0).toUpperCase() +
      word.slice(1)
    )
    .join(' ');
}