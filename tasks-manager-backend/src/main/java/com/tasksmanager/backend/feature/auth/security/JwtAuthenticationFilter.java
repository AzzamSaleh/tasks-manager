package com.tasksmanager.backend.feature.auth.security;


import com.tasksmanager.backend.common.exception.SecurityErrorResponseWriter;
import com.tasksmanager.backend.feature.auth.service.CustomUserDetailsService;
import com.tasksmanager.backend.feature.auth.service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/*
 * Checks the JWT access token once for every protected request.
 *
 * Successful validation adds the user to Spring Security's context,
 * allowing controllers and authorization rules to recognize them.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final SecurityErrorResponseWriter errorResponseWriter;

    @Autowired
    public JwtAuthenticationFilter(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService,
            JwtAuthenticationEntryPoint authenticationEntryPoint,
            SecurityErrorResponseWriter errorResponseWriter
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.errorResponseWriter = errorResponseWriter;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader =
                request.getHeader(HttpHeaders.AUTHORIZATION);

        /*
         * Continue normally when no JWT was sent.
         * Spring Security will return 401 if the endpoint is protected.
         */
        if (authorizationHeader == null
                || !authorizationHeader.startsWith(BEARER_PREFIX)) {

            filterChain.doFilter(request, response);
            return;
        }

        String token = authorizationHeader
                .substring(BEARER_PREFIX.length())
                .trim();

        if (token.isBlank()) {
            rejectRequest(
                    request,
                    response,
                    "The access token is missing.",
                    new BadCredentialsException("Missing access token")
            );
            return;
        }

        try {
            String username = jwtService.extractUsername(token);

            /*
             * Do not authenticate again when another security mechanism
             * has already authenticated this request.
             */
            if (SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails =
                        userDetailsService.loadUserByUsername(username);

                if (!userDetails.isEnabled()) {
                    rejectRequest(
                            request,
                            response,
                            "Your account is inactive. Contact an administrator.",
                            new DisabledException("Inactive account")
                    );
                    return;
                }

                if (!jwtService.isTokenValid(
                        token,
                        userDetails.getUsername()
                )) {
                    rejectRequest(
                            request,
                            response,
                            "The access token is invalid.",
                            new BadCredentialsException("Invalid access token")
                    );
                    return;
                }

                /*
                 * The token is trusted only after its signature,
                 * expiration, username, and account status are validated.
                 */
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                SecurityContext securityContext =
                        SecurityContextHolder.createEmptyContext();

                securityContext.setAuthentication(authentication);
                SecurityContextHolder.setContext(securityContext);
            }

            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException exception) {
            rejectRequest(
                    request,
                    response,
                    "Your session has expired. Please log in again.",
                    new BadCredentialsException(
                            "Expired access token",
                            exception
                    )
            );

        } catch (JwtException | IllegalArgumentException exception) {
            rejectRequest(
                    request,
                    response,
                    "The access token is invalid.",
                    new BadCredentialsException(
                            "Invalid access token",
                            exception
                    )
            );

        } catch (AuthenticationException exception) {
            rejectRequest(
                    request,
                    response,
                    "The user associated with this token is not available.",
                    exception
            );

        } catch (Exception exception) {
            SecurityContextHolder.clearContext();

            errorResponseWriter.write(
                    request,
                    response,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Authentication could not be processed at this time."
            );
        }
    }

    /*
     * Sends a consistent 401 response and stops request processing.
     */
    private void rejectRequest(
            HttpServletRequest request,
            HttpServletResponse response,
            String message,
            AuthenticationException exception
    ) throws IOException, ServletException {

        SecurityContextHolder.clearContext();

        request.setAttribute(
                JwtAuthenticationEntryPoint.ERROR_MESSAGE_ATTRIBUTE,
                message
        );

        authenticationEntryPoint.commence(
                request,
                response,
                exception
        );
    }
}
