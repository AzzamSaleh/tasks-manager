package com.tasksmanager.backend.feature.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/*
 * Returns the number shown on the notification badge.
 */
@Getter
@AllArgsConstructor
public class UnreadNotificationCountResponse {

    private long unreadCount;
}
