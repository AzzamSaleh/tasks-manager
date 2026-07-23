import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminDashboardStatistics, UserDashboardStatistics } from '../models/dashboard.models';

/*
 * Contains HTTP communication for dashboard data.
 *
 * The service remains focused on API communication.
 * Page loading, error, and display state remain
 * inside the corresponding dashboard component.
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly http =
    inject(HttpClient);

  /*
   * Returns system-wide statistics.
   *
   * The backend permits only ADMIN accounts.
   */
  getAdminStatistics():
    Observable<AdminDashboardStatistics> {

    return this.http.get<AdminDashboardStatistics>(
      `${environment.apiUrl}/dashboard/admin/statistics`
    );
  }

  /*
   * Returns task statistics belonging to
   * the authenticated regular User.
   */
  getUserStatistics():
    Observable<UserDashboardStatistics> {

    return this.http.get<UserDashboardStatistics>(
      `${environment.apiUrl}/dashboard/user/statistics`
    );
  }
}
