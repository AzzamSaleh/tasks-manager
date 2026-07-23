package com.tasksmanager.backend.feature.notification.exception;

/*
 * Thrown when a notification does not exist
 * or does not belong to the authenticated user.
 */
public class NotificationNotFoundException
        extends RuntimeException {

    public NotificationNotFoundException(String message) {
        super(message);
    }
}