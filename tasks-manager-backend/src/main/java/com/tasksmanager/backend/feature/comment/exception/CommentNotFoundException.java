package com.tasksmanager.backend.feature.comment.exception;

/*
 * Thrown when a comment does not exist
 * or does not belong to the specified task.
 */
public class CommentNotFoundException extends RuntimeException {

    public CommentNotFoundException(String message) {
        super(message);
    }
}