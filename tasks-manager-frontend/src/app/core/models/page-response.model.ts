/*
 * Matches the paginated response returned by Spring Data.
 *
 * This model will be reused for users, tasks,
 * notifications, comments, and activity logs.
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}