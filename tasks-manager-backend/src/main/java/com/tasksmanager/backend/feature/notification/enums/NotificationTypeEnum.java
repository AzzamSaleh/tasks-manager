package com.tasksmanager.backend.feature.notification.enums;


/*
 * Defines the events that can create notifications.
 */
public enum NotificationTypeEnum {

    /*
     * User-management notifications for Admins.
     */
    USER_CREATED,
    USER_UPDATED,
    USER_STATUS_CHANGED,

    /*
     * Task-related notifications.
     */
    TASK_ASSIGNED,
    TASK_REASSIGNED,
    TASK_UPDATED,
    TASK_STATUS_UPDATED,
    TASK_DELETED,

    /*
     * Comment-related notifications.
     */
    COMMENT_ADDED
}