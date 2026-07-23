package com.tasksmanager.backend.feature.comment.entity;

import com.tasksmanager.backend.feature.task.entity.Task;
import com.tasksmanager.backend.feature.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Represents a comment added to a task.
 *
 * Every comment belongs to one task and records
 * the user who created it.
 */
@Entity
@Table(name = "task_comments")
@Getter
@Setter
@NoArgsConstructor
public class TaskComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotBlank(message = "Comment content is mandatory")
    @Size(
            max = 1000,
            message = "Comment content cannot exceed 1000 characters"
    )
    @Column(
            name = "content",
            nullable = false,
            length = 1000
    )
    private String content;

    /*
     * The task that contains this comment.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "task_id",
            nullable = false
    )
    private Task task;

    /*
     * The Admin or User who added the comment.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "author_id",
            nullable = false
    )
    private User author;

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
     * Sets the creation and update timestamps
     * before the comment is inserted.
     */
    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;
    }

    /*
     * Updates the modification time when the comment changes.
     */
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}