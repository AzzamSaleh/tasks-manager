package com.tasksmanager.backend.feature.task.service;

import com.tasksmanager.backend.common.exception.InvalidRequestException;
import com.tasksmanager.backend.feature.activitylog.enums.ActivityActionEnum;
import com.tasksmanager.backend.feature.activitylog.service.ActivityLogService;
import com.tasksmanager.backend.feature.comment.repository.CommentRepository;
import com.tasksmanager.backend.feature.notification.enums.NotificationTypeEnum;
import com.tasksmanager.backend.feature.notification.service.NotificationService;
import com.tasksmanager.backend.feature.task.dto.UpdateTaskStatusRequest;
import com.tasksmanager.backend.feature.task.exception.TaskNotFoundException;
import com.tasksmanager.backend.feature.user.exception.UserNotFoundException;
import com.tasksmanager.backend.feature.task.dto.CreateTaskRequest;
import com.tasksmanager.backend.feature.task.dto.TaskResponse;
import com.tasksmanager.backend.feature.task.entity.Task;
import com.tasksmanager.backend.feature.task.enums.TaskPriorityEnum;
import com.tasksmanager.backend.feature.task.enums.TaskStatusEnum;
import com.tasksmanager.backend.feature.task.repository.TaskRepository;
import com.tasksmanager.backend.feature.user.entity.User;
import com.tasksmanager.backend.feature.user.enums.RoleEnum;
import com.tasksmanager.backend.feature.user.enums.UserStatusEnum;
import com.tasksmanager.backend.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tasksmanager.backend.feature.task.dto.UpdateTaskRequest;

/*
 * Contains task-management business logic.
 *
 * Controllers receive HTTP requests, while this service
 * validates, creates, and saves tasks.
 */
@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Autowired
    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository,
            CommentRepository commentRepository,
            ActivityLogService activityLogService,
            NotificationService notificationService
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.activityLogService = activityLogService;
        this.notificationService = notificationService;
    }

    /*
     * Creates and assigns a task.
     *
     * Only an authenticated Admin can execute this operation.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public TaskResponse createTask(
            CreateTaskRequest request,
            String currentUsername
    ) {
        User assignedUser = userRepository
                .findById(request.getAssignedUserId())
                .orElseThrow(() ->
                        new UserNotFoundException("User not found.")
                );

        validateAssignedUser(assignedUser);

        /*
         * The authenticated username comes from the validated JWT.
         * It identifies the Admin who created the task.
         */
        User createdBy = userRepository
                .findByUsername(currentUsername)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found.")
                );

        Task task = new Task();

        task.setTitle(request.getTitle().trim());
        task.setDescription(
                normalizeDescription(request.getDescription())
        );
        task.setPriority(request.getPriority());

        /*
         * Every new task starts as PENDING.
         * The client cannot create an already completed task.
         */
        task.setStatus(TaskStatusEnum.PENDING);

        task.setDueDate(request.getDueDate());
        task.setAssignedUser(assignedUser);
        task.setCreatedBy(createdBy);

        Task savedTask = taskRepository.save(task);

        activityLogService.createActivityLog(
                createdBy,
                ActivityActionEnum.TASK_CREATED,
                "TASK",
                savedTask.getId(),
                "Created task '" + savedTask.getTitle() + "'."
        );

        /*
         * Notifies the user that a new task was assigned to them.
         */
        notificationService.createNotification(
                assignedUser,
                NotificationTypeEnum.TASK_ASSIGNED,
                "New task assigned",
                "You have been assigned task '"
                        + savedTask.getTitle()
                        + "'.",
                savedTask.getId()
        );


        return convertToResponse(savedTask);
    }

    /*
     * Tasks can only be assigned to active accounts
     * that have the USER role.
     */
    private void validateAssignedUser(User assignedUser) {

        if (assignedUser.getStatus() == UserStatusEnum.INACTIVE) {
            throw new InvalidRequestException(
                    "The selected user is inactive and cannot receive tasks."
            );
        }

        if (assignedUser.getRole() != RoleEnum.USER) {
            throw new InvalidRequestException(
                    "Tasks can only be assigned to users with the USER role."
            );
        }
    }

    /*
     * Stores null instead of unnecessary blank description text.
     */
    private String normalizeDescription(String description) {

        if (description == null || description.isBlank()) {
            return null;
        }

        return description.trim();
    }

    /*
     * Converts the Task entity into a safe API response.
     */
    private TaskResponse convertToResponse(Task task) {

        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority().name(),
                task.getStatus().name(),
                task.getDueDate(),
                task.getAssignedUser().getId(),
                task.getAssignedUser().getFullName(),
                task.getCreatedBy().getId(),
                task.getCreatedBy().getFullName(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    /*
     * Returns Tasks based on the authenticated role.
     *
     * Admin:
     * - Can see all Tasks.
     * - Can optionally filter by assignedUserId.
     *
     * User:
     * - Can see only Tasks assigned to their own account.
     * - Any assignee ID sent by the frontend is ignored.
     */
    @PreAuthorize(
            "hasAnyRole('ADMIN', 'USER')"
    )
    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasks(
            String search,
            TaskStatusEnum status,
            TaskPriorityEnum priority,
            Long assignedUserId,
            Pageable pageable,
            String currentUsername
    ) {
        User currentUser =
                userRepository
                        .findByUsername(currentUsername)
                        .orElseThrow(() ->
                                new UserNotFoundException(
                                        "User not found."
                                )
                        );

        String normalizedSearch =
                normalizeSearch(search);

        /*
         * Admin may use the selected assignee filter.
         *
         * A regular User is always restricted to their
         * own database ID, regardless of request parameters.
         */
        Long effectiveAssignedUserId =
                currentUser.getRole() == RoleEnum.ADMIN
                        ? assignedUserId
                        : currentUser.getId();

        return taskRepository
                .searchTasks(
                        normalizedSearch,
                        status,
                        priority,
                        effectiveAssignedUserId,
                        pageable
                )
                .map(this::convertToResponse);
    }

    /*
     * Prevents invalid or excessively large page requests.
     */
    private void validatePagination(int page, int size) {

        if (page < 0) {
            throw new InvalidRequestException(
                    "Page number cannot be negative."
            );
        }

        if (size < 1 || size > 100) {
            throw new InvalidRequestException(
                    "Page size must be between 1 and 100."
            );
        }
    }

    /*
     * Returns one task based on the authenticated user's role.
     *
     * Admin can view any task.
     * User can view only a task assigned to their account.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(
            Long taskId,
            String currentUsername
    ) {
        User currentUser = userRepository
                .findByUsername(currentUsername)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found.")
                );

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new TaskNotFoundException("Task not found.")
                );

        /*
         * Returning 404 instead of 403 prevents users from knowing
         * whether another user's task exists.
         */
        boolean normalUserAccessingAnotherTask =
                currentUser.getRole() == RoleEnum.USER
                        && !task.getAssignedUser()
                        .getId()
                        .equals(currentUser.getId());

        if (normalUserAccessingAnotherTask) {
            throw new TaskNotFoundException("Task not found.");
        }

        return convertToResponse(task);
    }

    /*
     * Updates an existing task.
     *
     * Only Admin can change task details or assign
     * the task to another user.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public TaskResponse updateTask(
            Long taskId,
            UpdateTaskRequest request,
            String currentUsername
    ) {
        User actor = userRepository.findByUsername(currentUsername)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found.")
                );

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new TaskNotFoundException("Task not found.")
                );

        User assignedUser = userRepository
                .findById(request.getAssignedUserId())
                .orElseThrow(() ->
                        new UserNotFoundException("User not found.")
                );

        validateAssignedUser(assignedUser);

        /*
         * Keeps the previous assignment so we can detect
         * whether the task was reassigned.
         */
        User previousAssignedUser = task.getAssignedUser();

        boolean assignedUserChanged =
                !previousAssignedUser.getId()
                        .equals(assignedUser.getId());

        task.setTitle(request.getTitle().trim());
        task.setDescription(
                normalizeDescription(request.getDescription())
        );
        task.setPriority(request.getPriority());
        task.setStatus(request.getStatus());
        task.setDueDate(request.getDueDate());
        task.setAssignedUser(assignedUser);

        Task updatedTask = taskRepository.save(task);

        activityLogService.createActivityLog(
                actor,
                ActivityActionEnum.TASK_UPDATED,
                "TASK",
                updatedTask.getId(),
                "Updated task '" + updatedTask.getTitle() + "'."
        );

        if (assignedUserChanged) {

            /*
             * Informs the previous user that the task
             * is no longer assigned to them.
             */
            notificationService.createNotification(
                    previousAssignedUser,
                    NotificationTypeEnum.TASK_REASSIGNED,
                    "Task reassigned",
                    "Task '"
                            + updatedTask.getTitle()
                            + "' is no longer assigned to you.",
                    updatedTask.getId()
            );

            /*
             * Informs the new user that they received the task.
             */
            notificationService.createNotification(
                    assignedUser,
                    NotificationTypeEnum.TASK_REASSIGNED,
                    "New task assigned",
                    "Task '"
                            + updatedTask.getTitle()
                            + "' has been assigned to you.",
                    updatedTask.getId()
            );

        } else {

            /*
             * The assignment did not change, so the assigned user
             * is informed that the task details were updated.
             */
            notificationService.createNotification(
                    assignedUser,
                    NotificationTypeEnum.TASK_UPDATED,
                    "Task updated",
                    "Task '"
                            + updatedTask.getTitle()
                            + "' has been updated.",
                    updatedTask.getId()
            );
        }

        return convertToResponse(updatedTask);
    }
    /*
     * Allows a normal User to update the status
     * of a task assigned to their account.
     */
    @PreAuthorize("hasRole('USER')")
    @Transactional
    public TaskResponse updateTaskStatus(
            Long taskId,
            UpdateTaskStatusRequest request,
            String currentUsername
    ) {
        User currentUser = userRepository
                .findByUsername(currentUsername)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found.")
                );

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new TaskNotFoundException("Task not found.")
                );

        /*
         * Returning 404 prevents users from discovering
         * tasks assigned to other accounts.
         */
        boolean taskNotAssignedToCurrentUser =
                !task.getAssignedUser()
                        .getId()
                        .equals(currentUser.getId());

        if (taskNotAssignedToCurrentUser) {
            throw new TaskNotFoundException("Task not found.");
        }

        task.setStatus(request.getStatus());

        Task updatedTask = taskRepository.save(task);


        activityLogService.createActivityLog(
                currentUser,
                ActivityActionEnum.TASK_STATUS_UPDATED,
                "TASK",
                updatedTask.getId(),
                "Changed task status to "
                        + updatedTask.getStatus().name()
                        + "."
        );

        /*
         * Notifies the task creator that the assigned user
         * changed the task status.
         */
        User taskCreator = task.getCreatedBy();

        notificationService.createNotification(
                taskCreator,
                NotificationTypeEnum.TASK_STATUS_UPDATED,
                "Task status updated",
                currentUser.getFullName()
                        + " changed task '"
                        + updatedTask.getTitle()
                        + "' to "
                        + updatedTask.getStatus().name()
                        + ".",
                updatedTask.getId()
        );

        return convertToResponse(updatedTask);
    }

    /*
     * Deletes an existing task.
     *
     * Only an authenticated Admin can perform this operation.
     */
    /*
     * Deletes an existing task and informs
     * the assigned user.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteTask(
            Long taskId,
            String currentUsername
    ) {
        User actor = userRepository.findByUsername(currentUsername)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found.")
                );

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new TaskNotFoundException("Task not found.")
                );

        String deletedTaskTitle = task.getTitle();
        User assignedUser = task.getAssignedUser();

        commentRepository.deleteByTaskId(taskId);
        taskRepository.delete(task);

        activityLogService.createActivityLog(
                actor,
                ActivityActionEnum.TASK_DELETED,
                "TASK",
                taskId,
                "Deleted task '" + deletedTaskTitle + "'."
        );

        /*
         * The notification keeps the previous task ID as information,
         * although the task itself no longer exists.
         */
        notificationService.createNotification(
                assignedUser,
                NotificationTypeEnum.TASK_DELETED,
                "Task deleted",
                "Task '"
                        + deletedTaskTitle
                        + "' has been deleted.",
                taskId
        );
    }

    /*
     * Converts blank search values into null so the
     * repository optional-search condition works correctly.
     */
    private String normalizeSearch(
            String search
    ) {
        if (
                search == null ||
                        search.isBlank()
        ) {
            return null;
        }

        return search.trim();
    }
}
