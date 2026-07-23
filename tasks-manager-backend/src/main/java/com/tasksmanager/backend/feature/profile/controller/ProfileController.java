package com.tasksmanager.backend.feature.profile.controller;

import com.tasksmanager.backend.feature.profile.dto.ChangePasswordRequest;
import com.tasksmanager.backend.feature.profile.dto.ProfileResponse;
import com.tasksmanager.backend.feature.profile.dto.UpdateProfileRequest;
import com.tasksmanager.backend.feature.profile.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/*
 * Provides endpoints for the authenticated user's profile.
 */
@RestController
@RequestMapping("/api/profile")
@Tag(
        name = "Profile Management",
        description = "Operations for the authenticated user's profile"
)
public class ProfileController {

    private final ProfileService profileService;

    @Autowired
    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    @Operation(
            summary = "Get profile",
            description = "Get the authenticated user's profile"
    )
    public ResponseEntity<ProfileResponse> getProfile(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                profileService.getProfile(
                        authentication.getName()
                )
        );
    }

    @PutMapping
    @Operation(
            summary = "Update profile",
            description = "Update the authenticated user's name and email"
    )
    public ResponseEntity<ProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                profileService.updateProfile(
                        request,
                        authentication.getName()
                )
        );
    }

    @PatchMapping("/password")
    @Operation(
            summary = "Change password",
            description = "Change the authenticated user's password"
    )
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication
    ) {
        profileService.changePassword(
                request,
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }
}