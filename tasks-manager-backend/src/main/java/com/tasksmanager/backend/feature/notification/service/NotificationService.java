package com.tasksmanager.backend.feature.notification.service;

import com.tasksmanager.backend.common.exception.InvalidRequestException;
import com.tasksmanager.backend.feature.notification.dto.NotificationResponse;
import com.tasksmanager.backend.feature.notification.dto.UnreadNotificationCountResponse;
import com.tasksmanager.backend.feature.notification.entity.Notification;
import com.tasksmanager.backend.feature.notification.enums.NotificationTypeEnum;
import com.tasksmanager.backend.feature.notification.event.NotificationCreatedEvent;
import com.tasksmanager.backend.feature.notification.exception.NotificationNotFoundException;
import com.tasksmanager.backend.feature.notification.repository.NotificationRepository;
import com.tasksmanager.backend.feature.user.entity.User;
import com.tasksmanager.backend.feature.user.enums.RoleEnum;
import com.tasksmanager.backend.feature.user.enums.UserStatusEnum;
import com.tasksmanager.backend.feature.user.exception.UserNotFoundException;
import com.tasksmanager.backend.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/*
 * Creates and manages persisted notifications.
 *
 * Every read or update operation is restricted to
 * the authenticated user's own notification records.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired
    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            ApplicationEventPublisher eventPublisher
    ) {
        this.notificationRepository =
                notificationRepository;

        this.userRepository =
                userRepository;

        this.eventPublisher =
                eventPublisher;
    }

    /*
     * Creates one notification for a specific recipient.
     *
     * The record is first stored in MySQL. The published
     * event is delivered through WebSocket only after the
     * surrounding transaction commits successfully.
     */
    @Transactional
    public void createNotification(
            User recipient,
            NotificationTypeEnum type,
            String title,
            String message,
            Long taskId
    ) {
        saveAndPublishNotification(
                recipient,
                type,
                title,
                message,
                taskId
        );
    }

    /*
     * Creates the same notification for every active Admin.
     *
     * This is used for role-specific system events such as:
     * - User creation
     * - User updates
     * - User activation or deactivation
     *
     * The acting Admin is intentionally included. This allows
     * the requirement to work even when only one active Admin
     * exists in the system.
     */
    @Transactional
    public void createNotificationsForActiveAdmins(
            NotificationTypeEnum type,
            String title,
            String message,
            Long taskId
    ) {
        List<User> activeAdmins =
                userRepository.findAllByRoleAndStatus(
                        RoleEnum.ADMIN,
                        UserStatusEnum.ACTIVE
                );

        for (User admin : activeAdmins) {
            saveAndPublishNotification(
                    admin,
                    type,
                    title,
                    message,
                    taskId
            );
        }
    }

    /*
     * Removes all notifications belonging to a user.
     *
     * UserService calls this before deleting the User entity
     * so the foreign-key relationship remains valid.
     */
    @Transactional
    public void deleteNotificationsForRecipient(
            Long recipientId
    ) {
        notificationRepository.deleteByRecipientId(
                recipientId
        );
    }

    /*
     * Returns the authenticated user's notifications.
     *
     * The read filter is optional:
     * - null: all notifications
     * - true: read notifications
     * - false: unread notifications
     */
    @PreAuthorize(
            "hasAnyRole('ADMIN', 'USER')"
    )
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(
            String currentUsername,
            Boolean read,
            int page,
            int size
    ) {
        validatePagination(page, size);

        User currentUser =
                getCurrentUser(currentUsername);

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt"
                        )
                );

        Page<Notification> notifications;

        if (read == null) {
            notifications =
                    notificationRepository
                            .findByRecipientId(
                                    currentUser.getId(),
                                    pageable
                            );
        } else {
            notifications =
                    notificationRepository
                            .findByRecipientIdAndRead(
                                    currentUser.getId(),
                                    read,
                                    pageable
                            );
        }

        return notifications.map(
                this::convertToResponse
        );
    }

    /*
     * Returns the authenticated user's unread count.
     */
    @PreAuthorize(
            "hasAnyRole('ADMIN', 'USER')"
    )
    @Transactional(readOnly = true)
    public UnreadNotificationCountResponse
    getUnreadNotificationCount(
            String currentUsername
    ) {
        User currentUser =
                getCurrentUser(currentUsername);

        long unreadCount =
                notificationRepository
                        .countByRecipientIdAndReadFalse(
                                currentUser.getId()
                        );

        return new UnreadNotificationCountResponse(
                unreadCount
        );
    }

    /*
     * Marks one notification as read.
     *
     * Recipient ID is included in the repository query,
     * preventing one user from modifying another user's
     * notification.
     */
    @PreAuthorize(
            "hasAnyRole('ADMIN', 'USER')"
    )
    @Transactional
    public NotificationResponse markNotificationAsRead(
            Long notificationId,
            String currentUsername
    ) {
        User currentUser =
                getCurrentUser(currentUsername);

        Notification notification =
                notificationRepository
                        .findByIdAndRecipientId(
                                notificationId,
                                currentUser.getId()
                        )
                        .orElseThrow(() ->
                                new NotificationNotFoundException(
                                        "Notification not found."
                                )
                        );

        /*
         * Avoid unnecessary database updates when the
         * notification is already read.
         */
        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(
                    notification
            );
        }

        return convertToResponse(
                notification
        );
    }

    /*
     * Centralized notification creation prevents duplicated
     * persistence and event-publishing logic.
     */
    private void saveAndPublishNotification(
            User recipient,
            NotificationTypeEnum type,
            String title,
            String message,
            Long taskId
    ) {
        Notification notification =
                new Notification();

        notification.setRecipient(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setTaskId(taskId);

        Notification savedNotification =
                notificationRepository.save(
                        notification
                );

        eventPublisher.publishEvent(
                new NotificationCreatedEvent(
                        recipient.getUsername(),
                        convertToResponse(
                                savedNotification
                        )
                )
        );
    }

    private User getCurrentUser(
            String currentUsername
    ) {
        return userRepository
                .findByUsername(
                        currentUsername
                )
                .orElseThrow(() ->
                        new UserNotFoundException(
                                "User not found."
                        )
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

        if (size < 1 || size > 100) {
            throw new InvalidRequestException(
                    "Page size must be between 1 and 100."
            );
        }
    }

    private NotificationResponse convertToResponse(
            Notification notification
    ) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType().name(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getTaskId(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
