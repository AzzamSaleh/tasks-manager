package com.tasksmanager.backend.feature.auth.security;

import com.tasksmanager.backend.common.exception.SecurityErrorResponseWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/*
 * Handles HTTP 401 errors.
 *
 * It runs when a user tries to access a protected endpoint
 * without valid authentication.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    public static final String ERROR_MESSAGE_ATTRIBUTE =
            "authenticationErrorMessage";

    private final SecurityErrorResponseWriter errorResponseWriter;

    @Autowired
    public JwtAuthenticationEntryPoint(
            SecurityErrorResponseWriter errorResponseWriter
    ) {
        this.errorResponseWriter = errorResponseWriter;
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {

        String message = (String) request.getAttribute(
                ERROR_MESSAGE_ATTRIBUTE
        );

        if (message == null) {
            message = "Authentication is required. Please log in.";
        }

        errorResponseWriter.write(
                request,
                response,
                HttpStatus.UNAUTHORIZED,
                message
        );
    }
}