package com.tasksmanager.backend.feature.profile.service;


import com.tasksmanager.backend.common.exception.InvalidRequestException;
import com.tasksmanager.backend.feature.activitylog.enums.ActivityActionEnum;
import com.tasksmanager.backend.feature.activitylog.service.ActivityLogService;
import com.tasksmanager.backend.feature.profile.dto.ChangePasswordRequest;
import com.tasksmanager.backend.feature.profile.dto.ProfileResponse;
import com.tasksmanager.backend.feature.profile.dto.UpdateProfileRequest;
import com.tasksmanager.backend.feature.user.entity.User;
import com.tasksmanager.backend.feature.user.exception.UserAlreadyExistsException;
import com.tasksmanager.backend.feature.user.exception.UserNotFoundException;
import com.tasksmanager.backend.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/*
 * Contains profile-management business logic.
 *
 * Every operation affects only the authenticated user's account.
 */
@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogService activityLogService;

    @Autowired
    public ProfileService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder, ActivityLogService activityLogService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.activityLogService = activityLogService;
    }

    /*
     * Returns the authenticated user's profile.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String currentUsername) {

        User user = getCurrentUser(currentUsername);

        return convertToResponse(user);
    }

    /*
     * Updates the authenticated user's full name and email.
     *
     * Role, status, and username cannot be changed here.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @Transactional
    public ProfileResponse updateProfile(
            UpdateProfileRequest request,
            String currentUsername
    ) {
        User user = getCurrentUser(currentUsername);

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        /*
         * Ignores the current user's own email while
         * checking whether another user already uses it.
         */
        if (userRepository.existsByEmailAndIdNot(
                email,
                user.getId()
        )) {
            throw new UserAlreadyExistsException(
                    "A user with this email already exists."
            );
        }

        user.setFullName(request.getFullName().trim());
        user.setEmail(email);

        User updatedUser = userRepository.save(user);

        activityLogService.createActivityLog(
                updatedUser,
                ActivityActionEnum.PROFILE_UPDATED,
                "PROFILE",
                updatedUser.getId(),
                "Updated profile information."
        );

        return convertToResponse(updatedUser);
    }

    /*
     * Changes the authenticated user's password after
     * verifying the current password.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @Transactional
    public void changePassword(
            ChangePasswordRequest request,
            String currentUsername
    ) {
        User user = getCurrentUser(currentUsername);

        /*
         * PasswordEncoder.matches compares the submitted password
         * with the BCrypt hash stored in the database.
         */
        boolean currentPasswordMatches =
                passwordEncoder.matches(
                        request.getCurrentPassword(),
                        user.getPassword()
                );

        if (!currentPasswordMatches) {
            throw new InvalidRequestException(
                    "Current password is incorrect."
            );
        }

        if (!request.getNewPassword()
                .equals(request.getConfirmPassword())) {

            throw new InvalidRequestException(
                    "New password and confirmation do not match."
            );
        }

        /*
         * Prevents replacing the password with the same value.
         */
        if (passwordEncoder.matches(
                request.getNewPassword(),
                user.getPassword()
        )) {
            throw new InvalidRequestException(
                    "New password must be different from the current password."
            );
        }

        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        userRepository.save(user);
        activityLogService.createActivityLog(
                user,
                ActivityActionEnum.PASSWORD_CHANGED,
                "PROFILE",
                user.getId(),
                "Changed account password."
        );
    }

    /*
     * Loads the account connected to the authenticated JWT.
     */
    private User getCurrentUser(String currentUsername) {

        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found.")
                );
    }

    /*
     * Converts the User entity into a safe profile response.
     */
    private ProfileResponse convertToResponse(User user) {

        return new ProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
