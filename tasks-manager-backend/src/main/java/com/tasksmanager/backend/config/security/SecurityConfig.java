package com.tasksmanager.backend.config.security;

import com.tasksmanager.backend.feature.auth.security.JwtAccessDeniedHandler;
import com.tasksmanager.backend.feature.auth.security.JwtAuthenticationEntryPoint;
import com.tasksmanager.backend.feature.auth.security.JwtAuthenticationFilter;
import com.tasksmanager.backend.feature.auth.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/*
 * Defines authentication, authorization, password hashing,
 * JWT filtering, CORS, and security error handling.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAccessDeniedHandler accessDeniedHandler;
    private final List<String> allowedOrigins;

    @Autowired
    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            JwtAuthenticationEntryPoint authenticationEntryPoint,
            JwtAccessDeniedHandler accessDeniedHandler,
            @Value("${app.cors.allowed-origins}") String allowedOrigins
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.allowedOrigins = parseAllowedOrigins(allowedOrigins);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                /*
                 * Activates the CorsConfigurationSource
                 * bean defined below.
                 */
                .cors(Customizer.withDefaults())

                /*
                 * CSRF is disabled because authentication
                 * uses JWT in the Authorization header.
                 */
                .csrf(csrf -> csrf.disable())

                /*
                 * JWT authentication does not use
                 * server-side sessions.
                 */
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        /*
                         * Allows browser CORS preflight requests.
                         */
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        )
                        .permitAll()

                        /*
                         * Public application endpoints.
                         */
                        .requestMatchers(
                                "/api/auth/login",
                                "/actuator/health",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/ws",
                                "/ws/**"
                        )
                        .permitAll()

                        /*
                         * Every other endpoint requires
                         * a valid JWT.
                         */
                        .anyRequest()
                        .authenticated()
                )

                /*
                 * Returns clean JSON responses
                 * for 401 and 403 errors.
                 */
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(
                                authenticationEntryPoint
                        )
                        .accessDeniedHandler(
                                accessDeniedHandler
                        )
                )

                /*
                 * Validates JWT tokens before Spring Security's
                 * username/password authentication filter.
                 */
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    /*
     * Uses the database user service and BCrypt
     * when checking login credentials.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            CustomUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(
                        userDetailsService
                );

        provider.setPasswordEncoder(
                passwordEncoder
        );

        return new ProviderManager(
                provider
        );
    }

    /*
     * Creates secure one-way password hashes.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /*
     * Allows configured Angular origins to communicate
     * with the Spring Boot REST API.
     *
     * Local values come from application.properties.
     * Deployment values come from FRONTEND_ORIGINS.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                allowedOrigins
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept"
                )
        );

        /*
         * Authentication uses Bearer tokens,
         * not browser authentication cookies.
         */
        configuration.setAllowCredentials(
                false
        );

        /*
         * Allows the browser to cache successful
         * preflight responses for one hour.
         */
        configuration.setMaxAge(
                3600L
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }

    /*
     * Converts a comma-separated property into
     * clean origin values.
     *
     * Example:
     * http://localhost:4200,https://tasks-manager.example.com
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