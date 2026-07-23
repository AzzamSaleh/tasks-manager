package com.tasksmanager.backend.feature.auth.security;

import com.tasksmanager.backend.common.exception.SecurityErrorResponseWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;


/*
 * Handles HTTP 403 errors.
 *
 * It runs when a logged-in user tries to perform an action
 * that their role does not allow.
 */
@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final SecurityErrorResponseWriter errorResponseWriter;

    @Autowired
    public JwtAccessDeniedHandler(
            SecurityErrorResponseWriter errorResponseWriter
    ) {
        this.errorResponseWriter = errorResponseWriter;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException exception
    ) throws IOException, ServletException {

        errorResponseWriter.write(
                request,
                response,
                HttpStatus.FORBIDDEN,
                "You do not have permission to perform this action."
        );
    }
}