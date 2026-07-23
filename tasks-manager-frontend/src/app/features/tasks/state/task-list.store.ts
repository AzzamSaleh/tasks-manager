import { Injectable, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subject, tap, switchMap, map, catchError, of } from "rxjs";
import { PageResponse } from "../../../core/models/page-response.model";
import { ApiErrorService } from "../../../core/services/api-error.service";
import { createPagedListState } from "../../../core/state/paged-list.state";
import { TaskResponse, TaskSearchRequest } from "../models/task.models";
import { TaskService } from "../services/task.service";

interface TaskLoadSuccess {
    response: PageResponse<TaskResponse>;
    error: null;
}

interface TaskLoadFailure {
    response: null;
    error: unknown;
}

type TaskLoadResult =
    | TaskLoadSuccess
    | TaskLoadFailure;

const DEFAULT_TASK_REQUEST:
    TaskSearchRequest = {
    page: 0,
    size: 10,
    status: null,
    priority: null,
    assignedUserId: null,
    sortField: 'dueDate',
    sortDirection: 'asc'
};

/*
 * Component-scoped store for the Task workspace.
 *
 * It is provided by TaskWorkspace rather than globally,
 * so Admin and User page instances never share stale state.
 */
@Injectable()
export class TaskListStore {

    private readonly taskService =
        inject(TaskService);

    private readonly apiErrorService =
        inject(ApiErrorService);

    private readonly pagedState =
        createPagedListState<TaskResponse>(10);

    private readonly loadRequests =
        new Subject<TaskSearchRequest>();

    private readonly lastRequest =
        signal<TaskSearchRequest>(
            DEFAULT_TASK_REQUEST
        );

    readonly tasks =
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

    /*
     * Each new request cancels the older unfinished HTTP
     * request through switchMap.
     */
    private connectLoadPipeline(): void {
        this.loadRequests
            .pipe(
                tap(() => {
                    this.pagedState.startLoading();
                }),

                switchMap(request =>
                    this.taskService
                        .getTasks(request)
                        .pipe(
                            map(response => ({
                                response,
                                error: null
                            }) satisfies TaskLoadSuccess),

                            catchError(error =>
                                of({
                                    response: null,
                                    error
                                } satisfies TaskLoadFailure)
                            )
                        )
                ),

                takeUntilDestroyed()
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
                        'Unable to load tasks.'
                    )
                );
            });
    }

    load(
        request: TaskSearchRequest
    ): void {

        const normalizedRequest = {
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


     /*
     * Updates one Task in the currently displayed page
     * without reloading the complete list.
     */
    replaceTask(
        updatedTask: TaskResponse
    ): void {
        this.pagedState.replaceItem(
            task =>
                task.id === updatedTask.id,
            updatedTask
        );
    }
    
    /*
     * Avoids leaving the user on an invalid empty page
     * after deleting its final row.
     */
    reloadAfterDelete(): void {
        this.pagedState
            .moveToPreviousPageIfEmptyAfterDelete();

        this.load({
            ...this.lastRequest(),
            page: this.currentPage()
        });
    }

   

}