package com.tasksmanager.backend.feature.task.dto;

import com.tasksmanager.backend.feature.task.enums.TaskStatusEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/*
 * Contains the new status selected by the assigned user.
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateTaskStatusRequest {

    @NotNull(message = "Task status is mandatory")
    private TaskStatusEnum status;
}
