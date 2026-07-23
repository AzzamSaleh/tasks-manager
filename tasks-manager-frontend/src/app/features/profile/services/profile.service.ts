import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProfileResponse, UpdateProfileRequest, ChangePasswordRequest } from '../models/profile.models';


/*
 * Handles Profile HTTP communication and stores
 * the latest authenticated profile.
 *
 * The shared Profile Signal allows the header,
 * dropdown, and Profile page to display the same
 * current information without duplicated state.
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private readonly http =
    inject(HttpClient);

  private readonly profileUrl =
    `${environment.apiUrl}/profile`;

  private readonly profileState =
    signal<ProfileResponse | null>(null);

  /*
   * Components can read the profile but cannot
   * directly mutate the shared state.
   */
  readonly profile =
    this.profileState.asReadonly();

  getProfile():
    Observable<ProfileResponse> {

    return this.http
      .get<ProfileResponse>(
        this.profileUrl
      )
      .pipe(
        tap(profile => {
          this.profileState.set(profile);
        })
      );
  }

  updateProfile(
    request: UpdateProfileRequest
  ): Observable<ProfileResponse> {

    return this.http
      .put<ProfileResponse>(
        this.profileUrl,
        request
      )
      .pipe(
        /*
         * This immediately updates every component
         * reading the shared Profile Signal.
         */
        tap(updatedProfile => {
          this.profileState.set(
            updatedProfile
          );
        })
      );
  }

  changePassword(
    request: ChangePasswordRequest
  ): Observable<void> {

    return this.http.patch<void>(
      `${this.profileUrl}/password`,
      request
    );
  }

  /*
   * Prevents a newly authenticated account from
   * temporarily seeing the previous user's profile.
   */
  clearProfile(): void {
    this.profileState.set(null);
  }
}