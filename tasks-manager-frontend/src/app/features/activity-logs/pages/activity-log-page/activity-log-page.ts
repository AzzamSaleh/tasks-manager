import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { startWith, debounceTime, map, distinctUntilChanged } from 'rxjs';
import { ACTIVITY_ACTION_OPTIONS, ACTIVITY_ACTION_META, formatActivityValue, ACTIVITY_ACTIONS } from '../../constants/activity-log.constants';
import { ActivityAction, ActivityLogSearchRequest } from '../../models/activity-log.models';
import { ActivityLogStore } from '../../state/activity-log.store';

interface ActivityLogFilters {
  search?: string;
  action: ActivityAction | null;
}

interface ActivityLogFilterFormValue {
  search: string;
  action: string;
}

function areActivityFiltersEqual(
  previous: ActivityLogFilters,
  current: ActivityLogFilters
): boolean {

  return (
    previous.search ===
      current.search &&
    previous.action ===
      current.action
  );
}

/*
 * Admin-only page for reviewing system activity.
 *
 * The page coordinates user interaction while
 * ActivityLogStore owns list and pagination state.
 */
@Component({
  selector: 'app-activity-log-page',
  imports: [
    DatePipe,
    NgClass,
    ReactiveFormsModule
  ],
  providers: [
    ActivityLogStore
  ],
  templateUrl:
    './activity-log-page.html',
  styleUrl:
    './activity-log-page.css',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ActivityLogPage
  implements OnInit {

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly formBuilder =
    inject(NonNullableFormBuilder);

  readonly activityLogStore =
    inject(ActivityLogStore);

  readonly actionOptions =
    ACTIVITY_ACTION_OPTIONS;

  readonly actionMeta =
    ACTIVITY_ACTION_META;

  readonly pageSizeOptions =
    [10, 20, 50, 100] as const;

  readonly filterForm =
    this.formBuilder.group({
      search: [''],
      action: ['']
    });

  ngOnInit(): void {
    this.connectFilters();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      action: ''
    });
  }

  refresh(): void {
    this.activityLogStore.reload();
  }

  goToPage(
    page: number
  ): void {

    this.activityLogStore.goToPage(
      page
    );
  }

  changePageSize(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;

    this.activityLogStore
      .changePageSize(
        Number(select.value)
      );
  }

  entityLabel(
    entityType: string
  ): string {

    return formatActivityValue(
      entityType
    );
  }

  roleLabel(
    role: string
  ): string {

    return role === 'ADMIN'
      ? 'Admin'
      : 'User';
  }

  actorInitials(
    username: string
  ): string {

    const parts = username
      .trim()
      .split(/[._\-\s]+/)
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
      parts[1].charAt(0)
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
          areActivityFiltersEqual
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(filters => {
        const request:
          ActivityLogSearchRequest = {
            ...filters,
            page: 0,
            size:
              this.activityLogStore
                .pageSize()
          };

        this.activityLogStore.load(
          request
        );
      });
  }

  private normalizeFilters(
    filters:
      Partial<
        ActivityLogFilterFormValue
      >
  ): ActivityLogFilters {

    const action =
      filters.action as
        ActivityAction | undefined;

    return {
      search:
        filters.search?.trim() ||
        undefined,

      action:
        action &&
        ACTIVITY_ACTIONS.includes(
          action
        )
          ? action
          : null
    };
  }
}
