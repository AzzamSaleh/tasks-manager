package com.tasksmanager.backend.feature.dashboard.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

/*
 * Contains statistics for tasks assigned
 * to the authenticated regular user.
 */
@Getter
@AllArgsConstructor
public class UserDashboardResponse {

    private long totalTasks;
    private long pendingTasks;
    private long inProgressTasks;
    private long completedTasks;
    private long overdueTasks;

    /*
     * Percentage of the user's assigned tasks
     * that are completed.
     */
    private double completionRate;
}
