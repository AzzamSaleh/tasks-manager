import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../core/models/page-response.model';
import { TaskNotification, UnreadNotificationCountResponse } from '../models/notification.models';
/*
 * Handles notification REST communication only.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {

  private readonly http =
    inject(HttpClient);

  private readonly notificationsUrl =
    `${environment.apiUrl}/notifications`;

  getNotifications(
    page = 0,
    size = 8,
    read?: boolean
  ): Observable<
    PageResponse<TaskNotification>
  > {
    let params =
      new HttpParams()
        .set(
          'page',
          String(page)
        )
        .set(
          'size',
          String(size)
        );

    if (read !== undefined) {
      params = params.set(
        'read',
        String(read)
      );
    }

    return this.http.get<
      PageResponse<TaskNotification>
    >(
      this.notificationsUrl,
      {
        params
      }
    );
  }

  getUnreadCount():
    Observable<
      UnreadNotificationCountResponse
    > {
    return this.http.get<
      UnreadNotificationCountResponse
    >(
      `${this.notificationsUrl}/unread-count`
    );
  }

  markAsRead(
    notificationId: number
  ): Observable<TaskNotification> {
    return this.http.patch<
      TaskNotification
    >(
      `${this.notificationsUrl}/${notificationId}/read`,
      {}
    );
  }
}