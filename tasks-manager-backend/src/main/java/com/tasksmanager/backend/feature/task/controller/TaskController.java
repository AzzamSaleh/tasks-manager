package com.tasksmanager.backend.feature.task.controller;


import com.tasksmanager.backend.feature.task.dto.CreateTaskRequest;
import com.tasksmanager.backend.feature.task.dto.TaskResponse;
import com.tasksmanager.backend.feature.task.dto.UpdateTaskRequest;
import com.tasksmanager.backend.feature.task.dto.UpdateTaskStatusRequest;
import com.tasksmanager.backend.feature.task.enums.TaskPriorityEnum;
import com.tasksmanager.backend.feature.task.enums.TaskStatusEnum;
import com.tasksmanager.backend.feature.task.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestParam;
/*
 * Provides task-management API endpoints.
 */
@RestController
@RequestMapping("/api/tasks")
@Tag(
        name = "Task Management",
        description = "Operations for creating and managing tasks"
)
public class TaskController {

    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    @Operation(
            summary = "Create task",
            description = "Create a task and assign it to an active user"
    )
    public ResponseEntity<TaskResponse> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            Authentication authentication
    ) {
        TaskResponse response = taskService.createTask(
                request,
                authentication.getName()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /*
     * Returns tasks visible to the authenticated user.
     */
    @GetMapping
    @Operation(
            summary = "Get Tasks",
            description = "Get accessible Tasks with optional search, status, priority, assignee, sorting, and pagination"
    )
    public ResponseEntity<Page<TaskResponse>> getTasks(
            @RequestParam(
                    required = false
            )
            String search,

            @RequestParam(
                    required = false
            )
            TaskStatusEnum status,

            @RequestParam(
                    required = false
            )
            TaskPriorityEnum priority,

            /*
             * Explicit name ensures that the Angular query
             * parameter assignedUserId is mapped correctly.
             */
            @RequestParam(
                    name = "assignedUserId",
                    required = false
            )
            Long assignedUserId,

            @PageableDefault(
                    sort = "dueDate",
                    direction = Sort.Direction.ASC
            )
            Pageable pageable,

            Authentication authentication
    ) {
        return ResponseEntity.ok(
                taskService.getTasks(
                        search,
                        status,
                        priority,
                        assignedUserId,
                        pageable,
                        authentication.getName()
                )
        );
    }

    /*
     * Returns one task when it is visible
     * to the authenticated user.
     */
    @GetMapping("/{id}")
    @Operation(
            summary = "Get task by ID",
            description = "Admin can view any task while User can view assigned tasks only"
    )
    public ResponseEntity<TaskResponse> getTaskById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                taskService.getTaskById(
                        id,
                        authentication.getName()
                )
        );
    }
    /*
     * Updates one task using its database ID.
     */
    @PutMapping("/{id}")
    @Operation(
            summary = "Update task",
            description = "Update task details, status, priority, due date, or assigned user"
    )
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                taskService.updateTask(
                        id,
                        request,
                        authentication.getName()
                )
        );
    }

    /*
     * Allows the assigned User to update task status only.
     */
    @PatchMapping("/{id}/status")
    @Operation(
            summary = "Update task status",
            description = "Allow a User to update the status of an assigned task"
    )
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                taskService.updateTaskStatus(
                        id,
                        request,
                        authentication.getName()
                )
        );
    }

    /*
     * Deletes one task using its database ID.
     */
    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete task",
            description = "Delete an existing task"
    )
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            Authentication authentication
    ) {
        taskService.deleteTask(
                id,
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }
}