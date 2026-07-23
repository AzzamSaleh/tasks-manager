import {
  TaskPriority,
  TaskSortDirection,
  TaskSortField,
  TaskStatus
} from '../models/task.models';

export interface TaskOption<T extends string> {
  value: T;
  label: string;
  icon: string;
  cssClass: string;
}

export interface TaskSortOption {
  value: string;
  label: string;
  field: TaskSortField;
  direction: TaskSortDirection;
}
/*
 * Centralized values prevent repeated magic strings
 * across forms, filters, tables, and details views.
 */
export const TASK_STATUS_OPTIONS:
  readonly TaskOption<TaskStatus>[] = [
    {
      value: 'PENDING',
      label: 'Pending',
      icon: 'bi-clock',
      cssClass: 'status-pending'
    },
    {
      value: 'IN_PROGRESS',
      label: 'In progress',
      icon: 'bi-arrow-repeat',
      cssClass: 'status-progress'
    },
    {
      value: 'COMPLETED',
      label: 'Completed',
      icon: 'bi-check2-circle',
      cssClass: 'status-completed'
    }
  ];

export const TASK_PRIORITY_OPTIONS:
  readonly TaskOption<TaskPriority>[] = [
    {
      value: 'LOW',
      label: 'Low',
      icon: 'bi-arrow-down',
      cssClass: 'priority-low'
    },
    {
      value: 'MEDIUM',
      label: 'Medium',
      icon: 'bi-dash',
      cssClass: 'priority-medium'
    },
    {
      value: 'HIGH',
      label: 'High',
      icon: 'bi-arrow-up',
      cssClass: 'priority-high'
    }
  ];

export const TASK_STATUSES:
  readonly TaskStatus[] =
    TASK_STATUS_OPTIONS.map(
      option => option.value
    );

export const TASK_PRIORITIES:
  readonly TaskPriority[] =
    TASK_PRIORITY_OPTIONS.map(
      option => option.value
    );

export const TASK_STATUS_META:
  Readonly<
    Record<
      TaskStatus,
      TaskOption<TaskStatus>
    >
  > = {
    PENDING: TASK_STATUS_OPTIONS[0],
    IN_PROGRESS: TASK_STATUS_OPTIONS[1],
    COMPLETED: TASK_STATUS_OPTIONS[2]
  };

export const TASK_PRIORITY_META:
  Readonly<
    Record<
      TaskPriority,
      TaskOption<TaskPriority>
    >
  > = {
    LOW: TASK_PRIORITY_OPTIONS[0],
    MEDIUM: TASK_PRIORITY_OPTIONS[1],
    HIGH: TASK_PRIORITY_OPTIONS[2]
  };

export const TASK_SORT_OPTIONS:
  readonly TaskSortOption[] = [
    {
      value: 'dueDate,asc',
      label: 'Due date: earliest',
      field: 'dueDate',
      direction: 'asc'
    },
    {
      value: 'dueDate,desc',
      label: 'Due date: latest',
      field: 'dueDate',
      direction: 'desc'
    },
    {
      value: 'createdAt,desc',
      label: 'Newest created',
      field: 'createdAt',
      direction: 'desc'
    },
    {
      value: 'createdAt,asc',
      label: 'Oldest created',
      field: 'createdAt',
      direction: 'asc'
    },
    {
      value: 'title,asc',
      label: 'Title: A–Z',
      field: 'title',
      direction: 'asc'
    }
  ];

export const DEFAULT_TASK_SORT =
  TASK_SORT_OPTIONS[0];