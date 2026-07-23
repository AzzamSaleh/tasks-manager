import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { createPagedListState } from '../../../../core/state/paged-list.state';
import { AlertService } from '../../../../core/services/alert.service';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { FormErrorService } from '../../../../core/services/form-error.service';

import { AuthService } from '../../../auth/services/auth.service';

import { TASK_PRIORITY_META, TASK_STATUS_META } from '../../constants/task.constants';

import { TaskCommentResponse } from '../../models/task-comment.models';

import { TaskDueState, TaskResponse } from '../../models/task.models';

import { TaskCommentService } from '../../services/task-comment.service';
import { TaskService } from '../../services/task.service';

import { getTaskDueLabel, getTaskDueState } from '../../utils/task-date.util';

const COMMENT_PAGE_SIZE = 10;
const COMMENT_MAX_LENGTH = 2000;

/*
 * Displays complete Task information and manages
 * the Task's chronological comment discussion.
 */
@Component({
  selector: 'app-task-details-dialog',
  imports: [
    DatePipe,
    NgClass,
    ReactiveFormsModule
  ],
  templateUrl: './task-details-dialog.html',
  styleUrl: './task-details-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskDetailsDialog implements OnInit {

  readonly taskId = input.required<number>();

  readonly closed = output<void>();

  private readonly destroyRef = inject(DestroyRef);

  private readonly formBuilder = inject(NonNullableFormBuilder);

  private readonly taskService = inject(TaskService);

  private readonly commentService = inject(TaskCommentService);

  private readonly authService = inject(AuthService);

  private readonly alertService = inject(AlertService);

  private readonly apiErrorService = inject(ApiErrorService);

  private readonly formErrorService = inject(FormErrorService);

  private readonly confirmationService = inject(ConfirmationService);

  private readonly commentState = createPagedListState<TaskCommentResponse>(COMMENT_PAGE_SIZE);

  readonly task = signal<TaskResponse | null>(null);

  readonly isLoadingTask = signal(false);

  readonly taskError = signal<string | null>(null);

  readonly isCreatingComment = signal(false);

  readonly editingCommentId = signal<number | null>(null);

  readonly updatingCommentId = signal<number | null>(null);

  readonly deletingCommentId = signal<number | null>(null);

  readonly comments = this.commentState.items;

  readonly isLoadingComments = this.commentState.isLoading;

  readonly commentsError = this.commentState.errorMessage;

  readonly commentPage = this.commentState.currentPage;

  readonly commentTotalPages = this.commentState.totalPages;

  readonly commentTotalElements = this.commentState.totalElements;

  readonly commentVisiblePages = this.commentState.visiblePages;

  readonly commentIsFirstPage = this.commentState.isFirstPage;

  readonly commentIsLastPage = this.commentState.isLastPage;

  readonly currentUser = this.authService.currentUser;

  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  readonly statusMeta = TASK_STATUS_META;

  readonly priorityMeta = TASK_PRIORITY_META;

  readonly commentForm = this.formBuilder.group({
    content: [
      '',
      [
        Validators.required,
        Validators.maxLength(COMMENT_MAX_LENGTH)
      ]
    ]
  });

  readonly editCommentForm = this.formBuilder.group({
    content: [
      '',
      [
        Validators.required,
        Validators.maxLength(COMMENT_MAX_LENGTH)
      ]
    ]
  });

  ngOnInit(): void {
    this.loadTask();
    this.loadComments(0);
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.close();
  }

  close(): void {
    if (
      this.isCreatingComment() ||
      this.updatingCommentId() !== null ||
      this.deletingCommentId() !== null
    ) {
      return;
    }

    this.closed.emit();
  }

  retry(): void {
    this.loadTask();
    this.loadComments(this.commentPage());
  }

  submitComment(): void {
    this.formErrorService.clearBackendErrors(this.commentForm);

    /*
     * Prevents submission when the comment exceeds
     * the configured 2,000-character limit.
     */
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }

    const content = this.commentForm.controls.content.value.trim();

    /*
     * Angular's required validator accepts text containing
     * only spaces, so trimmed content is checked separately.
     */
    if (!content) {
      this.commentForm.controls.content.setErrors({
        required: true
      });

      this.commentForm.controls.content.markAsTouched();
      return;
    }

    this.isCreatingComment.set(true);

    this.commentService
      .createComment(
        this.taskId(),
        {
          content
        }
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.isCreatingComment.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.commentForm.reset({
            content: ''
          });

          this.alertService.success(
            'Your comment was added successfully.',
            'Comment added'
          );

          /*
           * Comments are sorted oldest-to-newest.
           * After creation, load the last page so
           * the newly added comment is visible.
           */
          const lastPage = Math.floor(this.commentTotalElements() / COMMENT_PAGE_SIZE);

          this.loadComments(lastPage);
        },

        error: error => {
          this.formErrorService.applyBackendErrors(
            this.commentForm,
            error
          );

          this.alertService.error(
            this.apiErrorService.getMessage(
              error,
              'Unable to add the comment.'
            )
          );
        }
      });
  }

  startEditing(comment: TaskCommentResponse): void {
    if (!this.canEdit(comment)) {
      return;
    }

    this.editingCommentId.set(comment.id);

    this.editCommentForm.reset({
      content: comment.content
    });
  }

  cancelEditing(): void {
    this.editingCommentId.set(null);

    this.editCommentForm.reset({
      content: ''
    });
  }

  saveComment(comment: TaskCommentResponse): void {
    if (!this.canEdit(comment)) {
      return;
    }

    this.formErrorService.clearBackendErrors(this.editCommentForm);

    /*
     * Prevents updating a comment when it exceeds
     * the configured 2,000-character limit.
     */
    if (this.editCommentForm.invalid) {
      this.editCommentForm.markAllAsTouched();
      return;
    }

    const content = this.editCommentForm.controls.content.value.trim();

    if (!content) {
      this.editCommentForm.controls.content.setErrors({
        required: true
      });

      this.editCommentForm.controls.content.markAsTouched();
      return;
    }

    this.updatingCommentId.set(comment.id);

    this.commentService
      .updateComment(
        this.taskId(),
        comment.id,
        {
          content
        }
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.updatingCommentId.set(null);
        })
      )
      .subscribe({
        next: updatedComment => {
          this.commentState.replaceItem(
            currentComment => currentComment.id === updatedComment.id,
            updatedComment
          );

          this.cancelEditing();

          this.alertService.success(
            'The comment was updated successfully.',
            'Comment updated'
          );
        },

        error: error => {
          this.formErrorService.applyBackendErrors(
            this.editCommentForm,
            error
          );

          this.alertService.error(
            this.apiErrorService.getMessage(
              error,
              'Unable to update the comment.'
            )
          );
        }
      });
  }

  async requestDeleteComment(comment: TaskCommentResponse): Promise<void> {
    if (!this.canDelete(comment)) {
      return;
    }

    const confirmed = await this.confirmationService.confirm({
      title: 'Delete comment?',
      message: 'This comment will be permanently deleted. This action cannot be reversed.',
      confirmText: 'Delete comment',
      cancelText: 'Keep comment',
      tone: 'danger'
    });

    if (!confirmed) {
      return;
    }

    this.deleteComment(comment);
  }

  goToCommentPage(page: number): void {
    if (!this.commentState.setPage(page)) {
      return;
    }

    this.loadComments(page);
  }

  canEdit(comment: TaskCommentResponse): boolean {
    return this.isOwnComment(comment);
  }

  canDelete(comment: TaskCommentResponse): boolean {
    return this.isAdmin() || this.isOwnComment(comment);
  }

  isEdited(comment: TaskCommentResponse): boolean {
    return comment.createdAt !== comment.updatedAt;
  }

  dueState(): TaskDueState {
    const task = this.task();

    return task
      ? getTaskDueState(task)
      : 'normal';
  }

  dueLabel(): string {
    return getTaskDueLabel(this.dueState());
  }

  getInitials(name: string): string {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return '?';
    }

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }

  private loadTask(): void {
    this.isLoadingTask.set(true);
    this.taskError.set(null);

    this.taskService
      .getTaskById(this.taskId())
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.isLoadingTask.set(false);
        })
      )
      .subscribe({
        next: task => {
          this.task.set(task);
        },

        error: error => {
          this.task.set(null);

          this.taskError.set(
            this.apiErrorService.getMessage(
              error,
              'Unable to load the task details.'
            )
          );
        }
      });
  }

  private loadComments(page: number): void {
    this.commentState.startLoading();

    this.commentService
      .getComments(
        this.taskId(),
        page,
        COMMENT_PAGE_SIZE
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.commentState.finishLoading();
        })
      )
      .subscribe({
        next: response => {
          this.commentState.setResponse(response);
        },

        error: error => {
          this.commentState.setError(
            this.apiErrorService.getMessage(
              error,
              'Unable to load comments.'
            )
          );
        }
      });
  }

  private deleteComment(comment: TaskCommentResponse): void {
    this.deletingCommentId.set(comment.id);

    this.commentService
      .deleteComment(
        this.taskId(),
        comment.id
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.deletingCommentId.set(null);
        })
      )
      .subscribe({
        next: () => {
          if (this.editingCommentId() === comment.id) {
            this.cancelEditing();
          }

          this.commentState.moveToPreviousPageIfEmptyAfterDelete();

          this.loadComments(this.commentPage());

          this.alertService.success(
            'The comment was deleted successfully.',
            'Comment deleted'
          );
        },

        error: error => {
          this.alertService.error(
            this.apiErrorService.getMessage(
              error,
              'Unable to delete the comment.'
            )
          );
        }
      });
  }

  /*
   * The current login response does not include a
   * User ID. For regular Users, the Task assignee ID
   * is authoritative because they can only access
   * Tasks assigned to them.
   *
   * For Admin, author role and full name are used until
   * the login response is later enhanced with userId.
   */
  private isOwnComment(comment: TaskCommentResponse): boolean {
    const currentUser = this.currentUser();

    const task = this.task();

    if (!currentUser || !task) {
      return false;
    }

    if (currentUser.role === 'USER') {
      return comment.authorId === task.assignedUserId;
    }

    return (
      comment.authorRole === 'ADMIN' &&
      comment.authorName === currentUser.fullName
    );
  }
}