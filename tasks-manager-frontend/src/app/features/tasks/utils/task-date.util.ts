import { TaskResponse, TaskDueState } from "../models/task.models";

const DUE_SOON_HOURS = 48;
const MILLISECONDS_PER_HOUR =
  60 * 60 * 1000;

/*
 * Pure functions are easier to reuse and test than
 * date calculations embedded inside components.
 */
export function getTaskDueState(
  task: TaskResponse,
  now = new Date()
): TaskDueState {

  if (task.status === 'COMPLETED') {
    return 'completed';
  }

  const dueDate =
    new Date(task.dueDate);

  const dueTimestamp =
    dueDate.getTime();

  if (Number.isNaN(dueTimestamp)) {
    return 'normal';
  }

  const difference =
    dueTimestamp - now.getTime();

  if (difference < 0) {
    return 'overdue';
  }

  const dueSoonLimit =
    DUE_SOON_HOURS *
    MILLISECONDS_PER_HOUR;

  if (difference <= dueSoonLimit) {
    return 'due-soon';
  }

  return 'normal';
}

export function getTaskDueLabel(
  state: TaskDueState
): string {

  const labels:
    Record<TaskDueState, string> = {
      completed: 'Completed',
      overdue: 'Overdue',
      'due-soon': 'Due soon',
      normal: 'On schedule'
    };

  return labels[state];
}

/*
 * Converts a Spring LocalDateTime string into the
 * value expected by an HTML datetime-local input.
 */
export function toDateTimeLocalValue(
  value: string
): string {

  if (!value) {
    return '';
  }

  /*
   * Spring LocalDateTime normally returns:
   * 2026-07-25T14:30:00
   */
  return value.slice(0, 16);
}

/*
 * Adds seconds for a consistent LocalDateTime request.
 */
export function toApiLocalDateTime(
  value: string
): string {

  if (!value) {
    return value;
  }

  return value.length === 16
    ? `${value}:00`
    : value;
}