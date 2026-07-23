import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../core/models/page-response.model';
import { TaskSearchRequest, TaskResponse, CreateTaskRequest, UpdateTaskRequest, UpdateTaskStatusRequest } from '../models/task.models';

/*
 * TaskService contains HTTP communication only.
 *
 * It does not own page state, dialogs, alerts,
 * confirmation behavior, or role decisions.
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private readonly http =
    inject(HttpClient);

  private readonly tasksUrl =
    `${environment.apiUrl}/tasks`;

  getTasks(
    request: TaskSearchRequest
  ): Observable<PageResponse<TaskResponse>> {

    let params = new HttpParams()
      .set('page', String(request.page))
      .set('size', String(request.size))
      .append(
        'sort',
        `${request.sortField},${request.sortDirection}`
      );

    const search =
      request.search?.trim();

    if (search) {
      params = params.set(
        'search',
        search
      );
    }

    if (request.status) {
      params = params.set(
        'status',
        request.status
      );
    }

    if (request.priority) {
      params = params.set(
        'priority',
        request.priority
      );
    }

    if (request.assignedUserId) {
      params = params.set(
        'assignedUserId',
        String(request.assignedUserId)
      );
    }

    return this.http.get<
      PageResponse<TaskResponse>
    >(
      this.tasksUrl,
      {
        params
      }
    );
  }

  getTaskById(
    taskId: number
  ): Observable<TaskResponse> {

    return this.http.get<TaskResponse>(
      `${this.tasksUrl}/${taskId}`
    );
  }

  createTask(
    request: CreateTaskRequest
  ): Observable<TaskResponse> {

    return this.http.post<TaskResponse>(
      this.tasksUrl,
      request
    );
  }

  updateTask(
    taskId: number,
    request: UpdateTaskRequest
  ): Observable<TaskResponse> {

    return this.http.put<TaskResponse>(
      `${this.tasksUrl}/${taskId}`,
      request
    );
  }

  updateTaskStatus(
    taskId: number,
    request: UpdateTaskStatusRequest
  ): Observable<TaskResponse> {

    return this.http.patch<TaskResponse>(
      `${this.tasksUrl}/${taskId}/status`,
      request
    );
  }

  deleteTask(
    taskId: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.tasksUrl}/${taskId}`
    );
  }
}