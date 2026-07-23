package com.tasksmanager.backend.feature.comment.repository;

import com.tasksmanager.backend.feature.comment.entity.TaskComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/*
 * Provides database operations for task comments.
 */
public interface CommentRepository
        extends JpaRepository<TaskComment, Long> {

    /*
     * Used when deleting a task so its comments
     * are deleted first.
     */
    void deleteByTaskId(Long taskId);

    /*
     * Checks whether a user has authored comments.
     */
    boolean existsByAuthorId(Long authorId);

    /*
     * Returns comments for one task using pagination.
     */
    Page<TaskComment> findByTaskId(
            Long taskId,
            Pageable pageable
    );
    /*
     * Finds a comment only when it belongs
     * to the specified task.
     */
    Optional<TaskComment> findByIdAndTaskId(
            Long commentId,
            Long taskId
    );
}
