package com.tasksmanager.backend.feature.profile.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/*
 * Contains profile information the authenticated user
 * is allowed to update.
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "Full name is mandatory")
    @Size(
            max = 100,
            message = "Full name cannot exceed 100 characters"
    )
    private String fullName;

    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email format is invalid")
    @Size(
            max = 150,
            message = "Email cannot exceed 150 characters"
    )
    private String email;
}
