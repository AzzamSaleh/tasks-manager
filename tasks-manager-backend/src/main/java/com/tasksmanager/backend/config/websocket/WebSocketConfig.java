package com.tasksmanager.backend.config.websocket;

import com.tasksmanager.backend.feature.auth.security.JwtWebSocketInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;
import java.util.List;

/*
 * Configures the WebSocket endpoint and private
 * notification destination.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig
        implements WebSocketMessageBrokerConfigurer {

    private final JwtWebSocketInterceptor jwtWebSocketInterceptor;
    private final List<String> allowedOrigins;

    @Autowired
    public WebSocketConfig(
            JwtWebSocketInterceptor jwtWebSocketInterceptor,
            @Value("${app.cors.allowed-origins}") String allowedOrigins
    ) {
        this.jwtWebSocketInterceptor =
                jwtWebSocketInterceptor;

        this.allowedOrigins =
                parseAllowedOrigins(
                        allowedOrigins
                );
    }

    /*
     * Angular connects to this URL to start
     * a WebSocket/STOMP session.
     *
     * Allowed origins work locally and can be
     * overridden during deployment.
     */
    @Override
    public void registerStompEndpoints(
            StompEndpointRegistry registry
    ) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                        allowedOrigins.toArray(
                                String[]::new
                        )
                );
    }

    /*
     * Enables private queue destinations.
     *
     * The frontend subscribes to:
     * /user/queue/notifications
     */
    @Override
    public void configureMessageBroker(
            MessageBrokerRegistry registry
    ) {
        registry.enableSimpleBroker(
                "/queue"
        );

        registry.setUserDestinationPrefix(
                "/user"
        );
    }

    /*
     * Applies JWT authentication to incoming
     * STOMP CONNECT and SUBSCRIBE messages.
     */
    @Override
    public void configureClientInboundChannel(
            ChannelRegistration registration
    ) {
        registration.interceptors(
                jwtWebSocketInterceptor
        );
    }

    /*
     * Converts the comma-separated origins property
     * into clean WebSocket origin values.
     */
    private List<String> parseAllowedOrigins(
            String configuredOrigins
    ) {
        return Arrays.stream(
                        configuredOrigins.split(",")
                )
                .map(String::trim)
                .filter(origin ->
                        !origin.isBlank()
                )
                .toList();
    }
}