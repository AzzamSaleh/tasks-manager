package com.tasksmanager.backend.feature.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


/*
 * Contains the information required to change
 * the authenticated user's password.
 */
@Getter
@Setter
@NoArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(
            message = "Current password is mandatory"
    )
    @Size(
            max = 100,
            message = "Current password cannot exceed 100 characters"
    )
    private String currentPassword;

    @NotBlank(
            message = "New password is mandatory"
    )
    @Size(
            min = 8,
            max = 100,
            message = "New password must contain between 8 and 100 characters"
    )
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{8,100}$",
            message = "New password must contain uppercase, lowercase, number, and special characters"
    )
    private String newPassword;

    @NotBlank(
            message = "Password confirmation is mandatory"
    )
    @Size(
            max = 100,
            message = "Password confirmation cannot exceed 100 characters"
    )
    private String confirmPassword;
}