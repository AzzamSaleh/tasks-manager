package com.tasksmanager.backend.common.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

/*
 * Defines one consistent JSON format for API errors.
 */
@Getter
@AllArgsConstructor
public class ApiErrorResponse {

    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;

    /*
     * Contains field validation errors.
     * It will be empty for non-validation errors.
     */
    private Map<String, String> fieldErrors;
}