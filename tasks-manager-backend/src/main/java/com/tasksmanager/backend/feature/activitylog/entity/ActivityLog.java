package com.tasksmanager.backend.feature.activitylog.entity;
import com.tasksmanager.backend.feature.activitylog.enums.ActivityActionEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Stores an audit record of an important action.
 *
 * Username and role are stored as text instead of a User relationship.
 * This keeps the log even when the related user is later deleted.
 */
@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /*
     * Username of the person who performed the operation.
     */
    @Column(
            name = "actor_username",
            nullable = false,
            length = 50
    )
    private String actorUsername;

    /*
     * Role of the person at the time the action occurred.
     */
    @Column(
            name = "actor_role",
            nullable = false,
            length = 20
    )
    private String actorRole;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "action",
            nullable = false,
            length = 50
    )
    private ActivityActionEnum action;

    /*
     * Identifies the affected feature, such as USER, TASK,
     * COMMENT, PROFILE, or AUTHENTICATION.
     */
    @Column(
            name = "entity_type",
            nullable = false,
            length = 30
    )
    private String entityType;

    /*
     * ID of the affected record.
     *
     * It is nullable because actions such as login
     * may not target a specific database record.
     */
    @Column(name = "entity_id")
    private Long entityId;

    @Column(
            name = "description",
            nullable = false,
            length = 500
    )
    private String description;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}