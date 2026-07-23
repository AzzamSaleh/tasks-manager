package com.tasksmanager.backend.feature.task.entity;


import com.tasksmanager.backend.feature.task.enums.TaskPriorityEnum;
import com.tasksmanager.backend.feature.task.enums.TaskStatusEnum;
import com.tasksmanager.backend.feature.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Represents a task stored in the database.
 *
 * Each task is assigned to one user and records
 * which Admin created it.
 */
@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotBlank(message = "Task title is mandatory")
    @Size(
            max = 150,
            message = "Task title cannot exceed 150 characters"
    )
    @Column(
            name = "title",
            nullable = false,
            length = 150
    )
    private String title;

    @Size(
            max = 1000,
            message = "Task description cannot exceed 1000 characters"
    )
    @Column(
            name = "description",
            length = 1000
    )
    private String description;

    @NotNull(message = "Task priority is mandatory")
    @Enumerated(EnumType.STRING)
    @Column(
            name = "priority",
            nullable = false,
            length = 20
    )
    private TaskPriorityEnum priority;

    @NotNull(message = "Task status is mandatory")
    @Enumerated(EnumType.STRING)
    @Column(
            name = "status",
            nullable = false,
            length = 20
    )
    private TaskStatusEnum status;

    @NotNull(message = "Due date is mandatory")
    @Column(
            name = "due_date",
            nullable = false
    )
    private LocalDateTime dueDate;

    /*
     * The user responsible for completing the task.
     *
     * LAZY means the user information is loaded only
     * when the application actually needs it.
     */
    @NotNull(message = "Assigned user is mandatory")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "assigned_user_id",
            nullable = false
    )
    private User assignedUser;

    /*
     * The Admin who created the task.
     */
    @NotNull(message = "Task creator is mandatory")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "created_by_id",
            nullable = false
    )
    private User createdBy;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @Column(
            name = "updated_at",
            nullable = false
    )
    private LocalDateTime updatedAt;

    /*
     * Automatically sets timestamps before the first insert.
     */
    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;
    }

    /*
     * Automatically updates the modification time.
     */
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
