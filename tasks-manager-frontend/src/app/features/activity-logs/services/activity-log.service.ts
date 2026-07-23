import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import { environment } from '../../../../environments/environment';
import { PageResponse } from "../../../core/models/page-response.model";
import { ActivityLogSearchRequest, ActivityLogResponse } from "../models/activity-log.models";

/*
 * Handles Activity Log HTTP communication only.
 *
 * The backend always sorts by createdAt DESC,
 * therefore the frontend does not send a sort value.
 */
@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {

  private readonly http =
    inject(HttpClient);

  private readonly activityLogsUrl =
    `${environment.apiUrl}/activity-logs`;

  getActivityLogs(
    request: ActivityLogSearchRequest
  ): Observable<
    PageResponse<ActivityLogResponse>
  > {

    let params =
      new HttpParams()
        .set(
          'page',
          String(request.page)
        )
        .set(
          'size',
          String(request.size)
        );

    const search =
      request.search?.trim();

    if (search) {
      params = params.set(
        'search',
        search
      );
    }

    if (request.action) {
      params = params.set(
        'action',
        request.action
      );
    }

    return this.http.get<
      PageResponse<ActivityLogResponse>
    >(
      this.activityLogsUrl,
      {
        params
      }
    );
  }
}