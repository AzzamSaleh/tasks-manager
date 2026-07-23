import { DatePipe } from "@angular/common";
import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from "@angular/core";
import { ReactiveFormsModule, NonNullableFormBuilder } from "@angular/forms";
import { finalize } from "rxjs";
import { AlertService } from "../../../../core/services/alert.service";
import { ApiErrorService } from "../../../../core/services/api-error.service";
import { ConfirmationService } from "../../../../core/services/confirmation.service";
import { createPagedListState } from "../../../../core/state/paged-list.state";
import { AuthService } from "../../../auth/services/auth.service";
import { UserFormDialog } from "../../components/user-form-dialog/user-form-dialog";
import { UserResponse, UserRole, UserStatus } from "../../models/user.models";
import { UserService } from "../../services/user.service";


/*
 * Admin user-management page.
 *
 * Responsibilities:
 * - User interactions
 * - Filters
 * - Dialog state
 * - Delete confirmation
 *
 * Pagination state is delegated to createPagedListState().
 * HTTP communication is delegated to UserService.
 */
@Component({
  selector: 'app-user-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    UserFormDialog
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class UserList
  implements OnInit {

  private readonly formBuilder =
    inject(NonNullableFormBuilder);

  private readonly userService =
    inject(UserService);

  private readonly authService =
    inject(AuthService);

  private readonly alertService =
    inject(AlertService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  private readonly confirmationService =
    inject(ConfirmationService);

  /*
   * Reusable paginated state.
   *
   * These aliases preserve a simple template API.
   */
  private readonly listState =
    createPagedListState<UserResponse>(10);

  readonly users =
    this.listState.items;

  readonly currentPage =
    this.listState.currentPage;

  readonly pageSize =
    this.listState.pageSize;

  readonly totalPages =
    this.listState.totalPages;

  readonly totalElements =
    this.listState.totalElements;

  readonly isLoading =
    this.listState.isLoading;

  readonly errorMessage =
    this.listState.errorMessage;

  readonly visiblePages =
    this.listState.visiblePages;

  readonly rangeStart =
    this.listState.rangeStart;

  readonly rangeEnd =
    this.listState.rangeEnd;

  readonly deletingUserId =
    signal<number | null>(null);

  readonly userDialogOpen =
    signal(false);

  readonly selectedUser =
    signal<UserResponse | null>(null);

  readonly pageSizeOptions =
    [10, 20, 50] as const;

  readonly roles =
    ['ADMIN', 'USER'] as const;

  readonly statuses =
    ['ACTIVE', 'INACTIVE'] as const;

  readonly filterForm =
    this.formBuilder.group({
      search: [''],
      role: [''],
      status: ['']
    });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.listState.startLoading();

    const filters =
      this.filterForm.getRawValue();

    this.userService
      .getUsers({
        search:
          filters.search,
        role:
          (filters.role || null) as
            UserRole | null,
        status:
          (filters.status || null) as
            UserStatus | null,
        page:
          this.currentPage(),
        size:
          this.pageSize()
      })
      .pipe(
        finalize(() => {
          this.listState
            .finishLoading();
        })
      )
      .subscribe({
        next: response => {
          this.listState
            .setResponse(response);
        },

        error: error => {
          this.listState.setError(
            this.apiErrorService.getMessage(
              error,
              'Unable to load users.'
            )
          );
        }
      });
  }

  applyFilters(): void {
    this.listState.resetPage();
    this.loadUsers();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      role: '',
      status: ''
    });

    this.listState.resetPage();
    this.loadUsers();
  }

  openCreateDialog(): void {
    this.selectedUser.set(null);
    this.userDialogOpen.set(true);
  }

  openEditDialog(
    user: UserResponse
  ): void {
    this.selectedUser.set(user);
    this.userDialogOpen.set(true);
  }

  closeUserDialog(): void {
    this.userDialogOpen.set(false);
    this.selectedUser.set(null);
  }

  handleUserSaved(): void {
    this.closeUserDialog();
    this.loadUsers();
  }

  goToPage(
    page: number
  ): void {
    const pageChanged =
      this.listState.setPage(page);

    if (pageChanged) {
      this.loadUsers();
    }
  }

  changePageSize(
    event: Event
  ): void {
    const select =
      event.target as HTMLSelectElement;

    this.listState.setPageSize(
      Number(select.value)
    );

    this.loadUsers();
  }

  canDelete(
    user: UserResponse
  ): boolean {
    return (
      user.username !==
      this.authService
        .currentUser()?.username
    );
  }

  async requestDelete(
    user: UserResponse
  ): Promise<void> {
    if (!this.canDelete(user)) {
      this.alertService.warning(
        'You cannot delete the account currently used for authentication.',
        'Delete blocked'
      );

      return;
    }

    const confirmed =
      await this.confirmationService
        .confirm({
          title: 'Delete user?',
          message:
            `User '${user.fullName}' (${user.username}) will be permanently deleted. This action cannot be reversed. Deletion will fail if the user is connected to existing tasks or comments.`,
          confirmText:
            'Delete user',
          cancelText:
            'Keep user',
          tone:
            'danger'
        });

    if (!confirmed) {
      return;
    }

    this.deleteUser(user);
  }

  getRoleLabel(
    role: UserRole
  ): string {
    return role === 'ADMIN'
      ? 'Admin'
      : 'User';
  }

  getStatusLabel(
    status: UserStatus
  ): string {
    return status === 'ACTIVE'
      ? 'Active'
      : 'Inactive';
  }

  getInitials(
    fullName: string
  ): string {
    const nameParts = fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (nameParts.length === 0) {
      return '?';
    }

    if (nameParts.length === 1) {
      return nameParts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      nameParts[0].charAt(0) +
      nameParts[
        nameParts.length - 1
      ].charAt(0)
    ).toUpperCase();
  }

  /*
   * Kept private so requestDelete() focuses only
   * on confirmation and business interaction.
   */
  private deleteUser(
    user: UserResponse
  ): void {
    this.deletingUserId.set(user.id);

    this.userService
      .deleteUser(user.id)
      .pipe(
        finalize(() => {
          this.deletingUserId.set(null);
        })
      )
      .subscribe({
        next: () => {
          this.alertService.success(
            `User '${user.username}' was deleted successfully.`,
            'User deleted'
          );

          this.listState
            .moveToPreviousPageIfEmptyAfterDelete();

          this.loadUsers();
        },

        error: error => {
          this.alertService.error(
            this.apiErrorService.getMessage(
              error,
              'Unable to delete the user.'
            )
          );
        }
      });
  }
}