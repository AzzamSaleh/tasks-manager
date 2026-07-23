package com.tasksmanager.backend.feature.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/*
 * Contains the new content when an author edits a comment.
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateCommentRequest {

    @NotBlank(message = "Comment content is mandatory")
    @Size(
            max = 1000,
            message = "Comment content cannot exceed 1000 characters"
    )
    private String content;
}