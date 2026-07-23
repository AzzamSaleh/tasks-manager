package com.tasksmanager.backend.feature.user.dto;

import com.tasksmanager.backend.feature.user.enums.RoleEnum;
import com.tasksmanager.backend.feature.user.enums.UserStatusEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/*
 * Contains the information an Admin can update.
 *
 * Password is optional. When it is null or blank,
 * the existing password remains unchanged.
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateUserRequest {

    @NotBlank(message = "Username is mandatory")
    @Size(
            max = 50,
            message = "Username cannot exceed 50 characters"
    )
    private String username;

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

    /*
     * Optional password.
     * Validation is performed in UserService only when provided.
     */
    private String password;

    @NotNull(message = "Role is mandatory")
    private RoleEnum role;

    @NotNull(message = "Status is mandatory")
    private UserStatusEnum status;
}
