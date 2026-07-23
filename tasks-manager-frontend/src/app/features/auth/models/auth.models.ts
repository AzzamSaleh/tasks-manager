/*
 * Roles returned by the Spring Boot backend.
 */
export type UserRole = 'ADMIN' | 'USER';

/*
 * Credentials submitted to:
 * POST /api/auth/login
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/*
 * Must match the existing Spring Boot LoginResponse DTO.
 */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  username: string;
  fullName: string;
  role: UserRole;
}

/*
 * Authentication information stored in the browser.
 */
export interface AuthSession {
  accessToken: string;
  tokenType: string;
  username: string;
  fullName: string;
  role: UserRole;
}