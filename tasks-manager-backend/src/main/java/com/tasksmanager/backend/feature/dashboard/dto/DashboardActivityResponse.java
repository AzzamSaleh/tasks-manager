package com.tasksmanager.backend.feature.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;


/*
 * Contains a short activity-log representation
 * for the Admin dashboard.
 */
@Getter
@AllArgsConstructor
public class DashboardActivityResponse {

    private Long id;
    private String actorUsername;
    private String actorRole;
    private String action;
    private String entityType;
    private Long entityId;
    private String description;
    private Instant createdAt;
}
