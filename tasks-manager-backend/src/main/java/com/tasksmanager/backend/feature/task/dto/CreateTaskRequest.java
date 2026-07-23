package com.tasksmanager.backend.feature.task.dto;

import com.tasksmanager.backend.feature.task.enums.TaskPriorityEnum;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Contains and validates the information required
 * when an Admin creates a task.
 */
@Getter
@Setter
@NoArgsConstructor
public class CreateTaskRequest {

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

    @NotNull(message = "Due date is mandatory")
    @Future(message = "Due date must be in the future")
    private LocalDateTime dueDate;

    @NotNull(message = "Assigned user is mandatory")
    private Long assignedUserId;
}
