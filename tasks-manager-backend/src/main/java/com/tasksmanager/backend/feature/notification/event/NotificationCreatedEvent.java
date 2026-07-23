package com.tasksmanager.backend.feature.notification.event;

import com.tasksmanager.backend.feature.notification.dto.NotificationResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;

/*
 * Represents a notification that was successfully created
 * and is ready to be sent through WebSocket.
 */
@Getter
@AllArgsConstructor
public class NotificationCreatedEvent {

    private String recipientUsername;
    private NotificationResponse notification;
}