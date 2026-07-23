package com.tasksmanager.backend.feature.task.repository;

import com.tasksmanager.backend.feature.task.entity.Task;
import com.tasksmanager.backend.feature.task.enums.TaskPriorityEnum;
import com.tasksmanager.backend.feature.task.enums.TaskStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

/*
 * Provides database operations, filtering,
 * and dashboard counts for Tasks.
 */
public interface TaskRepository extends JpaRepository<Task, Long> {

    /*
     * Checks whether a user is connected to a task
     * as its assignee or creator.
     */
    boolean existsByAssignedUserIdOrCreatedById(
            Long assignedUserId,
            Long createdById
    );

    /*
     * Admin dashboard counts.
     */
    long countByStatus(TaskStatusEnum status);

    long countByDueDateBeforeAndStatusNot(
            LocalDateTime currentDateTime,
            TaskStatusEnum excludedStatus
    );

    /*
     * User dashboard counts.
     */
    long countByAssignedUserId(Long assignedUserId);

    long countByAssignedUserIdAndStatus(
            Long assignedUserId,
            TaskStatusEnum status
    );

    long countByAssignedUserIdAndDueDateBeforeAndStatusNot(
            Long assignedUserId,
            LocalDateTime currentDateTime,
            TaskStatusEnum excludedStatus
    );

    /*
     * Searches and filters tasks.
     *
     * assignedUserId is null for Admin, so all tasks are returned.
     * For a normal User, it contains their ID and restricts the result
     * to tasks assigned to them.
     */
    @Query("""
            SELECT task
            FROM Task task
            WHERE (
                :search IS NULL
                OR LOWER(task.title)
                    LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(task.description)
                    LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(task.assignedUser.fullName)
                    LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(task.assignedUser.username)
                    LIKE LOWER(CONCAT('%', :search, '%'))
            )
            AND (
                :status IS NULL
                OR task.status = :status
            )
            AND (
                :priority IS NULL
                OR task.priority = :priority
            )
            AND (
                :assignedUserId IS NULL
                OR task.assignedUser.id = :assignedUserId
            )
            """)
    Page<Task> searchTasks(
            @Param("search")
            String search,

            @Param("status")
            TaskStatusEnum status,

            @Param("priority")
            TaskPriorityEnum priority,

            @Param("assignedUserId")
            Long assignedUserId,

            Pageable pageable
    );
}
