package com.tasksmanager.backend.feature.auth.security;

import com.tasksmanager.backend.feature.auth.service.CustomUserDetailsService;
import com.tasksmanager.backend.feature.auth.service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
/*
 * Authenticates WebSocket connections using the JWT
 * sent inside the STOMP CONNECT headers.
 *
 * The normal browser WebSocket handshake cannot reliably send
 * the Authorization HTTP header, so authentication happens
 * when the STOMP connection starts.
 */
@Component
public class JwtWebSocketInterceptor
        implements ChannelInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String NOTIFICATION_DESTINATION =
            "/user/queue/notifications";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Autowired
    public JwtWebSocketInterceptor(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(
            Message<?> message,
            MessageChannel channel
    ) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (accessor.getCommand() == StompCommand.CONNECT) {
            authenticateConnection(accessor);
        }

        if (accessor.getCommand() == StompCommand.SUBSCRIBE) {
            validateSubscription(accessor);
        }

        /*
         * Clients do not need to send application messages.
         * Notifications are sent only from the backend.
         */
        if (accessor.getCommand() == StompCommand.SEND) {
            throw new MessagingException(
                    "Sending WebSocket messages is not allowed."
            );
        }

        return message;
    }

    /*
     * Validates the JWT and attaches the authenticated
     * user to the WebSocket session.
     */
    private void authenticateConnection(
            StompHeaderAccessor accessor
    ) {
        String authorizationHeader =
                accessor.getFirstNativeHeader(
                        HttpHeaders.AUTHORIZATION
                );

        if (authorizationHeader == null
                || !authorizationHeader.startsWith(BEARER_PREFIX)) {

            throw new MessagingException(
                    "Authentication is required. Please log in."
            );
        }

        String token = authorizationHeader
                .substring(BEARER_PREFIX.length())
                .trim();

        if (token.isBlank()) {
            throw new MessagingException(
                    "The access token is missing."
            );
        }

        try {
            String username = jwtService.extractUsername(token);

            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(username);

            if (!userDetails.isEnabled()) {
                throw new MessagingException(
                        "Your account is inactive. Contact an administrator."
                );
            }

            if (!jwtService.isTokenValid(
                    token,
                    userDetails.getUsername()
            )) {
                throw new MessagingException(
                        "The access token is invalid."
                );
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            accessor.setUser(authentication);

        } catch (ExpiredJwtException exception) {
            throw new MessagingException(
                    "Your session has expired. Please log in again.",
                    exception
            );

        } catch (JwtException | IllegalArgumentException exception) {
            throw new MessagingException(
                    "The access token is invalid.",
                    exception
            );
        }
    }

    /*
     * Allows clients to subscribe only to their
     * private notification destination.
     */
    private void validateSubscription(
            StompHeaderAccessor accessor
    ) {
        if (accessor.getUser() == null) {
            throw new MessagingException(
                    "Authentication is required. Please log in."
            );
        }

        if (!NOTIFICATION_DESTINATION.equals(
                accessor.getDestination()
        )) {
            throw new MessagingException(
                    "You cannot subscribe to this destination."
            );
        }
    }
}