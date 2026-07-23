package com.tasksmanager.backend.feature.task.exception;

/*
 * Thrown when a task does not exist or is not visible
 * to the authenticated user.
 */
public class TaskNotFoundException extends RuntimeException {

    public TaskNotFoundException(String message) {
        super(message);
    }
}