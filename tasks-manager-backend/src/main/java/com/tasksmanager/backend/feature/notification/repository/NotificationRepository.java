package com.tasksmanager.backend.feature.notification.repository;

import com.tasksmanager.backend.feature.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/*
 * Provides database operations for user notifications.
 */
public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    /*
     * Returns all notifications belonging to one user.
     */
    Page<Notification> findByRecipientId(
            Long recipientId,
            Pageable pageable
    );

    /*
     * Returns only read or unread notifications.
     */
    Page<Notification> findByRecipientIdAndRead(
            Long recipientId,
            boolean read,
            Pageable pageable
    );

    /*
     * Counts the user's unread notifications.
     */
    long countByRecipientIdAndReadFalse(Long recipientId);

    /*
     * Finds a notification only when it belongs
     * to the authenticated user.
     */
    Optional<Notification> findByIdAndRecipientId(
            Long notificationId,
            Long recipientId
    );

    /*
     * Removes a user's notifications before deleting their account.
     */
    void deleteByRecipientId(Long recipientId);
}