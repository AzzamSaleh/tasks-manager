export type ProfileRole =
  | 'ADMIN'
  | 'USER';

export type ProfileStatus =
  | 'ACTIVE'
  | 'INACTIVE';

/*
 * Matches ProfileResponse returned by Spring Boot.
 */
export interface ProfileResponse {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: ProfileRole;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
}

/*
 * PUT /api/profile
 */
export interface UpdateProfileRequest {
  fullName: string;
  email: string;
}

/*
 * PATCH /api/profile/password
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}