package com.tasksmanager.backend.feature.comment.controller;

import com.tasksmanager.backend.feature.comment.dto.CommentResponse;
import com.tasksmanager.backend.feature.comment.dto.CreateCommentRequest;
import com.tasksmanager.backend.feature.comment.dto.UpdateCommentRequest;
import com.tasksmanager.backend.feature.comment.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/*
 * Provides comment endpoints for tasks.
 */
@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
@Tag(
        name = "Task Comments",
        description = "Operations for comments attached to tasks"
)
public class CommentController {

    private final CommentService commentService;

    @Autowired
    public CommentController(
            CommentService commentService
    ) {
        this.commentService = commentService;
    }

    @PostMapping
    @Operation(
            summary = "Create comment",
            description = "Add a comment to an accessible task"
    )
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication
    ) {
        CommentResponse response =
                commentService.createComment(
                        taskId,
                        request,
                        authentication.getName()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /*
     * Returns comments for an accessible task.
     */
    @GetMapping
    @Operation(
            summary = "Get task comments",
            description = "Get a paginated list of comments for an accessible task"
    )
    public ResponseEntity<Page<CommentResponse>> getComments(

            @PathVariable Long taskId,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size,

            Authentication authentication
    ) {
        return ResponseEntity.ok(
                commentService.getComments(
                        taskId,
                        authentication.getName(),
                        page,
                        size
                )
        );
    }

    /*
     * Updates one comment created by the authenticated user.
     */
    @PutMapping("/{commentId}")
    @Operation(
            summary = "Update comment",
            description = "Update a comment created by the authenticated user"
    )
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long taskId,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                commentService.updateComment(
                        taskId,
                        commentId,
                        request,
                        authentication.getName()
                )
        );
    }

    /*
     * Deletes one comment.
     */
    @DeleteMapping("/{commentId}")
    @Operation(
            summary = "Delete comment",
            description = "Delete an accessible task comment"
    )
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long taskId,
            @PathVariable Long commentId,
            Authentication authentication
    ) {
        commentService.deleteComment(
                taskId,
                commentId,
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }
}
