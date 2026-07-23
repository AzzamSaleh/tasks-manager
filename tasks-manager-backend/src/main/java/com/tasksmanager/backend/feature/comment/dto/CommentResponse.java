package com.tasksmanager.backend.feature.comment.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDateTime;

/*
 * Contains comment information returned to the frontend.
 */
@Getter
@AllArgsConstructor
public class CommentResponse {

    private Long id;
    private String content;

    private Long taskId;

    private Long authorId;
    private String authorName;
    private String authorRole;

    private Instant createdAt;
    private Instant updatedAt;
}