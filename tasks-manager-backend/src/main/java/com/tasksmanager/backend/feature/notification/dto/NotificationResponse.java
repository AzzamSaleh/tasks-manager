package com.tasksmanager.backend.feature.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/*
 * Contains notification information returned to the recipient.
 */
@Getter
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String type;
    private String title;
    private String message;
    private Long taskId;
    private boolean read;
    private LocalDateTime createdAt;
}