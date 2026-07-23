package com.tasksmanager.backend.feature.notification.entity;

import com.tasksmanager.backend.feature.notification.enums.NotificationTypeEnum;
import com.tasksmanager.backend.feature.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Represents a notification sent to one user.
 *
 * taskId is stored as a value instead of a Task relationship
 * so deleting a task does not prevent keeping the notification.
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /*
     * The user who receives this notification.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "recipient_id",
            nullable = false
    )
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "type",
            nullable = false,
            length = 40
    )
    private NotificationTypeEnum type;

    @Column(
            name = "title",
            nullable = false,
            length = 150
    )
    private String title;

    @Column(
            name = "message",
            nullable = false,
            length = 500
    )
    private String message;

    /*
     * Identifies the related task when the notification
     * was created. Some future notifications may not need it.
     */
    @Column(name = "task_id")
    private Long taskId;

    @Column(
            name = "is_read",
            nullable = false
    )
    private boolean read;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    /*
     * New notifications start as unread.
     */
    @PrePersist
    public void prePersist() {
        read = false;
        createdAt = LocalDateTime.now();
    }
}
