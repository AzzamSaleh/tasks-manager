package com.tasksmanager.backend.feature.activitylog.enums;

/*
 * Defines the important operations recorded by the system.
 */
public enum ActivityActionEnum {

    LOGIN,
    LOGOUT,

    USER_CREATED,
    USER_UPDATED,
    USER_DELETED,

    TASK_CREATED,
    TASK_UPDATED,
    TASK_STATUS_UPDATED,
    TASK_DELETED,

    COMMENT_CREATED,
    COMMENT_UPDATED,
    COMMENT_DELETED,

    PROFILE_UPDATED,
    PASSWORD_CHANGED
}