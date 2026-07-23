import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { AdminDashboardStatistics, DashboardMetric, DashboardActivity } from '../../models/dashboard.models';
import { DashboardService } from '../../services/dashboard.service';

/*
 * Displays system-wide Admin dashboard statistics
 * and the newest activity-log records.
 */
@Component({
  selector: 'app-admin-dashboard',
  imports: [
    DatePipe
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboard implements OnInit {

  readonly authService =
    inject(AuthService);

  private readonly dashboardService =
    inject(DashboardService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  readonly statistics =
    signal<AdminDashboardStatistics | null>(null);

  readonly isLoading =
    signal(true);

  readonly errorMessage =
    signal<string | null>(null);

  /*
   * Main statistic cards are derived from the
   * current dashboard response.
   */
  readonly metrics =
    computed<DashboardMetric[]>(() => {
      const statistics = this.statistics();

      if (!statistics) {
        return [];
      }

      return [
        {
          label: 'Total users',
          value: statistics.totalUsers,
          icon: 'bi-people',
          tone: 'orange',
          description:
            `${statistics.activeUsers} active accounts`
        },
        {
          label: 'Total tasks',
          value: statistics.totalTasks,
          icon: 'bi-list-check',
          tone: 'gray',
          description:
            'All tasks in the workspace'
        },
        {
          label: 'Completed',
          value: statistics.completedTasks,
          icon: 'bi-check2-circle',
          tone: 'green',
          description:
            `${statistics.completionRate}% completion rate`
        },
        {
          label: 'Overdue',
          value: statistics.overdueTasks,
          icon: 'bi-exclamation-triangle',
          tone:
            statistics.overdueTasks > 0
              ? 'red'
              : 'green',
          description:
            statistics.overdueTasks > 0
              ? 'Require attention'
              : 'No overdue tasks'
        }
      ];
    });

  readonly completionChartBackground =
    computed(() => {
      const rate =
        this.statistics()?.completionRate ?? 0;

      const safeRate =
        Math.min(100, Math.max(0, rate));

      return `conic-gradient(
        var(--primary-orange) 0% ${safeRate}%,
        var(--light-gray) ${safeRate}% 100%
      )`;
    });

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardService
      .getAdminStatistics()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: statistics => {
          this.statistics.set(statistics);
        },

        error: error => {
          this.statistics.set(null);

          this.errorMessage.set(
            this.apiErrorService.getMessage(
              error,
              'Unable to load the Admin dashboard.'
            )
          );
        }
      });
  }

  /*
   * Converts a task count into a safe progress
   * percentage for the task-status bars.
   */
  getTaskPercentage(count: number): number {
    const totalTasks =
      this.statistics()?.totalTasks ?? 0;

    if (totalTasks === 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        count * 100 / totalTasks
      )
    );
  }

  getActivityIcon(
    activity: DashboardActivity
  ): string {
    const icons: Record<string, string> = {
      LOGIN: 'bi-box-arrow-in-right',
      LOGOUT: 'bi-box-arrow-right',

      USER_CREATED: 'bi-person-plus',
      USER_UPDATED: 'bi-person-gear',
      USER_DELETED: 'bi-person-x',

      TASK_CREATED: 'bi-plus-square',
      TASK_UPDATED: 'bi-pencil-square',
      TASK_STATUS_UPDATED: 'bi-arrow-repeat',
      TASK_DELETED: 'bi-trash3',

      COMMENT_CREATED: 'bi-chat-left-text',
      COMMENT_UPDATED: 'bi-chat-left-dots',
      COMMENT_DELETED: 'bi-chat-left',

      PROFILE_UPDATED: 'bi-person-check',
      PASSWORD_CHANGED: 'bi-key'
    };

    return icons[activity.action]
      ?? 'bi-activity';
  }

  getActivityTone(
    activity: DashboardActivity
  ): string {
    if (
      activity.action.includes('DELETED')
    ) {
      return 'activity-danger';
    }

    if (
      activity.action.includes('CREATED')
    ) {
      return 'activity-success';
    }

    if (
      activity.action === 'LOGIN' ||
      activity.action === 'LOGOUT'
    ) {
      return 'activity-orange';
    }

    return 'activity-blue';
  }
}
