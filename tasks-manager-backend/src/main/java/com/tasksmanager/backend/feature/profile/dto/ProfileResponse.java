package com.tasksmanager.backend.feature.profile.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/*
 * Contains the authenticated user's profile information.
 *
 * Password information is never returned.
 */
@Getter
@AllArgsConstructor
public class ProfileResponse {

    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String role;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}