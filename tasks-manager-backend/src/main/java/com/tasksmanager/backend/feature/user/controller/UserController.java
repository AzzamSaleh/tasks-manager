package com.tasksmanager.backend.feature.user.controller;

import com.tasksmanager.backend.feature.user.dto.CreateUserRequest;
import com.tasksmanager.backend.feature.user.dto.UpdateUserRequest;
import com.tasksmanager.backend.feature.user.dto.UserResponse;
import com.tasksmanager.backend.feature.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.tasksmanager.backend.feature.user.enums.RoleEnum;
import com.tasksmanager.backend.feature.user.enums.UserStatusEnum;
import org.springframework.data.domain.Page;
/*
 * Provides Admin user-management endpoints.
 */
@RestController
@RequestMapping("/api/users")
@Tag(
        name = "User Management",
        description = "Admin operations for managing users"
)
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @Operation(
            summary = "Create user",
            description = "Create a new user or Admin account"
    )
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request,
            Authentication authentication
    ) {
        UserResponse response = userService.createUser(
                request,
                authentication.getName()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
    /*
     * Returns users using pagination, search, and optional filters.
     */
    @GetMapping
    @Operation(
            summary = "Get users",
            description = "Get a paginated list of users with optional search and filters"
    )
    public ResponseEntity<Page<UserResponse>> getUsers(

            @RequestParam(required = false)
            String search,

            @RequestParam(required = false)
            RoleEnum role,

            @RequestParam(required = false)
            UserStatusEnum status,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size
    ) {
        return ResponseEntity.ok(
                userService.getUsers(
                        search,
                        role,
                        status,
                        page,
                        size
                )
        );
    }
    /*
     * Returns one user by their ID.
     */
    @GetMapping("/{id}")
    @Operation(
            summary = "Get user by ID",
            description = "Get the details of one user"
    )
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                userService.getUserById(id)
        );
    }

    /*
     * Updates one user using their database ID.
     */
    @PutMapping("/{id}")
    @Operation(
            summary = "Update user",
            description = "Update an existing user's details, role, status, or password"
    )
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                userService.updateUser(
                        id,
                        request,
                        authentication.getName()
                )
        );
    }

    /*
     * Deletes one user using their database ID.
     */
    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete user",
            description = "Delete an existing user account"
    )
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            Authentication authentication
    ) {
        userService.deleteUser(
                id,
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }
}