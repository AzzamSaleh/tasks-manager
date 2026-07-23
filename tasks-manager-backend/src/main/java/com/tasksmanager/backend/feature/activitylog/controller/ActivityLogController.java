package com.tasksmanager.backend.feature.activitylog.controller;

import com.tasksmanager.backend.feature.activitylog.dto.ActivityLogResponse;
import com.tasksmanager.backend.feature.activitylog.enums.ActivityActionEnum;
import com.tasksmanager.backend.feature.activitylog.service.ActivityLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/*
 * Provides Admin access to system activity records.
 */
@RestController
@RequestMapping("/api/activity-logs")
@Tag(
        name = "Activity Logs",
        description = "Admin operations for viewing system activity"
)
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @Autowired
    public ActivityLogController(
            ActivityLogService activityLogService
    ) {
        this.activityLogService = activityLogService;
    }

    @GetMapping
    @Operation(
            summary = "Get activity logs",
            description = "Get paginated system activity records"
    )
    public ResponseEntity<Page<ActivityLogResponse>> getActivityLogs(

            @RequestParam(required = false)
            String search,

            @RequestParam(required = false)
            ActivityActionEnum action,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size
    ) {
        return ResponseEntity.ok(
                activityLogService.getActivityLogs(
                        search,
                        action,
                        page,
                        size
                )
        );
    }
}