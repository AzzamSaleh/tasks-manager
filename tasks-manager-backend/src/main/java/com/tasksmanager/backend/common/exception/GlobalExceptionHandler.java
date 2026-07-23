package com.tasksmanager.backend.common.exception;
import com.tasksmanager.backend.feature.comment.exception.CommentNotFoundException;
import com.tasksmanager.backend.feature.notification.exception.NotificationNotFoundException;
import com.tasksmanager.backend.feature.task.exception.TaskNotFoundException;
import com.tasksmanager.backend.feature.user.exception.UserAlreadyExistsException;
import com.tasksmanager.backend.feature.user.exception.UserNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/*
 * Handles exceptions thrown by controllers and services.
 *
 * This keeps error-response logic out of controllers and services
 * and gives the frontend one consistent error format.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /*
     * Handles invalid username, password, or inactive account.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(
            AuthenticationException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "Invalid username or password",
                request,
                Collections.emptyMap()
        );
    }

    /*
     * Handles validation errors from DTO fields annotated
     * with @NotBlank, @Email, @Size, and similar annotations.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        fieldErrors.putIfAbsent(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Request validation failed",
                request,
                fieldErrors
        );
    }

    /*
     * Handles validation errors from query parameters,
     * path variables, and service methods.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            ConstraintViolationException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                request,
                Collections.emptyMap()
        );
    }

    /*
     * Handles invalid JSON, such as missing commas
     * or incorrect property value types.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableJson(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "The request contains invalid or unsupported values.",
                request,
                Collections.emptyMap()
        );
    }

    /*
     * Handles database conflicts, such as duplicate
     * usernames or email addresses.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataConflict(
            DataIntegrityViolationException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "A record with the same unique value already exists",
                request,
                Collections.emptyMap()
        );
    }

    /*
     * Final fallback for unexpected application errors.
     * Internal exception details are not exposed to the client.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedException(
            Exception exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred",
                request,
                Collections.emptyMap()
        );
    }

    /*
     * Creates the standard error-response object.
     */
    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors
    ) {
        ApiErrorResponse response = new ApiErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI(),
                fieldErrors
        );

        return ResponseEntity.status(status).body(response);
    }

    /*
     * Handles duplicate username or email errors.
     */
    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleUserAlreadyExists(
            UserAlreadyExistsException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                exception.getMessage(),
                request,
                Collections.emptyMap()
        );
    }

    /*
     * Handles requests for users that do not exist.
     */
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleUserNotFound(
            UserNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                exception.getMessage(),
                request,
                Collections.emptyMap()
        );
    }

    /*
     * Handles permission errors raised by @PreAuthorize.
     *
     * For example, when a normal User tries to call
     * an Admin-only operation.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException exception,
            HttpServletRequest request
    ) {
        String message = exception.getMessage() == null
                ? "You do not have permission to perform this action."
                : exception.getMessage();

        return buildResponse(
                HttpStatus.FORBIDDEN,
                message,
                request,
                Collections.emptyMap()
        );
    }



    /*
     * Handles invalid request values checked by our services.
     */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidRequest(
            InvalidRequestException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                request,
                Collections.emptyMap()
        );
    }

    /*
     * Handles unsupported enum values in query parameters.
     *
     * Example:
     * role=MANAGER when the allowed values are ADMIN and USER.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request
    ) {
        String message = "The value provided for '"
                + exception.getName()
                + "' is invalid.";

        Class<?> requiredType = exception.getRequiredType();

        if (requiredType != null && requiredType.isEnum()) {
            String allowedValues = Arrays.stream(
                            requiredType.getEnumConstants()
                    )
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));

            message = "Invalid value for '"
                    + exception.getName()
                    + "'. Allowed values: "
                    + allowedValues
                    + ".";
        }

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                message,
                request,
                Collections.emptyMap()
        );
    }

    /*
     * Returns 404 when a task does not exist
     * or is not accessible to the current user.
     */
    @ExceptionHandler(TaskNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleTaskNotFound(
            TaskNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                exception.getMessage(),
                request,
                Collections.emptyMap()
        );
    }


    /*
     * Returns 404 when a requested comment does not exist.
     */
    @ExceptionHandler(CommentNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleCommentNotFound(
            CommentNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                exception.getMessage(),
                request,
                Collections.emptyMap()
        );
    }


    /*
     * Returns 404 when a notification does not exist
     * or is not accessible to the current user.
     */
    @ExceptionHandler(NotificationNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotificationNotFound(
            NotificationNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                exception.getMessage(),
                request,
                Collections.emptyMap()
        );
    }
}
