import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { RouterOutlet } from "@angular/router";
import { finalize } from 'rxjs';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { UserDashboardStatistics, DashboardMetric } from '../../models/dashboard.models';
import { DashboardService } from '../../services/dashboard.service';

/*
 * Displays task statistics belonging only
 * to the authenticated regular User.
 */
@Component({
  selector: 'app-user-dashboard',
  imports: [],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDashboard implements OnInit {

  readonly authService =
    inject(AuthService);

  private readonly dashboardService =
    inject(DashboardService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  readonly statistics =
    signal<UserDashboardStatistics | null>(null);

  readonly isLoading =
    signal(true);

  readonly errorMessage =
    signal<string | null>(null);

  readonly metrics =
    computed<DashboardMetric[]>(() => {
      const statistics = this.statistics();

      if (!statistics) {
        return [];
      }

      return [
        {
          label: 'My tasks',
          value: statistics.totalTasks,
          icon: 'bi-list-check',
          tone: 'orange',
          description:
            'All tasks assigned to you'
        },
        {
          label: 'In progress',
          value: statistics.inProgressTasks,
          icon: 'bi-arrow-repeat',
          tone: 'blue',
          description:
            'Tasks currently being worked on'
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
              ? 'Tasks require your attention'
              : 'You are currently on schedule'
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

  readonly performanceMessage =
    computed(() => {
      const statistics = this.statistics();

      if (!statistics || statistics.totalTasks === 0) {
        return {
          title: 'No tasks assigned yet',
          message:
            'New tasks assigned to you will appear in your workspace.',
          icon: 'bi-inbox',
          tone: 'neutral'
        };
      }

      if (statistics.overdueTasks > 0) {
        return {
          title: 'Some tasks need attention',
          message:
            `You currently have ${statistics.overdueTasks} overdue task${statistics.overdueTasks === 1 ? '' : 's'}.`,
          icon: 'bi-exclamation-triangle',
          tone: 'warning'
        };
      }

      if (statistics.completionRate === 100) {
        return {
          title: 'Excellent work',
          message:
            'You have completed all of your assigned tasks.',
          icon: 'bi-trophy',
          tone: 'success'
        };
      }

      return {
        title: 'Keep up the progress',
        message:
          'Your workspace is on schedule with no overdue tasks.',
        icon: 'bi-lightning-charge',
        tone: 'orange'
      };
    });

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardService
      .getUserStatistics()
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
              'Unable to load your dashboard.'
            )
          );
        }
      });
  }

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
}