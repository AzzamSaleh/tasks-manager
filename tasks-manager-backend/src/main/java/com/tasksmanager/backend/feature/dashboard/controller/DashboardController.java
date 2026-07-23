package com.tasksmanager.backend.feature.dashboard.controller;

import com.tasksmanager.backend.feature.dashboard.dto.AdminDashboardResponse;
import com.tasksmanager.backend.feature.dashboard.dto.UserDashboardResponse;
import com.tasksmanager.backend.feature.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/*
 * Provides statistics for Admin and User dashboards.
 */
@RestController
@RequestMapping("/api/dashboard")
@Tag(
        name = "Dashboard",
        description = "Role-specific dashboard statistics"
)
public class DashboardController {

    private final DashboardService dashboardService;

    @Autowired
    public DashboardController(
            DashboardService dashboardService
    ) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/admin/statistics")
    @Operation(
            summary = "Get Admin dashboard statistics",
            description = "Get system-wide users, tasks, completion, overdue, and recent-activity statistics"
    )
    public ResponseEntity<AdminDashboardResponse>
    getAdminDashboardStatistics() {

        return ResponseEntity.ok(
                dashboardService
                        .getAdminDashboardStatistics()
        );
    }

    @GetMapping("/user/statistics")
    @Operation(
            summary = "Get User dashboard statistics",
            description = "Get task statistics for the authenticated regular user"
    )
    public ResponseEntity<UserDashboardResponse>
    getUserDashboardStatistics(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                dashboardService
                        .getUserDashboardStatistics(
                                authentication.getName()
                        )
        );
    }
}
