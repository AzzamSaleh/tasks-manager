import { Injectable, inject, DestroyRef, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subject, tap, switchMap, map, catchError, of } from "rxjs";
import { PageResponse } from "../../../core/models/page-response.model";
import { ApiErrorService } from "../../../core/services/api-error.service";
import { createPagedListState } from "../../../core/state/paged-list.state";
import { ActivityLogResponse, ActivityLogSearchRequest } from "../models/activity-log.models";
import { ActivityLogService } from "../services/activity-log.service";

interface ActivityLoadSuccess {
  response:
    PageResponse<ActivityLogResponse>;
  error: null;
}

interface ActivityLoadFailure {
  response: null;
  error: unknown;
}

type ActivityLoadResult =
  | ActivityLoadSuccess
  | ActivityLoadFailure;

const DEFAULT_REQUEST:
  ActivityLogSearchRequest = {
    page: 0,
    size: 10,
    action: null
  };

/*
 * Component-scoped Activity Log state.
 *
 * It coordinates:
 * - HTTP request cancellation
 * - Loading and error states
 * - Pagination
 * - Current filters
 */
@Injectable()
export class ActivityLogStore {

  private readonly activityLogService =
    inject(ActivityLogService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly pagedState =
    createPagedListState<
      ActivityLogResponse
    >(10);

  private readonly loadRequests =
    new Subject<ActivityLogSearchRequest>();

  private readonly lastRequest =
    signal<ActivityLogSearchRequest>(
      DEFAULT_REQUEST
    );

  readonly activityLogs =
    this.pagedState.items;

  readonly currentPage =
    this.pagedState.currentPage;

  readonly pageSize =
    this.pagedState.pageSize;

  readonly totalPages =
    this.pagedState.totalPages;

  readonly totalElements =
    this.pagedState.totalElements;

  readonly isLoading =
    this.pagedState.isLoading;

  readonly errorMessage =
    this.pagedState.errorMessage;

  readonly visiblePages =
    this.pagedState.visiblePages;

  readonly rangeStart =
    this.pagedState.rangeStart;

  readonly rangeEnd =
    this.pagedState.rangeEnd;

  readonly isFirstPage =
    this.pagedState.isFirstPage;

  readonly isLastPage =
    this.pagedState.isLastPage;

  constructor() {
    this.connectLoadPipeline();
  }

  load(
    request: ActivityLogSearchRequest
  ): void {

    const normalizedRequest:
      ActivityLogSearchRequest = {
        ...request,
        page:
          Math.max(0, request.page),
        size:
          Math.max(1, request.size)
      };

    this.lastRequest.set(
      normalizedRequest
    );

    this.loadRequests.next(
      normalizedRequest
    );
  }

  reload(): void {
    this.loadRequests.next(
      this.lastRequest()
    );
  }

  goToPage(
    page: number
  ): void {

    if (!this.pagedState.setPage(page)) {
      return;
    }

    this.load({
      ...this.lastRequest(),
      page
    });
  }

  changePageSize(
    pageSize: number
  ): void {

    this.pagedState.setPageSize(
      pageSize
    );

    this.load({
      ...this.lastRequest(),
      page: 0,
      size: this.pageSize()
    });
  }

  private connectLoadPipeline(): void {
    this.loadRequests
      .pipe(
        tap(() => {
          this.pagedState.startLoading();
        }),

        /*
         * A new search or filter request cancels
         * the previous unfinished HTTP request.
         */
        switchMap(request =>
          this.activityLogService
            .getActivityLogs(request)
            .pipe(
              map(
                response => ({ response, error: null } as ActivityLoadSuccess)
              ),

              catchError(error =>
                of({ response: null, error } as ActivityLoadFailure)
              )
            )
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(result => {
        this.pagedState.finishLoading();

        if (result.response) {
          this.pagedState.setResponse(
            result.response
          );

          return;
        }

        this.pagedState.setError(
          this.apiErrorService.getMessage(
            result.error,
            'Unable to load activity logs.'
          )
        );
      });
  }
}