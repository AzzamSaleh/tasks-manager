/*
 * Task values supported by the Spring Boot backend.
 */
export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type TaskPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export type TaskSortDirection =
  | 'asc'
  | 'desc';

export type TaskSortField =
  | 'dueDate'
  | 'createdAt'
  | 'title'
  | 'status';

export type TaskWorkspaceMode =
  | 'admin'
  | 'user';

export type TaskDueState =
  | 'completed'
  | 'overdue'
  | 'due-soon'
  | 'normal';

/*
 * Matches the TaskResponse DTO returned by Spring Boot.
 *
 * The User fields are flattened DTO fields, not exposed
 * JPA User entities.
 */
export interface TaskResponse {
  id: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;

  assignedUserId: number;
  assignedUserName: string;

  createdById: number;
  createdByName: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  assignedUserId: number;
}

export interface UpdateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedUserId: number;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface TaskSearchRequest {
  search?: string;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  assignedUserId?: number | null;

  page: number;
  size: number;

  sortField: TaskSortField;
  sortDirection: TaskSortDirection;
}
