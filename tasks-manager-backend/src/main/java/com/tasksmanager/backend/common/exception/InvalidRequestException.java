package com.tasksmanager.backend.common.exception;

/*
 * Used when request values are logically invalid,
 * such as a negative page number or unsupported page size.
 */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}