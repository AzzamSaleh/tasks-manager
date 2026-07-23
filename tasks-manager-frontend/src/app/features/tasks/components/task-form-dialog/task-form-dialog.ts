import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { AlertService } from '../../../../core/services/alert.service';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { FormErrorService } from '../../../../core/services/form-error.service';

import { UserResponse } from '../../../users/models/user.models';

import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS
} from '../../constants/task.constants';

import {
  CreateTaskRequest,
  TaskPriority,
  TaskResponse,
  TaskStatus,
  UpdateTaskRequest
} from '../../models/task.models';

import { TaskService } from '../../services/task.service';

import {
  toApiLocalDateTime,
  toDateTimeLocalValue
} from '../../utils/task-date.util';

interface TaskFormValue {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedUserId: string;
  dueDate: string;
}

interface AssigneeOption {
  id: number;
  fullName: string;
  username: string | null;
}


/* Admin dialog 
 * Admin-only create/edit Task dialog.
 */
@Component({
  selector: 'app-task-form-dialog',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './task-form-dialog.html',
  styleUrl: './task-form-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskFormDialog implements OnInit {

  readonly task =
    input<TaskResponse | null>(null);

  readonly assignees =
    input.required<
      readonly UserResponse[]
    >();

  readonly closed =
    output<void>();

  readonly saved =
    output<TaskResponse>();

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly formBuilder =
    inject(NonNullableFormBuilder);

  private readonly taskService =
    inject(TaskService);

  private readonly alertService =
    inject(AlertService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  private readonly formErrorService =
    inject(FormErrorService);

  readonly isSubmitting =
    signal(false);

  readonly formError =
    signal<string | null>(null);

  readonly isEditMode =
    computed(() => this.task() !== null);

  readonly priorityOptions =
    TASK_PRIORITY_OPTIONS;

  readonly statusOptions =
    TASK_STATUS_OPTIONS;

  /*
   * Keeps the existing assignee visible during editing,
   * even if that account is no longer returned by the
   * active-user query.
   */
  readonly assigneeOptions =
    computed<readonly AssigneeOption[]>(() => {
      const options =
        this.assignees().map(user => ({
          id: user.id,
          fullName: user.fullName,
          username: user.username
        }));

      const existingTask =
        this.task();

      if (
        !existingTask ||
        options.some(
          option =>
            option.id ===
            existingTask.assignedUserId
        )
      ) {
        return options;
      }

      return [
        {
          id: existingTask.assignedUserId,
          fullName:
            existingTask.assignedUserName,
          username: null
        },
        ...options
      ];
    });

  readonly taskForm =
    this.formBuilder.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(150)
        ]
      ],

      description: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(2000)
        ]
      ],

      assignedUserId: [
        '',
        [
          Validators.required
        ]
      ],

      priority: [
        'MEDIUM' as TaskPriority,
        [
          Validators.required
        ]
      ],

      status: [
        'PENDING' as TaskStatus,
        [
          Validators.required
        ]
      ],

      dueDate: [
        '',
        [
          Validators.required
        ]
      ]
    });

  ngOnInit(): void {
    this.initializeForm();
  }

  @HostListener(
    'document:keydown.escape'
  )
  handleEscape(): void {
    this.close();
  }

  close(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.closed.emit();
  }

  submit(): void {
    this.formError.set(null);

    this.formErrorService
      .clearBackendErrors(
        this.taskForm
      );

    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const value =
      this.taskForm
        .getRawValue() as TaskFormValue;

    const assignedUserId =
      Number(value.assignedUserId);

    if (
      !Number.isInteger(assignedUserId) ||
      assignedUserId < 1
    ) {
      this.taskForm.controls
        .assignedUserId
        .setErrors({
          invalidAssignee: true
        });

      this.taskForm.controls
        .assignedUserId
        .markAsTouched();

      return;
    }

    this.isSubmitting.set(true);

    const existingTask =
      this.task();

    if (existingTask) {
      this.updateTask(
        existingTask,
        value,
        assignedUserId
      );

      return;
    }

    this.createTask(
      value,
      assignedUserId
    );
  }

  getBackendError(
    fieldName: string
  ): string | null {
    return this.formErrorService
      .getBackendError(
        this.taskForm.get(fieldName)
      );
  }

  private initializeForm(): void {
    const existingTask =
      this.task();

    if (!existingTask) {
      this.taskForm.reset({
        title: '',
        description: '',
        assignedUserId: '',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: ''
      });

      return;
    }

    this.taskForm.reset({
      title: existingTask.title,
      description:
        existingTask.description,
      assignedUserId:
        String(
          existingTask.assignedUserId
        ),
      priority:
        existingTask.priority,
      status:
        existingTask.status,
      dueDate:
        toDateTimeLocalValue(
          existingTask.dueDate
        )
    });
  }

  private createTask(
    value: TaskFormValue,
    assignedUserId: number
  ): void {
    const request:
      CreateTaskRequest = {
        title: value.title.trim(),
        description:
          value.description.trim(),
        priority: value.priority,
        assignedUserId,
        dueDate:
          toApiLocalDateTime(
            value.dueDate
          )
      };

    this.taskService
      .createTask(request)
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        ),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: createdTask => {
          this.alertService.success(
            `Task '${createdTask.title}' was created successfully.`,
            'Task created'
          );

          this.saved.emit(createdTask);
        },

        error: error => {
          this.handleError(
            error,
            'Unable to create the task.'
          );
        }
      });
  }

  private updateTask(
    existingTask: TaskResponse,
    value: TaskFormValue,
    assignedUserId: number
  ): void {
    const request:
      UpdateTaskRequest = {
        title: value.title.trim(),
        description:
          value.description.trim(),
        priority: value.priority,
        status: value.status,
        assignedUserId,
        dueDate:
          toApiLocalDateTime(
            value.dueDate
          )
      };

    this.taskService
      .updateTask(
        existingTask.id,
        request
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        ),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: updatedTask => {
          this.alertService.success(
            `Task '${updatedTask.title}' was updated successfully.`,
            'Task updated'
          );

          this.saved.emit(updatedTask);
        },

        error: error => {
          this.handleError(
            error,
            'Unable to update the task.'
          );
        }
      });
  }

  private handleError(
    error: unknown,
    fallbackMessage: string
  ): void {
    this.formErrorService
      .applyBackendErrors(
        this.taskForm,
        error
      );

    this.formError.set(
      this.apiErrorService.getMessage(
        error,
        fallbackMessage
      )
    );
  }
}