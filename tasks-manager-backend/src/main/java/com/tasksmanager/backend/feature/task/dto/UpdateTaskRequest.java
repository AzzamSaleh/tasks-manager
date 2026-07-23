package com.tasksmanager.backend.feature.task.dto;
import com.tasksmanager.backend.feature.task.enums.TaskPriorityEnum;
import com.tasksmanager.backend.feature.task.enums.TaskStatusEnum;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Contains the task information an Admin can update.
 *
 * All fields are required because this endpoint uses PUT,
 * which replaces the editable task information.
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateTaskRequest {

    @NotBlank(message = "Task title is mandatory")
    @Size(
            max = 150,
            message = "Task title cannot exceed 150 characters"
    )
    private String title;

    @Size(
            max = 1000,
            message = "Task description cannot exceed 1000 characters"
    )
    private String description;

    @NotNull(message = "Task priority is mandatory")
    private TaskPriorityEnum priority;

    @NotNull(message = "Task status is mandatory")
    private TaskStatusEnum status;

    @NotNull(message = "Due date is mandatory")
    @Future(message = "Due date must be in the future")
    private LocalDateTime dueDate;

    @NotNull(message = "Assigned user is mandatory")
    private Long assignedUserId;
}