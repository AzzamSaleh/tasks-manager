package com.tasksmanager.backend.feature.user.service;


import com.tasksmanager.backend.common.exception.InvalidRequestException;
import com.tasksmanager.backend.feature.activitylog.enums.ActivityActionEnum;
import com.tasksmanager.backend.feature.activitylog.service.ActivityLogService;
import com.tasksmanager.backend.feature.comment.repository.CommentRepository;
import com.tasksmanager.backend.feature.notification.enums.NotificationTypeEnum;
import com.tasksmanager.backend.feature.notification.service.NotificationService;
import com.tasksmanager.backend.feature.task.repository.TaskRepository;
import com.tasksmanager.backend.feature.user.dto.CreateUserRequest;
import com.tasksmanager.backend.feature.user.dto.UpdateUserRequest;
import com.tasksmanager.backend.feature.user.dto.UserResponse;
import com.tasksmanager.backend.feature.user.entity.User;
import com.tasksmanager.backend.feature.user.enums.RoleEnum;
import com.tasksmanager.backend.feature.user.enums.UserStatusEnum;
import com.tasksmanager.backend.feature.user.exception.UserAlreadyExistsException;
import com.tasksmanager.backend.feature.user.exception.UserNotFoundException;
import com.tasksmanager.backend.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/*
 * Contains user-management business logic.
 *
 * Controllers receive requests while this service manages:
 * - Validation
 * - Persistence
 * - Password hashing
 * - Activity logs
 * - Role-specific notifications
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Autowired
    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            TaskRepository taskRepository,
            CommentRepository commentRepository,
            ActivityLogService activityLogService,
            NotificationService notificationService
    ) {
        this.userRepository =
                userRepository;

        this.passwordEncoder =
                passwordEncoder;

        this.taskRepository =
                taskRepository;

        this.commentRepository =
                commentRepository;

        this.activityLogService =
                activityLogService;

        this.notificationService =
                notificationService;
    }

    /*
     * Creates a new user.
     *
     * Only Admins can execute this operation.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse createUser(
            CreateUserRequest request,
            String currentUsername
    ) {
        User actor =
                getUserByUsername(
                        currentUsername
                );

        String username =
                request.getUsername().trim();

        String email =
                request.getEmail()
                        .trim()
                        .toLowerCase();

        if (
                userRepository.existsByUsername(
                        username
                )
        ) {
            throw new UserAlreadyExistsException(
                    "A user with this username already exists."
            );
        }

        if (
                userRepository.existsByEmail(
                        email
                )
        ) {
            throw new UserAlreadyExistsException(
                    "A user with this email already exists."
            );
        }

        User user =
                new User();

        user.setUsername(username);

        user.setFullName(
                request.getFullName().trim()
        );

        user.setEmail(email);

        /*
         * Only the BCrypt hash is stored.
         * The original password is never persisted.
         */
        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setRole(
                request.getRole()
        );

        user.setStatus(
                request.getStatus()
        );

        User savedUser =
                userRepository.save(user);

        activityLogService.createActivityLog(
                actor,
                ActivityActionEnum.USER_CREATED,
                "USER",
                savedUser.getId(),
                "Created user '"
                        + savedUser.getUsername()
                        + "'."
        );

        /*
         * User-management notifications have no related task,
         * so taskId is null.
         */
        notificationService
                .createNotificationsForActiveAdmins(
                        NotificationTypeEnum.USER_CREATED,
                        "User created",
                        actor.getFullName()
                                + " created user '"
                                + savedUser.getUsername()
                                + "'.",
                        null
                );

        return convertToResponse(
                savedUser
        );
    }

    /*
     * Returns a paginated user list.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(
            String search,
            RoleEnum role,
            UserStatusEnum status,
            int page,
            int size
    ) {
        validatePagination(page, size);

        String normalizedSearch =
                search == null ||
                        search.isBlank()
                        ? null
                        : search.trim();

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt"
                        )
                );

        return userRepository
                .searchUsers(
                        normalizedSearch,
                        role,
                        status,
                        pageable
                )
                .map(
                        this::convertToResponse
                );
    }

    /*
     * Returns one user by database ID.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public UserResponse getUserById(
            Long userId
    ) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() ->
                                new UserNotFoundException(
                                        "User not found."
                                )
                        );

        return convertToResponse(user);
    }

    /*
     * Updates an existing user.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse updateUser(
            Long userId,
            UpdateUserRequest request,
            String currentUsername
    ) {
        User actor =
                getUserByUsername(
                        currentUsername
                );

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() ->
                                new UserNotFoundException(
                                        "User not found."
                                )
                        );

        /*
         * Keep the previous state before modifying the entity.
         * This allows a specific status-change notification.
         */
        UserStatusEnum previousStatus =
                user.getStatus();

        String username =
                request.getUsername().trim();

        String email =
                request.getEmail()
                        .trim()
                        .toLowerCase();

        if (
                userRepository
                        .existsByUsernameAndIdNot(
                                username,
                                userId
                        )
        ) {
            throw new UserAlreadyExistsException(
                    "A user with this username already exists."
            );
        }

        if (
                userRepository
                        .existsByEmailAndIdNot(
                                email,
                                userId
                        )
        ) {
            throw new UserAlreadyExistsException(
                    "A user with this email already exists."
            );
        }

        validateActiveAdminUpdate(
                user,
                request
        );

        user.setUsername(username);

        user.setFullName(
                request.getFullName().trim()
        );

        user.setEmail(email);

        user.setRole(
                request.getRole()
        );

        user.setStatus(
                request.getStatus()
        );

        updatePasswordIfProvided(
                user,
                request.getPassword()
        );

        User updatedUser =
                userRepository.save(user);

        activityLogService.createActivityLog(
                actor,
                ActivityActionEnum.USER_UPDATED,
                "USER",
                updatedUser.getId(),
                "Updated user '"
                        + updatedUser.getUsername()
                        + "'."
        );

        publishUserUpdateNotification(
                actor,
                updatedUser,
                previousStatus
        );

        return convertToResponse(
                updatedUser
        );
    }

    /*
     * Deletes an existing user.
     *
     * The logged-in Admin cannot delete their own account.
     * Users connected to tasks or comments cannot be deleted.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteUser(
            Long userId,
            String currentUsername
    ) {
        User actor =
                getUserByUsername(
                        currentUsername
                );

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() ->
                                new UserNotFoundException(
                                        "User not found."
                                )
                        );

        if (
                user.getUsername()
                        .equals(currentUsername)
        ) {
            throw new InvalidRequestException(
                    "You cannot delete your own account."
            );
        }

        boolean connectedToTasks =
                taskRepository
                        .existsByAssignedUserIdOrCreatedById(
                                userId,
                                userId
                        );

        boolean authoredComments =
                commentRepository
                        .existsByAuthorId(
                                userId
                        );

        if (
                connectedToTasks ||
                        authoredComments
        ) {
            throw new InvalidRequestException(
                    "This user cannot be deleted because they are connected to existing tasks or comments."
            );
        }

        String deletedUsername =
                user.getUsername();

        /*
         * Notifications must be deleted before the User
         * because Notification.recipient is a foreign key.
         */
        notificationService
                .deleteNotificationsForRecipient(
                        userId
                );

        userRepository.delete(user);

        activityLogService.createActivityLog(
                actor,
                ActivityActionEnum.USER_DELETED,
                "USER",
                userId,
                "Deleted user '"
                        + deletedUsername
                        + "'."
        );
    }

    /*
     * Publishes either a general update notification or
     * a more specific activation/deactivation notification.
     *
     * One notification is created per update to avoid
     * duplicate alerts for the same operation.
     */
    private void publishUserUpdateNotification(
            User actor,
            User updatedUser,
            UserStatusEnum previousStatus
    ) {
        if (
                previousStatus !=
                        updatedUser.getStatus()
        ) {
            notificationService
                    .createNotificationsForActiveAdmins(
                            NotificationTypeEnum.USER_STATUS_CHANGED,
                            "User status changed",
                            actor.getFullName()
                                    + " changed user '"
                                    + updatedUser.getUsername()
                                    + "' from "
                                    + previousStatus.name()
                                    + " to "
                                    + updatedUser
                                    .getStatus()
                                    .name()
                                    + ".",
                            null
                    );

            return;
        }

        notificationService
                .createNotificationsForActiveAdmins(
                        NotificationTypeEnum.USER_UPDATED,
                        "User updated",
                        actor.getFullName()
                                + " updated user '"
                                + updatedUser.getUsername()
                                + "'.",
                        null
                );
    }

    /*
     * Prevents changing or disabling the final
     * active Admin account.
     */
    private void validateActiveAdminUpdate(
            User user,
            UpdateUserRequest request
    ) {
        boolean currentlyActiveAdmin =
                user.getRole() ==
                        RoleEnum.ADMIN
                        &&
                        user.getStatus() ==
                                UserStatusEnum.ACTIVE;

        boolean willRemainActiveAdmin =
                request.getRole() ==
                        RoleEnum.ADMIN
                        &&
                        request.getStatus() ==
                                UserStatusEnum.ACTIVE;

        if (
                currentlyActiveAdmin &&
                        !willRemainActiveAdmin
        ) {
            long activeAdminCount =
                    userRepository
                            .countByRoleAndStatus(
                                    RoleEnum.ADMIN,
                                    UserStatusEnum.ACTIVE
                            );

            if (activeAdminCount <= 1) {
                throw new InvalidRequestException(
                        "At least one active Admin account must remain."
                );
            }
        }
    }

    /*
     * Validates and hashes a new password only
     * when one is supplied.
     */
    private void updatePasswordIfProvided(
            User user,
            String newPassword
    ) {
        if (
                newPassword == null ||
                        newPassword.isBlank()
        ) {
            return;
        }

        if (
                newPassword.length() < 8 ||
                        newPassword.length() > 100
        ) {
            throw new InvalidRequestException(
                    "Password must contain between 8 and 100 characters."
            );
        }

        user.setPassword(
                passwordEncoder.encode(
                        newPassword
                )
        );
    }

    /*
     * Converts the entity into a safe response DTO.
     */
    private UserResponse convertToResponse(
            User user
    ) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name(),
                user.getCreatedAt()
        );
    }

    private void validatePagination(
            int page,
            int size
    ) {
        if (page < 0) {
            throw new InvalidRequestException(
                    "Page number cannot be negative."
            );
        }

        if (
                size < 1 ||
                        size > 100
        ) {
            throw new InvalidRequestException(
                    "Page size must be between 1 and 100."
            );
        }
    }

    /*
     * Loads a user by username.
     */
    private User getUserByUsername(
            String username
    ) {
        return userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new UserNotFoundException(
                                "User not found."
                        )
                );
    }
}