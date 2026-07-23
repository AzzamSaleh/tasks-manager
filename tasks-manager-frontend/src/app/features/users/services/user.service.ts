import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../core/models/page-response.model';
import { UserSearchRequest, UserResponse, CreateUserRequest, UpdateUserRequest } from '../models/user.models';

/*
 * Contains HTTP communication for Admin
 * user-management operations.
 *
 * Authentication is handled globally by the JWT interceptor.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly http =
    inject(HttpClient);

  private readonly usersUrl =
    `${environment.apiUrl}/users`;

  /*
   * Returns a paginated and filtered user list.
   */
  getUsers(
    request: UserSearchRequest
  ): Observable<PageResponse<UserResponse>> {

    let params = new HttpParams()
      .set('page', request.page)
      .set('size', request.size);

    const search = request.search?.trim();

    if (search) {
      params = params.set('search', search);
    }

    if (request.role) {
      params = params.set('role', request.role);
    }

    if (request.status) {
      params = params.set(
        'status',
        request.status
      );
    }

    return this.http.get<PageResponse<UserResponse>>(
      this.usersUrl,
      {
        params
      }
    );
  }

  /*
   * Returns one user by database ID.
   */
  getUserById(
    userId: number
  ): Observable<UserResponse> {

    return this.http.get<UserResponse>(
      `${this.usersUrl}/${userId}`
    );
  }

  /*
   * Creates a new user account.
   */
  createUser(
    request: CreateUserRequest
  ): Observable<UserResponse> {

    return this.http.post<UserResponse>(
      this.usersUrl,
      request
    );
  }

  /*
   * Updates an existing user.
   */
  updateUser(
    userId: number,
    request: UpdateUserRequest
  ): Observable<UserResponse> {

    return this.http.put<UserResponse>(
      `${this.usersUrl}/${userId}`,
      request
    );
  }

  /*
   * Deletes an existing user.
   */
  deleteUser(
    userId: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.usersUrl}/${userId}`
    );
  }
}