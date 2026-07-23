package com.tasksmanager.backend.feature.user.dto;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/*
 * Contains user information that is safe to return.
 *
 * Passwords and password hashes are never included.
 */
@Getter
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String role;
    private String status;
    private LocalDateTime createdAt;
}