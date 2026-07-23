package com.tasksmanager.backend.feature.user.exception;

/*
 * Thrown when a requested user does not exist.
 *
 * The message remains "User not found" regardless
 * of whether the account role is USER or ADMIN.
 */
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String message) {
        super(message);
    }
}