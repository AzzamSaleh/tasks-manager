/*
 * Represents one recent activity item returned
 * with the Admin dashboard statistics.
 */
export interface DashboardActivity {
  id: number;
  actorUsername: string;
  actorRole: 'ADMIN' | 'USER';
  action: string;
  entityType: string;
  entityId: number | null;
  description: string;
  createdAt: string;
}

/*
 * Matches:
 * GET /api/dashboard/admin/statistics
 */
export interface AdminDashboardStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;

  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;

  completionRate: number;

  recentActivity: DashboardActivity[];
}

/*
 * Matches:
 * GET /api/dashboard/user/statistics
 */
export interface UserDashboardStatistics {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;

  completionRate: number;
}

/*
 * Reusable visual representation of one statistic card.
 */
export interface DashboardMetric {
  label: string;
  value: number;
  icon: string;
  tone:
    | 'orange'
    | 'gray'
    | 'green'
    | 'blue'
    | 'red'
    | 'yellow';
  description: string;
}