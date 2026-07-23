import { signal, computed } from "@angular/core";
import { PageResponse } from "../models/page-response.model";


const DEFAULT_VISIBLE_PAGE_COUNT = 5;
/*
 * Creates reusable Signal-based state for
 * paginated list features.
 *
 * It can be used by:
 * - Users
 * - Tasks
 * - Activity logs
 * - Notifications
 * - Comments
 *
 * Each component gets an independent state instance.
 */
export function createPagedListState<T>(
  initialPageSize = 10,
  visiblePageCount =
    DEFAULT_VISIBLE_PAGE_COUNT
) {
  /*
   * Writable state remains private to this factory.
   */
  const itemsState =
    signal<T[]>([]);

  const currentPageState =
    signal(0);

  const pageSizeState =
    signal(initialPageSize);

  const totalPagesState =
    signal(0);

  const totalElementsState =
    signal(0);

  const loadingState =
    signal(false);

  const errorState =
    signal<string | null>(null);

  /*
   * Derived pagination values are computed rather
   * than manually synchronized with source state.
   */
  const visiblePages = computed(() => {
    const totalPages =
      totalPagesState();

    const currentPage =
      currentPageState();

    if (totalPages <= 0) {
      return [];
    }

    let startPage = Math.max(
      0,
      currentPage -
        Math.floor(visiblePageCount / 2)
    );

    let endPage = Math.min(
      totalPages - 1,
      startPage + visiblePageCount - 1
    );

    startPage = Math.max(
      0,
      endPage - visiblePageCount + 1
    );

    return Array.from(
      {
        length:
          endPage - startPage + 1
      },
      (_, index) =>
        startPage + index
    );
  });

  const rangeStart = computed(() => {
    if (totalElementsState() === 0) {
      return 0;
    }

    return (
      currentPageState() *
      pageSizeState()
    ) + 1;
  });

  const rangeEnd = computed(() =>
    Math.min(
      (
        currentPageState() + 1
      ) * pageSizeState(),
      totalElementsState()
    )
  );

  const isFirstPage = computed(
    () => currentPageState() === 0
  );

  const isLastPage = computed(() => {
    const totalPages =
      totalPagesState();

    return (
      totalPages === 0 ||
      currentPageState() >=
        totalPages - 1
    );
  });

  /*
   * Starts a list request without removing
   * the currently displayed data.
   */
  function startLoading(): void {
    loadingState.set(true);
    errorState.set(null);
  }

  /*
   * Updates all list and pagination information
   * from one Spring Data Page response.
   */
  function setResponse(
    response: PageResponse<T>
  ): void {
    itemsState.set(response.content);
    currentPageState.set(response.number);
    pageSizeState.set(response.size);
    totalPagesState.set(
      response.totalPages
    );
    totalElementsState.set(
      response.totalElements
    );
    errorState.set(null);
  }

  /*
   * Clears stale list data after a failed request.
   */
  function setError(
    message: string
  ): void {
    itemsState.set([]);
    totalPagesState.set(0);
    totalElementsState.set(0);
    errorState.set(message);
  }

  function finishLoading(): void {
    loadingState.set(false);
  }

  /*
   * Returns true only when the requested page
   * represents a valid navigation change.
   */
  function setPage(
    page: number
  ): boolean {
    if (
      page < 0 ||
      page >= totalPagesState() ||
      page === currentPageState()
    ) {
      return false;
    }

    currentPageState.set(page);
    return true;
  }

  function resetPage(): void {
    currentPageState.set(0);
  }

  function setPageSize(
    pageSize: number
  ): void {
    if (
      !Number.isInteger(pageSize) ||
      pageSize < 1
    ) {
      return;
    }

    pageSizeState.set(pageSize);
    currentPageState.set(0);
  }

  /*
   * Used after deletion when the final item
   * on a non-first page was removed.
   */
  function moveToPreviousPageIfEmptyAfterDelete(): void {
    if (
      itemsState().length === 1 &&
      currentPageState() > 0
    ) {
      currentPageState.update(
        page => page - 1
      );
    }
  }

  function clear(): void {
    itemsState.set([]);
    currentPageState.set(0);
    totalPagesState.set(0);
    totalElementsState.set(0);
    loadingState.set(false);
    errorState.set(null);
  }


/*
 * Replaces one list item without reloading
 * the complete database page.
 *
 * Useful after successful update operations.
 */
function replaceItem(
  predicate: (item: T) => boolean,
  replacement: T
): void {
  itemsState.update(items =>
    items.map(item =>
      predicate(item)
        ? replacement
        : item
    )
  );
}

  /*
   * Consumers receive read-only Signals and
   * focused mutation methods.
   */
  return {
  items: itemsState.asReadonly(),
  currentPage:
    currentPageState.asReadonly(),
  pageSize:
    pageSizeState.asReadonly(),
  totalPages:
    totalPagesState.asReadonly(),
  totalElements:
    totalElementsState.asReadonly(),
  isLoading:
    loadingState.asReadonly(),
  errorMessage:
    errorState.asReadonly(),

  visiblePages,
  rangeStart,
  rangeEnd,
  isFirstPage,
  isLastPage,

  startLoading,
  setResponse,
  setError,
  finishLoading,
  setPage,
  resetPage,
  setPageSize,
  moveToPreviousPageIfEmptyAfterDelete,
  replaceItem,
  clear
} as const;

}