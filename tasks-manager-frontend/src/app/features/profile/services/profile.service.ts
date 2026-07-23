import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { TokenStorageService } from '../../../core/services/token-storage.service';

import { ChangePasswordRequest, ProfileResponse, UpdateProfileRequest } from '../models/profile.models';

/*
 * Handles Profile HTTP communication and stores
 * the latest authenticated profile.
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private readonly http = inject(HttpClient);

  private readonly tokenStorage = inject(TokenStorageService);

  private readonly profileUrl = `${environment.apiUrl}/profile`;

  private readonly profileState = signal<ProfileResponse | null>(null);

  readonly profile = this.profileState.asReadonly();

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(this.profileUrl).pipe(
      tap(profile => {
        this.synchronizeProfile(profile);
      })
    );
  }

  updateProfile(request: UpdateProfileRequest): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(this.profileUrl, request).pipe(
      tap(updatedProfile => {
        this.synchronizeProfile(updatedProfile);
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.patch<void>(`${this.profileUrl}/password`, request);
  }

  /*
   * Prevents the next logged-in user from briefly
   * seeing the previous account's profile.
   */
  clearProfile(): void {
    this.profileState.set(null);
  }

  /*
   * Updates ProfileService and the authentication
   * session with the same current identity.
   */
  private synchronizeProfile(profile: ProfileResponse): void {
    this.profileState.set(profile);
    this.tokenStorage.updateProfileIdentity(profile.username, profile.fullName);
  }
}