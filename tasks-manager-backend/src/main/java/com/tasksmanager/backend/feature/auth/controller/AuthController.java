package com.tasksmanager.backend.feature.auth.controller;


import com.tasksmanager.backend.feature.auth.dto.LoginRequest;
import com.tasksmanager.backend.feature.auth.dto.LoginResponse;
import com.tasksmanager.backend.feature.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
/*
 * Handles authentication-related endpoints:
 * login and retrieving the current authenticated user.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(
            summary = "Login",
            description = "Authenticate using username and password"
    )
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(authService.login(request));
    }


    /*
     * Records logout before the frontend removes its JWT.
     */
    @PostMapping("/logout")
    @Operation(
            summary = "Logout",
            description = "Record logout for the authenticated user"
    )
    public ResponseEntity<Void> logout(
            Authentication authentication
    ) {
        authService.logout(authentication.getName());

        return ResponseEntity.noContent().build();
    }
}
