package com.tasksmanager.backend.feature.user.exception;

/*
 * Thrown when creating a user with a username
 * or email that is already registered.
 *
 * This exception applies to both USER and ADMIN roles.
 */
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String message) {
        super(message);
    }
}