package com.tasksmanager.backend.feature.activitylog.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/*
 * Contains activity-log information returned to Admin.
 */
@Getter
@AllArgsConstructor
public class ActivityLogResponse {

    private Long id;
    private String actorUsername;
    private String actorRole;
    private String action;
    private String entityType;
    private Long entityId;
    private String description;
    private LocalDateTime createdAt;
}
