import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import {
  DatePipe,
  NgClass
} from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  startWith
} from 'rxjs';

import { AlertService } from '../../../../core/services/alert.service';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

import { UserResponse } from '../../../users/models/user.models';
import { UserService } from '../../../users/services/user.service';

import { TaskFormDialog } from '../../components/task-form-dialog/task-form-dialog';
import { TaskDetailsDialog } from '../../components/task-details-dialog/task-details-dialog';
import {
  DEFAULT_TASK_SORT,
  TASK_PRIORITIES,
  TASK_PRIORITY_META,
  TASK_PRIORITY_OPTIONS,
  TASK_SORT_OPTIONS,
  TASK_STATUSES,
  TASK_STATUS_META,
  TASK_STATUS_OPTIONS
} from '../../constants/task.constants';

import {
  TaskDueState,
  TaskPriority,
  TaskResponse,
  TaskSearchRequest,
  TaskSortDirection,
  TaskSortField,
  TaskStatus,
  TaskWorkspaceMode
} from '../../models/task.models';

import { TaskService } from '../../services/task.service';
import { TaskListStore } from '../../state/task-list.store';

import {
  getTaskDueLabel,
  getTaskDueState
} from '../../utils/task-date.util';

interface NormalizedTaskFilters {
  search?: string;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  assignedUserId: number | null;
  sortField: TaskSortField;
  sortDirection: TaskSortDirection;
}

interface TaskFilterFormValue {
  search: string;
  status: string;
  priority: string;
  assignedUserId: string;
  sort: string;
}

function areTaskFiltersEqual(
  previous: NormalizedTaskFilters,
  current: NormalizedTaskFilters
): boolean {
  return (
    previous.search === current.search &&
    previous.status === current.status &&
    previous.priority === current.priority &&
    previous.assignedUserId ===
    current.assignedUserId &&
    previous.sortField ===
    current.sortField &&
    previous.sortDirection ===
    current.sortDirection
  );
}

/*
 * Shared Task workspace for Admin and User roles.
 */
@Component({
  selector: 'app-task-workspace',
  imports: [
    DatePipe,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    TaskDetailsDialog,
    TaskFormDialog
  ],
  providers: [
    TaskListStore
  ],
  templateUrl: './task-workspace.html',
  styleUrl: './task-workspace.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskWorkspace implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly formBuilder =
    inject(NonNullableFormBuilder);

  private readonly taskService =
    inject(TaskService);

  private readonly userService =
    inject(UserService);

  private readonly alertService =
    inject(AlertService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  private readonly confirmationService =
    inject(ConfirmationService);

  readonly taskStore =
    inject(TaskListStore);

  readonly mode =
    this.route.snapshot.data[
    'mode'
    ] as TaskWorkspaceMode;

  readonly isAdmin =
    this.mode === 'admin';

  readonly pageTitle =
    this.isAdmin
      ? 'Task management'
      : 'My tasks';

  readonly pageDescription =
    this.isAdmin
      ? 'Create, assign, prioritize, update, and monitor workspace tasks.'
      : 'Review your assigned tasks and keep their progress up to date.';

  readonly assignees =
    signal<UserResponse[]>([]);

  readonly isLoadingAssignees =
    signal(false);

  readonly taskDialogOpen =
    signal(false);

  readonly selectedTask =
    signal<TaskResponse | null>(null);

  readonly deletingTaskId =
    signal<number | null>(null);

  readonly updatingStatusTaskId =
    signal<number | null>(null);

  readonly detailsTaskId =
    signal<number | null>(null);

  readonly pageSizeOptions =
    [10, 20, 50] as const;

  readonly statusOptions =
    TASK_STATUS_OPTIONS;

  readonly priorityOptions =
    TASK_PRIORITY_OPTIONS;

  readonly statusMeta =
    TASK_STATUS_META;

  readonly priorityMeta =
    TASK_PRIORITY_META;

  readonly sortOptions =
    TASK_SORT_OPTIONS;

  readonly filterForm =
    this.formBuilder.group({
      search: [''],
      status: [''],
      priority: [''],
      assignedUserId: [''],
      sort: [
        DEFAULT_TASK_SORT.value
      ]
    });

  ngOnInit(): void {
    if (this.isAdmin) {
      this.loadAssignableUsers();
    }

    this.connectFilters();
  }

  openCreateDialog(): void {
    if (!this.isAdmin) {
      return;
    }

    if (this.assignees().length === 0) {
      this.alertService.warning(
        'Create at least one active User account before assigning a task.',
        'No assignable users'
      );

      return;
    }

    this.selectedTask.set(null);
    this.taskDialogOpen.set(true);
  }

  openEditDialog(
    task: TaskResponse
  ): void {
    if (!this.isAdmin) {
      return;
    }

    this.selectedTask.set(task);
    this.taskDialogOpen.set(true);
  }

  closeTaskDialog(): void {
    this.taskDialogOpen.set(false);
    this.selectedTask.set(null);
  }

  handleTaskSaved(): void {
    this.closeTaskDialog();
    this.taskStore.reload();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: '',
      priority: '',
      assignedUserId: '',
      sort: DEFAULT_TASK_SORT.value
    });
  }

  goToPage(
    page: number
  ): void {
    this.taskStore.goToPage(page);
  }

  changePageSize(
    event: Event
  ): void {
    const select =
      event.target as HTMLSelectElement;

    this.taskStore.changePageSize(
      Number(select.value)
    );
  }

  /*
  * Updates one assigned Task status.
  *
  * The dropdown is bound to the Task's real status,
  * and the local list is updated from the backend
  * response without reloading the full page.
  */
  onStatusChange(
    task: TaskResponse,
    statusValue: string
  ): void {
    const status =
      statusValue as TaskStatus;

    if (
      !TASK_STATUSES.includes(status) ||
      status === task.status
    ) {
      return;
    }

    this.updatingStatusTaskId.set(
      task.id
    );

    this.taskService
      .updateTaskStatus(
        task.id,
        {
          status
        }
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        ),

        finalize(() => {
          this.updatingStatusTaskId
            .set(null);
        })
      )
      .subscribe({
        next: updatedTask => {
          /*
           * Replace the local row with the authoritative
           * Task returned by Spring Boot.
           */
          this.taskStore.replaceTask(
            updatedTask
          );

          const activeStatusFilter =
            this.filterForm.controls
              .status.value;

          if (
            activeStatusFilter &&
            activeStatusFilter !==
            updatedTask.status
          ) {
            this.taskStore.reload();
          }
          const statusLabel =
            this.statusMeta[
              updatedTask.status
            ].label;

          this.alertService.success(
            `Task '${updatedTask.title}' is now ${statusLabel}.`,
            'Status updated'
          );
        },

        error: error => {
          /*
           * The original Task object was not modified,
           * so reloading restores the previous status.
           */
          this.taskStore.reload();

          this.alertService.error(
            this.apiErrorService.getMessage(
              error,
              'Unable to update the task status.'
            )
          );
        }
      });
  }

  async requestDelete(
    task: TaskResponse
  ): Promise<void> {
    if (!this.isAdmin) {
      return;
    }

    const confirmed =
      await this.confirmationService.confirm({
        title: 'Delete task?',
        message:
          `Task '${task.title}' and its comments will be permanently deleted. This action cannot be reversed.`,
        confirmText: 'Delete task',
        cancelText: 'Keep task',
        tone: 'danger'
      });

    if (!confirmed) {
      return;
    }

    this.deleteTask(task);
  }

  dueState(
    task: TaskResponse
  ): TaskDueState {
    return getTaskDueState(task);
  }

  dueLabel(
    task: TaskResponse
  ): string {
    return getTaskDueLabel(
      this.dueState(task)
    );
  }

  getInitials(
    name: string
  ): string {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return '?';
    }

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[
        parts.length - 1
      ].charAt(0)
    ).toUpperCase();
  }

  private connectFilters(): void {
    this.filterForm.valueChanges
      .pipe(
        startWith(
          this.filterForm.getRawValue()
        ),
        debounceTime(300),
        map(filters =>
          this.normalizeFilters(filters)
        ),
        distinctUntilChanged(
          areTaskFiltersEqual
        ),
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(filters => {
        const request:
          TaskSearchRequest = {
          ...filters,
          page: 0,
          size:
            this.taskStore.pageSize()
        };

        this.taskStore.load(request);
      });
  }

  private normalizeFilters(
    filters:
      Partial<TaskFilterFormValue>
  ): NormalizedTaskFilters {
    const selectedSort =
      TASK_SORT_OPTIONS.find(
        option =>
          option.value === filters.sort
      ) ?? DEFAULT_TASK_SORT;

    const assignedUserId =
      Number(
        filters.assignedUserId ?? 0
      );

    return {
      search:
        filters.search?.trim() ||
        undefined,

      status:
        this.toTaskStatus(
          filters.status
        ),

      priority:
        this.toTaskPriority(
          filters.priority
        ),

      assignedUserId:
        this.isAdmin &&
          Number.isInteger(assignedUserId) &&
          assignedUserId > 0
          ? assignedUserId
          : null,

      sortField:
        selectedSort.field,

      sortDirection:
        selectedSort.direction
    };
  }

  private toTaskStatus(
    value: string | undefined
  ): TaskStatus | null {
    if (!value) {
      return null;
    }

    const status =
      value as TaskStatus;

    return TASK_STATUSES.includes(status)
      ? status
      : null;
  }

  private toTaskPriority(
    value: string | undefined
  ): TaskPriority | null {
    if (!value) {
      return null;
    }

    const priority =
      value as TaskPriority;

    return TASK_PRIORITIES.includes(
      priority
    )
      ? priority
      : null;
  }

  private loadAssignableUsers(): void {
    this.isLoadingAssignees.set(true);

    this.userService
      .getUsers({
        role: 'USER',
        status: 'ACTIVE',
        page: 0,
        size: 100
      })
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        ),
        finalize(() => {
          this.isLoadingAssignees
            .set(false);
        })
      )
      .subscribe({
        next: response => {
          this.assignees.set(
            response.content
          );
        },

        error: error => {
          this.assignees.set([]);

          this.alertService.error(
            this.apiErrorService.getMessage(
              error,
              'Unable to load assignable users.'
            )
          );
        }
      });
  }

  private deleteTask(
    task: TaskResponse
  ): void {
    this.deletingTaskId.set(
      task.id
    );

    this.taskService
      .deleteTask(task.id)
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        ),
        finalize(() => {
          this.deletingTaskId.set(
            null
          );
        })
      )
      .subscribe({
        next: () => {
          this.alertService.success(
            `Task '${task.title}' was deleted successfully.`,
            'Task deleted'
          );

          this.taskStore
            .reloadAfterDelete();
        },

        error: error => {
          this.alertService.error(
            this.apiErrorService.getMessage(
              error,
              'Unable to delete the task.'
            )
          );
        }
      });
  }
  openTaskDetails(
    task: TaskResponse
  ): void {
    this.detailsTaskId.set(
      task.id
    );
  }

  closeTaskDetails(): void {
    this.detailsTaskId.set(null);
  }
}