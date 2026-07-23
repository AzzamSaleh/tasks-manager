package com.tasksmanager.backend.feature.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/*
 * Returned after successful authentication.
 */
@Getter
@AllArgsConstructor
public class LoginResponse {

    private String accessToken;
    private String tokenType;
    private String username;
    private String fullName;
    private String role;
}
