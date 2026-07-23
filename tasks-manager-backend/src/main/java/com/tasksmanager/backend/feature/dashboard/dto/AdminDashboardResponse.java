package com.tasksmanager.backend.feature.dashboard.dto;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/*
 * Contains statistics and recent activity
 * displayed on the Admin dashboard.
 */
@Getter
@AllArgsConstructor
public class AdminDashboardResponse {

    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;

    private long totalTasks;
    private long pendingTasks;
    private long inProgressTasks;
    private long completedTasks;
    private long overdueTasks;

    /*
     * Percentage of all tasks that are completed.
     */
    private double completionRate;

    private List<DashboardActivityResponse> recentActivity;
}
