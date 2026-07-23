package com.tasksmanager.backend.feature.dashboard.service;

import com.tasksmanager.backend.feature.activitylog.entity.ActivityLog;
import com.tasksmanager.backend.feature.activitylog.repository.ActivityLogRepository;
import com.tasksmanager.backend.feature.dashboard.dto.AdminDashboardResponse;
import com.tasksmanager.backend.feature.dashboard.dto.DashboardActivityResponse;
import com.tasksmanager.backend.feature.dashboard.dto.UserDashboardResponse;
import com.tasksmanager.backend.feature.task.enums.TaskStatusEnum;
import com.tasksmanager.backend.feature.task.repository.TaskRepository;
import com.tasksmanager.backend.feature.user.entity.User;
import com.tasksmanager.backend.feature.user.enums.UserStatusEnum;
import com.tasksmanager.backend.feature.user.exception.UserNotFoundException;
import com.tasksmanager.backend.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/*
 * Provides dashboard statistics for Admin and User roles.
 *
 * Angular receives prepared statistics from one backend
 * endpoint instead of calculating them from large data lists.
 */
@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ActivityLogRepository activityLogRepository;

    @Autowired
    public DashboardService(
            UserRepository userRepository,
            TaskRepository taskRepository,
            ActivityLogRepository activityLogRepository
    ) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.activityLogRepository = activityLogRepository;
    }

    /*
     * Returns system-wide statistics and recent activity.
     *
     * Only Admin can access this method.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public AdminDashboardResponse
    getAdminDashboardStatistics() {

        long totalUsers = userRepository.count();

        long activeUsers =
                userRepository.countByStatus(
                        UserStatusEnum.ACTIVE
                );

        long inactiveUsers =
                userRepository.countByStatus(
                        UserStatusEnum.INACTIVE
                );

        long totalTasks = taskRepository.count();

        long pendingTasks =
                taskRepository.countByStatus(
                        TaskStatusEnum.PENDING
                );

        long inProgressTasks =
                taskRepository.countByStatus(
                        TaskStatusEnum.IN_PROGRESS
                );

        long completedTasks =
                taskRepository.countByStatus(
                        TaskStatusEnum.COMPLETED
                );

        long overdueTasks =
                taskRepository
                        .countByDueDateBeforeAndStatusNot(
                                LocalDateTime.now(),
                                TaskStatusEnum.COMPLETED
                        );

        double completionRate =
                calculateCompletionRate(
                        completedTasks,
                        totalTasks
                );

        List<DashboardActivityResponse> recentActivity =
                activityLogRepository
                        .findTop5ByOrderByCreatedAtDesc()
                        .stream()
                        .map(this::convertActivity)
                        .toList();

        return new AdminDashboardResponse(
                totalUsers,
                activeUsers,
                inactiveUsers,
                totalTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks,
                overdueTasks,
                completionRate,
                recentActivity
        );
    }

    /*
     * Returns task statistics for the authenticated user.
     *
     * The username comes from the authenticated JWT,
     * not from a user ID supplied by Angular.
     */
    @PreAuthorize("hasRole('USER')")
    @Transactional(readOnly = true)
    public UserDashboardResponse
    getUserDashboardStatistics(
            String currentUsername
    ) {
        User currentUser =
                userRepository
                        .findByUsername(currentUsername)
                        .orElseThrow(() ->
                                new UserNotFoundException(
                                        "User not found."
                                )
                        );

        Long userId = currentUser.getId();

        long totalTasks =
                taskRepository
                        .countByAssignedUserId(userId);

        long pendingTasks =
                taskRepository
                        .countByAssignedUserIdAndStatus(
                                userId,
                                TaskStatusEnum.PENDING
                        );

        long inProgressTasks =
                taskRepository
                        .countByAssignedUserIdAndStatus(
                                userId,
                                TaskStatusEnum.IN_PROGRESS
                        );

        long completedTasks =
                taskRepository
                        .countByAssignedUserIdAndStatus(
                                userId,
                                TaskStatusEnum.COMPLETED
                        );

        long overdueTasks =
                taskRepository
                        .countByAssignedUserIdAndDueDateBeforeAndStatusNot(
                                userId,
                                LocalDateTime.now(),
                                TaskStatusEnum.COMPLETED
                        );

        double completionRate =
                calculateCompletionRate(
                        completedTasks,
                        totalTasks
                );

        return new UserDashboardResponse(
                totalTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks,
                overdueTasks,
                completionRate
        );
    }

    /*
     * Prevents division by zero and returns
     * a percentage rounded to two decimal places.
     */
    private double calculateCompletionRate(
            long completedTasks,
            long totalTasks
    ) {
        if (totalTasks == 0) {
            return 0.0;
        }

        double percentage =
                completedTasks * 100.0 / totalTasks;

        return Math.round(percentage * 100.0) / 100.0;
    }

    private DashboardActivityResponse convertActivity(
            ActivityLog activityLog
    ) {
        return new DashboardActivityResponse(
                activityLog.getId(),
                activityLog.getActorUsername(),
                activityLog.getActorRole(),
                activityLog.getAction().name(),
                activityLog.getEntityType(),
                activityLog.getEntityId(),
                activityLog.getDescription(),
                activityLog.getCreatedAt()
        );
    }
}