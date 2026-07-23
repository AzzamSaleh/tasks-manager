package com.tasksmanager.backend.feature.comment.service;

import com.tasksmanager.backend.feature.activitylog.enums.ActivityActionEnum;
import com.tasksmanager.backend.feature.activitylog.service.ActivityLogService;
import com.tasksmanager.backend.feature.comment.dto.CommentResponse;
import com.tasksmanager.backend.feature.comment.dto.CreateCommentRequest;
import com.tasksmanager.backend.feature.comment.entity.TaskComment;
import com.tasksmanager.backend.feature.comment.repository.CommentRepository;
import com.tasksmanager.backend.feature.notification.enums.NotificationTypeEnum;
import com.tasksmanager.backend.feature.notification.service.NotificationService;
import com.tasksmanager.backend.feature.task.entity.Task;
import com.tasksmanager.backend.feature.task.exception.TaskNotFoundException;
import com.tasksmanager.backend.feature.task.repository.TaskRepository;
import com.tasksmanager.backend.feature.user.entity.User;
import com.tasksmanager.backend.feature.user.enums.RoleEnum;
import com.tasksmanager.backend.feature.user.exception.UserNotFoundException;
import com.tasksmanager.backend.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tasksmanager.backend.common.exception.InvalidRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.tasksmanager.backend.feature.comment.dto.UpdateCommentRequest;
import com.tasksmanager.backend.feature.comment.exception.CommentNotFoundException;
import org.springframework.security.access.AccessDeniedException;
/*
 * Contains the business logic for task comments.
 */
@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Autowired
    public CommentService(
            CommentRepository commentRepository,
            TaskRepository taskRepository,
            UserRepository userRepository,
            ActivityLogService activityLogService,
            NotificationService notificationService
    ) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.activityLogService = activityLogService;
        this.notificationService = notificationService;
    }

    /*
     * Adds a comment to a task.
     *
     * Admin can comment on any task.
     * User can comment only on an assigned task.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @Transactional
    public CommentResponse createComment(
            Long taskId,
            CreateCommentRequest request,
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

        validateTaskAccess(task, currentUser);

        TaskComment comment = new TaskComment();

        comment.setContent(request.getContent().trim());
        comment.setTask(task);
        comment.setAuthor(currentUser);

        TaskComment savedComment =
                commentRepository.save(comment);

        activityLogService.createActivityLog(
                currentUser,
                ActivityActionEnum.COMMENT_CREATED,
                "COMMENT",
                savedComment.getId(),
                "Added a comment to task ID "
                        + task.getId()
                        + "."
        );

        /*
         * Admin comments notify the assigned user.
         * User comments notify the Admin who created the task.
         */
        User notificationRecipient =
                currentUser.getRole() == RoleEnum.ADMIN
                        ? task.getAssignedUser()
                        : task.getCreatedBy();

        /*
         * Prevents creating a notification for the same
         * user who added the comment.
         */
        if (!notificationRecipient.getId()
                .equals(currentUser.getId())) {

            notificationService.createNotification(
                    notificationRecipient,
                    NotificationTypeEnum.COMMENT_ADDED,
                    "New task comment",
                    currentUser.getFullName()
                            + " commented on task '"
                            + task.getTitle()
                            + "'.",
                    task.getId()
            );
        }
        return convertToResponse(savedComment);
    }

    /*
     * Prevents a normal User from accessing
     * a task assigned to another account.
     */
    private void validateTaskAccess(
            Task task,
            User currentUser
    ) {
        boolean userAccessingAnotherTask =
                currentUser.getRole() == RoleEnum.USER
                        && !task.getAssignedUser()
                        .getId()
                        .equals(currentUser.getId());

        if (userAccessingAnotherTask) {
            throw new TaskNotFoundException("Task not found.");
        }
    }

    /*
     * Converts the entity into a safe API response.
     */
    private CommentResponse convertToResponse(
            TaskComment comment
    ) {
        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getTask().getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getFullName(),
                comment.getAuthor().getRole().name(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }

    /*
     * Returns comments for one accessible task.
     *
     * Admin can view comments for any task.
     * User can view comments only for an assigned task.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(
            Long taskId,
            String currentUsername,
            int page,
            int size
    ) {
        validatePagination(page, size);

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
         * Reuses the same access rule used when creating comments.
         */
        validateTaskAccess(task, currentUser);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Direction.ASC,
                        "createdAt"
                )
        );

        return commentRepository
                .findByTaskId(taskId, pageable)
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
     * Updates a comment created by the authenticated user.
     *
     * Admin and User can edit only their own comments.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @Transactional
    public CommentResponse updateComment(
            Long taskId,
            Long commentId,
            UpdateCommentRequest request,
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

        validateTaskAccess(task, currentUser);

        TaskComment comment = commentRepository
                .findByIdAndTaskId(commentId, taskId)
                .orElseThrow(() ->
                        new CommentNotFoundException(
                                "Comment not found."
                        )
                );

        /*
         * Comments may be edited only by their original author.
         */
        if (!comment.getAuthor()
                .getId()
                .equals(currentUser.getId())) {

            throw new AccessDeniedException(
                    "You can only update your own comments."
            );
        }

        comment.setContent(request.getContent().trim());

        TaskComment updatedComment =
                commentRepository.save(comment);


        activityLogService.createActivityLog(
                currentUser,
                ActivityActionEnum.COMMENT_UPDATED,
                "COMMENT",
                updatedComment.getId(),
                "Updated a comment on task ID "
                        + task.getId()
                        + "."
        );

        return convertToResponse(updatedComment);
    }
    /*
     * Deletes a comment.
     *
     * Admin can delete any comment.
     * User can delete only comments they created.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @Transactional
    public void deleteComment(
            Long taskId,
            Long commentId,
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

        validateTaskAccess(task, currentUser);

        TaskComment comment = commentRepository
                .findByIdAndTaskId(commentId, taskId)
                .orElseThrow(() ->
                        new CommentNotFoundException(
                                "Comment not found."
                        )
                );

        boolean adminUser =
                currentUser.getRole() == RoleEnum.ADMIN;

        boolean commentAuthor =
                comment.getAuthor()
                        .getId()
                        .equals(currentUser.getId());

        if (!adminUser && !commentAuthor) {
            throw new AccessDeniedException(
                    "You can only delete your own comments."
            );
        }
        Long deletedCommentId = comment.getId();

        commentRepository.delete(comment);

        activityLogService.createActivityLog(
                currentUser,
                ActivityActionEnum.COMMENT_DELETED,
                "COMMENT",
                deletedCommentId,
                "Deleted a comment from task ID "
                        + task.getId()
                        + "."
        );
    }

}
