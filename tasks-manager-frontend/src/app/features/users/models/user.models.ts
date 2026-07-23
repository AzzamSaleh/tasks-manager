/*
 * Roles supported by the Spring Boot backend.
 */
export type UserRole =
  | 'ADMIN'
  | 'USER';

/*
 * Account statuses supported by the backend.
 */
export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE';

/*
 * Matches the UserResponse DTO returned by Spring Boot.
 */
export interface UserResponse {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

/*
 * Submitted when Admin creates a new user.
 */
export interface CreateUserRequest {
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}

/*
 * Submitted when Admin edits an existing user.
 *
 * Password is optional during editing. When it is omitted,
 * the existing password remains unchanged.
 */
export interface UpdateUserRequest {
  username: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
}

/*
 * Filters accepted by:
 *
 * GET /api/users
 */
export interface UserSearchRequest {
  search?: string;
  role?: UserRole | null;
  status?: UserStatus | null;
  page: number;
  size: number;
}