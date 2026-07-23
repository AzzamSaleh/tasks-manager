package com.tasksmanager.backend.feature.notification.controller;

import com.tasksmanager.backend.feature.notification.dto.NotificationResponse;
import com.tasksmanager.backend.feature.notification.dto.UnreadNotificationCountResponse;
import com.tasksmanager.backend.feature.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/*
 * Provides notification endpoints for authenticated users.
 */
@RestController
@RequestMapping("/api/notifications")
@Tag(
        name = "Notifications",
        description = "Operations for the authenticated user's notifications"
)
public class NotificationController {

    private final NotificationService notificationService;

    @Autowired
    public NotificationController(
            NotificationService notificationService
    ) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(
            summary = "Get notifications",
            description = "Get the authenticated user's notifications"
    )
    public ResponseEntity<Page<NotificationResponse>>
    getNotifications(

            @RequestParam(required = false)
            Boolean read,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size,

            Authentication authentication
    ) {
        return ResponseEntity.ok(
                notificationService.getNotifications(
                        authentication.getName(),
                        read,
                        page,
                        size
                )
        );
    }

    @GetMapping("/unread-count")
    @Operation(
            summary = "Get unread notification count",
            description = "Get the authenticated user's unread notification count"
    )
    public ResponseEntity<UnreadNotificationCountResponse>
    getUnreadNotificationCount(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                notificationService
                        .getUnreadNotificationCount(
                                authentication.getName()
                        )
        );
    }

    @PatchMapping("/{id}/read")
    @Operation(
            summary = "Mark notification as read",
            description = "Mark one notification belonging to the authenticated user as read"
    )
    public ResponseEntity<NotificationResponse>
    markNotificationAsRead(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                notificationService
                        .markNotificationAsRead(
                                id,
                                authentication.getName()
                        )
        );
    }
}